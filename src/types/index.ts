/**
 * Shared type definitions for ArtEcho
 *
 * این تایپ‌ها بین سمت کلاینت و سرور مشترک هستند.
 * مدل‌های Prisma تایپ‌های دیتابیس را تولید می‌کنند —
 * این فایل تایپ‌های API response / form / UI را تعریف می‌کند.
 */

/* ───────────────────── Enums ───────────────────── */

export type Role = "USER" | "ADMIN";

export type PlanTier = "FREE" | "BASIC" | "PRO" | "PRO_PLUS" | "CREATOR";

export type PlanStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED";

export type AiModelStatus = "training" | "ready" | "failed";

/* ───────────────────── User ───────────────────── */

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** اطلاعات کاربر + پلن فعال — برای پنل ادمین */
export interface UserWithPlan extends User {
  plan: Plan | null;
  lessonProgress: number;
  aiProgress: number;
  aiTestsCount: number;
  aiModelName: string | null;
  lastActive: string | null;
}

/* ───────────────────── Plan ───────────────────── */

export interface Plan {
  id: string;
  tier: PlanTier;
  status: PlanStatus;
  startDate: string;
  endDate: string | null;
  stripeSubscriptionId: string | null;
}

/* ───────────────────── Learning ───────────────────── */

export interface LearningSession {
  id: string;
  userId: string;
  lessonId: string;
  progress: number;
  completed: boolean;
  aiFeedback: string | null;
  createdAt: string;
}

/* ───────────────────── AI ───────────────────── */

export interface AiModel {
  id: string;
  userId: string;
  name: string;
  progress: number;
  testsRun: number;
  status: AiModelStatus;
  createdAt: string;
}

export interface AiInput {
  id: string;
  sessionId: string;
  input: string;
  output: string | null;
  createdAt: string;
}

/* ───────────────────── API ───────────────────── */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AdminStats {
  totalUsers: number;
  activePlans: number;
  lessonsCompleted: number;
  aiModelsTrained: number;
}
