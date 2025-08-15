import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload, Clipboard, Search, MessageSquare, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ImageUpload from "@/components/image-upload.tsx";
import AIModelSelector from "@/components/ai-model-selector.tsx";
import { analytics } from "@/lib/posthog";
import { useAuth } from "@/hooks/useAuth";

interface ConversationInputProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any) => void;
}

export default function ConversationInput({ onAnalysisStart, onAnalysisComplete }: ConversationInputProps) {
  const [conversationText, setConversationText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [analysisDepth, setAnalysisDepth] = useState("standard");
  const [language, setLanguage] = useState("english");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [reasoningLevel, setReasoningLevel] = useState("standard");
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user subscription status
  const { data: userData } = useQuery<{
    subscriptionPlan: string;
    subscriptionStatus: string;
    monthlyAnalysisCount: number;
    subscriptionEndsAt?: string;
  }>({
    queryKey: ["/api/user/subscription"],
    enabled: !!user,
  });

  // Handle paste events for screenshot pasting
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = await item.getAsFile();
        if (!file){
          break;
        }
        handleImagePaste(file);
        break;
      }
    }
  };

  const handleImagePaste = async (file: File) => {          
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setSelectedImage(base64String);
        setInputMode("image");
        
        toast({
          title: "Screenshot pasted successfully",
          description: "Your screenshot has been added for analysis.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop for images
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setSelectedImage(base64String);
          setInputMode("image");
          
          toast({
            title: "Screenshot uploaded successfully",
            description: "Your screenshot has been added for analysis.",
          });
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
      }
    }
  };

  const createConversationMutation = useMutation({
    mutationFn: async (data: { 
      text: string; 
      imageUrl?: string; 
      analysisDepth: string; 
      language: string;
      aiModel?: string;
      reasoningLevel?: string;
    }) => {
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
    if (!conversationText.trim() && !selectedImage) {
      toast({
        title: "Error",
        description: "Please enter a conversation or upload a screenshot to analyze.",
        variant: "destructive",
      });
      return;
    }

    const startTime = Date.now();

    try {
      onAnalysisStart();

      // Track conversation upload
      analytics.trackConversationUploaded(selectedImage ? 'image' : 'text');
      
      // Track analysis start
      analytics.trackAnalysisStarted(analysisDepth, language, !!selectedImage);

      // Create conversation
      const conversation = await createConversationMutation.mutateAsync({
        text: conversationText || "Text extracted from image",
        imageUrl: selectedImage || undefined,
        analysisDepth,
        language,
        aiModel,
        reasoningLevel,
      });

      // Analyze conversation
      const analysis = await analyzeConversationMutation.mutateAsync(conversation.id);
      
      // Track analysis completion
      const processingTime = Date.now() - startTime;
      analytics.trackAnalysisCompleted(
        analysis.clarityScore || 0,
        analysis.issues?.length || 0,
        analysis.speakers?.length || 0,
        analysis.messages?.length || 0,
        processingTime
      );
      
      onAnalysisComplete(analysis);
      
      toast({
        title: "Analysis Complete",
        description: "Your conversation has been analyzed successfully.",
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      
      // Track error
      analytics.trackError("analysis_failed", {
        error_details: error instanceof Error ? error.message : "Unknown error",
        has_image: !!selectedImage,
        analysis_depth: analysisDepth,
        language: language,
      });
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis.",
        variant: "destructive",
      });
      onAnalysisComplete(null);
    }
  };
  const handleGlobalPaste = async () => {
    if (inputMode === "text") {
      handleTextPaste();
    } else {
      try {
        const clipboardItems = await navigator.clipboard.read();
        
        const clipboardData = {
          items: clipboardItems.map(item => ({
            type: item.types[0],
            getAsFile: () => item.getType(item.types[0]).then(blob => new File([blob], "clipboard-image", { type: blob.type })),
          })),
        };
        handleImagePaste(await clipboardData.items[0].getAsFile());
      } catch (error) {
        toast({
          title: "Failed to access clipboard",
          description: "Could not read clipboard image.",
          variant: "destructive",
        });
      }
    }
  };

  const handleTextPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setConversationText(text);
      toast({
        title: "Text pasted",
        description: "Content pasted from clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to paste",
        description: "Could not access clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Panel */}
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation Input</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGlobalPaste}
              className="text-sm text-gray-500 hover:text-gray-700"
              data-testid="button-paste-text"
            >
              <Clipboard className="w-4 h-4 mr-1" />
              Paste
            </Button>
          </div>

          <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as "text" | "image")} className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-input-mode">
              <TabsTrigger value="text" className="flex items-center space-x-2" data-testid="tab-text-input">
                <MessageSquare className="w-4 h-4" />
                <span>Text Input</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center space-x-2" data-testid="tab-image-input">
                <Camera className="w-4 h-4" />
                <span>Screenshot</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div>
                <Label className="block text-sm font-medium text-gray-600 dark:text-white mb-2">Conversation Text</Label>
                <Textarea 
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  onPaste={handlePaste}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                  placeholder={`Paste your conversation here...

John: I think we should proceed with the original plan.

Sarah: That sounds reasonable, but I have some concerns about timing.

John: What do you mean by reasonable? I thought you were on board.`}
                  data-testid="textarea-conversation-text"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-4">
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
              >
                <Label className="block text-sm font-medium text-gray-300 dark:text-white mb-2">Upload Screenshot</Label>
                <ImageUpload
                  onImageSelect={setSelectedImage}
                  onImageRemove={() => setSelectedImage(null)}
                  selectedImage={selectedImage}
                />
                {/* <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Works with screenshots from WhatsApp, Discord, Slack, Teams, and other messaging apps<br/>
                  🖼️ Drag & drop images or paste screenshots with Ctrl+V
                </p> */}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="space-y-4 mt-6">

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
              data-testid="button-analyze-conversation"
            >
              <Search className="w-4 h-4" />
              <span>
                {selectedImage ? "Analyze Screenshot" : "Analyze Conversation"}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Model and Reasoning Level Selection - Premium Feature */}
      {/* <AIModelSelector
        selectedModel={aiModel}
        selectedReasoningLevel={reasoningLevel}
        onModelChange={setAiModel}
        onReasoningLevelChange={setReasoningLevel}
        userPlan={userData?.subscriptionPlan || "free"}
        disabled={createConversationMutation.isPending || analyzeConversationMutation.isPending}
      /> */}

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
                <h4 className="font-medium text-gray-900">Extract & Parse</h4>
                <p className="text-sm text-gray-600">Extract text from screenshots or parse typed conversations to identify speakers</p>
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
                <p className="text-sm text-gray-600">Highlight potential miscommunications with detailed explanations</p>
              </div>
            </div>
          </div>

          {/* <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">💡</div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">Screenshot Support</h4>
                <p className="text-xs text-blue-700 mt-1">Upload screenshots from WhatsApp, Discord, Slack, Teams, or any messaging app for instant analysis</p>
              </div>
            </div>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
