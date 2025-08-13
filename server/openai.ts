import OpenAI from "openai";
import { AnalysisIssue, AnalysisSummary, ConversationMessage } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

interface AnalysisResult {
  speakers: string[];
  messages: ConversationMessage[];
  issues: AnalysisIssue[];
  summary: AnalysisSummary;
  clarityScore: number;
}

function sanitizeContentForAnalysis(text: string): string {
  // Remove potential personal information patterns while preserving conversation structure
  let sanitized = text
    // Replace phone numbers with placeholder
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE_NUMBER]")
    // Replace email addresses with placeholder  
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_ADDRESS]")
    // Replace URLs with placeholder
    .replace(/https?:\/\/[^\s]+/g, "[URL]")
    // Replace credit card-like numbers
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD_NUMBER]")
    // Replace SSN-like patterns
    .replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, "[SSN]");
  
  return sanitized;
}

function normalizespeakers(parseResult: any, isFromImage: boolean): { speakers: string[], messages: any[] } {
  const speakers: string[] = (parseResult.speakers || []).filter((s: any) => typeof s === 'string');
  const messages = parseResult.messages || [];
  
  // For image-based conversations, ensure proper speaker labeling
  if (isFromImage) {
    const speakerMap = new Map<string, string>();
    let namedSpeakers: string[] = [];
    let hasUnnamedSpeaker = false;
    
    // Identify named speakers and unnamed speakers
    speakers.forEach((speaker: string) => {
      if (speaker.includes(' ') || (!speaker.toLowerCase().includes('speaker') && !speaker.toLowerCase().includes('unnamed') && !speaker.toLowerCase().includes('you'))) {
        namedSpeakers.push(speaker);
      } else {
        hasUnnamedSpeaker = true;
      }
    });
    
    // Create normalized speaker mapping
    namedSpeakers.forEach((speaker, index) => {
      speakerMap.set(speaker, `Speaker-${String.fromCharCode(65 + index)}`); // A, B, C...
    });
    
    if (hasUnnamedSpeaker || speakers.some((s: string) => s.toLowerCase().includes('you') || s.toLowerCase().includes('unnamed'))) {
      const nextLetter = String.fromCharCode(65 + namedSpeakers.length);
      speakerMap.set('You', `Speaker-${nextLetter}`);
      speakerMap.set('Unnamed', `Speaker-${nextLetter}`);
      speakers.forEach((speaker: string) => {
        if (speaker.toLowerCase().includes('speaker') || speaker.toLowerCase().includes('you') || speaker.toLowerCase().includes('unnamed')) {
          speakerMap.set(speaker, `Speaker-${nextLetter}`);
        }
      });
    }
    
    // Normalize messages and sort by line number to maintain order
    const normalizedMessages = messages
      .map((msg: any) => ({
        ...msg,
        speaker: speakerMap.get(msg.speaker) || msg.speaker,
        lineNumber: msg.lineNumber || 0
      }))
      .sort((a: any, b: any) => (a.lineNumber || 0) - (b.lineNumber || 0));
    
    const normalizedSpeakers = Array.from(new Set(normalizedMessages.map((msg: any) => msg.speaker))).sort();
    
    return {
      speakers: normalizedSpeakers,
      messages: normalizedMessages
    };
  }
  
  return { speakers, messages };
}

export async function analyzeConversation(
  text: string, 
  analysisDepth: string = "standard",
  language: string = "english",
  imageUrl?: string
): Promise<AnalysisResult> {
  try {
    let conversationText = sanitizeContentForAnalysis(text);
    
    // If image is provided, extract text from it first
    if (imageUrl) {
      const imageAnalysis = await openai.chat.completions.create({
        model: "gpt-4o", // Need full gpt-4o for vision capabilities
        messages: [
          {
            role: "system",
            content: "You are a text extraction assistant. Your purpose is to help users extract text from conversation screenshots for legitimate communication analysis and improvement purposes. Extract text accurately and professionally."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this messaging app conversation screenshot with PRECISE attention to chronological order and speaker identification.\n\nIMPORTANT GUIDELINES:\n1. Read messages from TOP TO BOTTOM in chronological order\n2. Identify speaker patterns:\n   - Messages with visible names/contacts = that person spoke\n   - Messages without sender names (often right-aligned) = screenshot owner spoke\n3. Preserve exact message order and content\n4. Include timestamps if visible for context\n\nFormat as a conversation transcript maintaining chronological flow:\n\n[Contact Name]: [first message]\n[You/Unnamed]: [response]\n[Contact Name]: [next message]\n[You/Unnamed]: [your response]\n\nBe extremely careful about WHO said WHAT and WHEN. This transcript will be used for communication analysis."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });
      
      const extractedText = imageAnalysis.choices[0].message.content;
      conversationText = extractedText || text; // Fallback to original text if extraction fails
    }
    
    // Parse the conversation to identify speakers and messages
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for better compatibility and lower cost
      messages: [
        {
          role: "system",
          content: `You are a conversation parser that specializes in analyzing messaging app conversations. Your goal is to accurately identify speakers and preserve the chronological order of messages.

          CRITICAL: Parse messages in the EXACT order they appear in the conversation, from top to bottom or earliest to latest.

          For conversations from screenshots:
          - Named senders (visible contact names) should be consistently labeled throughout
          - Messages without sender names (usually from screenshot owner) should be labeled as "You" or "Unnamed"
          - Pay attention to message threading and chronological flow
          - Each message should have an accurate line number reflecting its position in the conversation

          For speaker identification:
          - If a contact name appears (e.g. "Layne Villanueva"), use that name consistently
          - Messages that appear without a sender name are typically from the screenshot owner - label as "You"
          - Maintain speaker consistency throughout the conversation
          - Don't mix up which speaker said what

          Return JSON in this exact format:
          {
            "speakers": ["Contact Name", "You"],
            "messages": [
              {
                "speaker": "Contact Name",
                "content": "message content",
                "lineNumber": 1
              },
              {
                "speaker": "You", 
                "content": "response message",
                "lineNumber": 2
              }
            ]
          }
          
          IMPORTANT: Maintain chronological order and accurate speaker attribution.`
        },
        {
          role: "user",
          content: `Parse this conversation (${imageUrl ? 'extracted from screenshot' : 'typed text'}):\n\n${conversationText}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const parseResult = JSON.parse(parseResponse.choices[0].message.content || "{}");
    
    // Post-process speakers to ensure consistent naming
    if (parseResult.speakers && parseResult.messages) {
      const processedResult = normalizespeakers(parseResult, imageUrl ? true : false);
      parseResult.speakers = processedResult.speakers;
      parseResult.messages = processedResult.messages;
    }
    
    // Then analyze for miscommunications
    const analysisPrompt = `You are a professional communication consultant helping people improve their conversations. Your role is to provide constructive analysis of communication patterns to help people understand each other better.

Analyze this conversation for potential miscommunications in these areas:
1. Assumption gaps - when speakers assume shared understanding
2. Ambiguous language - words/phrases that could be interpreted differently  
3. Tone mismatches - defensive or unclear emotional responses
4. Implicit meanings - unstated assumptions or expectations

Analysis depth: ${analysisDepth}
Language: ${language}

This analysis is for educational and communication improvement purposes. Focus on constructive feedback and clear explanations.

Return JSON in this exact format:
{
  "issues": [
    {
      "id": "unique_id",
      "type": "critical|moderate|minor", 
      "category": "assumption_gap|ambiguous_language|tone_mismatch|implicit_meaning",
      "title": "Brief title",
      "description": "Detailed description",
      "highlightedText": "exact text causing issue",
      "lineNumbers": [1, 2],
      "whyConfusing": ["reason 1", "reason 2"],
      "suggestedImprovement": "better phrasing",
      "speakerInterpretations": [
        {
          "speaker": "Speaker1", 
          "interpretation": "what they likely meant"
        }
      ]
    }
  ],
  "summary": {
    "criticalIssues": 0,
    "moderateIssues": 0, 
    "minorIssues": 0,
    "suggestions": 0,
    "mainCategories": ["category1", "category2"]
  },
  "clarityScore": 85
}`;

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for better compatibility and lower cost
      messages: [
        {
          role: "system",
          content: analysisPrompt
        },
        {
          role: "user",
          content: `Please analyze this conversation for communication improvement purposes:\n\n${conversationText}\n\nSpeakers identified: ${parseResult.speakers?.join(", ")}\n\nNote: This is for educational analysis to help improve understanding between people.`
        }
      ],
      response_format: { type: "json_object" },
    });

    const analysisResult = JSON.parse(analysisResponse.choices[0].message.content || "{}");

    return {
      speakers: parseResult.speakers || [],
      messages: parseResult.messages || [],
      issues: analysisResult.issues || [],
      summary: analysisResult.summary || {
        criticalIssues: 0,
        moderateIssues: 0,
        minorIssues: 0,
        suggestions: 0,
        mainCategories: []
      },
      clarityScore: analysisResult.clarityScore || 0
    };
    
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    // Check if the error message contains content policy rejection
    const errorMessage = error.message || "";
    const isContentPolicyError = errorMessage.includes("I'm unable to fulfill your request") || 
                                 errorMessage.includes("content policy") || 
                                 errorMessage.includes("unable to assist") ||
                                 error.status === 400;
    
    if (isContentPolicyError) {
      throw new Error("The conversation content couldn't be analyzed. This may happen if the text contains sensitive information, personal data, or content that appears inappropriate to the AI. Try removing any personal details like names, phone numbers, or private information and try again.");
    } else if (error.status === 401) {
      throw new Error("Invalid OpenAI API key. Please check that your API key is correct and has the necessary permissions.");
    } else if (error.status === 429) {
      throw new Error("OpenAI API rate limit exceeded. Please try again in a moment.");
    } else if (error.status === 403) {
      throw new Error("OpenAI API access denied. Please check your API key permissions.");
    } else {
      throw new Error("Failed to analyze conversation: " + (error.message || "Unknown error"));
    }
  }
}
