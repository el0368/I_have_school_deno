// islands/math/PartWholeExplorer.tsx
// Toggle part-to-part vs part-to-whole to see how the ratio changes
import { useSignal } from "@preact/signals";

export default function PartWholeExplorer() {
    const mode = useSignal("part");
    const blueCount = 2;
    const yellowCount = 3;
    const total = blueCount + yellowCount;
    const isPart = mode.value === "part";
    const leftVal = blueCount;
    const rightVal = isPart ? yellowCount : total;
    const rightLabel = isPart ? "yellow" : "all marbles";
    const rightColor = isPart ? "#f0b232" : "#b5bac1";
    return (
        <div
            style={{
                background: "#2b2d31",
                borderRadius: "10px",
                padding: "16px 20px",
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
                    marginBottom: "10px",
                }}
            >
                Part-to-Part vs Part-to-Whole
            </div>
            <div
                style={{ marginBottom: "12px", fontSize: "14px", color: "#b5bac1" }}
            >
                A bag has{" "}
                <strong style={{ color: "#5865f2" }}>2 blue</strong> and{" "}
                <strong style={{ color: "#f0b232" }}>3 yellow</strong>{" "}
                marbles ({total} total).
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                <button
                    type="button"
                    onClick={() => (mode.value = "part")}
                    style={{
                        flex: 1,
                        background: isPart ? "#3c3f75" : "#383a40",
                        border: `1px solid ${isPart ? "#5865f2" : "#4e5058"}`,
                        borderRadius: "6px",
                        padding: "8px",
                        color: isPart ? "#f2f3f5" : "#b5bac1",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}
                >
                    Part-to-Part
                </button>
                <button
                    type="button"
                    onClick={() => (mode.value = "whole")}
                    style={{
                        flex: 1,
                        background: !isPart ? "#3c3f75" : "#383a40",
                        border: `1px solid ${!isPart ? "#5865f2" : "#4e5058"}`,
                        borderRadius: "6px",
                        padding: "8px",
                        color: !isPart ? "#f2f3f5" : "#b5bac1",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}
                >
                    Part-to-Whole
                </button>
            </div>
            {/* Visual */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "6px",
                    marginBottom: "10px",
                    fontSize: "20px",
                }}
            >
                <span>🔵</span>
                <span>🔵</span>
                <span
                    style={{
                        color: "#949ba4",
                        fontSize: "16px",
                        alignSelf: "center",
                        margin: "0 4px",
                    }}
                >
                    vs
                </span>
                {isPart
                    ? (
                        <>
                            <span>🟡</span>
                            <span>🟡</span>
                            <span>🟡</span>
                        </>
                    )
                    : (
                        <>
                            <span>🔵</span>
                            <span>🔵</span>
                            <span>🟡</span>
                            <span>🟡</span>
                            <span>🟡</span>
                        </>
                    )}
            </div>
            <div
                style={{
                    textAlign: "center",
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#f2f3f5",
                }}
            >
                <span style={{ color: "#5865f2" }}>blue</span>
                <span style={{ color: "#949ba4" }}> : </span>
                <span style={{ color: rightColor }}>{rightLabel}</span>
                <span style={{ color: "#949ba4" }}> = </span>
                <span style={{ color: "#f0b232" }}>
                    {leftVal} : {rightVal}
                </span>
            </div>
            <div
                style={{
                    marginTop: "10px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#b5bac1",
                }}
            >
                {isPart
                    ? "Comparing one group to another group."
                    : "Comparing one group to the total (all marbles)."}
            </div>
        </div>
    );
}
