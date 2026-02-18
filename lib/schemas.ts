// Sovereign Academy — Zod Schemas
//
// Runtime type validation for all data structures.
// These schemas are the "contract" between Rust-generated data and the UI.
// If a .bin file is malformed, Zod will catch it before it reaches the UI.
//
// Pillar 3 (Anti-Logic Drift): schemas mirror lib/types.ts and lib/state.ts
// exactly. Any mismatch between Rust output and these schemas is a bug.

import { z } from "zod";

// ─── Exercise Schemas ────────────────────────────────────────────────

export const ExerciseTypeSchema = z.enum(["arithmetic", "fraction", "equation"]);

export const ExerciseSchema = z.object({
  id: z.number().int().nonnegative(),
  type: ExerciseTypeSchema,
  problem: z.string().min(1),
  expectedAnswer: z.string().min(1),
});

export type ValidatedExercise = z.infer<typeof ExerciseSchema>;

// ─── Sub-Topic Schemas ───────────────────────────────────────────────

export const SubTopicSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  lessonText: z.string().optional(),
  exerciseCount: z.number().int().nonnegative().default(0),
});

export type ValidatedSubTopic = z.infer<typeof SubTopicSchema>;

// ─── Topic Schemas ───────────────────────────────────────────────────

export const TopicSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  icon: z.string().min(1),
  subTopics: z.array(SubTopicSchema).default([]),
  exerciseCount: z.number().int().nonnegative(),
});

export type ValidatedTopic = z.infer<typeof TopicSchema>;

// ─── Manifest Schema ─────────────────────────────────────────────────

export const TopicManifestSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  exercises: z.array(z.string()),
});

export const ExerciseManifestSchema = z.object({
  topics: z.array(TopicManifestSchema),
});

export type ValidatedManifest = z.infer<typeof ExerciseManifestSchema>;

// ─── Validation Helpers ──────────────────────────────────────────────

/** Parse and validate a raw object as an Exercise. Throws ZodError if invalid. */
export function parseExerciseRecord(raw: unknown): ValidatedExercise {
  return ExerciseSchema.parse(raw);
}

/** Safely parse an Exercise — returns null instead of throwing. */
export function safeParseExercise(raw: unknown): ValidatedExercise | null {
  const result = ExerciseSchema.safeParse(raw);
  return result.success ? result.data : null;
}
