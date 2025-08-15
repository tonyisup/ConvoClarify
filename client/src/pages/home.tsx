import { useState, useEffect } from "react";
import { MessageSquare, Settings, HelpCircle } from "lucide-react";
import ConversationInput from "@/components/conversation-input.tsx";
import AnalysisResults from "@/components/analysis-results.tsx";
import LoadingModal from "@/components/loading-modal.tsx";
import ConversationEditor from "@/components/conversation-editor.tsx";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/posthog";

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState<{
    conversationId: string;
    speakers: string[];
    messages: any[];
    originalData: any;
  } | null>(null);

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('home');
  }, []);

  const handleAnalysisComplete = (data: any) => {
    setIsAnalyzing(false);
    // If we have parsed messages, show the editor first
    if (data.messages && data.messages.length > 0) {
      setEditingData({
        conversationId: data.conversationId || data.id,
        speakers: data.speakers || [],
        messages: data.messages || [],
        originalData: data
      });
      setIsEditing(true);
    } else {
      setAnalysisData(data);
    }
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisData(null);
  };

  const handleEditingSave = async (speakers: string[], messages: any[]) => {
    setIsEditing(false);
    setIsAnalyzing(true);
    
    const startTime = Date.now();
    
    try {
      // Re-run analysis with corrected data
      const response = await fetch(`/api/conversations/${editingData?.conversationId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakers, messages })
      });
      
      const result = await response.json();
      
      // Track reanalysis completion
      const processingTime = Date.now() - startTime;
      analytics.trackReanalysisCompleted(
        result.clarityScore || 0,
        result.issues?.length || 0,
        processingTime
      );
      
      setAnalysisData(result);
    } catch (error) {
      console.error('Reanalysis failed:', error);
      
      // Track reanalysis error
      analytics.trackError("reanalysis_failed", {
        error_details: error instanceof Error ? error.message : "Unknown error",
      });
      
      // Fallback to original data
      setAnalysisData(editingData?.originalData);
    }
    
    setIsAnalyzing(false);
    setEditingData(null);
  };

  const handleEditingCancel = () => {
    setIsEditing(false);
    setAnalysisData(editingData?.originalData);
    setEditingData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MessageSquare className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">ConversationClarify</h1>
                <p className="text-sm text-gray-600">Analyze conversations for potential miscommunications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isEditing ? (
          <ConversationEditor 
            speakers={editingData?.speakers || []}
            messages={editingData?.messages || []}
            onSave={handleEditingSave}
            onCancel={handleEditingCancel}
          />
        ) : (
          <>
            <ConversationInput 
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
            />
            
            {analysisData && (
              <div className="mt-8">
                <AnalysisResults analysis={analysisData} />
              </div>
            )}
          </>
        )}
      </main>

      <LoadingModal isOpen={isAnalyzing} />
    </div>
  );
}
