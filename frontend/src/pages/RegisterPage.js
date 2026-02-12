import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);

    if (result.success) {
      toast.success('Kayıt başarılı!');
      navigate('/panel');
    } else {
      toast.error(result.error);
    }
  };

  const benefits = [
    'Sınırsız link kısaltma',
    'Detaylı analitik ve raporlar',
    'QR kod üretimi',
    'Özel domain desteği',
    'Şifre korumalı linkler'
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-[#0d0d0e] p-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Profesyonel Link Yönetimi
          </h2>
          <p className="text-slate-400 mb-8">
            BestURL ile linklerinizi kısaltın, analiz edin ve tam kontrol altında tutun.
          </p>

          <div className="space-y-4">
            {(Array.isArray(benefits) ? benefits : []).map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-[#121214] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src="https://images.unsplash.com/photo-1758518727592-706e80ebc354?w=100&h=100&fit=crop" 
                alt="User" 
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="text-white font-medium">Ahmet Yılmaz</p>
                <p className="text-sm text-slate-500">Dijital Pazarlamacı</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm italic">
              "BestURL sayesinde kampanya linklerimi çok daha profesyonel yönetebiliyorum. Analitik özellikleri gerçekten harika!"
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-sm mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors duration-200">
            <ArrowLeft className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <img src="/logo.png" alt="BestURL" className="h-10 w-auto" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Hesap Oluştur</h1>
            <p className="text-slate-400">Ücretsiz hesap oluşturarak başlayın.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullaniciadi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500"
                data-testid="register-username-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500"
                data-testid="register-email-input"
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
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500"
                data-testid="register-confirm-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? (
                <div className="spinner w-5 h-5" />
              ) : (
                'Hesap Oluştur'
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-slate-400">
            Zaten hesabınız var mı?{' '}
            <Link to="/giris" className="text-cyan-400 hover:text-cyan-300 font-medium" data-testid="login-link">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
