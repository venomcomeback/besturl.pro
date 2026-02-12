import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, QrCode, Globe, Shield, Zap, ArrowRight, ChevronRight, Check, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';

const DOMAIN = 'besturl.pro';

const LandingPage = () => {
  const [url, setUrl] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleShorten = (e) => {
    e.preventDefault();
    if (url) {
      navigate('/giris', { state: { url } });
    }
  };

  const features = [
    {
      icon: () => <img src="/logo.png" alt="Link" className="w-6 h-6" />,
      title: 'Özel Kısa Linkler',
      description: 'Kendi domain adresinizle profesyonel kısa linkler oluşturun.'
    },
    {
      icon: BarChart3,
      title: 'Detaylı Analitik',
      description: 'Tıklama, cihaz, konum ve referrer verilerini anlık takip edin.'
    },
    {
      icon: QrCode,
      title: 'QR Kod Üretimi',
      description: 'Her link için otomatik QR kod oluşturun ve indirin.'
    },
    {
      icon: Globe,
      title: 'Özel Domain',
      description: 'Kendi alan adınızı bağlayarak marka bilinirliğinizi artırın.'
    },
    {
      icon: Shield,
      title: 'Şifre Koruması',
      description: 'Hassas linklerinizi şifre ile koruma altına alın.'
    },
    {
      icon: Zap,
      title: 'Hızlı Yönlendirme',
      description: 'Milisaniyeler içinde hedef sayfaya yönlendirme yapın.'
    }
  ];

  const stats = [
    { value: '10M+', label: 'Kısaltılan Link' },
    { value: '500K+', label: 'Aktif Kullanıcı' },
    { value: '99.9%', label: 'Uptime' },
    { value: '<50ms', label: 'Yönlendirme Süresi' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="BestURL" className="h-10 w-auto" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#ozellikler" className="text-slate-400 hover:text-white transition-colors duration-200">Özellikler</a>
              <a href="#nasil-calisir" className="text-slate-400 hover:text-white transition-colors duration-200">Nasıl Çalışır</a>
              <a href="#istatistikler" className="text-slate-400 hover:text-white transition-colors duration-200">İstatistikler</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <Link to="/panel">
                  <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]" data-testid="dashboard-btn">
                    Panele Git
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/giris">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" data-testid="login-btn">
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link to="/kayit">
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)]" data-testid="register-btn">
                      Ücretsiz Başla
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className="md:hidden overflow-hidden transition-all duration-300"
          style={{ maxHeight: mobileMenuOpen ? '300px' : '0', opacity: mobileMenuOpen ? 1 : 0 }}
        >
          <div className="px-4 py-4 space-y-4 bg-[#121214] border-t border-white/5">
            <a href="#ozellikler" className="block text-slate-400 hover:text-white">Özellikler</a>
            <a href="#nasil-calisir" className="block text-slate-400 hover:text-white">Nasıl Çalışır</a>
            <a href="#istatistikler" className="block text-slate-400 hover:text-white">İstatistikler</a>
            <div className="flex gap-2 pt-4">
              <Link to="/giris" className="flex-1">
                <Button variant="outline" className="w-full border-white/10 text-slate-300">Giriş Yap</Button>
              </Link>
              <Link to="/kayit" className="flex-1">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500">Kayıt Ol</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm text-cyan-400 font-medium">Özel Domain Desteği</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                Linklerinizi{' '}
                <span className="text-gradient">Kısaltın</span>,{' '}
                Analiz Edin, Kontrol Edin
              </h1>

              <p className="text-lg text-slate-400 max-w-lg">
                Profesyonel link kısaltma servisi ile markanızı güçlendirin. 
                Detaylı analitik, özel domain ve QR kod desteği.
              </p>

              <form onSubmit={handleShorten} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="url"
                    placeholder="https://uzun-link-adresiniz.com/cok-uzun-link"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full h-14 bg-[#1C1C1E] border-white/10 text-white placeholder:text-slate-500 pr-4 text-base"
                    data-testid="hero-url-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="h-14 px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]"
                  data-testid="hero-shorten-btn"
                >
                  Kısalt
                </Button>
              </form>

              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Ücretsiz başla</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  <span>Kredi kartı gerekmez</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {/* Analytics Card */}
                <div className="col-span-2 bg-[#121214] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-cyan-400 font-medium">CANLI ANALİTİK</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Gerçek Zamanlı İstatistikler</h3>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-sm text-slate-500">Toplam Tıklama</p>
                      <p className="text-3xl font-bold text-white">24,567</p>
                      <span className="text-sm text-emerald-400">↑ +23%</span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Aktif Link</p>
                      <p className="text-3xl font-bold text-white">142</p>
                    </div>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-[#121214] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs text-emerald-400 font-medium">● QR Aktif</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 w-fit mx-auto">
                    <div className="w-24 h-24 bg-[#0A0A0B] rounded-lg grid grid-cols-3 gap-1 p-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className={`rounded-sm ${i % 2 === 0 ? 'bg-cyan-500' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Domain Card */}
                <div className="bg-[#121214] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-white font-medium">Özel Domain</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">Kendi domain adresinizle profesyonel kısa linkler</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-md font-mono">
                      {DOMAIN}/kampanya
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Güçlü Özellikler
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Link yönetimini profesyonel seviyeye taşıyan tüm araçlar tek bir platformda.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-[#121214] rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors duration-300">
                  {typeof feature.icon === 'function' ? feature.icon() : <feature.icon className="w-6 h-6 text-cyan-400" />}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="nasil-calisir" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0d0d0e]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Sadece üç adımda profesyonel link yönetimine başlayın.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Linki Yapıştır',
                description: 'Kısaltmak istediğiniz uzun linki yapıştırın.'
              },
              {
                step: '02',
                title: 'Özelleştir',
                description: 'Özel kısa URL, QR kod ve şifre koruması ekleyin.'
              },
              {
                step: '03',
                title: 'Paylaş & Takip Et',
                description: 'Linki paylaşın ve detaylı analitiğini takip edin.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <span className="text-6xl font-bold text-cyan-500/20">{item.step}</span>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.description}</p>
                  </div>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2">
                    <ChevronRight className="w-8 h-8 text-cyan-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="istatistikler" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <p className="text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-[#121214] rounded-3xl p-8 sm:p-12 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Hemen Başlayın
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Ücretsiz hesap oluşturun ve linklerinizi profesyonel şekilde yönetmeye başlayın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/kayit">
                  <Button size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]" data-testid="cta-register-btn">
                    Ücretsiz Hesap Oluştur
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/giris">
                  <Button size="lg" variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5" data-testid="cta-login-btn">
                    Giriş Yap
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="BestURL" className="h-8 w-auto" />
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 BestURL. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
