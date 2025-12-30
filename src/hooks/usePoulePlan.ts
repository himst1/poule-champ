import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PoulePlan = "free" | "pro" | "business";

export interface PlanFeatures {
  maxMembers: number | null; // null = unlimited
  aiPredictions: boolean;
  pushNotifications: boolean;
  stripePayments: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  dedicatedSupport: boolean;
}

const PLAN_FEATURES: Record<PoulePlan, PlanFeatures> = {
  free: {
    maxMembers: 10,
    aiPredictions: false,
    pushNotifications: false,
    stripePayments: false,
    customBranding: false,
    apiAccess: false,
    dedicatedSupport: false,
  },
  pro: {
    maxMembers: 100,
    aiPredictions: true,
    pushNotifications: true,
    stripePayments: true,
    customBranding: false,
    apiAccess: false,
    dedicatedSupport: false,
  },
  business: {
    maxMembers: null,
    aiPredictions: true,
    pushNotifications: true,
    stripePayments: true,
    customBranding: true,
    apiAccess: true,
    dedicatedSupport: true,
  },
};

export const getPlanFeatures = (plan: PoulePlan): PlanFeatures => {
  return PLAN_FEATURES[plan];
};

export const usePoulePlan = (pouleId: string | undefined) => {
  const { data: poule, isLoading } = useQuery({
    queryKey: ["poule-plan", pouleId],
    queryFn: async () => {
      if (!pouleId) return null;
      
      const { data, error } = await supabase
        .from("poules")
        .select("plan_type")
        .eq("id", pouleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pouleId,
  });

  const plan: PoulePlan = (poule?.plan_type as PoulePlan) || "free";
  const features = getPlanFeatures(plan);

  return {
    plan,
    features,
    isLoading,
    isPremium: plan !== "free",
    canUseAI: features.aiPredictions,
    canUsePushNotifications: features.pushNotifications,
    canUseStripePayments: features.stripePayments,
  };
};
