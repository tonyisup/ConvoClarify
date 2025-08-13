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

export async function analyzeConversation(
  text: string, 
  analysisDepth: string = "standard",
  language: string = "english",
  imageUrl?: string
): Promise<AnalysisResult> {
  try {
    let conversationText = text;
    
    // If image is provided, extract text from it first
    if (imageUrl) {
      const imageAnalysis = await openai.chat.completions.create({
        model: "gpt-4o", // Need full gpt-4o for vision capabilities
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this screenshot. Focus on conversation messages, chat bubbles, or any text communication. Return the extracted text exactly as it appears, preserving the speaker names and message structure if visible."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
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
          content: `You are a conversation parser. Parse the provided conversation text and identify speakers and their messages. Return JSON in this exact format:
          {
            "speakers": ["Speaker1", "Speaker2"],
            "messages": [
              {
                "speaker": "Speaker1",
                "content": "message content",
                "lineNumber": 1
              }
            ]
          }
          
          If no clear speaker format is found, try to infer speakers from context or use "Speaker A", "Speaker B" etc.`
        },
        {
          role: "user",
          content: `Parse this conversation:\n\n${conversationText}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const parseResult = JSON.parse(parseResponse.choices[0].message.content || "{}");
    
    // Then analyze for miscommunications
    const analysisPrompt = `You are an expert communication analyst. Analyze this conversation for potential miscommunications, focusing on:

1. Assumption gaps - when speakers assume shared understanding
2. Ambiguous language - words/phrases that could be interpreted differently  
3. Tone mismatches - defensive or unclear emotional responses
4. Implicit meanings - unstated assumptions or expectations

Analysis depth: ${analysisDepth}
Language: ${language}

For each issue found, categorize it as critical/moderate/minor and explain:
- Why it causes confusion
- Different possible interpretations
- Suggested improvements

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
          content: `Conversation to analyze:\n\n${conversationText}\n\nSpeakers identified: ${parseResult.speakers?.join(", ")}`
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
    
    if (error.status === 401) {
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
