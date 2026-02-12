import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Copy, ExternalLink, Trash2, Edit,
  MousePointerClick, Monitor, Smartphone, Tablet, Globe,
  TrendingUp, Users, Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

// VPS için sabit API URL
const API_URL = 'https://besturl.pro/api';
const DOMAIN = 'besturl.pro';

const COLORS = ['#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const LinkDetails = () => {
  const { linkId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', is_active: true });
  const [editLoading, setEditLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/links/${linkId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
      setEditData({
        title: response.data?.link?.title || '',
        is_active: response.data?.link?.is_active !== false
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Analitik veriler yüklenemedi');
      navigate('/panel');
    }
    setLoading(false);
  }, [linkId, token, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await axios.put(`${API_URL}/links/${linkId}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Link güncellendi');
      setEditDialogOpen(false);
      fetchAnalytics();
    } catch (error) {
      toast.error('Güncelleme başarısız');
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu linki silmek istediğinize emin misiniz?')) return;
    
    try {
      await axios.delete(`${API_URL}/links/${linkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Link silindi');
      navigate('/panel');
    } catch (error) {
      toast.error('Silme başarısız');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı!');
  };

  const getShortUrl = (shortCode) => {
    return `https://${DOMAIN}/${shortCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!analytics || !analytics.link) return null;

  const { link, total_clicks, devices, browsers, os_stats, countries, referrers, daily_clicks } = analytics;

  // Kurşun geçirmez veri hazırlığı
  const safeDevices = devices && typeof devices === 'object' ? devices : {};
  const safeBrowsers = browsers && typeof browsers === 'object' ? browsers : {};
  const safeCountries = countries && typeof countries === 'object' ? countries : {};
  const safeReferrers = referrers && typeof referrers === 'object' ? referrers : {};
  const safeOsStats = os_stats && typeof os_stats === 'object' ? os_stats : {};
  const safeDailyClicks = Array.isArray(daily_clicks) ? daily_clicks : [];

  // Prepare chart data
  const deviceData = Object.entries(safeDevices).map(([name, value]) => ({ name, value }));
  const browserData = Object.entries(safeBrowsers).map(([name, value]) => ({ name, value }));
  const countryData = Object.entries(safeCountries).map(([name, value]) => ({ name, value }));
  const referrerData = Object.entries(safeReferrers).slice(0, 5).map(([name, value]) => ({ 
    name: name === 'Doğrudan' ? 'Doğrudan' : (name || '').substring(0, 20), 
    value 
  }));

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/panel" className="p-2 text-slate-400 hover:text-white" data-testid="back-btn">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">{link.title || link.short_code}</h1>
                <div className="flex items-center gap-2">
                  <code className="text-cyan-400 text-sm font-mono">{getShortUrl(link.short_code)}</code>
                  <button
                    onClick={() => copyToClipboard(getShortUrl(link.short_code))}
                    className="text-slate-500 hover:text-cyan-400"
                    data-testid="copy-link-btn"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="text-slate-400 hover:text-white"
                data-testid="edit-link-btn"
              >
                <Edit className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.open(getShortUrl(link.short_code), '_blank')}
                className="text-slate-400 hover:text-white"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
                data-testid="delete-link-btn"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card" data-testid="stat-total-clicks">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Toplam Tıklama</p>
            <p className="text-2xl font-bold text-white">{total_clicks || 0}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Durum</p>
            <p className={`text-lg font-semibold ${link.is_active !== false ? 'text-emerald-400' : 'text-red-400'}`}>
              {link.is_active !== false ? 'Aktif' : 'Pasif'}
            </p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Benzersiz Cihaz</p>
            <p className="text-2xl font-bold text-white">{Object.keys(safeDevices).length}</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-1">Oluşturulma</p>
            <p className="text-sm font-medium text-white">
              {link.created_at ? new Date(link.created_at).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Clicks Chart */}
          <div className="chart-container col-span-full">
            <h3 className="text-lg font-semibold text-white mb-6">Günlük Tıklamalar (Son 30 Gün)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safeDailyClicks}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  tickFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
                    } catch {
                      return value;
                    }
                  }}
                />
                <YAxis stroke="#64748B" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1C1C1E', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                  labelFormatter={(value) => {
                    try {
                      return new Date(value).toLocaleDateString('tr-TR');
                    } catch {
                      return value;
                    }
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  dot={{ fill: '#06B6D4', r: 4 }}
                  activeDot={{ r: 6, fill: '#22D3EE' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Device Distribution */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold text-white mb-6">Cihaz Dağılımı</h3>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1C1C1E', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                Henüz veri yok
              </div>
            )}
          </div>

          {/* Browser Distribution */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold text-white mb-6">Tarayıcı Dağılımı</h3>
            {browserData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={browserData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="#64748B" />
                  <YAxis type="category" dataKey="name" stroke="#64748B" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1C1C1E', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#F8FAFC'
                    }}
                  />
                  <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-500">
                Henüz veri yok
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Countries */}
          <div className="bg-[#121214] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Ülkeler</h3>
            </div>
            {countryData.length > 0 ? (
              <div className="space-y-3">
                {countryData.slice(0, 5).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{country.name || 'Bilinmiyor'}</span>
                    <span className="text-cyan-400 font-medium">{country.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Henüz veri yok</p>
            )}
          </div>

          {/* Referrers */}
          <div className="bg-[#121214] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <img src="/favicon.png" alt="Link" className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">Kaynaklar</h3>
            </div>
            {referrerData.length > 0 ? (
              <div className="space-y-3">
                {referrerData.map((ref, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300 truncate max-w-[150px]">{ref.name}</span>
                    <span className="text-cyan-400 font-medium">{ref.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Henüz veri yok</p>
            )}
          </div>

          {/* OS Stats */}
          <div className="bg-[#121214] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Monitor className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">İşletim Sistemi</h3>
            </div>
            {Object.keys(safeOsStats).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(safeOsStats).slice(0, 5).map(([name, value], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{name}</span>
                    <span className="text-cyan-400 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Link Info */}
        <div className="mt-8 bg-[#121214] rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Link Bilgileri</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Orijinal URL</p>
              <p className="text-slate-300 break-all">{link.original_url}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Kısa URL</p>
              <p className="text-cyan-400 font-mono">{getShortUrl(link.short_code)}</p>
            </div>
            {link.expires_at && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Bitiş Tarihi</p>
                <p className="text-slate-300">{new Date(link.expires_at).toLocaleString('tr-TR')}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[#121214] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Link Düzenle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Başlık</Label>
              <Input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({...editData, title: e.target.value})}
                className="bg-[#1C1C1E] border-white/10 text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Aktif</Label>
              <button
                type="button"
                onClick={() => setEditData({...editData, is_active: !editData.is_active})}
                className={`w-12 h-6 rounded-full transition-colors duration-200 ${editData.is_active ? 'bg-cyan-600' : 'bg-slate-600'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition-transform duration-200 ${editData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)} className="text-slate-400">
                İptal
              </Button>
              <Button type="submit" disabled={editLoading} className="bg-cyan-600 hover:bg-cyan-500">
                {editLoading ? <div className="spinner w-4 h-4" /> : 'Kaydet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinkDetails;
