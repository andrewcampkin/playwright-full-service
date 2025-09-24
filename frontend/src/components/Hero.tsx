import { Play, BarChart3, Zap, ArrowRight, Sparkles, Bot, Rocket } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary-200/30 to-accent-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-accent-200/20 to-primary-200/20 rounded-full blur-3xl"></div>
      
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center">
          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-5xl lg:text-7xl font-heading font-bold mb-4">
              AI-Powered
              <br />
              <span className="gradient-text">Test Automation</span>
            </h1>
            <div className="flex justify-center items-center space-x-2 mb-6">
              <Bot className="h-8 w-8 text-primary-500 floating-element" />
              <Sparkles className="h-6 w-6 text-accent-500 floating-element" style={{animationDelay: '0.5s'}} />
              <Rocket className="h-8 w-8 text-success-500 floating-element" style={{animationDelay: '1s'}} />
            </div>
          </div>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Generate, execute, and analyze comprehensive web tests with AI. 
            <br className="hidden md:block" />
            Transform any website into a robust test suite in minutes.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center space-x-3 glass-card px-6 py-3 rounded-2xl border border-white/30 card-hover">
              <div className="w-10 h-10 bg-gradient-to-br from-warning-400 to-warning-500 rounded-xl flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-700">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-3 glass-card px-6 py-3 rounded-2xl border border-white/30 card-hover">
              <div className="w-10 h-10 bg-gradient-to-br from-success-400 to-success-500 rounded-xl flex items-center justify-center">
                <Play className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-700">Auto-Execute</span>
            </div>
            <div className="flex items-center space-x-3 glass-card px-6 py-3 rounded-2xl border border-white/30 card-hover">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-slate-700">Smart Analytics</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button className="gradient-button px-8 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 shadow-strong">
              <span>Start Testing Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            <button className="glass-card text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg border border-white/30 hover:shadow-medium card-hover">
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="glass-card rounded-3xl p-8 border border-white/30">
            <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">Trusted by development teams worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-70">
              <div className="text-xl font-heading font-bold text-slate-400">TechCorp</div>
              <div className="text-xl font-heading font-bold text-slate-400">StartupXYZ</div>
              <div className="text-xl font-heading font-bold text-slate-400">DevTeam</div>
              <div className="text-xl font-heading font-bold text-slate-400">WebAgency</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
