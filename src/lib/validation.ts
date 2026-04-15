/**
 * Zod validation schemas for all user-facing inputs.
 * Prevents malformed data from entering localStorage.
 */

import { z } from "zod";

/* ── Max lengths (enforced both in HTML and runtime) ── */
const MAX_NAME = 40;
const MAX_PROMPT = 200;
const MAX_TITLE = 60;
const MAX_DESC = 200;
const MAX_SNIPPET = 100;
const MAX_CHAT = 500;
const MAX_PROVIDER = 40;

/* ── Hex color ── */
const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color");

/* ── Planet Seed (user-created planets) ── */
export const PlanetSeedInputSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(MAX_NAME),
  prompt: z.string().trim().max(MAX_PROMPT),
  category: z.string().min(1).max(20),
  chakraColor: hexColor,
});

/* ── Planet Record ── */
export const PlanetRecordInputSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(MAX_TITLE),
  description: z.string().trim().max(MAX_DESC),
  promptSnippet: z.string().trim().max(MAX_SNIPPET),
});

/* ── Forge planet spec (Command Center) ── */
export const ForgeSpecInputSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(MAX_NAME),
  ring: z.enum(["outer", "inner"]),
  chakraColor: hexColor,
  provider: z.string().trim().max(MAX_PROVIDER),
  prompt: z.string().trim().max(MAX_PROMPT),
});

/* ── Chat message ── */
export const ChatMessageSchema = z.string().trim().min(1).max(MAX_CHAT);

/* ── Star config fields (admin editing) ── */
export const StarFieldSchema = z.object({
  displayNameFa: z.string().trim().max(MAX_NAME),
  displayNameEn: z.string().trim().max(MAX_NAME),
  missionFa: z.string().trim().max(MAX_DESC),
  missionEn: z.string().trim().max(MAX_DESC),
  chakraColor: hexColor,
});

/* ── Content block fields ── */
export const ContentFieldSchema = z.string().trim().max(MAX_DESC);

/* ── Helper: validate and return data or null ── */
export function validateInput<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (!result.success) return null;
  return result.data;
}
