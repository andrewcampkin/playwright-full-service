import { Play, BarChart3, Zap, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Test Automation
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Generate, execute, and analyze comprehensive web tests with AI. 
            Transform any website into a robust test suite in minutes.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded border border-gray-200">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-700">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded border border-gray-200">
              <Play className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-700">Auto-Execute</span>
            </div>
            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded border border-gray-200">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700">Smart Analytics</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 text-white px-6 py-3 rounded font-semibold hover:bg-blue-700 flex items-center justify-center space-x-2">
              <span>Start Testing Now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded font-semibold border border-gray-200 hover:border-gray-300">
              Watch Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Trusted by development teams worldwide</p>
            <div className="flex justify-center items-center space-x-6 opacity-60">
              <div className="text-lg font-semibold text-gray-400">TechCorp</div>
              <div className="text-lg font-semibold text-gray-400">StartupXYZ</div>
              <div className="text-lg font-semibold text-gray-400">DevTeam</div>
              <div className="text-lg font-semibold text-gray-400">WebAgency</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
