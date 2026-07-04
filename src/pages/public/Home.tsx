import { Link } from "wouter";
import { Button } from "@/components/ui/button";

import { Sun, Zap, ShieldCheck, BarChart3, ChevronRight, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.png" alt="SWAYOG" className="h-8 w-auto cursor-pointer" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/about"><span className="text-slate-600 hover:text-primary cursor-pointer transition-colors">About Us</span></Link>
            <Link href="/services"><span className="text-slate-600 hover:text-primary cursor-pointer transition-colors">Services</span></Link>
            <Link href="/contact"><span className="text-slate-600 hover:text-primary cursor-pointer transition-colors">Contact</span></Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="gradient-bg text-white border-0 hover:scale-105 transition-transform shadow-md rounded-full px-6">
                Login to Portal <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-green-50 opacity-90" />
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] rounded-full bg-green-500/10 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm border text-sm font-medium text-primary mb-6">
              <Sun className="w-4 h-4" /> Leading India's Solar Revolution
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              Powering the Future, <br />
              <span className="gradient-text">Together We Can.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              SWAYOG Energy provides end-to-end solar operations management, empowering homes and businesses with clean, sustainable energy solutions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="h-14 px-8 text-base gradient-bg hover:scale-105 transition-transform shadow-lg rounded-full w-full sm:w-auto">
                  Get a Free Quote
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-white hover:bg-slate-50 w-full sm:w-auto">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">High Efficiency</h3>
              <p className="text-slate-600 text-sm">Premium tier-1 panels with maximum energy yield for your property.</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">25-Year Warranty</h3>
              <p className="text-slate-600 text-sm">Long-term peace of mind with our comprehensive service coverage.</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Smart Monitoring</h3>
              <p className="text-slate-600 text-sm">Track your energy production and savings in real-time via our app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose SWAYOG?</h2>
            <p className="text-slate-600">We don't just install solar panels; we build lasting energy partnerships with complete operational transparency.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-white shadow-sm rounded-full flex items-center justify-center text-primary font-bold">1</div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Expert Installation</h4>
                  <p className="text-slate-600">Our certified technicians ensure perfect placement and structural integrity for maximum output.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-white shadow-sm rounded-full flex items-center justify-center text-primary font-bold">2</div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Proactive Maintenance (AMC)</h4>
                  <p className="text-slate-600">Regular cleaning and system checks keep your solar plant running at peak efficiency year-round.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-white shadow-sm rounded-full flex items-center justify-center text-primary font-bold">3</div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">Dedicated Customer Portal</h4>
                  <p className="text-slate-600">Log in to track your installation progress, view invoices, and raise service requests instantly.</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-200 rounded-3xl h-96 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=2072&auto=format&fit=crop"
                alt="Solar Installation"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <p className="text-white font-medium text-lg">Commercial Installation</p>
                <p className="text-white/80 text-sm">Pune, Maharashtra</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#111827]" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-green-600/20 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Become a SWAYOG Partner</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            Join our growing network of solar partners. Earn high commissions, manage projects through our dedicated partner portal, and help India transition to clean energy.
          </p>
          <Button size="lg" className="h-14 px-8 text-base bg-white text-slate-900 hover:bg-slate-100 rounded-full">
            Apply for Partnership <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/logo.png" alt="SWAYOG" className="h-8 w-auto" />
            <p className="text-slate-600 text-sm">
              Empowering India with sustainable, efficient, and affordable solar energy solutions. Together We Can.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/about"><span className="hover:text-primary cursor-pointer">About Us</span></Link></li>
              <li><Link href="/services"><span className="hover:text-primary cursor-pointer">Services</span></Link></li>
              <li><Link href="/contact"><span className="hover:text-primary cursor-pointer">Contact</span></Link></li>
              <li><Link href="/login"><span className="hover:text-primary cursor-pointer">Login</span></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Residential Solar</li>
              <li>Commercial Solar</li>
              <li>Annual Maintenance (AMC)</li>
              <li>System Upgrades</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>1800-SWAYOG (Toll Free)</li>
              <li>info@swayogenergy.com</li>
              <li>Pune, Maharashtra, India</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} SWAYOG Energy Private Limited. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
