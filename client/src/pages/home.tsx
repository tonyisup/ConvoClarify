import { useState, useEffect } from "react";
import { MessageSquare, Settings, HelpCircle, LogOut, History, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import ConversationInput from "@/components/conversation-input.tsx";
import AnalysisResults from "@/components/analysis-results.tsx";
import ConversationEditor from "@/components/conversation-editor.tsx";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { analytics } from "@/lib/posthog";

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); // 0: idle, 1: parsing, 2: analyzing, 3: generating
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
    setAnalysisStep(0);
  };

  const handleEditingSave = async (speakers: string[], messages: any[]) => {
    setIsEditing(false);
    setIsAnalyzing(true);
    
    const startTime = Date.now();
    
    try {
      setAnalysisStep(2); // Step 2: Running semantic analysis
      
      // Re-run analysis with corrected data
      const response = await fetch(`/api/conversations/${editingData?.conversationId}/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakers, messages })
      });
      
      const result = await response.json();
      
      setAnalysisStep(3); // Step 3: Identifying communication issues
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Track reanalysis completion
      const processingTime = Date.now() - startTime;
      analytics.trackReanalysisCompleted(
        result.clarityScore || 0,
        result.issues?.length || 0,
        processingTime
      );
      
      setAnalysisStep(0); // Reset
      setAnalysisData(result);
    } catch (error) {
      console.error('Reanalysis failed:', error);
      setAnalysisStep(0); // Reset on error
      
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
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Convo Clarify</h1>
                {/* <p className="text-sm text-gray-600 dark:text-gray-400">Analyze conversations for potential miscommunications</p> */}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/history">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  data-testid="button-view-history"
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
              <ThemeToggle />
              {/* <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <HelpCircle className="h-5 w-5" />
              </Button> */}
              {/* <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Settings className="h-5 w-5" />
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConversationInput 
          onAnalysisStart={handleAnalysisStart}
          onAnalysisComplete={handleAnalysisComplete}
          isEditing={isEditing}
          editingData={editingData}
          onEditingSave={handleEditingSave}
          onEditingCancel={handleEditingCancel}
          isAnalyzing={isAnalyzing}
          analysisStep={analysisStep}
          setAnalysisStep={setAnalysisStep}
        />
        
        {analysisData && !isAnalyzing && (
          <div className="mt-8 max-w-full overflow-hidden">
            <AnalysisResults analysis={analysisData} />
          </div>
        )}
      </main>
    </div>
  );
}
