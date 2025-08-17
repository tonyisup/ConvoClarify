import { useState } from "react";
import { Download, Clock, AlertTriangle, HelpCircle, MessageSquare, ChevronDown, ChevronUp, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AnalysisResultsProps {
  analysis: any;
}

export default function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const [expandedIssues, setExpandedIssues] = useState<string[]>([]);

  // Get unique speakers to maintain consistent colors
  const uniqueSpeakers = Array.from(new Set(analysis.messages?.map((message: any) => message.speaker) || []));

  const toggleIssue = (issueId: string) => {
    setExpandedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const getSeverityColor = (type: string) => {
    switch (type) {
      case "critical": return "red";
      case "moderate": return "yellow";
      case "minor": return "blue";
      default: return "gray";
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="text-red-600 dark:text-red-400" />;
      case "moderate": return <HelpCircle className="text-yellow-600 dark:text-yellow-400" />;
      case "minor": return <MessageSquare className="text-blue-600 dark:text-blue-400" />;
      default: return <MessageSquare className="text-gray-600 dark:text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "assumption_gap": return "⚠️";
      case "ambiguous_language": return "❓";
      case "tone_mismatch": return "💬";
      case "implicit_meaning": return "🧠";
      default: return "💭";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "assumption_gap": return "Assumption Gaps";
      case "ambiguous_language": return "Ambiguous Language";
      case "tone_mismatch": return "Tone Mismatch";
      case "implicit_meaning": return "Implicit Meaning";
      default: return "Other";
    }
  };

  const getSpeakerColor = (speaker: string, speakers: string[]) => {
    const colors = [
      "text-primary dark:text-primary", 
      "text-green-600 dark:text-green-400", 
      "text-purple-600 dark:text-purple-400", 
      "text-orange-600 dark:text-orange-400"
    ];
    if (!speakers || !Array.isArray(speakers)) {
      return colors[0];
    }
    const speakerIndex = speakers.indexOf(speaker);
    return colors[speakerIndex >= 0 ? speakerIndex % colors.length : 0];
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Results Header */}
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Analyzed just now
              </span>
              <Button variant="ghost" size="sm" className="text-sm text-primary hover:text-blue-700 font-medium">
                <Download className="w-4 h-4 mr-1" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {analysis.issues?.filter((issue: any) => issue.severity === 'critical').length || 0}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Critical Issues</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analysis.issues?.filter((issue: any) => issue.severity === 'moderate').length || 0}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Moderate Issues</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analysis.issues?.filter((issue: any) => issue.severity === 'minor').length || 0}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Minor Issues</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analysis.clarityScore || 0}%</div>
              <div className="text-sm text-green-700 dark:text-green-300">Clarity Score</div>
            </div>
          </div>

          {/* Issue Categories */}
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(analysis.issues?.map((issue: any) => issue.type) || [])).map((category, index: number) => (
              <Badge key={`${category}-${index}`} variant="secondary" className="inline-flex items-center px-3 py-1">
                <span className="mr-1">{getCategoryIcon(category as string)}</span>
                {getCategoryLabel(category as string)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversation with Highlights */}
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analyzed Conversation</h3>
          
          <div className="space-y-4 font-mono text-sm leading-relaxed">
            {analysis.messages?.map((message: any, index: number) => (
              <div key={index} className="border-l-4 border-gray-200 dark:border-gray-600 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold ${getSpeakerColor(message.speaker, uniqueSpeakers)}`}>
                    {message.speaker}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">{message.timestamp}</span>
                  )}
                </div>
                <div className="text-gray-800 dark:text-gray-200">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issue Analysis */}
      <div className="space-y-4">
        {analysis.issues?.map((issue: any, index: number) => (
          <Card key={`issue-${index}`} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <Collapsible 
                open={expandedIssues.includes(`issue-${index}`)}
                onOpenChange={() => toggleIssue(`issue-${index}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${getSeverityColor(issue.severity)}-100 dark:bg-${getSeverityColor(issue.severity)}-900/30 rounded-full flex items-center justify-center`}>
                      {getSeverityIcon(issue.severity)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{getCategoryLabel(issue.type)}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={issue.severity === "critical" ? "destructive" : "secondary"}
                          className={`capitalize`}
                        >
                          {issue.severity}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {issue.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                      {expandedIssues.includes(`issue-${index}`) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Issue Description</h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{issue.description}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1 text-yellow-500 dark:text-yellow-400" />
                      Suggestion
                    </h5>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      {issue.suggestion}
                    </p>
                  </div>

                  {issue.confidence && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>Confidence: {Math.round(issue.confidence * 100)}%</span>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary and Insights */}
      {analysis.summary && (
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {analysis.summary.keyInsights && analysis.summary.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Lightbulb className="text-yellow-500 dark:text-yellow-400 mr-2 w-5 h-5" />
                    Key Insights
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {analysis.summary.keyInsights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-1 h-1 bg-yellow-500 dark:bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.summary.recommendations && analysis.summary.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                    <Target className="text-blue-500 dark:text-blue-400 mr-2 w-5 h-5" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {analysis.summary.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="bg-blue-500 dark:bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">{index + 1}</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {analysis.summary.communicationPatterns && analysis.summary.communicationPatterns.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Communication Patterns Observed</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.summary.communicationPatterns.map((pattern: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overall Assessment */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Assessment</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                This conversation has a clarity score of <span className="font-bold text-lg">{analysis.clarityScore}%</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {analysis.clarityScore >= 80 
                  ? "Excellent communication with minimal issues" 
                  : analysis.clarityScore >= 60 
                  ? "Good communication with some areas for improvement"
                  : "Communication needs significant improvement"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Issues found:</p>
              <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {analysis.issues?.length || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}