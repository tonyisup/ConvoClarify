import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-900">
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

          {/* CTA Button */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="text-lg px-8 py-3"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Get Started
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to start analyzing your conversations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}