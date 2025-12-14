import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMobileStore } from './store/mobileStore';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

// Pages
import ConnectionScreen from './pages/ConnectionScreen';
import LoginScreen from './pages/LoginScreen';
import Dashboard from './pages/Dashboard';
import TransactionsPage from './pages/TransactionsPage';
import ExpensesPage from './pages/ExpensesPage';
import CreditCustomersPage from './pages/CreditCustomersPage';
import SettingsPage from './pages/SettingsPage';
import PendingSyncsPage from './pages/PendingSyncsPage';
import ReportsPage from './pages/ReportsPage';
import SalariesPage from './pages/SalariesPage';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { connection } = useMobileStore();

  if (!connection.isConnected || !connection.apiUrl) {
    return <Navigate to="/connect" replace />;
  }

  return <Outlet />;
};

const DashboardRoute = () => {
  const { currentUser } = useMobileStore();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Dashboard />;
};

// Wrapper to redirect if already connected
const ConnectRoute = () => {
  const { connection } = useMobileStore();
  if (connection.isConnected && connection.apiUrl) {
    return <Navigate to="/login" replace />;
  }
  return <ConnectionScreen />;
};

function App() {
  const {
    syncQueue,
    connection,
    removeSyncedItems,
    isHydrated,
    setProducts,
    setUsers,
    setExpenses,
    setSalaries,
    setCreditCustomers,
    setCategories,
    setTransactions
  } = useMobileStore();

  // Background Sync Logic
  useEffect(() => {
    if (!connection.isConnected || !connection.apiUrl) return;

    const syncLoop = async () => {
      // 1. Push Queue
      let pushedItems: any[] = [];
      if (syncQueue.length > 0) {
        const queueToSync = [...syncQueue]; // Copy to avoid mutation issues
        try {
          const result = await api.syncPush(queueToSync);
          if (result && result.success) {
            // Do NOT remove yet. Wait until after pull to ensure merge logic sees them as pending.
            pushedItems = queueToSync;
            console.log('Sync push successful');
          }
        } catch (e) {
          console.error("Sync push failed", e);
        }
      }

      // 2. Pull Updates (Products, Credit, Expenses, Users)
      try {
        const data = await api.syncPull();
        if (data) {
          // Update store with merged data
          // The merge logic in setX methods will use syncQueue to preserve local pending items
          if (data.products) setProducts(data.products);
          if (data.users) setUsers(data.users);
          if (data.expenses) setExpenses(data.expenses);
          if (data.salaries) setSalaries(data.salaries);
          if (data.creditCustomers) setCreditCustomers(data.creditCustomers);
          if (data.transactions) setTransactions(data.transactions); // Sync transactions too
        }

        // 3. Remove pushed items from queue only AFTER pull & merge is done
        // This ensures that if the server didn't return the new items yet, they were preserved by the merge logic
        // because they were still in the syncQueue. Now we can safely remove them.
        if (pushedItems.length > 0) {
          removeSyncedItems(pushedItems);
        }

      } catch (e) {
        console.error("Sync pull failed", e);
      }
    };

    const interval = setInterval(syncLoop, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [
    connection.isConnected,
    connection.apiUrl,
    syncQueue,
    removeSyncedItems,
    setProducts,
    setUsers,
    setExpenses,
    setSalaries,
    setCreditCustomers,
    setCategories,
    setTransactions
  ]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/connect" element={<ConnectRoute />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/credit-customers" element={<CreditCustomersPage />} />
          <Route path="/salaries" element={<SalariesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pending-sync" element={<PendingSyncsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/connect" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
