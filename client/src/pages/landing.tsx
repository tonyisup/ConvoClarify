import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            ConversationClarify
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            AI-Powered Conversation Analysis
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            Analyze your conversations to identify potential miscommunications, ambiguous language, and communication issues. 
            Upload screenshots from messaging platforms or paste text directly for comprehensive semantic analysis.
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-2xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Smart Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered semantic analysis identifies miscommunications and suggests improvements
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-2xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Screenshot Upload
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload screenshots from WhatsApp, Discord, Slack, Teams, and other messaging platforms
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-2xl mb-4">✏️</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Manual Editing
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fine-tune speaker attribution and message ordering before final analysis
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-3"
                onClick={() => window.location.href = '/api/auth/google'}
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-replit-login"
              >
                Continue with Replit
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to start analyzing your conversations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}