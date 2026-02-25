import { getPlanPriceLabel } from "@/lib/plan-pricing";

export const DEFAULT_SITE_SETTINGS = {
  mainLogoUrl: "/i-6-1.png",
  landingVideoUrl: "/videos/intro.mp4",
  ctaVideos: [
    "/videos/cta-1.mp4",
    "/videos/cta-2.mp4",
    "/videos/cta-3.mp4",
    "/videos/cta-4.mp4",
    "/videos/cta-5.mp4",
  ],
  plans: [
    {
      tier: "FREE",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Start exploring ArtEcho",
      features: [
        "3 video uploads",
        "Unlimited AI testing",
        "Watch 2 educational videos",
        "Community access",
      ],
      cta: "Current Plan",
      badge: null,
      color: "border-slate-200",
    },
    {
      tier: "BASIC",
      name: "Basic",
      price: "$18",
      period: "/month",
      description: "Start your learning journey",
      features: [
        "1 AI model per month",
        "10 educational videos / month",
        "Progress tracking & stats",
        "Email support",
      ],
      cta: "Upgrade to Basic",
      badge: null,
      color: "border-teal-400",
    },
    {
      tier: "PRO",
      name: "Pro",
      price: "$48",
      period: "/month",
      description: "Unlock full creative potential",
      features: [
        "3 AI models",
        "Unlimited educational videos",
        "High-res export",
        "Priority support",
        "Marketplace access",
      ],
      cta: "Upgrade to Pro",
      badge: "Popular",
      color: "border-amber-400",
    },
    {
      tier: "PRO_PLUS",
      name: "Pro+",
      price: "$78",
      period: "/month",
      description: "For power users & teams",
      features: [
        "10 AI models",
        "Unlimited educational videos",
        "Advanced analytics",
        "API access",
        "Team collaboration",
      ],
      cta: "Upgrade to Pro+",
      badge: null,
      color: "border-violet-400",
    },
    {
      tier: "CREATOR",
      name: "Creator",
      price: "$98",
      period: "/month",
      description: "No limits, full power",
      features: [
        "Unlimited AI models",
        "Unlimited everything",
        "Custom training pipelines",
        "Commercial license",
        "Dedicated support",
        "Early access to new features",
      ],
      cta: "Upgrade to Creator",
      badge: "Best Value",
      color: "border-indigo-400",
    },
  ],
};

function ensureStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const out = value.filter((item) => typeof item === "string");
  return out.length ? out : fallback;
}

function ensurePlans(value: unknown) {
  if (!Array.isArray(value)) return DEFAULT_SITE_SETTINGS.plans;
  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const p = item as Record<string, unknown>;
      const features = ensureStringArray(
        p.features,
        DEFAULT_SITE_SETTINGS.plans[0].features
      );
      return {
        tier: typeof p.tier === "string" ? p.tier : "FREE",
        name: typeof p.name === "string" ? p.name : "Plan",
        price:
          typeof p.tier === "string"
            ? getPlanPriceLabel(
                p.tier,
                typeof p.price === "string" ? p.price : "$0"
              )
            : typeof p.price === "string"
              ? p.price
              : "$0",
        period: typeof p.period === "string" ? p.period : "/month",
        description:
          typeof p.description === "string" ? p.description : "Custom plan",
        features,
        cta: typeof p.cta === "string" ? p.cta : "Select Plan",
        badge: typeof p.badge === "string" ? p.badge : null,
        color:
          typeof p.color === "string" ? p.color : "border-slate-200",
      };
    })
    .filter(Boolean);
  return normalized.length ? normalized : DEFAULT_SITE_SETTINGS.plans;
}

export function mergeSiteSettings(raw: {
  mainLogoUrl?: string | null;
  landingVideoUrl?: string | null;
  ctaVideos?: unknown;
  plans?: unknown;
} | null) {
  return {
    mainLogoUrl: raw?.mainLogoUrl || DEFAULT_SITE_SETTINGS.mainLogoUrl,
    landingVideoUrl:
      raw?.landingVideoUrl || DEFAULT_SITE_SETTINGS.landingVideoUrl,
    ctaVideos: ensureStringArray(raw?.ctaVideos, DEFAULT_SITE_SETTINGS.ctaVideos),
    plans: ensurePlans(raw?.plans),
  };
}

