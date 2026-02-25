/**
 * OpenAI Client — server-side singleton
 *
 * Usage:
 *   import { openai } from "@/lib/openai";
 *   const res = await openai.chat.completions.create({ ... });
 */

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
