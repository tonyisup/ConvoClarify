import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { MessageSquare, Eye, Calendar, ExternalLink, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AnalysisResults from "@/components/analysis-results";
import { formatDistanceToNow } from "date-fns";

export default function SharedAnalysisPage() {
  const params = useParams();
  const shareToken = params.token;

  const { data: sharedData, isLoading, error } = useQuery({
    queryKey: ["/api/shared", shareToken],
    enabled: !!shareToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                Analysis Not Available
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">
                This shared analysis link is invalid, expired, or has been removed.
              </p>
              <a href="https://conversationclarify.com" target="_blank" rel="noopener noreferrer">
                <Button data-testid="button-visit-site">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit ConversationClarify
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { conversation, analysis, shareInfo } = sharedData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Shared Analysis
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Analyzed {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {shareInfo.viewCount} view{shareInfo.viewCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <a href="https://conversationclarify.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" data-testid="button-try-yourself">
                <ExternalLink className="w-4 h-4 mr-2" />
                Try ConversationClarify
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Shared Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-2 text-blue-800 dark:text-blue-200">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">
              This is a shared conversation analysis. 
              <a href="https://conversationclarify.com" className="underline ml-1" target="_blank" rel="noopener noreferrer">
                Create your own free analysis
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalysisResults 
          analysis={{
            ...analysis,
            conversationId: conversation.id,
            messages: analysis.messages || [],
          }} 
        />
        
        {/* Footer CTA */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Want to analyze your own conversations?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get detailed insights into your communication patterns and identify potential miscommunications.
            </p>
            <a href="https://conversationclarify.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" data-testid="button-get-started">
                Get Started Free
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}