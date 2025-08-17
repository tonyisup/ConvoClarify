import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload, Clipboard, Search, MessageSquare, Camera, Check, ChevronDown, ChevronUp } from "lucide-react";
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
import ConversationEditor from "@/components/conversation-editor.tsx";
import { analytics } from "@/lib/posthog";
import { useAuth } from "@/hooks/useAuth";

interface ConversationInputProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: any) => void;
  isEditing?: boolean;
  editingData?: {
    conversationId: string;
    speakers: string[];
    messages: any[];
    originalData: any;
  } | null;
  onEditingSave?: (speakers: string[], messages: any[]) => void;
  onEditingCancel?: () => void;
  isAnalyzing?: boolean;
  analysisStep?: number;
  setAnalysisStep?: (step: number) => void;
}

export default function ConversationInput({ 
  onAnalysisStart, 
  onAnalysisComplete, 
  isEditing = false, 
  editingData = null, 
  onEditingSave, 
  onEditingCancel,
  isAnalyzing = false,
  analysisStep: externalAnalysisStep = 0,
  setAnalysisStep: externalSetAnalysisStep
}: ConversationInputProps) {
  const [conversationText, setConversationText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [analysisDepth, setAnalysisDepth] = useState("deep");
  const [language, setLanguage] = useState("english");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [reasoningLevel, setReasoningLevel] = useState("deep");
  const [dragOver, setDragOver] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [localAnalysisStep, setLocalAnalysisStep] = useState(0); // 0: idle, 1: parsing, 2: analyzing, 3: generating
  
  // Use external step state if provided, otherwise use local state
  const analysisStep = externalAnalysisStep;
  const setAnalysisStep = externalSetAnalysisStep || setLocalAnalysisStep;
  const { toast } = useToast();
  const { user } = useAuth();

  // Check localStorage for "don't show again" preference
  useEffect(() => {
    const hideHowItWorks = localStorage.getItem('hideHowItWorks');
    if (hideHowItWorks === 'true') {
      setShowHowItWorks(false);
    }
  }, []);

  // Auto-collapse input card when analysis starts
  useEffect(() => {
    if (isAnalyzing || isEditing) {
      setIsInputCollapsed(true);
    }
  }, [isAnalyzing, isEditing]);

  const handleDontShowAgain = () => {
    localStorage.setItem('hideHowItWorks', 'true');
    setShowHowItWorks(false);
    toast({
      title: "Preference saved",
      description: "The How It Works panel will no longer be shown.",
    });
  };

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
      setAnalysisStep(1); // Step 1: Parsing speakers & messages

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

      // Show step 1 complete briefly, then reset to allow editing
      setAnalysisStep(1.5); // Show checkmark for step 1
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalysisStep(0); // Reset - user can now edit
      
      // Wait for user to complete editing before starting analysis
      // This will be handled by the onAnalysisComplete callback which shows the editor
      onAnalysisComplete(conversation);
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
      setAnalysisStep(0); // Reset on error
      onAnalysisComplete(null);
    }
  };
  const handleGlobalPaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      // Check if clipboard contains image data
      const hasImage = clipboardItems.some(item => 
        item.types.some(type => type.startsWith('image/'))
      );
      
      if (hasImage) {
        // Auto-switch to image mode and handle image paste
        setInputMode("image");
        const clipboardData = {
          items: clipboardItems.map(item => ({
            type: item.types.find(type => type.startsWith('image/')) || item.types[0],
            getAsFile: () => {
              const imageType = item.types.find(type => type.startsWith('image/')) || item.types[0];
              return item.getType(imageType).then(blob => new File([blob], "clipboard-image", { type: blob.type }));
            },
          })),
        };
        handleImagePaste(await clipboardData.items[0].getAsFile());
        toast({
          title: "Image detected",
          description: "Switched to screenshot mode and pasted image.",
        });
      } else {
        // Auto-switch to text mode and handle text paste
        setInputMode("text");
        handleTextPaste();
      }
    } catch (error) {
      // Fallback to text paste if clipboard.read() fails
      setInputMode("text");
      handleTextPaste();
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
      {/* Inline Loading State */}
      {isAnalyzing && (
        <div className="lg:col-span-2 mb-8">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary bg-opacity-20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing Conversation</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our AI is examining your conversation for potential miscommunications...
                  </p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`${analysisStep >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    Parsing speakers & messages
                  </span>
                  {analysisStep === 1 ? (
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : analysisStep >= 1.5 ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${analysisStep >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    Running semantic analysis
                  </span>
                  {analysisStep === 2 ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : analysisStep >= 2.5 ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${analysisStep >= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    Identifying communication issues
                  </span>
                  {analysisStep === 3 ? (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : analysisStep > 3 ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Input Panel */}
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversation Input</h2>
            <div className="flex items-center space-x-2">
              {(isAnalyzing || isEditing) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsInputCollapsed(!isInputCollapsed)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                  data-testid="button-toggle-input"
                >
                  {isInputCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show Input
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Hide Input
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGlobalPaste}
                className="text-sm text-gray-500 hover:text-gray-700"
                data-testid="button-paste-auto"
              >
                <Clipboard className="w-4 h-4 mr-1" />
                Smart Paste
              </Button>
            </div>
          </div>

          {!isInputCollapsed && (
            <>
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

            {!isEditing && (
              <Button 
                onClick={handleAnalyze}
                disabled={createConversationMutation.isPending || analyzeConversationMutation.isPending || isAnalyzing}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-analyze-conversation"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>
                      {selectedImage ? "Analyze Screenshot" : "Analyze Conversation"}
                    </span>
                  </>
                )}
              </Button>
            )}
          </div>
          </>
          )}

          {/* Collapsed state - show just the input source */}
          {isInputCollapsed && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {selectedImage ? "📷 Screenshot uploaded" : "💬 Text conversation"}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  {analysisDepth === "deep" ? "Deep Analysis" : "Context-Aware Analysis"}
                </span>
              </div>
              {selectedImage && (
                <div className="mt-2">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded screenshot"
                    className="max-w-full h-20 object-cover rounded border"
                  />
                </div>
              )}
              {conversationText && !selectedImage && (
                <div className="mt-2 text-gray-600 dark:text-gray-400 text-xs truncate">
                  {conversationText.substring(0, 100)}...
                </div>
              )}
            </div>
          )}
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

      {/* Inline Conversation Editor or How It Works Panel */}
      {isEditing && editingData ? (
        <div className="w-full">
          <ConversationEditor 
            speakers={editingData.speakers}
            messages={editingData.messages}
            onSave={onEditingSave!}
            onCancel={onEditingCancel!}
          />
        </div>
      ) : showHowItWorks && (
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How It Works</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDontShowAgain}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="button-dont-show-again"
              >
                Don't show again
              </Button>
            </div>
            <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Extract & Parse</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Extract text from screenshots or parse typed conversations to identify speakers</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Semantic Analysis</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Analyze word choices, connotations, and implicit meanings</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Identify Issues</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highlight potential miscommunications with detailed explanations</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
