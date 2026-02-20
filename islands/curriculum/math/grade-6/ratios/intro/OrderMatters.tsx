// islands/math/OrderMatters.tsx
// Swap boys/girls ratio to show order matters
import { useSignal } from "@preact/signals";

export default function OrderMatters() {
    const swapped = useSignal(false);
    const a = 4, b = 7;
    const first = swapped.value ? b : a;
    const second = swapped.value ? a : b;
    const label1 = swapped.value ? "girls" : "boys";
    const label2 = swapped.value ? "boys" : "girls";
    return (
        <div
            style={{
                background: "#2b2d31",
                borderRadius: "10px",
                padding: "16px 20px",
                margin: "16px 0",
                border: "1px solid #3f4147",
                textAlign: "center",
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
                ⚡ Does order matter?
            </div>
            <div style={{ marginBottom: "14px" }}>
                <span style={{ fontSize: "13px", color: "#b5bac1" }}>In a class: </span>
                <span style={{ color: "#5865f2", fontWeight: "700" }}>4 boys</span>
                <span style={{ fontSize: "13px", color: "#b5bac1" }}> and </span>
                <span style={{ color: "#f23f43", fontWeight: "700" }}>7 girls</span>
            </div>
            <div
                style={{
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#f2f3f5",
                    marginBottom: "8px",
                }}
            >
                <span style={{ color: swapped.value ? "#f23f43" : "#5865f2" }}>
                    {label1}
                </span>
                <span style={{ color: "#949ba4" }}> : </span>
                <span style={{ color: swapped.value ? "#5865f2" : "#f23f43" }}>
                    {label2}
                </span>
                <span style={{ color: "#949ba4" }}> = </span>
                <span style={{ color: "#f0b232" }}>
                    {first} : {second}
                </span>
            </div>
            <button
                type="button"
                onClick={() => (swapped.value = !swapped.value)}
                style={{
                    background: "#5865f2",
                    border: "none",
                    borderRadius: "6px",
                    padding: "8px 20px",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                }}
            >
                🔄 Swap the order
            </button>
            <div
                style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: swapped.value ? "#f0b232" : "#949ba4",
                    transition: "color 0.2s",
                }}
            >
                {swapped.value
                    ? "⚠️ Different order → different meaning! Now it is girls to boys."
                    : "Click swap to see why order matters in ratios."}
            </div>
        </div>
    );
}
