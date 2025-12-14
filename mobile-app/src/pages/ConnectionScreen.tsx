import React, { useState, useEffect } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { QrCode, Wifi, WifiOff, Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

export default function ConnectionScreen() {
  const navigate = useNavigate();
  const { connection, setConnection, setProducts, setCategories, setUsers } = useMobileStore();

  const [manualUrl, setManualUrl] = useState(connection.apiUrl || 'http://192.168.');
  const [manualKey, setManualKey] = useState(connection.apiKey || '');
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      BarcodeScanner.checkPermissions().then((result) => {
        if (result.camera === 'granted') {
          setPermissionGranted(true);
        }
      });
    }
  }, []);

  const handleConnect = async (url: string, key: string) => {
    setIsLoading(true);
    setStatus('idle');
    setStatusMessage('');

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) {
      formattedUrl = `http://${formattedUrl}`;
    }
    formattedUrl = formattedUrl.replace(/\/$/, '');

    setConnection({ apiUrl: formattedUrl, apiKey: key.trim() });

    try {
      // api.checkConnection now throws an error if it fails
      const isConnected = await api.checkConnection();

      if (isConnected) {
        setStatus('success');
        setConnection({ isConnected: true, apiUrl: formattedUrl, apiKey: key.trim() });
        setStatusMessage('Connected successfully!');

        try {
            const data = await api.syncPull();
            if (data) {
               if (data.products) setProducts(data.products);
               if (data.categories) setCategories(data.categories);
               if (data.users) setUsers(data.users);
            }
        } catch (syncError) {
            console.error('Initial sync failed but connection was good:', syncError);
            // We don't block login if sync fails but connection was good
        }

        setTimeout(() => navigate('/login'), 500);
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      setStatus('error');
      // Display the specific error message to help debugging
      const errorMsg = error.message || 'Unknown connection error';
      setStatusMessage(`Error: ${errorMsg}`);
      setConnection({ isConnected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const startScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert("Scanner is only available on native devices. Using manual entry for testing.");
      return;
    }

    try {
      if (!permissionGranted) {
        const { camera } = await BarcodeScanner.requestPermissions();
        if (camera !== 'granted') {
          alert('Camera permission is required to scan QR codes.');
          return;
        }
        setPermissionGranted(true);
      }

      setIsScanning(true);

      // Aggressively make everything transparent
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      const root = document.getElementById('root');
      if (root) root.style.backgroundColor = 'transparent';

      // Start scanning
      await BarcodeScanner.addListener('barcodeScanned', async (result) => {
        await stopScan();
        if (result.barcode.displayValue) {
           try {
             // Expecting JSON: { apiUrl: "...", apiKey: "..." }
             const data = JSON.parse(result.barcode.displayValue);
             if (data.apiUrl && data.apiKey) {
               setManualUrl(data.apiUrl);
               setManualKey(data.apiKey);
               handleConnect(data.apiUrl, data.apiKey);
             } else {
               alert("Invalid QR Code format");
             }
           } catch (e) {
             // Fallback: try to treat as URL if simple string?
             // Or just fill URL field
             setManualUrl(result.barcode.displayValue);
           }
        }
      });

      await BarcodeScanner.startScan();
    } catch (e) {
      console.error(e);
      stopScan();
    }
  };

  const stopScan = async () => {
    setIsScanning(false);
    // Restore background color
    document.body.style.backgroundColor = '';
    document.documentElement.style.backgroundColor = '';
    const root = document.getElementById('root');
    if (root) root.style.backgroundColor = '';

    if (Capacitor.isNativePlatform()) {
      await BarcodeScanner.removeAllListeners();
      await BarcodeScanner.stopScan();
    }
  };

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center p-6 relative overflow-hidden",
      isScanning ? "bg-transparent" : "bg-slate-900"
    )}>
      {isScanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12 bg-black/0">
          <div className="text-white font-bold text-xl drop-shadow-md bg-black/50 px-4 py-2 rounded-full">Scan QR Code</div>
          <div className="w-64 h-64 border-2 border-sky-400 rounded-2xl relative">
             <div className="absolute inset-0 border-4 border-sky-500 rounded-2xl animate-pulse opacity-50"></div>
          </div>
          <button
            onClick={stopScan}
            className="bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
          >
            Cancel Scan
          </button>
        </div>
      )}

      {/* Background Ambience - Hide when scanning for performance/visibility */}
      {!isScanning && (
        <>
          <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px]" />
        </>
      )}

      <div className={cn("w-full max-w-md space-y-8 relative z-10", isScanning ? "hidden" : "block")}>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Connect to Server</h1>
          <p className="text-slate-400">Scan QR code from Desktop POS or enter details manually.</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <button
            onClick={startScan}
            className="w-full aspect-video bg-black/40 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-sky-400/50 hover:bg-black/60 transition-all group"
          >
            <QrCode className="w-12 h-12 text-slate-500 group-hover:text-sky-400 transition-colors mb-2" />
            <span className="text-slate-400 font-medium">Tap to Scan QR Code</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or Manual Entry</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1">Server URL</label>
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="http://192.168.1.X:3000"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1">Sync Key</label>
              <input
                type="text"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                placeholder="Paste API Key"
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
            </div>
          </div>

          <button
            onClick={() => handleConnect(manualUrl, manualKey)}
            disabled={isLoading}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2",
              status === 'success' ? "bg-emerald-500 hover:bg-emerald-600 text-white" :
              status === 'error' ? "bg-red-500 hover:bg-red-600 text-white" :
              "bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20"
            )}
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> :
             status === 'success' ? <Wifi className="w-5 h-5" /> :
             status === 'error' ? <WifiOff className="w-5 h-5" /> :
             "Connect"}
            <span>
              {isLoading ? "Connecting..." :
               status === 'success' ? "Connected!" :
               status === 'error' ? "Retry" :
               "Connect Server"}
            </span>
          </button>

          {statusMessage && (
            <div className={cn("text-center text-sm p-2 rounded-lg bg-black/20 break-words", status === 'error' ? "text-red-400 border border-red-500/20" : "text-emerald-400 border border-emerald-500/20")}>
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
