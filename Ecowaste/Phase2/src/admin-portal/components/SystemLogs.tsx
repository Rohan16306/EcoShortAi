'use client';

import React, { useState, useEffect } from 'react';
import { Database, Shield, Info, AlertTriangle, CheckCircle, Search, Trash2, Download, RefreshCw } from 'lucide-react';
import { AdminBackendService, type SystemLog } from '../services/AdminBackendService';
import { toast } from 'sonner';

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLogs(AdminBackendService.getAuditTrail());

    const unsubscribe = AdminBackendService.subscribeToLiveStream((entry) => {
      setLogs(prev => [entry, ...prev].slice(0, 500));
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogStyle = (type: SystemLog['type']) => {
    switch (type) {
      case 'success': return { icon: <CheckCircle size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'warning': return { icon: <AlertTriangle size={16} />, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'error': return { icon: <Shield size={16} />, color: 'text-rose-500', bg: 'bg-rose-50' };
      default: return { icon: <Info size={16} />, color: 'text-blue-500', bg: 'bg-blue-50' };
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the admin database?')) {
      AdminBackendService.purgeDatabase();
      setLogs([]);
      toast.success('Admin database cleared');
    }
  };

  const handleRefresh = () => {
    setLogs(AdminBackendService.getAuditTrail());
    toast.success('Logs refreshed from database');
  };

  const handleExport = () => {
    const data = AdminBackendService.dumpDatabase();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-pickup-audit-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Database dump exported');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Database Logs</h2>
          <p className="text-slate-500">Live audit trail of all transactions and system events.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm w-64 transition-all"
            />
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-primary hover:border-primary transition-all"
            title="Refresh Logs"
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={handleClear}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all"
            title="Clear All Logs"
          >
            <Trash2 size={20} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Export DB
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="flex items-center gap-2 px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-mono text-slate-400 ml-2">system_audit_trail.log — 500 lines</span>
        </div>

        <div className="max-h-[600px] overflow-y-auto font-mono text-xs">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {filteredLogs.map((log) => {
                const style = getLogStyle(log.type);
                return (
                  <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors flex gap-4">
                    <span className="text-slate-500 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${style.color}`}>{log.action}</span>
                        <span className="text-slate-500">performed by</span>
                        <span className="text-blue-400 font-bold">{log.performedBy}</span>
                      </div>
                      <div className="text-slate-400 break-all bg-slate-950/50 p-2 rounded border border-slate-800/50 mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    </div>
                    <div className={`${style.bg} ${style.color} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                      {style.icon}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-600 italic">
              No logs recorded in the system yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
