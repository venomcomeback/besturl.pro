import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Shield, Users, MousePointerClick, ArrowLeft,
  Trash2, UserX, UserCheck, TrendingUp, Calendar, Search,
  BarChart3, Home, LogOut
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// VPS için sabit API URL
const API_URL = 'https://besturl.pro/api';

const AdminPanel = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Kurşun geçirmez veri kontrolü
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchUsers]);

  const handleToggleUserStatus = async (userId) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kullanıcı durumu güncellendi');
      fetchUsers();
    } catch (error) {
      toast.error('İşlem başarısız');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`${username} kullanıcısını ve tüm verilerini silmek istediğinize emin misiniz?`)) return;

    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Kullanıcı silindi');
      fetchUsers();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.detail || 'Silme başarısız';
      toast.error(message);
    }
  };

  // Kurşun geçirmez filter
  const filteredUsers = (Array.isArray(users) ? users : []).filter(u => 
    u?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121214] border-r border-white/5 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="BestURL" className="h-9 w-auto" />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <Link to="/panel" className="sidebar-nav-item" data-testid="nav-dashboard">
              <Home className="w-5 h-5" />
              <span>Panel</span>
            </Link>
            <button 
              onClick={() => setActiveTab('overview')}
              className={`sidebar-nav-item w-full text-left ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Genel Bakış</span>
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`sidebar-nav-item w-full text-left ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users className="w-5 h-5" />
              <span>Kullanıcılar</span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.username || 'Admin'}</p>
                <p className="text-xs text-amber-400">Admin</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Link to="/panel" className="lg:hidden p-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h1 className="text-xl font-semibold text-white">Admin Paneli</h1>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="stat-card" data-testid="admin-stat-users">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Toplam Kullanıcı</p>
                  <p className="text-2xl font-bold text-white">{stats?.total_users || 0}</p>
                </div>

                <div className="stat-card" data-testid="admin-stat-links">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <img src="/favicon.png" alt="Link" className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Toplam Link</p>
                  <p className="text-2xl font-bold text-white">{stats?.total_links || 0}</p>
                </div>

                <div className="stat-card" data-testid="admin-stat-clicks">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <MousePointerClick className="w-5 h-5 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Toplam Tıklama</p>
                  <p className="text-2xl font-bold text-white">{stats?.total_clicks || 0}</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Bugün Tıklama</p>
                  <p className="text-2xl font-bold text-white">{stats?.today_clicks || 0}</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-pink-400" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-1">Bugün Link</p>
                  <p className="text-2xl font-bold text-white">{stats?.today_links || 0}</p>
                </div>
              </div>

              {/* Quick User List */}
              <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white">Son Kullanıcılar</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {(Array.isArray(users) ? users : []).slice(0, 5).map((u) => (
                    <div key={u.id} className="p-4 sm:p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.is_admin ? 'bg-amber-500/20' : 'bg-cyan-500/20'}`}>
                          <span className={`font-semibold ${u.is_admin ? 'text-amber-400' : 'text-cyan-400'}`}>
                            {u.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.username}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-cyan-400 font-medium">{u.link_count || 0} link</span>
                        <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-error'}`}>
                          {u.is_active !== false ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/5">
                  <Button 
                    variant="ghost" 
                    className="w-full text-cyan-400 hover:text-cyan-300"
                    onClick={() => setActiveTab('users')}
                  >
                    Tüm Kullanıcıları Görüntüle
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold text-white">Kullanıcı Yönetimi</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      placeholder="Kullanıcı ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64 bg-[#1C1C1E] border-white/10 text-white"
                      data-testid="search-users-input"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr className="bg-[#1C1C1E]">
                      <th>Kullanıcı</th>
                      <th>E-posta</th>
                      <th>Link Sayısı</th>
                      <th>Durum</th>
                      <th>Kayıt Tarihi</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(filteredUsers) ? filteredUsers : []).map((u) => (
                      <tr key={u.id} data-testid={`user-row-${u.id}`}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.is_admin ? 'bg-amber-500/20' : 'bg-cyan-500/20'}`}>
                              <span className={`text-sm font-semibold ${u.is_admin ? 'text-amber-400' : 'text-cyan-400'}`}>
                                {u.username?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">{u.username}</p>
                              {u.is_admin && <span className="text-xs text-amber-400">Admin</span>}
                            </div>
                          </div>
                        </td>
                        <td className="text-slate-300">{u.email}</td>
                        <td className="text-cyan-400 font-medium">{u.link_count || 0}</td>
                        <td>
                          <span className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-error'}`}>
                            {u.is_active !== false ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className="text-slate-400">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td>
                          {!u.is_admin && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={u.is_active !== false ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}
                                title={u.is_active !== false ? 'Devre dışı bırak' : 'Aktif et'}
                                data-testid={`toggle-user-${u.id}`}
                              >
                                {u.is_active !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="text-red-400 hover:text-red-300"
                                title="Kullanıcıyı sil"
                                data-testid={`delete-user-${u.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
