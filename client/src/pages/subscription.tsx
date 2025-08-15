import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, Check, X, Crown, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SubscriptionForm from "@/components/subscription-form";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionStatus {
  subscriptionStatus: string;
  subscriptionPlan: string;
  monthlyUsage: number;
  monthlyLimit: number;
  subscriptionEndsAt?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  stripePriceId: string;
  monthlyAnalysisLimit: number;
  price: number;
  features: string[];
  isActive: boolean;
}

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: subscriptionStatus } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/create", { planId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/cancel");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled and will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    setSelectedPlan(planId);
    createSubscriptionMutation.mutate(planId);
  };

  const handleCancel = () => {
    cancelSubscriptionMutation.mutate();
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro': return <Zap className="h-6 w-6 text-blue-600" />;
      case 'premium': return <Crown className="h-6 w-6 text-purple-600" />;
      default: return <Star className="h-6 w-6 text-gray-600" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'pro': return 'border-blue-500';
      case 'premium': return 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20';
      default: return 'border-gray-300';
    }
  };

  const usagePercentage = subscriptionStatus 
    ? (subscriptionStatus.monthlyUsage / subscriptionStatus.monthlyLimit) * 100 
    : 0;

  if (clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscriptionForm 
                  onSuccess={() => {
                    setClientSecret(null);
                    setSelectedPlan(null);
                    queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
                    toast({
                      title: "Subscription Activated",
                      description: "Welcome to your new plan! You can now enjoy increased analysis limits.",
                    });
                  }}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Current Usage Status */}
        {subscriptionStatus && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Subscription</span>
                <Badge variant={subscriptionStatus.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                  {subscriptionStatus.subscriptionPlan.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Monthly Usage</span>
                    <span>{subscriptionStatus.monthlyUsage} / {subscriptionStatus.monthlyLimit} analyses</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
                
                {subscriptionStatus.subscriptionStatus === 'active' && subscriptionStatus.subscriptionEndsAt && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Next billing date:</span>
                    <span>{new Date(subscriptionStatus.subscriptionEndsAt).toLocaleDateString()}</span>
                  </div>
                )}

                {subscriptionStatus.subscriptionStatus === 'active' && subscriptionStatus.subscriptionPlan !== 'free' && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={cancelSubscriptionMutation.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Unlock powerful conversation analysis with our flexible pricing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subscriptionStatus?.subscriptionPlan === plan.id;
            const isPopular = plan.id === 'pro';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${getPlanColor(plan.id)} ${isPopular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${(plan.price / 100).toFixed(0)}
                    <span className="text-lg font-normal text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      <span>{plan.monthlyAnalysisLimit} analyses per month</span>
                    </div>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled data-testid={`button-current-plan-${plan.id}`}>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={createSubscriptionMutation.isPending}
                      data-testid={`button-subscribe-${plan.id}`}
                    >
                      {createSubscriptionMutation.isPending && selectedPlan === plan.id 
                        ? "Processing..." 
                        : "Subscribe"
                      }
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Compare Features
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Free</th>
                      <th className="text-center p-4 font-semibold">Pro</th>
                      <th className="text-center p-4 font-semibold">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-4">Monthly Analyses</td>
                      <td className="text-center p-4">5</td>
                      <td className="text-center p-4">50</td>
                      <td className="text-center p-4">200</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-4">Advanced Analysis</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-4 w-4 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-4 w-4 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-4">Export Results</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-4 w-4 text-green-600 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-4 w-4 text-green-600 mx-auto" /></td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-4">Priority Support</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-gray-400 mx-auto" /></td>
                      <td className="text-center p-4"><Check className="h-4 w-4 text-green-600 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}