/** @jsxImportSource preact */
// KatexMath — client-side math renderer
//
// Usage in MDX:
//   import KatexMath from "../islands/KatexMath.tsx";
//   <KatexMath expr="V = l \times w \times h" display />
//
// `display` = true  → block-level (like $$...$$)
// `display` = false → inline (like $...$)

import { useEffect, useRef } from "preact/hooks";
import katex from "katex";

interface Props {
    expr: string;
    display?: boolean;
}

export default function KatexMath({ expr, display = false }: Props) {
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (!ref.current) return;
        try {
            katex.render(expr, ref.current, {
                displayMode: display,
                throwOnError: false,
                output: "htmlAndMathml",
            });
        } catch (e) {
            ref.current.textContent = `[KaTeX error: ${e}]`;
        }
    }, [expr, display]);

    return <span ref={ref} class={display ? "katex-display-block" : "katex-inline"} />;
}
