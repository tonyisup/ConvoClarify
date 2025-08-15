import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Clock, Crown } from "lucide-react";

interface AIModelSelectorProps {
  selectedModel: string;
  selectedReasoningLevel: string;
  onModelChange: (model: string) => void;
  onReasoningLevelChange: (level: string) => void;
  userPlan: string;
  disabled?: boolean;
}

const AI_MODELS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and efficient analysis",
    icon: Zap,
    speed: "Fast",
    accuracy: "Good",
    cost: "Low",
    planRequired: "free"
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Advanced reasoning and analysis",
    icon: Brain,
    speed: "Medium",
    accuracy: "Excellent",
    cost: "Medium",
    planRequired: "free"
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Superior conversation understanding",
    icon: Crown,
    speed: "Medium",
    accuracy: "Excellent",
    cost: "Medium",
    planRequired: "premium"
  }
];

const REASONING_LEVELS = [
  {
    id: "standard",
    name: "Standard",
    description: "Basic issue identification and clarity scoring",
    analysisDepth: "Core communication issues",
    planRequired: "free"
  },
  {
    id: "detailed",
    name: "Detailed",
    description: "In-depth analysis with context and recommendations",
    analysisDepth: "Detailed issue breakdown + actionable insights",
    planRequired: "free"
  },
  {
    id: "comprehensive",
    name: "Comprehensive",
    description: "Deep semantic analysis with psychological insights",
    analysisDepth: "Full linguistic analysis + interpersonal dynamics",
    planRequired: "premium"
  }
];

export default function AIModelSelector({
  selectedModel,
  selectedReasoningLevel,
  onModelChange,
  onReasoningLevelChange,
  userPlan,
  disabled = false
}: AIModelSelectorProps) {
  const isPremium = userPlan === "premium";
  const isPro = userPlan === "pro" || isPremium;

  const isModelAvailable = (planRequired: string) => {
    if (planRequired === "free") return true;
    if (planRequired === "pro") return isPro;
    if (planRequired === "premium") return isPremium;
    return false;
  };

  const availableModels = AI_MODELS.filter(model => isModelAvailable(model.planRequired));
  const availableReasoningLevels = REASONING_LEVELS.filter(level => isModelAvailable(level.planRequired));

  return (
    <div className="space-y-6">
      {/* AI Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            AI Model Selection
            {!isPremium && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Premium Feature
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Choose the AI model that best fits your analysis needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedModel}
            onValueChange={onModelChange}
            disabled={disabled || !isPremium}
          >
            <SelectTrigger data-testid="select-ai-model">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => {
                const available = isModelAvailable(model.planRequired);
                const IconComponent = model.icon;
                
                return (
                  <SelectItem 
                    key={model.id} 
                    value={model.id}
                    disabled={!available}
                  >
                    <div className="flex items-center gap-3 py-2">
                      <IconComponent className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          {!available && (
                            <Badge variant="secondary" className="text-xs">
                              {model.planRequired === "premium" ? "Premium" : "Pro"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {model.description}
                        </p>
                        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <span>Speed: {model.speed}</span>
                          <span>Accuracy: {model.accuracy}</span>
                          <span>Cost: {model.cost}</span>
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {!isPremium && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <Crown className="h-4 w-4 inline mr-1" />
                Upgrade to Premium to access advanced AI models like GPT-4o and Claude 3.5 Sonnet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reasoning Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            Analysis Depth
          </CardTitle>
          <CardDescription>
            Set how thoroughly the AI should analyze your conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedReasoningLevel}
            onValueChange={onReasoningLevelChange}
            disabled={disabled}
          >
            <SelectTrigger data-testid="select-reasoning-level">
              <SelectValue placeholder="Select analysis depth" />
            </SelectTrigger>
            <SelectContent>
              {REASONING_LEVELS.map((level) => {
                const available = isModelAvailable(level.planRequired);
                
                return (
                  <SelectItem 
                    key={level.id} 
                    value={level.id}
                    disabled={!available}
                  >
                    <div className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{level.name}</span>
                        {!available && (
                          <Badge variant="secondary" className="text-xs">
                            {level.planRequired === "premium" ? "Premium" : "Pro"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {level.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Includes: {level.analysisDepth}
                      </p>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {selectedReasoningLevel && !isModelAvailable(
            REASONING_LEVELS.find(l => l.id === selectedReasoningLevel)?.planRequired || "free"
          ) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This analysis level requires a {
                  REASONING_LEVELS.find(l => l.id === selectedReasoningLevel)?.planRequired === "premium" 
                    ? "Premium" 
                    : "Pro"
                } subscription
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}