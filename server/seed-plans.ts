import { storage } from "./storage";

async function seedSubscriptionPlans() {
  try {
    console.log('Seeding subscription plans...');
    
    // Free plan
    await storage.createSubscriptionPlan({
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out conversation analysis',
      stripePriceId: 'price_free', // This won't be used since it's free
      monthlyAnalysisLimit: 5,
      price: 0,
      features: [
        'Basic conversation analysis',
        'Issue identification',
        'Clarity scoring',
        'Community support'
      ],
      isActive: true,
    });

    // Pro plan
    await storage.createSubscriptionPlan({
      id: 'pro',
      name: 'Pro',
      description: 'Great for regular users and small teams',
      stripePriceId: 'price_1QTgOjLkjVKN8k9a7hxJYzXm', // Replace with actual Stripe price ID
      monthlyAnalysisLimit: 50,
      price: 1900, // $19.00 in cents
      features: [
        'Advanced conversation analysis',
        'Detailed issue categorization',
        'Speaker interpretation insights',
        'Export analysis results',
        'Priority email support'
      ],
      isActive: true,
    });

    // Premium plan
    await storage.createSubscriptionPlan({
      id: 'premium',
      name: 'Premium',
      description: 'Best for power users and organizations',
      stripePriceId: 'price_1QTgP3LkjVKN8k9a7qRsTuvw', // Replace with actual Stripe price ID
      monthlyAnalysisLimit: 200,
      price: 4900, // $49.00 in cents
      features: [
        'Unlimited conversation analysis',
        'Advanced AI insights',
        'Custom analysis parameters',
        'Bulk analysis processing',
        'API access',
        'Dedicated support',
        'Team collaboration features'
      ],
      isActive: true,
    });

    console.log('Subscription plans seeded successfully!');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  }
}

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans().then(() => process.exit(0));
}

export { seedSubscriptionPlans };