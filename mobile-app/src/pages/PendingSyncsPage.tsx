import React from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Database, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function PendingSyncsPage() {
  const navigate = useNavigate();
  const { syncQueue, clearSyncQueue, removeSyncedItems } = useMobileStore();

  const handleManualSync = async () => {
    try {
      if (syncQueue.length === 0) return;

      const result = await api.syncPush(syncQueue);
      if (result && result.success) {
         removeSyncedItems(syncQueue);
         alert('Sync successful!');
      } else {
         alert('Sync returned invalid response');
      }
    } catch (e) {
      console.error(e);
      alert('Sync failed. Check connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Pending Syncs</h1>
        <div className="flex-1" />
        {syncQueue.length > 0 && (
          <button
            onClick={clearSyncQueue}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </header>

      <div className="p-6 text-center bg-slate-800/50">
        <div className="w-16 h-16 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold mb-1">{syncQueue.length}</h2>
        <p className="text-slate-400 text-sm">Items Pending Upload</p>

        <button
          onClick={handleManualSync}
          disabled={syncQueue.length === 0}
          className="mt-6 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Sync Now
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {syncQueue.map((item, index) => (
          <div key={item._queueId || index} className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
             <div>
               <div className="font-bold text-sm uppercase text-slate-300">{item.type}</div>
               <div className="text-xs text-slate-500 font-mono mt-1">
                 ID: {item.data?.id?.slice(0,8)}...
               </div>
             </div>
             <div className="text-xs text-sky-400 font-medium px-2 py-1 bg-sky-500/10 rounded-lg">
               Pending
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
