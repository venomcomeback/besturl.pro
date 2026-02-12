import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      toast.success('Giriş başarılı!');
      navigate('/panel');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-2xl font-bold text-white">LinkShortTR</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Giriş Yap</h1>
            <p className="text-slate-400">Hesabınıza giriş yaparak devam edin.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500"
                data-testid="login-username-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Şifre</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500 pr-12"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <div className="spinner w-5 h-5" />
              ) : (
                'Giriş Yap'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-400">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-cyan-400 hover:text-cyan-300 font-medium" data-testid="register-link">
              Kayıt Ol
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[#0d0d0e] p-12">
        <div className="max-w-md">
          <div className="bg-[#121214] rounded-2xl p-8 border border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">linkshort.tr/kampanya</p>
                  <p className="text-sm text-slate-500">12,456 tıklama</p>
                </div>
              </div>
              <div className="h-2 bg-[#1C1C1E] rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full" />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-2">
            Linklerinizi Kontrol Altına Alın
          </h3>
          <p className="text-slate-400">
            Profesyonel link yönetimi ile markanızı güçlendirin ve detaylı analizlerle performansınızı takip edin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
