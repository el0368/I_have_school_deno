// Sovereign Academy - Volume & Surface Area Simulator
//
// Interactive island: SVG isometric 3D view with sliders,
// exploded 2D net toggle, and live math breakdown sidebar.
// Pure Preact + Signals — zero external 3D dependencies.

import { useComputed, useSignal } from "@preact/signals";

// ─── Isometric Projection Helpers ──────────────────────────────────
// Maps 3D coords to 2D isometric screen coords.
// x goes right-down, y goes left-down, z goes up.
const ISO_ANGLE = Math.PI / 6; // 30 degrees
const COS = Math.cos(ISO_ANGLE);
const SIN = Math.sin(ISO_ANGLE);
const SCALE = 18; // px per unit

function isoProject(x: number, y: number, z: number): [number, number] {
  const sx = (x - y) * COS * SCALE;
  const sy = (x + y) * SIN * SCALE - z * SCALE;
  return [sx, sy];
}

// Build polygon points string for an SVG <polygon>
function polyPoints(corners: [number, number, number][]): string {
  return corners.map(([x, y, z]) => {
    const [sx, sy] = isoProject(x, y, z);
    return `${sx},${sy}`;
  }).join(" ");
}

// ─── Face Colors ───────────────────────────────────────────────────
const FACE_COLORS = {
  top: "#5865f2", // Blurple — all top surfaces
  front: "#23a55a", // Green  — front-facing surfaces
  side: "#b5bac1", // Grey   — side-facing surfaces
  topNet: "#5865f299",
  frontNet: "#23a55a99",
  sideNet: "#b5bac199",
};

// ─── Prism Face Data ───────────────────────────────────────────────
function prismFaces(l: number, w: number, h: number) {
  return [
    // Front face (green)
    {
      id: "front",
      color: FACE_COLORS.front,
      label: `${l}×${h}`,
      points: polyPoints([
        [0, w, 0],
        [l, w, 0],
        [l, w, h],
        [0, w, h],
      ]),
    },
    // Right side (grey)
    {
      id: "side-r",
      color: FACE_COLORS.side,
      label: `${w}×${h}`,
      points: polyPoints([
        [l, 0, 0],
        [l, w, 0],
        [l, w, h],
        [l, 0, h],
      ]),
    },
    // Top face (blurple)
    {
      id: "top",
      color: FACE_COLORS.top,
      label: `${l}×${w}`,
      points: polyPoints([
        [0, 0, h],
        [l, 0, h],
        [l, w, h],
        [0, w, h],
      ]),
    },
  ];
}

// ─── L-Shape Face Data ─────────────────────────────────────────────
function lShapeFaces(
  l1: number,
  w1: number,
  h1: number,
  l2: number,
  w2: number,
  h2: number,
) {
  // Block 1 sits at origin. Block 2 sits on top of Block 1, aligned to left-front corner.
  const faces = [
    // Block 1 — front
    {
      id: "b1-front",
      color: FACE_COLORS.front,
      label: `${l1}×${h1}`,
      points: polyPoints([
        [0, w1, 0],
        [l1, w1, 0],
        [l1, w1, h1],
        [0, w1, h1],
      ]),
    },
    // Block 1 — right side
    {
      id: "b1-side",
      color: FACE_COLORS.side,
      label: `${w1}×${h1}`,
      points: polyPoints([
        [l1, 0, 0],
        [l1, w1, 0],
        [l1, w1, h1],
        [l1, 0, h1],
      ]),
    },
    // Block 1 — top (partial, exposed part outside block 2 footprint)
    {
      id: "b1-top",
      color: FACE_COLORS.top,
      label: `${l1}×${w1}`,
      points: polyPoints([
        [0, 0, h1],
        [l1, 0, h1],
        [l1, w1, h1],
        [0, w1, h1],
      ]),
    },
    // Block 2 — front
    {
      id: "b2-front",
      color: FACE_COLORS.front,
      label: `${l2}×${h2}`,
      points: polyPoints([
        [0, w2, h1],
        [l2, w2, h1],
        [l2, w2, h1 + h2],
        [0, w2, h1 + h2],
      ]),
    },
    // Block 2 — right side
    {
      id: "b2-side",
      color: FACE_COLORS.side,
      label: `${w2}×${h2}`,
      points: polyPoints([
        [l2, 0, h1],
        [l2, w2, h1],
        [l2, w2, h1 + h2],
        [l2, 0, h1 + h2],
      ]),
    },
    // Block 2 — top
    {
      id: "b2-top",
      color: FACE_COLORS.top,
      label: `${l2}×${w2}`,
      points: polyPoints([
        [0, 0, h1 + h2],
        [l2, 0, h1 + h2],
        [l2, w2, h1 + h2],
        [0, w2, h1 + h2],
      ]),
    },
  ];
  return faces;
}

// ─── 2D Net Renderer ───────────────────────────────────────────────
function NetRect(
  { x, y, w, h, color, label }: {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    label: string;
  },
) {
  const S = 20; // scale for net
  return (
    <g>
      <rect
        x={x * S}
        y={y * S}
        width={w * S}
        height={h * S}
        fill={color}
        stroke="#f2f3f5"
        stroke-width="1.5"
      />
      <text
        x={(x + w / 2) * S}
        y={(y + h / 2) * S}
        text-anchor="middle"
        dominant-baseline="central"
        fill="#f2f3f5"
        font-size="11"
        font-family="var(--font-mono)"
      >
        {label}
      </text>
    </g>
  );
}

function PrismNet({ l, w, h }: { l: number; w: number; h: number }) {
  // Cross-shaped net: front, top, back, bottom in a column; left/right on sides of front
  // Layout in net-space units:
  //   Column center x = w (after left side)
  //   Rows: bottom(l×w) → front(l×h) → top(l×w) → back(l×h)
  //   Left side: left of front; Right side: right of front
  const cx = w; // column left x
  return (
    <svg
      viewBox={`-10 -10 ${(l + 2 * w) * 20 + 20} ${(2 * w + 2 * h) * 20 + 20}`}
      class="sim-net-svg"
    >
      {/* Bottom */}
      <NetRect x={cx} y={0} w={l} h={w} color={FACE_COLORS.topNet} label={`${l}×${w}`} />
      {/* Front */}
      <NetRect x={cx} y={w} w={l} h={h} color={FACE_COLORS.frontNet} label={`${l}×${h}`} />
      {/* Left side */}
      <NetRect x={0} y={w} w={w} h={h} color={FACE_COLORS.sideNet} label={`${w}×${h}`} />
      {/* Right side */}
      <NetRect x={cx + l} y={w} w={w} h={h} color={FACE_COLORS.sideNet} label={`${w}×${h}`} />
      {/* Top */}
      <NetRect
        x={cx}
        y={w + h}
        w={l}
        h={w}
        color={FACE_COLORS.topNet}
        label={`${l}×${w}`}
      />
      {/* Back */}
      <NetRect
        x={cx}
        y={2 * w + h}
        w={l}
        h={h}
        color={FACE_COLORS.frontNet}
        label={`${l}×${h}`}
      />
    </svg>
  );
}

// ─── Slider Component ──────────────────────────────────────────────
function DimSlider(
  { label, value, onInput, min, max }: {
    label: string;
    value: number;
    onInput: (v: number) => void;
    min?: number;
    max?: number;
  },
) {
  return (
    <div class="sim-slider-row">
      <label class="sim-slider-label">{label}</label>
      <input
        type="range"
        min={min ?? 1}
        max={max ?? 12}
        step={1}
        value={value}
        onInput={(e) => onInput(Number((e.target as HTMLInputElement).value))}
        class="sim-slider-input"
      />
      <span class="sim-slider-value">{value}</span>
    </div>
  );
}

// ─── Main Island ───────────────────────────────────────────────────
export default function VolumeSimulator() {
  const shapeType = useSignal<"prism" | "lshape">("prism");
  const exploded = useSignal(false);

  // Block 1 dimensions
  const l1 = useSignal(6);
  const w1 = useSignal(4);
  const h1 = useSignal(3);

  // Block 2 dimensions (L-shape only)
  const l2 = useSignal(3);
  const w2 = useSignal(2);
  const h2 = useSignal(4);

  // ── Computed: Volume ──
  const volume = useComputed(() => {
    const v1 = l1.value * w1.value * h1.value;
    if (shapeType.value === "prism") return v1;
    const v2 = l2.value * w2.value * h2.value;
    return v1 + v2;
  });

  const vol1 = useComputed(() => l1.value * w1.value * h1.value);
  const vol2 = useComputed(() => l2.value * w2.value * h2.value);

  // ── Computed: Surface Area ──
  const surfaceArea = useComputed(() => {
    const lv = l1.value, wv = w1.value, hv = h1.value;
    if (shapeType.value === "prism") {
      return 2 * (lv * wv + lv * hv + wv * hv);
    }
    // L-shape: total SA of both blocks minus 2× overlapping area
    const l2v = l2.value, w2v = w2.value, h2v = h2.value;
    const sa1 = 2 * (lv * wv + lv * hv + wv * hv);
    const sa2 = 2 * (l2v * w2v + l2v * h2v + w2v * h2v);
    // Overlap where Block 2 sits on Block 1 (top/bottom contact)
    const overlap = Math.min(lv, l2v) * Math.min(wv, w2v);
    return sa1 + sa2 - 2 * overlap;
  });

  // Face areas for breakdown
  const faceAreas = useComputed(() => {
    const lv = l1.value, wv = w1.value, hv = h1.value;
    if (shapeType.value === "prism") {
      return [
        { name: "Top & Bottom", color: FACE_COLORS.top, area: lv * wv, count: 2 },
        { name: "Front & Back", color: FACE_COLORS.front, area: lv * hv, count: 2 },
        { name: "Left & Right", color: FACE_COLORS.side, area: wv * hv, count: 2 },
      ];
    }
    const l2v = l2.value, w2v = w2.value, h2v = h2.value;
    return [
      { name: "B1 Top & Bottom", color: FACE_COLORS.top, area: lv * wv, count: 2 },
      { name: "B1 Front & Back", color: FACE_COLORS.front, area: lv * hv, count: 2 },
      { name: "B1 Left & Right", color: FACE_COLORS.side, area: wv * hv, count: 2 },
      { name: "B2 Top & Bottom", color: FACE_COLORS.top, area: l2v * w2v, count: 2 },
      { name: "B2 Front & Back", color: FACE_COLORS.front, area: l2v * h2v, count: 2 },
      { name: "B2 Left & Right", color: FACE_COLORS.side, area: w2v * h2v, count: 2 },
      {
        name: "Overlap (−)",
        color: "#f23f43",
        area: -(Math.min(lv, l2v) * Math.min(wv, w2v)),
        count: 2,
      },
    ];
  });

  // ── Computed: SVG faces ──
  const faces = useComputed(() => {
    if (shapeType.value === "prism") {
      return prismFaces(l1.value, w1.value, h1.value);
    }
    return lShapeFaces(l1.value, w1.value, h1.value, l2.value, w2.value, h2.value);
  });

  // SVG viewBox — auto-size based on max dimensions
  const vbSize = useComputed(() => {
    const maxDim = shapeType.value === "prism"
      ? Math.max(l1.value, w1.value, h1.value)
      : Math.max(l1.value + l2.value, w1.value + w2.value, h1.value + h2.value);
    const pad = maxDim * SCALE + 80;
    return pad;
  });

  return (
    <main class="sim-shell">
      {/* ── Header ── */}
      <div class="sim-header">
        <div class="sim-header-left">
          <span class="stage-hash">#</span>
          <h1 class="stage-title">📐 Volume & Surface Area Lab</h1>
        </div>
        <div class="sim-header-right">
          <button
            type="button"
            class={`sim-toggle-btn ${shapeType.value === "prism" ? "sim-toggle-active" : ""}`}
            onClick={() => {
              shapeType.value = "prism";
              exploded.value = false;
            }}
          >
            ◻ Rectangular Prism
          </button>
          <button
            type="button"
            class={`sim-toggle-btn ${shapeType.value === "lshape" ? "sim-toggle-active" : ""}`}
            onClick={() => {
              shapeType.value = "lshape";
              exploded.value = false;
            }}
          >
            🄻 L-Shape
          </button>
          <button
            type="button"
            class={`sim-toggle-btn ${exploded.value ? "sim-toggle-active" : ""}`}
            onClick={() => (exploded.value = !exploded.value)}
          >
            {exploded.value ? "🔲 3D View" : "📋 Unfold Net"}
          </button>
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div class="sim-body">
        {/* ── LEFT: 3D Viewport / 2D Net ── */}
        <div class="sim-viewport">
          {exploded.value
            ? (
              <div class="sim-net-container">
                <h3 class="sim-section-title">2D Net (Unfolded)</h3>
                {shapeType.value === "prism"
                  ? <PrismNet l={l1.value} w={w1.value} h={h1.value} />
                  : (
                    <div class="sim-net-lshape">
                      <p class="sim-net-label">Block 1 Net</p>
                      <PrismNet l={l1.value} w={w1.value} h={h1.value} />
                      <p class="sim-net-label">Block 2 Net</p>
                      <PrismNet l={l2.value} w={w2.value} h={h2.value} />
                    </div>
                  )}
              </div>
            )
            : (
              <svg
                class="sim-iso-svg"
                viewBox={`${-vbSize.value} ${-vbSize.value} ${vbSize.value * 2} ${
                  vbSize.value * 2
                }`}
              >
                {faces.value.map((f) => (
                  <g key={f.id}>
                    <polygon
                      points={f.points}
                      fill={f.color}
                      stroke="#f2f3f5"
                      stroke-width="1.5"
                      opacity="0.85"
                    />
                  </g>
                ))}
              </svg>
            )}

          {/* ── Color Legend ── */}
          <div class="sim-legend">
            <span class="sim-legend-item">
              <span class="sim-legend-swatch" style={`background:${FACE_COLORS.top}`} />
              Top / Bottom
            </span>
            <span class="sim-legend-item">
              <span class="sim-legend-swatch" style={`background:${FACE_COLORS.front}`} />
              Front / Back
            </span>
            <span class="sim-legend-item">
              <span class="sim-legend-swatch" style={`background:${FACE_COLORS.side}`} />
              Left / Right
            </span>
          </div>
        </div>

        {/* ── RIGHT: Sliders + Math ── */}
        <div class="sim-sidebar">
          {/* ── Dimension Sliders ── */}
          <div class="sim-slider-group">
            <h3 class="sim-section-title">
              {shapeType.value === "lshape" ? "Block 1" : "Dimensions"}
            </h3>
            <DimSlider label="Length (l)" value={l1.value} onInput={(v) => (l1.value = v)} />
            <DimSlider label="Width (w)" value={w1.value} onInput={(v) => (w1.value = v)} />
            <DimSlider label="Height (h)" value={h1.value} onInput={(v) => (h1.value = v)} />
          </div>

          {shapeType.value === "lshape" && (
            <div class="sim-slider-group">
              <h3 class="sim-section-title">Block 2</h3>
              <DimSlider
                label="Length (l₂)"
                value={l2.value}
                onInput={(v) => (l2.value = v)}
                max={l1.value}
              />
              <DimSlider
                label="Width (w₂)"
                value={w2.value}
                onInput={(v) => (w2.value = v)}
                max={w1.value}
              />
              <DimSlider label="Height (h₂)" value={h2.value} onInput={(v) => (h2.value = v)} />
            </div>
          )}

          {/* ── Volume Formula ── */}
          <div class="sim-math-card">
            <h3 class="sim-section-title">📦 Volume</h3>
            {shapeType.value === "prism"
              ? (
                <div class="sim-formula">
                  <p class="sim-formula-line">
                    V = l × w × h
                  </p>
                  <p class="sim-formula-line">
                    V = {l1.value} × {w1.value} × {h1.value}
                  </p>
                  <p class="sim-formula-result">
                    V = {volume.value} units³
                  </p>
                </div>
              )
              : (
                <div class="sim-formula">
                  <p class="sim-formula-line">
                    V = V₁ + V₂
                  </p>
                  <p class="sim-formula-line">
                    V₁ = {l1.value} × {w1.value} × {h1.value} = {vol1.value}
                  </p>
                  <p class="sim-formula-line">
                    V₂ = {l2.value} × {w2.value} × {h2.value} = {vol2.value}
                  </p>
                  <p class="sim-formula-result">
                    V = {vol1.value} + {vol2.value} = {volume.value} units³
                  </p>
                </div>
              )}
          </div>

          {/* ── Surface Area Breakdown ── */}
          <div class="sim-math-card">
            <h3 class="sim-section-title">📐 Surface Area</h3>
            <div class="sim-formula">
              {faceAreas.value.map((f) => (
                <p key={f.name} class="sim-formula-line">
                  <span class="sim-legend-swatch" style={`background:${f.color}`} />
                  {f.name}: {f.count} × {Math.abs(f.area)} = {f.count * f.area}
                </p>
              ))}
              <p class="sim-formula-result">
                SA = {surfaceArea.value} units²
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
