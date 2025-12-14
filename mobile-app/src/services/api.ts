import axios from 'axios';
import { useMobileStore } from '../store/mobileStore';

// Create an axios instance
const apiClient = axios.create({
  timeout: 5000,
});

// Request interceptor to add API key and URL
apiClient.interceptors.request.use((config) => {
  const { connection } = useMobileStore.getState();

  if (connection.apiUrl) {
    config.baseURL = connection.apiUrl;
  }

  // Skip auth headers for the public status endpoint to avoid CORS preflight issues on simple checks
  if (config.url !== '/api/status' && connection.apiKey) {
    config.headers['X-API-KEY'] = connection.apiKey;
    config.headers['Authorization'] = `Bearer ${connection.apiKey}`;
  }

  return config;
});

export const api = {
  // Check connection status
  checkConnection: async () => {
    try {
      const { connection } = useMobileStore.getState();
      console.log('Checking connection to:', connection.apiUrl);

      // Use the public status endpoint
      const response = await apiClient.get('/api/status');
      console.log('Connection check response:', response.status, response.data);

      return response.status === 200 && response.data.status === 'ok';
    } catch (error) {
      console.error('Connection check failed:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.status,
          data: error.response?.data
        });
        // Re-throw with a more user-friendly message or the original error
        throw new Error(error.message || 'Connection failed');
      }
      throw error;
    }
  },

  // Full sync (Pull)
  syncPull: async () => {
    try {
      const response = await apiClient.get('/api/sync');
      return response.data;
    } catch (error) {
      console.error('Sync pull failed:', error);
      throw error;
    }
  },

  // Push sync queue
  syncPush: async (queue: any[]) => {
    if (queue.length === 0) return;
    try {
      const response = await apiClient.post('/api/sync', { operations: queue });
      return response.data;
    } catch (error) {
      console.error('Sync push failed:', error);
      throw error;
    }
  },

  // Print Receipt (Remote)
  printReceipt: async (transactionData: any) => {
    try {
      // Wrap in object as expected by electron.cjs endpoint
      const response = await apiClient.post('/api/print-receipt', { transaction: transactionData });
      return response.data;
    } catch (error) {
      console.error('Print receipt failed:', error);
      throw error;
    }
  }
};
