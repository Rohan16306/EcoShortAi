'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Search, Filter, Trash2, ShieldAlert, Award, Package, MapPin, Coins, ScanLine, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './Modal';
import { AdminDataService, type AdminUser, type AdminHistoryItem } from '../services/AdminDataService';

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AdminDataService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users from backend.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await AdminDataService.deleteUser(id);
      toast.success('User deleted successfully');
      setDeleteConfirmId(null);
      refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="text-slate-500 font-medium">Loading users from backend database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <ShieldAlert size={48} className="text-rose-400" />
        <p className="text-slate-700 font-bold text-lg">Connection Error</p>
        <p className="text-slate-500 text-sm max-w-md text-center">{error}</p>
        <button onClick={refreshData} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center gap-2">
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500">Live data from the platform database — {users.length} registered users.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm w-64 transition-all"
            />
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Scans</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isConfirming = deleteConfirmId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewingUser(user)}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                          {(user.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{user.name}</p>
                          <p className="text-xs text-slate-500 font-mono">ID: {user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Coins size={14} className="text-amber-500" />
                        <span className="text-sm font-bold text-slate-900">{user.credits}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ScanLine size={14} className="text-primary" />
                        <span className="text-sm font-bold text-slate-900">{user.totalScans}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isConfirming ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-1 text-[10px] font-bold"
                          >
                            <ShieldAlert size={14} />
                            CONFIRM
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-[10px] font-bold"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <User size={48} className="text-slate-200" />
                    <p>No users found matching your search.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* USER PROFILE MODAL */}
      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title={`Resident Profile: ${viewingUser?.name}`}
      >
        <div className="space-y-8">
           {/* Profile Header */}
           <div className="flex items-start gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20">
                {viewingUser?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">{viewingUser?.name}</h3>
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                       <Award size={14} />
                       {(viewingUser?.credits || 0) >= 500 ? 'Gold Contributor' : (viewingUser?.credits || 0) >= 100 ? 'Silver Contributor' : 'Eco Starter'}
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Mail size={16} />
                       {viewingUser?.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Calendar size={16} />
                       Joined {viewingUser?.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Stats */}
           <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Scans</p>
                 <p className="text-2xl font-bold text-slate-900">{viewingUser?.totalScans || 0}</p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Credits Earned</p>
                 <p className="text-2xl font-bold text-amber-600">{viewingUser?.credits || 0}</p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Badges</p>
                 <p className="text-2xl font-bold text-primary">{viewingUser?.badges?.length || 0}</p>
              </div>
           </div>

           {/* Scan History */}
           <div className="space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-primary" />
                Scan History
              </h4>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                 {(viewingUser?.history || []).map((item: AdminHistoryItem) => (
                    <div key={item.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                             {item.geoTag ? <MapPin size={20} /> : <ScanLine size={20} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900">{item.name}</p>
                             <p className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()} • {item.material}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-amber-600">+{item.credits} credits</p>
                          <span className={`text-[10px] font-bold uppercase ${item.isDuplicate ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {item.isDuplicate ? 'Duplicate' : 'Verified'}
                          </span>
                       </div>
                    </div>
                 ))}
                 {(!viewingUser?.history || viewingUser.history.length === 0) && (
                   <div className="py-10 text-center text-slate-400 italic text-sm">
                     This user has no recorded scan history.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}
