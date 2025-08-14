import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Edit3, Trash2, Plus, ArrowRight } from "lucide-react";
import { ConversationMessage } from "@shared/schema";
import { analytics } from "@/lib/posthog";

interface ConversationEditorProps {
  speakers: string[];
  messages: ConversationMessage[];
  onSave: (speakers: string[], messages: ConversationMessage[]) => void;
  onCancel: () => void;
}

export default function ConversationEditor({ speakers, messages, onSave, onCancel }: ConversationEditorProps) {
  const [editedSpeakers, setEditedSpeakers] = useState<string[]>([...speakers]);
  const [editedMessages, setEditedMessages] = useState<ConversationMessage[]>([...messages]);
  const [initialSpeakers] = useState<string[]>([...speakers]);
  const [initialMessages] = useState<ConversationMessage[]>([...messages]);

  // Track editor opening
  useState(() => {
    analytics.trackEditorOpened(speakers.length, messages.length);
    return null;
  });

  const addSpeaker = () => {
    const newSpeaker = `Speaker-${editedSpeakers.length + 1}`;
    setEditedSpeakers([...editedSpeakers, newSpeaker]);
  };

  const updateSpeaker = (index: number, newName: string) => {
    const oldName = editedSpeakers[index];
    const updatedSpeakers = [...editedSpeakers];
    updatedSpeakers[index] = newName;
    
    // Update all messages that reference the old speaker name
    const updatedMessages = editedMessages.map(msg => 
      msg.speaker === oldName ? { ...msg, speaker: newName } : msg
    );
    
    setEditedSpeakers(updatedSpeakers);
    setEditedMessages(updatedMessages);
  };

  const removeSpeaker = (index: number) => {
    const speakerToRemove = editedSpeakers[index];
    const updatedSpeakers = editedSpeakers.filter((_, i) => i !== index);
    
    // Remove messages from this speaker or reassign to first available speaker
    const updatedMessages = editedMessages.map(msg => {
      if (msg.speaker === speakerToRemove) {
        return { ...msg, speaker: updatedSpeakers[0] || 'Unknown' };
      }
      return msg;
    });
    
    setEditedSpeakers(updatedSpeakers);
    setEditedMessages(updatedMessages);
  };

  const updateMessage = (index: number, field: keyof ConversationMessage, value: string | number) => {
    const updatedMessages = [...editedMessages];
    updatedMessages[index] = { ...updatedMessages[index], [field]: value };
    setEditedMessages(updatedMessages);
  };

  const addMessage = () => {
    const newMessage: ConversationMessage = {
      speaker: editedSpeakers[0] || 'Unknown',
      content: '',
      lineNumber: editedMessages.length + 1
    };
    setEditedMessages([...editedMessages, newMessage]);
  };

  const removeMessage = (index: number) => {
    const updatedMessages = editedMessages
      .filter((_, i) => i !== index)
      .map((msg, i) => ({ ...msg, lineNumber: i + 1 })); // Renumber
    setEditedMessages(updatedMessages);
  };

  const moveMessage = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === editedMessages.length - 1)) {
      return;
    }
    
    const updatedMessages = [...editedMessages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedMessages[index], updatedMessages[targetIndex]] = [updatedMessages[targetIndex], updatedMessages[index]];
    
    // Update line numbers
    updatedMessages.forEach((msg, i) => {
      msg.lineNumber = i + 1;
    });
    
    setEditedMessages(updatedMessages);
  };

  const handleSave = () => {
    // Track editor usage
    const editedSpeakersFlag = JSON.stringify(initialSpeakers.sort()) !== JSON.stringify(editedSpeakers.sort());
    const editedMessagesFlag = JSON.stringify(initialMessages) !== JSON.stringify(editedMessages);
    
    analytics.trackEditorSaved(
      editedSpeakers.length,
      editedMessages.length,
      editedSpeakersFlag,
      editedMessagesFlag
    );
    
    onSave(editedSpeakers.filter(s => s.trim()), editedMessages);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit3 className="w-5 h-5" />
          <span>Edit Conversation</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Review and correct the extracted conversation before analysis. Fix any speaker misattributions or message ordering issues.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Speakers Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Speakers</Label>
            <Button 
              onClick={addSpeaker} 
              size="sm" 
              variant="outline"
              data-testid="button-add-speaker"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Speaker
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {editedSpeakers.map((speaker, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={speaker}
                  onChange={(e) => updateSpeaker(index, e.target.value)}
                  placeholder="Speaker name"
                  data-testid={`input-speaker-${index}`}
                />
                {editedSpeakers.length > 1 && (
                  <Button
                    onClick={() => removeSpeaker(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-remove-speaker-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Messages</Label>
            <Button 
              onClick={addMessage} 
              size="sm" 
              variant="outline"
              data-testid="button-add-message"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Message
            </Button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {editedMessages.map((message, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                  <div>
                    <Label className="text-xs text-gray-500">Speaker</Label>
                    <select
                      value={message.speaker}
                      onChange={(e) => updateMessage(index, 'speaker', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      data-testid={`select-message-speaker-${index}`}
                    >
                      {editedSpeakers.map(speaker => (
                        <option key={speaker} value={speaker}>{speaker}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label className="text-xs text-gray-500">Message Content</Label>
                    <Textarea
                      value={message.content}
                      onChange={(e) => updateMessage(index, 'content', e.target.value)}
                      placeholder="Message text"
                      className="min-h-[60px] text-sm"
                      data-testid={`textarea-message-content-${index}`}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <Label className="text-xs text-gray-500">Order #{message.lineNumber}</Label>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => moveMessage(index, 'up')}
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        data-testid={`button-move-up-${index}`}
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => moveMessage(index, 'down')}
                        size="sm"
                        variant="ghost"
                        disabled={index === editedMessages.length - 1}
                        data-testid={`button-move-down-${index}`}
                      >
                        ↓
                      </Button>
                      <Button
                        onClick={() => removeMessage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-remove-message-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button 
            onClick={onCancel} 
            variant="outline"
            data-testid="button-cancel-editing"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-primary text-white"
            data-testid="button-save-and-analyze"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Save & Analyze
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}