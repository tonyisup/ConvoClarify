import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertAnalysisSchema } from "@shared/schema";
import { analyzeConversation, extractTextFromImage, parseConversation } from "./ai-service";
import { setupAuth, isAuthenticated } from "./replitAuth";
import Stripe from "stripe";

// Development authentication bypass
const devAuthBypass = (req: any, res: any, next: any) => {
  // Create a mock user for development
  req.user = {
    claims: {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'User'
    },
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };
  req.isAuthenticated = () => true;
  next();
};

// Combined authentication middleware
const authMiddleware = (req: any, res: any, next: any) => {
  if (process.env.NODE_ENV === 'local') {
    return devAuthBypass(req, res, next);
  }
  return isAuthenticated(req, res, next);
};

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication (skip in local development)
  if (process.env.NODE_ENV !== 'local') {
    await setupAuth(app);
  } else {
    // Create development user if it doesn't exist
    try {
      await storage.upsertUser({
        id: 'dev-user-123',
        email: 'dev@example.com',
        firstName: 'Dev',
        lastName: 'User',
        subscriptionPlan: 'premium', // Give premium access for development
        subscriptionStatus: 'active',
        monthlyAnalysisCount: 0
      });
      console.log('Development user created/updated');
    } catch (error) {
      console.log('Development user setup error:', error);
    }
  }

  // Get authenticated user
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User subscription endpoint
  app.get('/api/user/subscription', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        monthlyAnalysisCount: user.monthlyAnalysisCount,
        subscriptionEndsAt: user.subscriptionEndsAt,
      });
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription data" });
    }
  });

  // Create a new conversation
  app.post("/api/conversations", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription limits
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const monthlyUsage = await storage.getUserMonthlyUsage(userId, currentMonth);
      const plan = user.subscriptionPlan || 'free';
      
      let monthlyLimit = 5; // Free plan default
      if (plan === 'pro') monthlyLimit = 50;
      if (plan === 'premium') monthlyLimit = 200;
      
      if (monthlyUsage >= monthlyLimit && plan !== 'premium') {
        return res.status(403).json({ 
          message: "Monthly analysis limit reached", 
          limit: monthlyLimit,
          usage: monthlyUsage,
          plan 
        });
      }

      let conversationText = req.body.text;
      
      // If there's an image but no text, extract text from the image
      if (req.body.imageUrl && (!conversationText || conversationText === "Text extracted from image")) {
        try {
          // Extract base64 data from data URL
          const base64Data = req.body.imageUrl.split(',')[1];
          const extractedText = await extractTextFromImage(base64Data);
          conversationText = extractedText || "No text could be extracted from the image";
        } catch (error) {
          console.error("Failed to extract text from image:", error);
          conversationText = "Error extracting text from image";
        }
      }

      const validatedData = insertConversationSchema.parse({
        ...req.body,
        text: conversationText,
        userId
      });
      const conversation = await storage.createConversation(validatedData);
      
      // Parse the conversation to extract speakers and messages for the editor
      try {
        const parseResult = await parseConversation(conversationText, { 
          model: req.body.aiModel || "gpt-4o-mini" 
        });
        
        // Return conversation with parsed data for the editor
        res.json({
          ...conversation,
          speakers: parseResult.speakers,
          messages: parseResult.messages
        });
      } catch (parseError) {
        console.error("Failed to parse conversation:", parseError);
        // Return conversation without parsed data if parsing fails
        res.json(conversation);
      }
    } catch (error) {
      res.status(400).json({ 
        message: "Invalid conversation data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get a conversation by ID
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to retrieve conversation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Analyze a conversation
  app.post("/api/conversations/:id/analyze", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Check if analysis already exists
      const existingAnalysis = await storage.getAnalysisByConversationId(conversation.id);
      if (existingAnalysis) {
        return res.json(existingAnalysis);
      }

      // Perform analysis using the selected AI model
      const analysisResult = await analyzeConversation(
        conversation.text,
        {
          model: conversation.aiModel || "gpt-4o-mini",
          reasoningLevel: conversation.reasoningLevel || "deep",
          language: conversation.language || "english",
          analysisDepth: conversation.analysisDepth || "deep"
        }
      );

      // Store the analysis
      const analysisData = insertAnalysisSchema.parse({
        conversationId: conversation.id,
        speakers: analysisResult.speakers,
        issues: analysisResult.issues,
        summary: analysisResult.summary,
        clarityScore: analysisResult.clarityScore,
      });

      const analysis = await storage.createAnalysis(analysisData);
      
      // Return analysis with parsed messages for frontend
      res.json({
        ...analysis,
        messages: analysisResult.messages
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to analyze conversation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get analysis by conversation ID
  app.get("/api/conversations/:id/analysis", async (req, res) => {
    try {
      const analysis = await storage.getAnalysisByConversationId(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to retrieve analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Re-analyze conversation with corrected speaker/message data
  app.post("/api/conversations/:id/reanalyze", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const { speakers, messages } = req.body;

      // Create a corrected conversation text from the messages
      const correctedText = messages.map((msg: any) => 
        `${msg.speaker}: ${msg.content}`
      ).join('\n');

      // Re-analyze with corrected data using original AI settings
      const analysisResult = await analyzeConversation(
        correctedText,
        {
          model: conversation.aiModel || "gpt-4o-mini",
          reasoningLevel: conversation.reasoningLevel || "deep",
          language: conversation.language || "english",
          analysisDepth: conversation.analysisDepth || "deep"
        }
      );

      // Delete existing analysis to create fresh one
      const existingAnalysis = await storage.getAnalysisByConversationId(conversation.id);
      if (existingAnalysis) {
        await storage.deleteAnalysis(existingAnalysis.id);
      }

      // Store the new analysis
      const analysisData = insertAnalysisSchema.parse({
        conversationId: conversation.id,
        speakers: speakers,
        issues: analysisResult.issues,
        summary: analysisResult.summary,
        clarityScore: analysisResult.clarityScore,
      });

      const analysis = await storage.createAnalysis(analysisData);
      
      // Return analysis with corrected messages for frontend
      res.json({
        ...analysis,
        messages: messages
      });

    } catch (error) {
      console.error("Failed to reanalyze conversation:", error);
      res.status(500).json({ 
        message: "Failed to reanalyze conversation",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Subscription and billing routes
  
  // Get subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get user's subscription status and usage
  app.get("/api/subscription/status", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const monthlyUsage = await storage.getUserMonthlyUsage(userId, currentMonth);
      
      const plan = user.subscriptionPlan || 'free';
      let monthlyLimit = 5; // Free plan default
      if (plan === 'pro') monthlyLimit = 50;
      if (plan === 'premium') monthlyLimit = 200;

      res.json({
        subscriptionStatus: user.subscriptionStatus || 'free',
        subscriptionPlan: plan,
        monthlyUsage,
        monthlyLimit,
        subscriptionEndsAt: user.subscriptionEndsAt,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // Create subscription
  app.post('/api/subscription/create', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.email) {
        return res.status(400).json({ message: "User email required" });
      }

      let customer;
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        await storage.updateUserSubscription(userId, {
          stripeCustomerId: customer.id,
        });
      }

      // Get plan details
      const plans = await storage.getSubscriptionPlans();
      const selectedPlan = plans.find(p => p.id === planId);
      
      if (!selectedPlan) {
        return res.status(404).json({ message: "Plan not found" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: selectedPlan.stripePriceId,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserSubscription(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: 'pending',
        subscriptionPlan: selectedPlan.id,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({ message: "Failed to create subscription", error: error.message });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }

      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await storage.updateUserSubscription(userId, {
        subscriptionStatus: 'canceled',
      });

      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
      res.status(500).json({ message: "Failed to cancel subscription", error: error.message });
    }
  });

  // Stripe webhook handler
  app.post('/api/webhooks/stripe', async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }
    let event;

    try {
      const signature = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(
        req.body,
        signature!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe!.customers.retrieve(subscription.customer as string);
          
          if ('email' in customer && customer.email) {
            // Find user by email and update subscription
            const users = await storage.getSubscriptionPlans(); // This would need a getUserByEmail method
            // For now, we'll skip this part and handle it in the frontend
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          // Handle subscription deletion
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          // Handle successful payment
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          // Handle failed payment
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({ error: 'Webhook handling failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
