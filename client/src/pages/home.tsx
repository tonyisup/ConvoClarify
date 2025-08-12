import { useState } from "react";
import { MessageSquare, Settings, HelpCircle } from "lucide-react";
import ConversationInput from "@/components/conversation-input.tsx";
import AnalysisResults from "@/components/analysis-results.tsx";
import LoadingModal from "@/components/loading-modal.tsx";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setIsAnalyzing(false);
  };

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisData(null);
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ConversationInput 
          onAnalysisStart={handleAnalysisStart}
          onAnalysisComplete={handleAnalysisComplete}
        />
        
        {analysisData && (
          <div className="mt-8">
            <AnalysisResults analysis={analysisData} />
          </div>
        )}
      </main>

      <LoadingModal isOpen={isAnalyzing} />
    </div>
  );
}
