"use client";

import type { CSSProperties } from "react";

type Layer = {
  id: string;
  title: string;
  subtitle: string;
  caption: string;
  depth: number;
  rotate: number;
  accent: string;
};

const LAYERS: Layer[] = [
  {
    id: "experience",
    title: "Product Surface",
    subtitle: "Whiteboard • Design review • Guardrails",
    caption: "Collaborative cockpit for system strategists.",
    depth: 90,
    rotate: -16,
    accent: "var(--gradient-surface)",
  },
  {
    id: "reasoning",
    title: "Cognitive Grid",
    subtitle: "Architecture AI • Load Lab • Code Forge",
    caption: "Reasoning engines generating resilient blueprints.",
    depth: 30,
    rotate: -8,
    accent: "var(--gradient-cerebral)",
  },
  {
    id: "foundation",
    title: "Knowledge Core",
    subtitle: "Graph memory • Telemetry • Policy layer",
    caption: "Signals and context fueling high-fidelity decisions.",
    depth: -30,
    rotate: 0,
    accent: "var(--gradient-core)",
  },
];

export function EarlyAccessAnimation() {
  return (
    <div className="access-stage">
      <div className="access-glow access-glow--primary" />
      <div className="access-glow access-glow--secondary" />
      <div className="access-orbit">
        <span className="access-orbit__beam access-orbit__beam--one" />
        <span className="access-orbit__beam access-orbit__beam--two" />
        <span className="access-orbit__node" />
      </div>

      <div className="access-halo access-halo--outer" />
      <div className="access-halo access-halo--inner" />

      <div className="access-stack">
        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className="access-layer"
            style={
              {
                "--layer-depth": `${layer.depth}px`,
                "--layer-rotate": `${layer.rotate}deg`,
                "--layer-accent": layer.accent,
              } as CSSProperties
            }
          ></div>
        ))}
      </div>

      <div className="access-particles">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="access-particle"
            style={
              {
                "--particle-index": index,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

export default EarlyAccessAnimation;
