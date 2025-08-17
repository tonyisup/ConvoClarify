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
  
  // Debug: Log the analysis data to see what we're receiving
  console.log("Analysis data received:", analysis);

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
      case "critical": return <AlertTriangle className="text-red-600" />;
      case "moderate": return <HelpCircle className="text-yellow-600" />;
      case "minor": return <MessageSquare className="text-blue-600" />;
      default: return <MessageSquare className="text-gray-600" />;
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

  const highlightText = (text: string, issues: any[]) => {
    let highlightedText = text;
    issues.forEach((issue, index) => {
      if (issue.highlightedText) {
        const highlightClass = `highlight-${issue.type}`;
        highlightedText = highlightedText.replace(
          issue.highlightedText,
          `<mark class="${highlightClass}" data-issue-id="${issue.id}" title="Click to see analysis">${issue.highlightedText}</mark>`
        );
      }
    });
    return highlightedText;
  };

  const getSpeakerColor = (speaker: string, index: number) => {
    const colors = ["text-primary", "text-green-600", "text-purple-600", "text-orange-600"];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Results Header */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 flex items-center">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.summary?.criticalIssues || 0}</div>
              <div className="text-sm text-red-700">Critical Issues</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{analysis.summary?.moderateIssues || 0}</div>
              <div className="text-sm text-yellow-700">Moderate Issues</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.summary?.minorIssues || 0}</div>
              <div className="text-sm text-blue-700">Minor Issues</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.clarityScore || 0}%</div>
              <div className="text-sm text-green-700">Clarity Score</div>
            </div>
          </div>

          {/* Issue Categories */}
          <div className="flex flex-wrap gap-2">
            {analysis.summary?.mainCategories?.map((category: string, index: number) => (
              <Badge key={`${category}-${index}`} variant="secondary" className="inline-flex items-center px-3 py-1">
                <span className="mr-1">{getCategoryIcon(category)}</span>
                {getCategoryLabel(category)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversation with Highlights */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyzed Conversation</h3>
          
          <div className="space-y-4 font-mono text-sm leading-relaxed">
            {analysis.messages?.map((message: any, index: number) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-semibold ${getSpeakerColor(message.speaker, index)}`}>
                    {message.speaker}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  )}
                </div>
                <div 
                  className="text-gray-800"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(message.content, analysis.issues || []) 
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <span className="mr-1">ℹ️</span>
            Click on highlighted text to see detailed analysis. Colors indicate severity: 
            <span className="bg-red-100 px-1 rounded ml-1">Critical</span>
            <span className="bg-yellow-100 px-1 rounded ml-1">Moderate</span>
            <span className="bg-blue-100 px-1 rounded ml-1">Minor</span>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Issue Analysis */}
      <div className="space-y-4">
        {analysis.issues?.map((issue: any) => (
          <Card key={issue.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <Collapsible 
                open={expandedIssues.includes(issue.id)}
                onOpenChange={() => toggleIssue(issue.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-${getSeverityColor(issue.type)}-100 rounded-full flex items-center justify-center`}>
                      {getSeverityIcon(issue.type)}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{issue.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant={issue.type === "critical" ? "destructive" : "secondary"}
                          className={`capitalize`}
                        >
                          {issue.type}
                        </Badge>
                        {issue.lineNumbers && (
                          <span className="text-sm text-gray-500">
                            Lines {issue.lineNumbers.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                      {expandedIssues.includes(issue.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Issue Description</h5>
                    <p className="text-gray-700 text-sm leading-relaxed">{issue.description}</p>
                  </div>

                  {issue.whyConfusing && issue.whyConfusing.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Why This Causes Confusion</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {issue.whyConfusing.map((reason: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issue.speakerInterpretations && issue.speakerInterpretations.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Different Interpretations</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {issue.speakerInterpretations.map((interp: any, index: number) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h6 className="font-medium text-blue-900 mb-1">{interp.speaker}'s Interpretation</h6>
                            <p className="text-blue-700">{interp.interpretation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {issue.suggestedImprovement && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Suggested Improvement</h5>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium mb-1">Better phrasing:</p>
                        <p className="text-sm text-green-700 italic">{issue.suggestedImprovement}</p>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Lightbulb className="text-yellow-500 mr-2 w-5 h-5" />
                Communication Best Practices
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Define specific terms and references</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Ask clarifying questions when uncertain</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Use "I" statements to express concerns</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span>Summarize understanding before proceeding</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="text-blue-500 mr-2 w-5 h-5" />
                Next Steps
              </h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">1</span>
                  <span>Address the most critical issues first</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">2</span>
                  <span>Clarify ambiguous terms and references</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">3</span>
                  <span>Establish shared understanding</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">4</span>
                  <span>Schedule follow-up to ensure alignment</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
