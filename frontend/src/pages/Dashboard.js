import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { 
  BarChart3, Plus, Search, Copy, ExternalLink, 
  Trash2, Edit, QrCode, MoreVertical, Home, Settings,
  LogOut, Shield, TrendingUp, MousePointerClick, Calendar,
  Menu, X, Eye, EyeOff, Lock, Clock, Download
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const DOMAIN = 'besturl.pro';

const Dashboard = () => {
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState({
    total_links: 0,
    active_links: 0,
    total_clicks: 0,
    today_clicks: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Create Link Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    original_url: '',
    custom_slug: '',
    title: '',
    password: '',
    expires_at: '',
    generate_qr: false
  });
  const [createLoading, setCreateLoading] = useState(false);

  // QR Dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);

  const fetchLinks = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/links`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinks(response.data);
    } catch (error) {
      console.error('Failed to fetch links:', error);
      toast.error('Linkler yüklenemedi');
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [token]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLinks(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchLinks, fetchStats]);

  const handleCreateLink = async (e) => {
    e.preventDefault();
    
    if (!newLink.original_url) {
      toast.error('Lütfen bir URL girin');
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        original_url: newLink.original_url,
        custom_slug: newLink.custom_slug || null,
        title: newLink.title || null,
        password: newLink.password || null,
        expires_at: newLink.expires_at ? new Date(newLink.expires_at).toISOString() : null,
        generate_qr: newLink.generate_qr
      };

      await axios.post(`${API_URL}/links`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Link başarıyla oluşturuldu!');
      setCreateDialogOpen(false);
      setNewLink({
        original_url: '',
        custom_slug: '',
        title: '',
        password: '',
        expires_at: '',
        generate_qr: false
      });
      fetchLinks();
      fetchStats();
    } catch (error) {
      const message = error.response?.data?.detail || 'Link oluşturulamadı';
      toast.error(message);
    }
    setCreateLoading(false);
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Bu linki silmek istediğinize emin misiniz?')) return;

    try {
      await axios.delete(`${API_URL}/links/${linkId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Link silindi');
      fetchLinks();
      fetchStats();
    } catch (error) {
      toast.error('Link silinemedi');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopyalandı!');
  };

  const getShortUrl = (shortCode) => {
    return `https://${DOMAIN}/${shortCode}`;
  };

  const filteredLinks = links.filter(link => 
    link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.original_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    link.short_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#121214] border-r border-white/5 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/5">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="BestURL" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/panel" className="sidebar-nav-item active" data-testid="nav-dashboard">
              <Home className="w-5 h-5" />
              <span>Panel</span>
            </Link>
            <button 
              onClick={() => setCreateDialogOpen(true)} 
              className="sidebar-nav-item w-full text-left"
              data-testid="nav-create-link"
            >
              <Plus className="w-5 h-5" />
              <span>Yeni Link</span>
            </button>
            {isAdmin && (
              <Link to="/admin" className="sidebar-nav-item" data-testid="nav-admin">
                <Shield className="w-5 h-5" />
                <span>Admin Paneli</span>
              </Link>
            )}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-semibold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.username}</p>
                <p className="text-sm text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-slate-400 hover:text-white"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="mobile-sidebar-btn"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-xl font-semibold text-white">Panel</h1>
            </div>

            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              data-testid="header-create-link-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Yeni Link</span>
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card" data-testid="stat-total-links">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <img src="/favicon.png" alt="Link" className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">Toplam Link</p>
              <p className="text-2xl font-bold text-white">{stats.total_links}</p>
            </div>

            <div className="stat-card" data-testid="stat-active-links">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">Aktif Link</p>
              <p className="text-2xl font-bold text-white">{stats.active_links}</p>
            </div>

            <div className="stat-card" data-testid="stat-total-clicks">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">Toplam Tıklama</p>
              <p className="text-2xl font-bold text-white">{stats.total_clicks}</p>
            </div>

            <div className="stat-card" data-testid="stat-today-clicks">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">Bugünkü Tıklama</p>
              <p className="text-2xl font-bold text-white">{stats.today_clicks}</p>
            </div>
          </div>

          {/* Links Section */}
          <div className="bg-[#121214] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-white">Linklerim</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Link ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-[#1C1C1E] border-white/10 text-white"
                    data-testid="search-links-input"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="spinner mx-auto" />
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="empty-state-icon">
                  <img src="/favicon.png" alt="Link" className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchQuery ? 'Sonuç bulunamadı' : 'Henüz link yok'}
                </h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery ? 'Farklı bir arama deneyin' : 'İlk linkinizi oluşturmaya başlayın'}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setCreateDialogOpen(true)}
                    className="bg-cyan-600 hover:bg-cyan-500"
                    data-testid="empty-create-link-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Link Oluştur
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors duration-200"
                    data-testid={`link-item-${link.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium truncate">
                            {link.title || link.short_code}
                          </h3>
                          {link.has_password && (
                            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                          {link.expires_at && (
                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-cyan-400 text-sm font-mono truncate">
                            {getShortUrl(link.short_code)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(getShortUrl(link.short_code))}
                            className="p-1 text-slate-500 hover:text-cyan-400 flex-shrink-0"
                            data-testid={`copy-link-${link.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 truncate">{link.original_url}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">{link.click_count}</p>
                          <p className="text-xs text-slate-500">tıklama</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" data-testid={`link-menu-${link.id}`}>
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1C1C1E] border-white/10">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/panel/link/${link.id}`)}
                              className="text-slate-300 hover:text-white focus:text-white focus:bg-white/5"
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analitik
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedLink(link);
                                setQrDialogOpen(true);
                              }}
                              className="text-slate-300 hover:text-white focus:text-white focus:bg-white/5"
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              QR Kod
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(getShortUrl(link.short_code), '_blank')}
                              className="text-slate-300 hover:text-white focus:text-white focus:bg-white/5"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Linke Git
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteLink(link.id)}
                              className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Link Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#121214] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Yeni Link Oluştur</DialogTitle>
            <DialogDescription className="text-slate-400">
              URL'nizi kısaltın ve özelleştirin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLink} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">URL *</Label>
              <Input
                type="url"
                placeholder="https://ornek.com/uzun-link"
                value={newLink.original_url}
                onChange={(e) => setNewLink({...newLink, original_url: e.target.value})}
                className="bg-[#1C1C1E] border-white/10 text-white"
                required
                data-testid="create-link-url-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Başlık (Opsiyonel)</Label>
              <Input
                type="text"
                placeholder="Kampanya Linki"
                value={newLink.title}
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                className="bg-[#1C1C1E] border-white/10 text-white"
                data-testid="create-link-title-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Özel Kısa URL (Opsiyonel)</Label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">{DOMAIN}/</span>
                <Input
                  type="text"
                  placeholder="kampanya"
                  value={newLink.custom_slug}
                  onChange={(e) => setNewLink({...newLink, custom_slug: e.target.value})}
                  className="flex-1 bg-[#1C1C1E] border-white/10 text-white"
                  data-testid="create-link-slug-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Şifre Koruması (Opsiyonel)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newLink.password}
                onChange={(e) => setNewLink({...newLink, password: e.target.value})}
                className="bg-[#1C1C1E] border-white/10 text-white"
                data-testid="create-link-password-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Bitiş Tarihi (Opsiyonel)</Label>
              <Input
                type="datetime-local"
                value={newLink.expires_at}
                onChange={(e) => setNewLink({...newLink, expires_at: e.target.value})}
                className="bg-[#1C1C1E] border-white/10 text-white"
                data-testid="create-link-expires-input"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setCreateDialogOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                İptal
              </Button>
              <Button 
                type="submit" 
                disabled={createLoading}
                className="bg-cyan-600 hover:bg-cyan-500"
                data-testid="create-link-submit-btn"
              >
                {createLoading ? <div className="spinner w-4 h-4" /> : 'Oluştur'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="bg-[#121214] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">QR Kod</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedLink?.title || selectedLink?.short_code}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-6">
            <div id="qr-code-container" className="bg-white rounded-2xl p-6 mb-6">
              {selectedLink && (
                <QRCodeSVG 
                  value={getShortUrl(selectedLink.short_code)}
                  size={192}
                  level="H"
                  includeMargin={false}
                  fgColor="#0A0A0B"
                  bgColor="#FFFFFF"
                />
              )}
            </div>
            <code className="text-cyan-400 text-sm font-mono mb-4">
              {selectedLink && getShortUrl(selectedLink.short_code)}
            </code>
            <Button 
              className="bg-cyan-600 hover:bg-cyan-500"
              onClick={() => {
                const svg = document.querySelector('#qr-code-container svg');
                if (svg) {
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  const img = new Image();
                  img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    const pngFile = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.download = `qr-${selectedLink?.short_code || 'code'}.png`;
                    downloadLink.href = pngFile;
                    downloadLink.click();
                    toast.success('QR kod indirildi!');
                  };
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                }
              }}
              data-testid="download-qr-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              PNG Olarak İndir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
