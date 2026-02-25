/**
 * POST /api/learning/submit
 *
 * Saves user learning content and generates AI feedback.
 *
 * Body: { content: string }
 *   - content: the user's submitted text/JSON (drawing description,
 *     lesson response, technique analysis, etc.)
 *
 * Flow:
 *   1. Validate auth + input
 *   2. Create LearningSession in DB
 *   3. Call OpenAI to analyze learning level & give feedback
 *   4. Update session with AI feedback
 *   5. Return session + feedback
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { openai } from "@/lib/openai";
import { rateLimitApi } from "@/lib/rate-limit";
import { getEffectiveUserPlanTier } from "@/lib/user-plan";

const SYSTEM_PROMPT = `You are ArtEcho's learning assistant. You analyze a student's art learning submission and provide brief, encouraging feedback.

Your response must be a JSON object with exactly these fields:
{
  "level": "beginner" | "intermediate" | "advanced",
  "score": 1-10,
  "strengths": ["..."],
  "improvements": ["..."],
  "feedback": "A short encouraging paragraph (2-3 sentences)."
}

Assess based on: technique understanding, creativity, effort shown, and completeness.
Always respond with valid JSON only.`;

export async function POST(request: Request) {
  try {
    const limited = await rateLimitApi(request);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const content =
      typeof body.content === "string"
        ? body.content
        : JSON.stringify(body.content);

    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: "Content is required (minimum 5 characters)" },
        { status: 400 }
      );
    }

    const currentTier = await getEffectiveUserPlanTier({
      userId: session.user.id,
      role: session.user.role,
    });

    // Enforce FREE plan AI training quota.
    // We reserve a slot before processing to prevent concurrent overuse.
    if (currentTier === "FREE") {
      const reserved = await prisma.user.updateMany({
        where: {
          id: session.user.id,
          freeAiTrainingUsed: { lt: 3 },
        },
        data: {
          freeAiTrainingUsed: { increment: 1 },
        },
      });

      if (reserved.count === 0) {
        return NextResponse.json(
          {
            error: "Free plan limit reached: only 3 AI training submissions are allowed.",
            code: "FREE_AI_TRAINING_LIMIT_REACHED",
            quota: {
              tier: currentTier,
              used: 3,
              limit: 3,
              remaining: 0,
            },
          },
          { status: 403 }
        );
      }
    }

    // ① Save session (without feedback yet)
    const learningSession = await prisma.learningSession.create({
      data: {
        userId: session.user.id,
        content,
      },
    });

    // ② Generate AI feedback
    let aiFeedback: string;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this learning submission:\n\n${content}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      aiFeedback = completion.choices[0]?.message?.content || '{"feedback":"Great work! Keep practicing.","level":"beginner","score":5,"strengths":[],"improvements":[]}';
    } catch (aiError) {
      console.error("[LEARNING_SUBMIT] OpenAI error:", aiError);
      aiFeedback = JSON.stringify({
        level: "unknown",
        score: 0,
        strengths: [],
        improvements: [],
        feedback:
          "AI feedback is temporarily unavailable. Your submission has been saved.",
      });
    }

    // ③ Update session with feedback
    const updated = await prisma.learningSession.update({
      where: { id: learningSession.id },
      data: { aiFeedback },
    });

    // ④ Parse feedback for structured response
    let parsedFeedback;
    try {
      parsedFeedback = JSON.parse(aiFeedback);
    } catch {
      parsedFeedback = { feedback: aiFeedback };
    }

    const usage = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { freeAiTrainingUsed: true },
    });

    const freeAiTrainingUsed = usage?.freeAiTrainingUsed || 0;
    const freeAiTrainingLimit = 3;

    return NextResponse.json({
      success: true,
      session: {
        id: updated.id,
        createdAt: updated.createdAt,
      },
      feedback: parsedFeedback,
      quota: {
        tier: currentTier,
        used: currentTier === "FREE" ? freeAiTrainingUsed : null,
        limit: currentTier === "FREE" ? freeAiTrainingLimit : null,
        remaining:
          currentTier === "FREE"
            ? Math.max(0, freeAiTrainingLimit - freeAiTrainingUsed)
            : null,
      },
    });
  } catch (error) {
    console.error("[LEARNING_SUBMIT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
