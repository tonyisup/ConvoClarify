import { useQuery } from "@tanstack/react-query";
import { Clock, FileText, MessageSquare, ArrowRight, Calendar, User, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function HistoryPage() {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ["/api/conversations"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Conversation History</h1>
            <p className="text-gray-600 dark:text-gray-400">Loading your analysis history...</p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
                Failed to load history
              </h2>
              <p className="text-red-700 dark:text-red-300">
                Unable to retrieve your conversation history. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Conversation History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and access your past conversation analyses
              </p>
            </div>
            <Link href="/">
              <Button data-testid="button-new-analysis">
                <FileText className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
            </Link>
          </div>
        </div>

        {/* History List */}
        {!history || (history as any[]).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No conversations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by analyzing your first conversation to see it appear here.
              </p>
              <Link href="/">
                <Button data-testid="button-start-first-analysis">
                  <FileText className="w-4 h-4 mr-2" />
                  Start Your First Analysis
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(history as any[]).map((conversation: any) => (
              <Card 
                key={conversation.id} 
                className="hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                data-testid={`card-conversation-${conversation.id}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 dark:text-white mb-2">
                        {conversation.text.split('\n')[0].substring(0, 80)}
                        {conversation.text.length > 80 ? '...' : ''}
                      </CardTitle>
                      
                      {/* Analysis Status */}
                      <div className="flex items-center space-x-3 mb-3">
                        {conversation.analysis ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <Target className="w-3 h-3 mr-1" />
                            Analyzed ({conversation.analysis.clarityScore}% clarity)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                            <Clock className="w-3 h-3 mr-1" />
                            Not Analyzed
                          </Badge>
                        )}
                        
                        {conversation.imageUrls && conversation.imageUrls.length > 0 && (
                          <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                            📸 {conversation.imageUrls.length} screenshot{conversation.imageUrls.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                        </div>
                        
                        {conversation.analysis?.speakers && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {conversation.analysis.speakers.length} speaker{conversation.analysis.speakers.length > 1 ? 's' : ''}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {conversation.text.split('\n').length} lines
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ml-4">
                      {conversation.analysis ? (
                        <Link href={`/analysis/${conversation.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-view-analysis-${conversation.id}`}
                          >
                            View Results
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/analyze/${conversation.id}`}>
                          <Button 
                            size="sm"
                            data-testid={`button-analyze-${conversation.id}`}
                          >
                            Analyze Now
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Analysis Summary (if available) */}
                {conversation.analysis && (
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">
                            {conversation.analysis.issues?.filter((issue: any) => issue.severity === 'critical').length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                            {conversation.analysis.issues?.filter((issue: any) => issue.severity === 'moderate').length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Moderate</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {conversation.analysis.issues?.filter((issue: any) => issue.severity === 'minor').length || 0}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Minor</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}