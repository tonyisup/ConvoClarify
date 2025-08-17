import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Initialize Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnalysisOptions {
  model: string;
  reasoningLevel: string;
  language: string;
  analysisDepth: string;
}

export interface AnalysisResult {
  speakers: string[];
  messages: Array<{
    speaker: string;
    content: string;
    timestamp?: string;
  }>;
  issues: Array<{
    type: string;
    severity: string;
    description: string;
    location: string;
    suggestion: string;
    confidence: number;
  }>;
  summary: {
    overallClarity: number;
    keyInsights: string[];
    recommendations: string[];
    communicationPatterns: string[];
  };
  clarityScore: number;
}

function buildPrompt(conversationText: string, options: AnalysisOptions): string {
  const { reasoningLevel, language, analysisDepth } = options;
  
  const basePrompt = `Analyze the following conversation to identify potential miscommunications, ambiguous language, and communication issues.`;
  
  const reasoningLevelInstructions: Record<string, string> = {
    deep: `Provide in-depth analysis with context and actionable recommendations. Include detailed explanations for each issue and specific suggestions for improvement.`,
    context: `Provide deep semantic analysis with psychological insights. Analyze linguistic patterns, interpersonal dynamics, cultural context, implicit meanings, and provide comprehensive recommendations for improving communication effectiveness.`
  };

  const analysisDepthInstructions: Record<string, string> = {
    deep: `Perform semantic analysis of word choices, connotations, and implied meanings.`,
    context: `Include contextual analysis, cultural considerations, and relationship dynamics.`
  };

  return `${basePrompt}

${reasoningLevelInstructions[reasoningLevel] || reasoningLevelInstructions.deep}
${analysisDepthInstructions[analysisDepth] || analysisDepthInstructions.deep}

Language: ${language}

Please analyze this conversation and return a JSON response with the following structure:
{
  "speakers": ["speaker1", "speaker2", ...],
  "messages": [
    {
      "speaker": "speaker name",
      "content": "message content",
      "timestamp": "optional timestamp"
    }
  ],
  "issues": [
    {
      "type": "assumption_gap|ambiguous_language|tone_mismatch|implicit_meaning|other",
      "severity": "critical|moderate|minor",
      "description": "detailed description of the issue",
      "location": "which part of the conversation",
      "suggestion": "specific suggestion for improvement",
      "confidence": 0.95
    }
  ],
  "summary": {
    "overallClarity": 7.5,
    "keyInsights": ["insight1", "insight2"],
    "recommendations": ["recommendation1", "recommendation2"],
    "communicationPatterns": ["pattern1", "pattern2"]
  },
  "clarityScore": 75
}

Conversation to analyze:
${conversationText}`;
}

export async function analyzeConversation(
  conversationText: string,
  options: AnalysisOptions
): Promise<AnalysisResult> {
  const prompt = buildPrompt(conversationText, options);
  
  try {
    switch (options.model) {
      case "gpt-4o":
        return await analyzeWithGPT4o(prompt);
      case "gpt-4o-mini":
        return await analyzeWithGPT4oMini(prompt);
      case "claude-3-5-sonnet":
        return await analyzeWithClaude(prompt);
      default:
        return await analyzeWithGPT4oMini(prompt);
    }
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error(`Failed to analyze conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzeWithGPT4oMini(prompt: string): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert conversation analyst specializing in identifying miscommunications and improving clarity. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
    temperature: 0.3,
  });

  const result = response.choices[0].message.content;
  if (!result) {
    throw new Error("Empty response from GPT-4o-mini");
  }

  return JSON.parse(result);
}

async function analyzeWithGPT4o(prompt: string): Promise<AnalysisResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert conversation analyst with advanced reasoning capabilities. Provide deep, nuanced analysis of communication patterns and potential issues. Always respond with valid JSON."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.2,
  });

  const result = response.choices[0].message.content;
  if (!result) {
    throw new Error("Empty response from GPT-4o");
  }

  return JSON.parse(result);
}

async function analyzeWithClaude(prompt: string): Promise<AnalysisResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Anthropic API key not configured");
  }

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4000,
    temperature: 0.2,
    system: "You are an expert conversation analyst with superior understanding of human communication nuances. Provide comprehensive analysis of conversation dynamics, implicit meanings, and communication effectiveness. Always respond with valid JSON.",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const result = response.content[0];
  if (result.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return JSON.parse(result.text);
}

export async function extractTextFromImage(base64Image: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract and return only the conversation text from this screenshot. Preserve the original formatting and speaker names. If there are timestamps, include them. Return only the conversation text, no additional commentary."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content || "";
}