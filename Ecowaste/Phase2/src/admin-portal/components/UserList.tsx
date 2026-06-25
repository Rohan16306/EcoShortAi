'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Search, Filter, Trash2, ShieldAlert, Award, Package, MapPin } from 'lucide-react';
import { getAllAccounts, getAllRequests, deleteAccount, type PickupRequest } from '@/lib/requestStore';
import { toast } from 'sonner';
import Modal from './Modal';

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setAccounts(getAllAccounts().filter(a => a.role === 'user'));
    setRequests(getAllRequests());
  };

  const filteredUsers = accounts.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserStats = (userId: string) => {
    const userReqs = requests.filter(r => r.userName === accounts.find(a => a.id === userId)?.fullName);
    return {
      totalPickups: userReqs.length,
      completed: userReqs.filter(r => r.status === 'completed').length,
    };
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    toast.success('User deleted successfully');
    setDeleteConfirmId(null);
    refreshData();
  };

  const getUserRequests = (userName: string) => {
    return requests.filter(r => r.userName === userName);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
          <p className="text-slate-500">Overview of all registered residents and their pickup history.</p>
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
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const stats = getUserStats(user.id);
                const isConfirming = deleteConfirmId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewingUser(user)}>
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{user.fullName}</p>
                          <p className="text-xs text-slate-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{stats.totalPickups} Requests</p>
                        <p className="text-xs text-emerald-600 font-medium">{stats.completed} Completed</p>
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
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
        title={`Resident Profile: ${viewingUser?.fullName}`}
      >
        <div className="space-y-8">
           {/* Profile Header */}
           <div className="flex items-start gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-xl shadow-primary/20">
                {viewingUser?.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">{viewingUser?.fullName}</h3>
                    <div className="flex items-center gap-1 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">
                       <Award size={14} />
                       Gold Contributor
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Mail size={16} />
                       {viewingUser?.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                       <Phone size={16} />
                       {viewingUser?.phone}
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Stats */}
           <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Requests</p>
                 <p className="text-2xl font-bold text-slate-900">{getUserRequests(viewingUser?.fullName).length}</p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waste Recycled</p>
                 <p className="text-2xl font-bold text-slate-900">
                   {getUserRequests(viewingUser?.fullName).reduce((sum, r) => sum + r.estimatedKg, 0)} <span className="text-xs text-slate-500">KG</span>
                 </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                 <p className="text-2xl font-bold text-emerald-600">100%</p>
              </div>
           </div>

           {/* Recent History */}
           <div className="space-y-4">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-primary" />
                Service History
              </h4>
              <div className="space-y-3">
                 {getUserRequests(viewingUser?.fullName).map((req) => (
                    <div key={req.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-300 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                             <MapPin size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900">{req.wasteType} Pickup</p>
                             <p className="text-[10px] text-slate-500">{new Date(req.submittedAt).toLocaleDateString()} • {req.address}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{req.estimatedKg} KG</p>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">Completed</span>
                       </div>
                    </div>
                 ))}
                 {getUserRequests(viewingUser?.fullName).length === 0 && (
                   <div className="py-10 text-center text-slate-400 italic text-sm">
                     This user has no recorded pickup history.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
}
