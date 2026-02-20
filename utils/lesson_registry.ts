// Sovereign Academy - Lesson Registry
//
// Maps Topic IDs (e.g. "T11_6_0_EN") to their MDX module imports.
// This allows MathStage to dynamically load the correct lesson
// without needing strict file path manipulation at runtime.

import type { ComponentChildren } from "preact";

// Type for the default export of an MDX module
export interface MdxModule {
  default: () => ComponentChildren;
}

// The Registry
// Format: "NODE_ID_LANG": () => import(...)
export const LESSON_REGISTRY: Record<string, () => Promise<MdxModule>> = {
  // Topic 11 (Grade 6) - Intro to Ratios
  "T11_6_0_EN": () => import("../curriculums/math/grade-6/unit-1-ratios/01-intro/T11_6_0_EN.mdx"),
  "T11_6_0_TH": () => import("../curriculums/math/grade-6/unit-1-ratios/01-intro/T11_6_0_TH.mdx"),
};
