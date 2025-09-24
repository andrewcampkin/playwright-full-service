import { Zap, User, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

interface HeaderProps {
  onLoginClick?: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <header className="glass-card border-b border-white/30 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-glow floating-element">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-warning-400 to-success-400 rounded-full flex items-center justify-center floating-element" style={{animationDelay: '0.1s'}}>
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold gradient-text">Playwright AI</h1>
              <p className="text-sm text-slate-600 font-medium">Test Automation Platform</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3 px-4 py-2 bg-white/50 rounded-xl border border-white/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline font-medium text-slate-700">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all duration-300 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-slate-600 hover:text-slate-900 font-semibold px-4 py-2 rounded-xl hover:bg-white/50 transition-all duration-300"
                >
                  Sign In
                </button>
                <button className="gradient-button px-6 py-3 rounded-xl font-semibold text-sm">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
