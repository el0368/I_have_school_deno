---
description: Project-wide coding standards and best practices
---

# Coding Standards

Values: **Readability**, **Maintainability**, **Modularity**.

## The 800 LOC Rule (Real World Standard)

> Any file exceeding **800 lines of code** must be flagged for refactoring.

### Why?

- **Cognitive Load**: Large files are harder to read and understand.
- **Merge Conflicts**: High-traffic monolithic files cause more git conflicts.
- **Lazy Loading**: Smaller modules allow for better code-splitting (though less relevant for CSS imports).

### How to Refactor

1. **Analyze**: Group related functions/styles.
2. **Split**: Extract groups into distinct files/modules.
3. **Import**: aggregate them in a main entry point or barrel file (`index.ts`, `discord.css`).

## CSS Architecture

- **Base**: Variables, Resets.
- **Layout**: Shell, Grid, Containers.
- **Components**: Reusable UI elements (Buttons, Inputs).
- **Modules**: Domain-specific styles (MathStage, Lesson).

## Naming Conventions

- **Files**: `kebab-case` (`math-stage.css`, `LessonToc.tsx`).
- **Classes**: `kebab-case` (`.app-shell`, `.title-bar`).
- **Components**: `PascalCase` (`TitleBar`, `MathStage`).
