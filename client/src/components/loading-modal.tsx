import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Brain, Check } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
}

export default function LoadingModal({ isOpen }: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="text-primary text-2xl animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Conversation</h3>
          <p className="text-sm text-gray-600 mb-6">
            Our AI is examining your conversation for potential miscommunications...
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Parsing speakers</span>
              <Check className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Semantic analysis</span>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Generating insights</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
