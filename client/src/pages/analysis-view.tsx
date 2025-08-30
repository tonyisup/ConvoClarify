import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, MessageSquare, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AnalysisResults from "@/components/analysis-results";
import { formatDistanceToNow } from "date-fns";

export default function AnalysisViewPage() {
  const params = useParams();
  const conversationId = params.id;

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId],
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["/api/conversations", conversationId, "analysis"],
    enabled: !!conversationId,
  });

  const isLoading = conversationLoading || analysisLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                Analysis Not Found
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-4">
                This conversation hasn't been analyzed yet or doesn't exist.
              </p>
              <Link href="/history">
                <Button variant="outline" data-testid="button-back-to-history">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/history">
                <Button 
                  variant="ghost" 
                  size="sm"
                  data-testid="button-back-to-history"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to History
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Analysis Results
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                  </div>
                  {analysis.speakers && (
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {analysis.speakers.length} speaker{analysis.speakers.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {conversation.text.split('\n').length} lines
                  </div>
                </div>
              </div>
            </div>
            
            <Link href="/">
              <Button data-testid="button-new-analysis">
                New Analysis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalysisResults 
          analysis={{
            ...analysis,
            conversationId: conversation.id,
            messages: analysis.messages || [],
          }} 
        />
      </main>
    </div>
  );
}