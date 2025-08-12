import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Clipboard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ConversationInputProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any) => void;
}

export default function ConversationInput({ onAnalysisStart, onAnalysisComplete }: ConversationInputProps) {
  const [conversationText, setConversationText] = useState("");
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [language, setLanguage] = useState("english");
  const { toast } = useToast();

  const createConversationMutation = useMutation({
    mutationFn: async (data: { text: string; analysisDepth: string; language: string }) => {
      const response = await apiRequest("POST", "/api/conversations", data);
      return response.json();
    },
  });

  const analyzeConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/analyze`);
      return response.json();
    },
  });

  const handleAnalyze = async () => {
    if (!conversationText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a conversation to analyze.",
        variant: "destructive",
      });
      return;
    }

    try {
      onAnalysisStart();

      // Create conversation
      const conversation = await createConversationMutation.mutateAsync({
        text: conversationText,
        analysisDepth,
        language,
      });

      // Analyze conversation
      const analysis = await analyzeConversationMutation.mutateAsync(conversation.id);
      
      onAnalysisComplete(analysis);
      
      toast({
        title: "Analysis Complete",
        description: "Your conversation has been analyzed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive",
      });
      onAnalysisComplete(null);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setConversationText(text);
    } catch (error) {
      toast({
        title: "Paste Failed",
        description: "Could not paste from clipboard. Please paste manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Conversation Input</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-blue-700 font-medium">
                <Upload className="w-4 h-4 mr-1" />
                Upload File
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePaste}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                <Clipboard className="w-4 h-4 mr-1" />
                Paste
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Conversation Text</Label>
              <Textarea 
                value={conversationText}
                onChange={(e) => setConversationText(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                placeholder={`Paste your conversation here...

Example format:
John: I think we should proceed with the original plan.
Sarah: That sounds reasonable, but I have some concerns about timing.
John: What do you mean by reasonable? I thought you were on board.
Sarah: I am supportive, but reasonable doesn't mean without questions.`}
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Use "Name:" format to separate speakers, or our AI will automatically detect conversation patterns
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label className="block text-sm font-medium text-gray-700 mb-2">Analysis Depth</Label>
                <Select value={analysisDepth} onValueChange={setAnalysisDepth}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Analysis</SelectItem>
                    <SelectItem value="deep">Deep Semantic Analysis</SelectItem>
                    <SelectItem value="context">Context-Aware Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="block text-sm font-medium text-gray-700 mb-2">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="german">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleAnalyze}
              disabled={createConversationMutation.isPending || analyzeConversationMutation.isPending}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Analyze Conversation</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips Panel */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Parse Conversation</h4>
                <p className="text-sm text-gray-600">Our AI identifies different speakers and conversation flow</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Semantic Analysis</h4>
                <p className="text-sm text-gray-600">Analyze word choices, connotations, and implicit meanings</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Identify Issues</h4>
                <p className="text-sm text-gray-600">Highlight potential miscommunications with explanations</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">💡</div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Pro Tip</h4>
                <p className="text-xs text-blue-700 mt-1">Include context like timestamps, emotions, or setting for more accurate analysis</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
