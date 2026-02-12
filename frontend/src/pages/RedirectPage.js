import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const RedirectPage = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLink = async () => {
      try {
        const response = await axios.get(`${API_URL}/r/${shortCode}`);
        
        // If we get requires_password response
        if (response.data?.requires_password) {
          setRequiresPassword(true);
          setLoading(false);
        }
        // Otherwise, the redirect happened via 302
      } catch (error) {
        const status = error.response?.status;
        const detail = error.response?.data?.detail;
        
        if (status === 404) {
          setError('Bu link bulunamadı');
        } else if (status === 410) {
          setError(detail || 'Bu link artık aktif değil');
        } else {
          setError('Bir hata oluştu');
        }
        setLoading(false);
      }
    };

    checkLink();
  }, [shortCode]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Lütfen şifre girin');
      return;
    }

    setVerifying(true);
    try {
      const response = await axios.post(`${API_URL}/r/${shortCode}/verify`, { password });
      
      if (response.data?.redirect_url) {
        window.location.href = response.data.redirect_url;
      }
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(detail || 'Şifre doğrulanamadı');
    }
    setVerifying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Yönlendiriliyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">😔</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Bulunamadı</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-[#121214] rounded-2xl border border-white/5 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Şifre Gerekli</h1>
              <p className="text-slate-400 text-sm">Bu link şifre ile korunmaktadır.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Şifre girin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-[#1C1C1E] border-white/10 text-white"
                data-testid="password-input"
              />
              <Button 
                type="submit" 
                disabled={verifying}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500"
                data-testid="verify-password-btn"
              >
                {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Devam Et'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RedirectPage;
