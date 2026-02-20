// islands/math/RatioBuilder.tsx
// Interactive ratio builder — click +/- to add/remove items, live ratio display
import { useSignal } from "@preact/signals";

export default function RatioBuilder() {
    const red = useSignal(3);
    const blue = useSignal(5);
    const MAX = 12;
    function inc(sig: { value: number }) {
        if (sig.value < MAX) sig.value++;
    }
    function dec(sig: { value: number }) {
        if (sig.value > 0) sig.value--;
    }
    const r = red.value;
    const b = blue.value;

    return (
        <div
            style={{
                background: "#2b2d31",
                borderRadius: "10px",
                padding: "20px 24px",
                margin: "16px 0",
                border: "1px solid #3f4147",
            }}
        >
            <div
                style={{
                    fontSize: "12px",
                    color: "#949ba4",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "12px",
                }}
            >
                Interactive Ratio Builder
            </div>

            {/* Red row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                }}
            >
                <button
                    type="button"
                    onClick={() => dec(red)}
                    style={{
                        width: "28px",
                        height: "28px",
                        background: "#383a40",
                        border: "1px solid #4e5058",
                        borderRadius: "4px",
                        color: "#f2f3f5",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    −
                </button>
                <span
                    style={{
                        color: "#f23f43",
                        fontWeight: "700",
                        fontSize: "16px",
                        minWidth: "20px",
                        textAlign: "center",
                    }}
                >
                    {r}
                </span>
                <button
                    type="button"
                    onClick={() => inc(red)}
                    style={{
                        width: "28px",
                        height: "28px",
                        background: "#383a40",
                        border: "1px solid #4e5058",
                        borderRadius: "4px",
                        color: "#f2f3f5",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    +
                </button>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {Array.from({ length: r }, (_, i) => (
                        <span key={i} style={{ fontSize: "20px" }}>
                            🔴
                        </span>
                    ))}
                </div>
            </div>

            {/* Blue row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "16px",
                }}
            >
                <button
                    type="button"
                    onClick={() => dec(blue)}
                    style={{
                        width: "28px",
                        height: "28px",
                        background: "#383a40",
                        border: "1px solid #4e5058",
                        borderRadius: "4px",
                        color: "#f2f3f5",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    −
                </button>
                <span
                    style={{
                        color: "#5865f2",
                        fontWeight: "700",
                        fontSize: "16px",
                        minWidth: "20px",
                        textAlign: "center",
                    }}
                >
                    {b}
                </span>
                <button
                    type="button"
                    onClick={() => inc(blue)}
                    style={{
                        width: "28px",
                        height: "28px",
                        background: "#383a40",
                        border: "1px solid #4e5058",
                        borderRadius: "4px",
                        color: "#f2f3f5",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    +
                </button>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {Array.from({ length: b }, (_, i) => (
                        <span key={i} style={{ fontSize: "20px" }}>
                            🔵
                        </span>
                    ))}
                </div>
            </div>

            {/* Live ratio display */}
            {r === 0 && b === 0
                ? (
                    <div style={{ color: "#949ba4", fontSize: "13px" }}>
                        Add some items to build a ratio!
                    </div>
                )
                : (
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                        <div
                            style={{
                                background: "#313338",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                borderLeft: "4px solid #f0b232",
                            }}
                        >
                            <div
                                style={{
                                    color: "#949ba4",
                                    fontSize: "10px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: "2px",
                                }}
                            >
                                Words
                            </div>
                            <div
                                style={{ color: "#f2f3f5", fontSize: "16px", fontWeight: "600" }}
                            >
                                {r} to {b}
                            </div>
                        </div>
                        <div
                            style={{
                                background: "#313338",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                borderLeft: "4px solid #5865f2",
                            }}
                        >
                            <div
                                style={{
                                    color: "#949ba4",
                                    fontSize: "10px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: "2px",
                                }}
                            >
                                Colon
                            </div>
                            <div
                                style={{ color: "#f2f3f5", fontSize: "16px", fontWeight: "600" }}
                            >
                                {r} : {b}
                            </div>
                        </div>
                        <div
                            style={{
                                background: "#313338",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                borderLeft: "4px solid #23a55a",
                            }}
                        >
                            <div
                                style={{
                                    color: "#949ba4",
                                    fontSize: "10px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    marginBottom: "2px",
                                }}
                            >
                                Fraction
                            </div>
                            <div
                                style={{ color: "#f2f3f5", fontSize: "16px", fontWeight: "600" }}
                            >
                                {r}/{b}
                            </div>
                        </div>
                    </div>
                )}

            {/* Tape diagram */}
            {(r > 0 || b > 0) && (
                <div style={{ marginTop: "14px" }}>
                    <svg
                        viewBox={`0 0 320 36`}
                        style={{ width: "100%", maxWidth: "400px", display: "block" }}
                    >
                        {(() => {
                            const total = r + b || 1;
                            const rw = (r / total) * 300;
                            const bw = (b / total) * 300;
                            return (
                                <g>
                                    <rect
                                        x="10"
                                        y="4"
                                        width={rw}
                                        height="28"
                                        rx="4"
                                        fill="#f23f43"
                                        opacity="0.8"
                                    />
                                    {rw > 30 && (
                                        <text
                                            x={10 + rw / 2}
                                            y="22"
                                            text-anchor="middle"
                                            fill="#f2f3f5"
                                            font-size="12"
                                            font-family="sans-serif"
                                            font-weight="700"
                                        >
                                            {r}
                                        </text>
                                    )}
                                    <rect
                                        x={10 + rw}
                                        y="4"
                                        width={bw}
                                        height="28"
                                        rx="4"
                                        fill="#5865f2"
                                        opacity="0.8"
                                    />
                                    {bw > 30 && (
                                        <text
                                            x={10 + rw + bw / 2}
                                            y="22"
                                            text-anchor="middle"
                                            fill="#f2f3f5"
                                            font-size="12"
                                            font-family="sans-serif"
                                            font-weight="700"
                                        >
                                            {b}
                                        </text>
                                    )}
                                </g>
                            );
                        })()}
                    </svg>
                </div>
            )}
        </div>
    );
}
