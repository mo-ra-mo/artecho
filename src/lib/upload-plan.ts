import type { PlanTier } from "@prisma/client";

export type UploadPlanLimits = {
  maxFileBytes: number;
  monthlyUploadBytes: number | null;
  totalStorageBytes: number | null;
  uploadCostPerMbCents: number;
  requiresPhysicalProvision: boolean;
  provisioningOneTimeCostCents: number;
};

const MB = 1024 * 1024;
const GB = 1024 * MB;

const LIMITS: Record<PlanTier, UploadPlanLimits> = {
  FREE: {
    maxFileBytes: 40 * MB,
    monthlyUploadBytes: 1 * GB,
    totalStorageBytes: 2 * GB,
    uploadCostPerMbCents: 0,
    requiresPhysicalProvision: false,
    provisioningOneTimeCostCents: 0,
  },
  BASIC: {
    maxFileBytes: 120 * MB,
    monthlyUploadBytes: 8 * GB,
    totalStorageBytes: 16 * GB,
    uploadCostPerMbCents: 0,
    requiresPhysicalProvision: false,
    provisioningOneTimeCostCents: 0,
  },
  PRO: {
    maxFileBytes: 256 * MB,
    monthlyUploadBytes: 25 * GB,
    totalStorageBytes: 80 * GB,
    uploadCostPerMbCents: 1,
    requiresPhysicalProvision: false,
    provisioningOneTimeCostCents: 0,
  },
  PRO_PLUS: {
    maxFileBytes: 512 * MB,
    monthlyUploadBytes: null,
    totalStorageBytes: 250 * GB,
    uploadCostPerMbCents: 1,
    requiresPhysicalProvision: true,
    provisioningOneTimeCostCents: 1200,
  },
  CREATOR: {
    maxFileBytes: 1024 * MB,
    monthlyUploadBytes: null,
    totalStorageBytes: null,
    uploadCostPerMbCents: 1,
    requiresPhysicalProvision: true,
    provisioningOneTimeCostCents: 2500,
  },
};

export function getUploadPlanLimits(tier: PlanTier): UploadPlanLimits {
  return LIMITS[tier] || LIMITS.FREE;
}

export function isUnlimitedBytes(value: number | null) {
  return value === null;
}

export function bytesToMb(value: number) {
  return value / MB;
}

export function calculateUploadDebitCents(fileSizeBytes: number, centsPerMb: number) {
  if (centsPerMb <= 0) return 0;
  const mb = Math.ceil(bytesToMb(fileSizeBytes));
  return mb * centsPerMb;
}

