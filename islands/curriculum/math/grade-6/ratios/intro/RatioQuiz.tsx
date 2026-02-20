// islands/math/RatioQuiz.tsx
// 5-question ratio quiz with instant feedback
import { useSignal } from "@preact/signals";

const qs = [
    {
        q: "A recipe uses 2 cups of flour and 3 cups of sugar. What is the ratio of flour to sugar?",
        choices: ["3 : 2", "2 : 3", "2 : 5", "5 : 2"],
        correct: 1,
        hint: "Flour first (2), then sugar (3) → 2 : 3",
    },
    {
        q: "There are 5 cats and 8 dogs at a shelter. What is the ratio of dogs to cats?",
        choices: ["5 : 8", "8 : 5", "5 : 13", "8 : 13"],
        correct: 1,
        hint: "Dogs first (8), then cats (5) → 8 : 5",
    },
    {
        q: "A bag has 3 red, 4 blue, and 5 green counters. What is the ratio of red to total?",
        choices: ["3 : 9", "3 : 5", "3 : 12", "12 : 3"],
        correct: 2,
        hint: "Total = 3 + 4 + 5 = 12, so red to total = 3 : 12",
    },
    {
        q: "Which of these is NOT a valid way to write a ratio?",
        choices: ["5 to 3", "5 : 3", "5 × 3", "5/3"],
        correct: 2,
        hint: "Multiplication (×) is not a ratio notation.",
    },
    {
        q: '"4 : 7" and "7 : 4" represent the same ratio.',
        choices: ["True", "False"],
        correct: 1,
        hint: "Order matters in ratios! 4 : 7 ≠ 7 : 4",
    },
];

const letters = ["A", "B", "C", "D"];

export default function RatioQuiz() {
    const answers = useSignal<(number | null)[]>(Array(qs.length).fill(null));
    const done = useSignal(false);
    const score = answers.value.filter((a, i) => a === qs[i].correct).length;

    function pick(qi: number, ci: number) {
        if (done.value) return;
        const n = [...answers.value];
        n[qi] = ci;
        answers.value = n;
    }

    return (
        <div style={{ margin: "20px 0" }}>
            {qs.map((q, qi) => {
                const chosen = answers.value[qi];
                const ok = chosen === q.correct;
                return (
                    <div
                        key={qi}
                        style={{
                            background: "#2b2d31",
                            borderRadius: "10px",
                            padding: "16px 20px",
                            marginBottom: "10px",
                            border: done.value
                                ? `1px solid ${ok ? "#23a55a" : "#f23f43"}`
                                : "1px solid #3f4147",
                            transition: "border-color 0.2s",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 10px",
                                fontWeight: "600",
                                color: "#f2f3f5",
                                fontSize: "14px",
                            }}
                        >
                            Q{qi + 1}. {q.q}
                        </p>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                            }}
                        >
                            {q.choices.map((c, ci) => {
                                let bg = "#383a40",
                                    border = "#4e5058",
                                    color = "#b5bac1";
                                if (chosen === ci && !done.value) {
                                    bg = "#3c3f75";
                                    border = "#5865f2";
                                    color = "#f2f3f5";
                                }
                                if (done.value && ci === q.correct) {
                                    bg = "#1e3a2a";
                                    border = "#23a55a";
                                    color = "#23a55a";
                                }
                                if (done.value && chosen === ci && ci !== q.correct) {
                                    bg = "#3a1e1e";
                                    border = "#f23f43";
                                    color = "#f23f43";
                                }
                                return (
                                    <button
                                        key={ci}
                                        type="button"
                                        onClick={() => pick(qi, ci)}
                                        style={{
                                            background: bg,
                                            border: `1px solid ${border}`,
                                            borderRadius: "6px",
                                            padding: "8px 12px",
                                            color,
                                            fontSize: "13px",
                                            textAlign: "left",
                                            cursor: done.value ? "default" : "pointer",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {letters[ci]}. {c}
                                    </button>
                                );
                            })}
                        </div>
                        {done.value && (
                            <p
                                style={{
                                    margin: "8px 0 0",
                                    fontSize: "12px",
                                    color: ok ? "#23a55a" : "#f23f43",
                                }}
                            >
                                {ok ? "✓ Correct! " : "✗ "}
                                <span style={{ color: "#b5bac1" }}>{q.hint}</span>
                            </p>
                        )}
                    </div>
                );
            })}
            {!done.value
                ? (
                    <button
                        type="button"
                        onClick={() => (done.value = true)}
                        disabled={answers.value.includes(null)}
                        style={{
                            background: answers.value.includes(null) ? "#3f4147" : "#5865f2",
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 24px",
                            color: answers.value.includes(null) ? "#949ba4" : "#fff",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: answers.value.includes(null) ? "not-allowed" : "pointer",
                            marginTop: "6px",
                        }}
                    >
                        Submit Answers
                    </button>
                )
                : (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "15px",
                            fontWeight: "700",
                            marginTop: "6px",
                            background: score === 5
                                ? "#1e3a2a"
                                : score >= 3
                                    ? "#2a2d1e"
                                    : "#3a1e1e",
                            color: score === 5
                                ? "#23a55a"
                                : score >= 3
                                    ? "#f0b232"
                                    : "#f23f43",
                            border: `1px solid ${score === 5 ? "#23a55a" : score >= 3 ? "#f0b232" : "#f23f43"
                                }`,
                        }}
                    >
                        {score === 5
                            ? "🎉 Perfect 5/5!"
                            : score >= 3
                                ? `⭐ ${score}/5 — Almost there!`
                                : `📖 ${score}/5 — Review the lesson and retry.`}
                        <button
                            type="button"
                            onClick={() => {
                                answers.value = Array(qs.length).fill(null);
                                done.value = false;
                            }}
                            style={{
                                marginLeft: "12px",
                                background: "transparent",
                                border: "1px solid currentColor",
                                borderRadius: "4px",
                                padding: "2px 10px",
                                color: "inherit",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}
        </div>
    );
}
