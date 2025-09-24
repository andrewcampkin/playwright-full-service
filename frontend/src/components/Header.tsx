import { Zap, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

interface HeaderProps {
  onLoginClick?: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Playwright AI</h1>
              <p className="text-xs text-gray-500">Test Automation Platform</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name || user?.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Sign In
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
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
