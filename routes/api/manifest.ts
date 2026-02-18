// Sovereign Academy - Exercise Manifest API
//
// Returns the exercise manifest with all topics and their .bin file paths.
// Used by the exercise loader to discover available exercises.

import { define } from "@/utils.ts";
import { TOPICS } from "@/lib/state.ts";

export const handler = define.handlers({
  GET() {
    const manifest = {
      version: 1,
      totalExercises: TOPICS.reduce((sum, t) => sum + t.exerciseCount, 0),
      topics: TOPICS.map((topic) => ({
        id: topic.id,
        name: topic.name,
        icon: topic.icon,
        exerciseCount: topic.exerciseCount,
        exercises: Array.from(
          { length: topic.exerciseCount },
          (_, i) => {
            const paddedTopic = String(topic.id).padStart(2, "0");
            const paddedExercise = String(i + 1).padStart(3, "0");
            return `/exercises/topic-${paddedTopic}/exercise-${paddedExercise}.bin`;
          },
        ),
      })),
    };

    return Response.json(manifest, {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    });
  },
});
