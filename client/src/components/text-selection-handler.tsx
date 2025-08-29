import { useState, useRef, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, X } from "lucide-react";
import { PAIN_POINT_CATEGORIES, PAIN_POINT_LABELS, type PainPointCategory } from "@shared/schema";

interface TextSelection {
  text: string;
  startIndex: number;
  endIndex: number;
  rect: DOMRect;
}

interface TextSelectionHandlerProps {
  children: ReactNode;
  conversationId: string;
  analysisId?: string;
  onFeedbackSubmit: (feedback: {
    highlightedText: string;
    textStartIndex: number;
    textEndIndex: number;
    painPointCategory: PainPointCategory;
    additionalContext?: string;
  }) => Promise<void>;
}

export default function TextSelectionHandler({
  children,
  conversationId,
  analysisId,
  onFeedbackSubmit
}: TextSelectionHandlerProps) {
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [painPointCategory, setPainPointCategory] = useState<PainPointCategory>("other");
  const [additionalContext, setAdditionalContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle text selection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      if (selectedText.length === 0) {
        return;
      }

      // Check if selection is within our container
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }

      // Get the full text content of the container to calculate indices
      const fullText = containerRef.current.textContent || "";
      const beforeRange = range.cloneRange();
      beforeRange.selectNodeContents(containerRef.current);
      beforeRange.setEnd(range.startContainer, range.startOffset);
      const startIndex = beforeRange.toString().length;
      const endIndex = startIndex + selectedText.length;

      // Get the bounding rectangle for positioning the feedback form
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        startIndex,
        endIndex,
        rect
      });
      setShowFeedbackForm(true);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleSubmitFeedback = async () => {
    if (!selection) return;

    setIsSubmitting(true);
    try {
      await onFeedbackSubmit({
        highlightedText: selection.text,
        textStartIndex: selection.startIndex,
        textEndIndex: selection.endIndex,
        painPointCategory,
        additionalContext: additionalContext.trim() || undefined
      });

      // Reset form
      setShowFeedbackForm(false);
      setSelection(null);
      setPainPointCategory("other");
      setAdditionalContext("");
      
      // Clear the text selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowFeedbackForm(false);
    setSelection(null);
    setPainPointCategory("other");
    setAdditionalContext("");
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="relative">
      <div ref={containerRef} className="select-text">
        {children}
      </div>

      {/* Feedback Form Popup */}
      {showFeedbackForm && selection && (
        <div 
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80"
          style={{
            top: Math.min(selection.rect.bottom + window.scrollY + 8, window.innerHeight - 320),
            left: Math.min(selection.rect.left + window.scrollX, window.innerWidth - 320),
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flag className="w-4 h-4 text-orange-500" />
                <h3 className="font-medium text-sm">Suggest Pain Point</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                data-testid="button-cancel-feedback"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
              <strong>Selected text:</strong> "{selection.text}"
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">What type of communication issue do you see?</Label>
              <Select value={painPointCategory} onValueChange={(value: PainPointCategory) => setPainPointCategory(value)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAIN_POINT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="text-xs">
                      {PAIN_POINT_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Additional context (optional)</Label>
              <Textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Why do you think this could cause confusion?"
                className="w-full h-16 text-xs resize-none"
                data-testid="textarea-feedback-context"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting}
                className="flex-1 h-8 text-xs"
                data-testid="button-submit-feedback"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="h-8 text-xs"
                data-testid="button-cancel-feedback-form"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}