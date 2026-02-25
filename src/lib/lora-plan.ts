import type { PlanTier } from "@prisma/client";

type LimitValue = number | null;

export type LoraPlanLimits = {
  maxModels: LimitValue;
  maxVideosPerModel: LimitValue;
  maxTrainRuns: LimitValue;
  minVideosToTrain: number;
};

const PLAN_LIMITS: Record<PlanTier, LoraPlanLimits> = {
  FREE: {
    maxModels: 1,
    maxVideosPerModel: 3,
    maxTrainRuns: 3,
    minVideosToTrain: 1,
  },
  BASIC: {
    maxModels: 1,
    maxVideosPerModel: 10,
    maxTrainRuns: 20,
    minVideosToTrain: 2,
  },
  PRO: {
    maxModels: 3,
    maxVideosPerModel: null,
    maxTrainRuns: null,
    minVideosToTrain: 2,
  },
  PRO_PLUS: {
    maxModels: 10,
    maxVideosPerModel: null,
    maxTrainRuns: null,
    minVideosToTrain: 2,
  },
  CREATOR: {
    maxModels: null,
    maxVideosPerModel: null,
    maxTrainRuns: null,
    minVideosToTrain: 2,
  },
};

export function getLoraPlanLimits(tier: PlanTier): LoraPlanLimits {
  return PLAN_LIMITS[tier] || PLAN_LIMITS.FREE;
}

export function isUnlimited(value: LimitValue) {
  return value === null;
}

