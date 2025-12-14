import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

// Custom storage adapter for Capacitor Preferences
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

interface User {
  id: string;
  name: string;
  role: string;
  pin?: string;
}

interface Product {
  id: string; // Use string for ID to match desktop/mongo
  _id?: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  minStock?: number;
}

interface CartItem extends Product {
  cartId: string;
  quantity: number;
}

interface ConnectionSettings {
  apiUrl: string;
  apiKey: string;
  isConnected: boolean;
}

interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  timestamp: string;
  cashierId?: string;
  cashierName?: string;
  status: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  cashierId?: string;
  cashierName?: string;
}

interface Salary {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
  type: 'advance' | 'full';
  notes?: string;
  recordedBy?: string;
}

interface CreditCustomer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  notes?: string;
}

interface MobileStore {
  // Hydration State
  isHydrated: boolean;
  setIsHydrated: (val: boolean) => void;

  // Connection
  connection: ConnectionSettings;
  setConnection: (settings: Partial<ConnectionSettings>) => void;

  // Auth
  currentUser: User | null;
  lastLoggedUserId: string | null;
  users: User[]; // Synced users list for login
  login: (user: User) => void;
  logout: () => void;
  setUsers: (users: User[]) => void;
  clearLastLoggedUser: () => void;

  // Data
  products: Product[];
  categories: string[];
  transactions: Transaction[];
  expenses: Expense[];
  salaries: Salary[];
  creditCustomers: CreditCustomer[];

  setProducts: (products: Product[]) => void;
  setCategories: (categories: string[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setSalaries: (salaries: Salary[]) => void;
  setCreditCustomers: (customers: CreditCustomer[]) => void;

  addTransaction: (transaction: Transaction) => void;
  addExpense: (expense: Expense) => void;
  addSalary: (salary: Salary) => void;
  addCreditCustomer: (customer: CreditCustomer) => void;
  updateCreditCustomer: (id: string, updates: Partial<CreditCustomer>) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (cartId: string) => void;
  updateCartQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;

  // Sync Queue
  syncQueue: any[];
  addToSyncQueue: (item: any) => void;
  removeSyncedItems: (itemsToRemove: any[]) => void;
  clearSyncQueue: () => void;
}

export const useMobileStore = create<MobileStore>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      setIsHydrated: (val) => set({ isHydrated: val }),

      connection: {
        apiUrl: '',
        apiKey: '',
        isConnected: false,
      },
      setConnection: (settings) =>
        set((state) => ({ connection: { ...state.connection, ...settings } })),

      currentUser: null,
      lastLoggedUserId: null,
      users: [],
      login: (user) => set({ currentUser: user, lastLoggedUserId: user.id }),
      logout: () => set({ currentUser: null }),
      clearLastLoggedUser: () => set({ lastLoggedUserId: null }),
      setUsers: (users) => set({ users }),

      products: [],
      categories: [],
      transactions: [],
      expenses: [],
      salaries: [],
      creditCustomers: [],

      setProducts: (products) => set({
        products,
        // Automatically derive categories from products
        categories: [...new Set(products.map(p => p.category).filter(Boolean))]
      }),
      setCategories: (categories) => set({ categories }),

      setTransactions: (serverTransactions) => {
         const state = get();
         // Keep local transactions that are pending in the sync queue
         const queuedIds = new Set(state.syncQueue.filter(op => op.type === 'transaction' || op.type === 'new-transaction').map(op => op.data.id));
         const localPending = state.transactions.filter(t => queuedIds.has(t.id) && !serverTransactions.some(st => st.id === t.id));
         set({ transactions: [...localPending, ...serverTransactions] }); // Local pending on top? Or merged. Order might matter for UI.
      },

      setExpenses: (serverExpenses) => {
         const state = get();
         const queuedIds = new Set(state.syncQueue.filter(op => op.type === 'expense' || op.type === 'add-expense').map(op => op.data.id));
         const localPending = state.expenses.filter(e => queuedIds.has(e.id) && !serverExpenses.some(se => se.id === e.id));
         set({ expenses: [...localPending, ...serverExpenses] });
      },

      setSalaries: (serverSalaries) => {
         const state = get();
         const queuedIds = new Set(state.syncQueue.filter(op => op.type === 'salary' || op.type === 'add-salary').map(op => op.data.id));
         const localPending = state.salaries.filter(s => queuedIds.has(s.id) && !serverSalaries.some(ss => ss.id === s.id));
         set({ salaries: [...localPending, ...serverSalaries] });
      },

      setCreditCustomers: (serverCustomers) => {
         const state = get();
         // For customers, we might have 'add-credit-customer' or 'update-credit-customer'
         const addedIds = new Set(state.syncQueue.filter(op => op.type === 'add-credit-customer' || op.type === 'credit-customer').map(op => op.data.id));
         const localPending = state.creditCustomers.filter(c => addedIds.has(c.id) && !serverCustomers.some(sc => sc.id === c.id));

         // Note: If we have 'update' ops, the server version might be older than local.
         // But merging updates is complex. We assume 'Server Wins' for existing IDs,
         // unless we implement timestamp conflict resolution here too.
         // For now, preserving NEW items is the critical fix for "disappearing" items.
         set({ creditCustomers: [...localPending, ...serverCustomers] });
      },

      addTransaction: (transaction) => set((state) => ({ transactions: [transaction, ...state.transactions] })),
      addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),
      addSalary: (salary) => set((state) => ({ salaries: [salary, ...state.salaries] })),
      addCreditCustomer: (customer) => set((state) => ({ creditCustomers: [...state.creditCustomers, customer] })),
      updateCreditCustomer: (id, updates) => set((state) => ({
        creditCustomers: state.creditCustomers.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      cart: [],
      addToCart: (product) => set((state) => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        return {
          cart: [...state.cart, { ...product, cartId: Math.random().toString(36), quantity: 1 }]
        };
      }),
      removeFromCart: (cartId) =>
        set((state) => ({ cart: state.cart.filter(item => item.cartId !== cartId) })),
      updateCartQuantity: (cartId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { cart: state.cart.filter(item => item.cartId !== cartId) };
          }
          return {
            cart: state.cart.map(item =>
              item.cartId === cartId ? { ...item, quantity } : item
            )
          };
        }),
      clearCart: () => set({ cart: [] }),

      syncQueue: [],
      addToSyncQueue: (item) => {
        // Ensure item has a unique queue ID if not present, to enable safe removal
        const queueItem = { ...item, _queueId: item._queueId || crypto.randomUUID() };
        set((state) => ({ syncQueue: [...state.syncQueue, queueItem] }));
      },
      removeSyncedItems: (itemsToRemove) => set((state) => {
        const idsToRemove = new Set(itemsToRemove.map(i => i._queueId));
        return {
          syncQueue: state.syncQueue.filter(i => !idsToRemove.has(i._queueId))
        };
      }),
      clearSyncQueue: () => set({ syncQueue: [] }),
    }),
    {
      name: 'whiz-pos-mobile-storage',
      storage: createJSONStorage(() => capacitorStorage),
      partialize: (state) => ({
        connection: state.connection,
        currentUser: state.currentUser,
        lastLoggedUserId: state.lastLoggedUserId,
        syncQueue: state.syncQueue,
        products: state.products,
        categories: state.categories,
        users: state.users,
        transactions: state.transactions,
        expenses: state.expenses,
        salaries: state.salaries,
        creditCustomers: state.creditCustomers
      }),
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true);
      },
    }
  )
);
