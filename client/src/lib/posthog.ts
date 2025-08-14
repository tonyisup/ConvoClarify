import posthog from 'posthog-js';

// Initialize PostHog
export const initPostHog = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      // Enable session recording and heatmaps
      session_recording: {
        recordCrossOriginIframes: true,
      },
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture performance data
      capture_performance: true,
    });
    
    console.log('PostHog initialized successfully');
    return true;
  } else {
    console.warn('PostHog not initialized - missing environment variables');
    return false;
  }
};

// Analytics tracking functions
export const analytics = {
  // Track conversation analysis events
  trackConversationUploaded: (method: 'text' | 'image') => {
    posthog.capture('conversation_uploaded', {
      input_method: method,
      timestamp: new Date().toISOString(),
    });
  },

  trackAnalysisStarted: (analysisDepth: string, language: string, hasImage: boolean) => {
    posthog.capture('analysis_started', {
      analysis_depth: analysisDepth,
      language: language,
      has_image: hasImage,
      timestamp: new Date().toISOString(),
    });
  },

  trackAnalysisCompleted: (
    clarityScore: number,
    issueCount: number,
    speakerCount: number,
    messageCount: number,
    processingTimeMs: number
  ) => {
    posthog.capture('analysis_completed', {
      clarity_score: clarityScore,
      issue_count: issueCount,
      speaker_count: speakerCount,
      message_count: messageCount,
      processing_time_ms: processingTimeMs,
      timestamp: new Date().toISOString(),
    });
  },

  // Track editor usage
  trackEditorOpened: (speakerCount: number, messageCount: number) => {
    posthog.capture('editor_opened', {
      initial_speaker_count: speakerCount,
      initial_message_count: messageCount,
      timestamp: new Date().toISOString(),
    });
  },

  trackEditorSaved: (
    finalSpeakerCount: number,
    finalMessageCount: number,
    editedSpeakers: boolean,
    editedMessages: boolean
  ) => {
    posthog.capture('editor_saved', {
      final_speaker_count: finalSpeakerCount,
      final_message_count: finalMessageCount,
      edited_speakers: editedSpeakers,
      edited_messages: editedMessages,
      timestamp: new Date().toISOString(),
    });
  },

  trackReanalysisCompleted: (
    newClarityScore: number,
    newIssueCount: number,
    processingTimeMs: number
  ) => {
    posthog.capture('reanalysis_completed', {
      new_clarity_score: newClarityScore,
      new_issue_count: newIssueCount,
      processing_time_ms: processingTimeMs,
      timestamp: new Date().toISOString(),
    });
  },

  // Track user engagement
  trackFeatureUsed: (feature: string, details?: Record<string, any>) => {
    posthog.capture('feature_used', {
      feature_name: feature,
      ...details,
      timestamp: new Date().toISOString(),
    });
  },

  trackError: (error: string, context?: Record<string, any>) => {
    posthog.capture('error_occurred', {
      error_message: error,
      ...context,
      timestamp: new Date().toISOString(),
    });
  },

  // Track user properties
  identifyUser: (userId?: string, properties?: Record<string, any>) => {
    if (userId) {
      posthog.identify(userId, properties);
    } else {
      posthog.identify(undefined, properties);
    }
  },

  // Page tracking
  trackPageView: (pageName: string) => {
    posthog.capture('$pageview', {
      page_name: pageName,
      timestamp: new Date().toISOString(),
    });
  },
};

export default posthog;