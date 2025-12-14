import React from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Shield, Smartphone, RefreshCw, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { connection, logout, currentUser } = useMobileStore();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Device Info */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Device & App</h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
             <div className="p-4 flex items-center gap-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Whiz Pos Mobile</div>
                  <div className="text-xs text-slate-400">v2.0.0 • Production Build</div>
                </div>
             </div>
             <div className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white">Current User</div>
                  <div className="text-xs text-slate-400">{currentUser?.name} ({currentUser?.role})</div>
                </div>
             </div>
          </div>
        </section>

        {/* Connection */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Connection</h2>
          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
             <div className="p-4 flex items-center gap-4 border-b border-white/5">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", connection.isConnected ? "bg-emerald-500/20" : "bg-red-500/20")}>
                  <Server className={cn("w-5 h-5", connection.isConnected ? "text-emerald-400" : "text-red-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{connection.apiUrl}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                     <span className={cn("w-1.5 h-1.5 rounded-full", connection.isConnected ? "bg-emerald-400" : "bg-red-400")} />
                     {connection.isConnected ? 'Connected' : 'Offline'}
                  </div>
                </div>
             </div>

             <button
                onClick={() => navigate('/pending-sync')}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
             >
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
                   <RefreshCw className="w-5 h-5 text-sky-400" />
                 </div>
                 <div className="text-left">
                   <div className="font-medium text-white">Sync Status</div>
                   <div className="text-xs text-slate-400">Check pending items</div>
                 </div>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-500" />
             </button>
          </div>
        </section>

        <button
           onClick={() => { logout(); navigate('/login'); }}
           className="w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-5 h-5" /> Logout Account
        </button>

        <div className="text-center text-xs text-slate-600 pb-8">
           Designed & Serviced by Whiz Tech<br/>0740 841 168
        </div>
      </div>
    </div>
  );
}
