import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type DiagramNode = {
  id: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  z?: number;
  className?: string;
};

type DiagramLayer = {
  id: string;
  label: string;
  subLabel: string;
  depth: number;
  rotate?: number;
  tilt?: number;
  nodes: DiagramNode[];
};

type DiagramBeam = {
  id: string;
  x: number;
  y: number;
  z?: number;
  rotation: number;
  length: number;
  delay?: number;
  variant?: "primary" | "secondary";
};

const LAYERS: DiagramLayer[] = [
  {
    id: "core",
    label: "Knowledge Core",
    subLabel: "Unified graph, context memory, and telemetry",
    depth: -160,
    rotate: -8,
    tilt: 60,
    nodes: [
      {
        id: "graph",
        label: "Knowledge Graph",
        description: "Domain ontology + lineage",
        x: -88,
        y: -46,
        z: 16,
        className: "diagram-node--primary",
      },
      {
        id: "vector",
        label: "Vector Memory",
        description: "Semantic recall + embeddings",
        x: 36,
        y: 6,
        z: 8,
        className: "diagram-node--primary",
      },
      {
        id: "observability",
        label: "Observability",
        description: "Tracing & health metrics",
        x: -18,
        y: 64,
        z: -12,
        className: "diagram-node--tertiary",
      },
    ],
  },
  {
    id: "services",
    label: "Cognitive Services",
    subLabel: "Reasoning, simulation, and automation engines",
    depth: -60,
    rotate: 4,
    tilt: 58,
    nodes: [
      {
        id: "architect",
        label: "Architect AI",
        description: "Blueprint synthesis",
        x: -76,
        y: -54,
        z: 18,
        className: "diagram-node--primary",
      },
      {
        id: "simulation",
        label: "Load Lab",
        description: "Synthetic traffic models",
        x: 68,
        y: -28,
        z: 6,
        className: "diagram-node--secondary",
      },
      {
        id: "codegen",
        label: "Code Forge",
        description: "Boilerplate generation",
        x: -12,
        y: 48,
        z: -16,
        className: "diagram-node--secondary",
      },
    ],
  },
  {
    id: "experience",
    label: "Product Surface",
    subLabel: "Collaborative whiteboard & governance guardrails",
    depth: 40,
    rotate: 0,
    tilt: 55,
    nodes: [
      {
        id: "whiteboard",
        label: "Architecture Whiteboard",
        description: "Multiplayer canvas",
        x: -64,
        y: -52,
        z: 20,
        className: "diagram-node--primary",
      },
      {
        id: "review",
        label: "Design Review",
        description: "AI assisted critiques",
        x: 52,
        y: -12,
        z: 10,
        className: "diagram-node--secondary",
      },
      {
        id: "governance",
        label: "Governance Guardrails",
        description: "Policy enforcement",
        x: -24,
        y: 60,
        z: -10,
        className: "diagram-node--tertiary",
      },
    ],
  },
];

const BEAMS: DiagramBeam[] = [
  {
    id: "beam-1",
    x: -120,
    y: -32,
    z: 12,
    rotation: 18,
    length: 220,
    delay: 0.2,
    variant: "primary",
  },
  {
    id: "beam-2",
    x: 44,
    y: -8,
    z: -24,
    rotation: -36,
    length: 240,
    delay: 0.8,
    variant: "secondary",
  },
  {
    id: "beam-3",
    x: -30,
    y: 68,
    z: 4,
    rotation: 12,
    length: 210,
    delay: 1.4,
    variant: "primary",
  },
];

export function EarlyAccessDiagram() {
  return (
    <div className="diagram-perspective">
      <div className="diagram-scene">
        <div className="diagram-halo diagram-halo--inner" />
        <div className="diagram-halo diagram-halo--outer" />

        {BEAMS.map((beam) => (
          <span
            key={beam.id}
            className={cn(
              "diagram-beam",
              beam.variant === "secondary" && "diagram-beam--secondary"
            )}
            style={
              {
                "--beam-translate-x": `${beam.x}px`,
                "--beam-translate-y": `${beam.y}px`,
                "--beam-translate-z": `${beam.z ?? 0}px`,
                "--beam-rotation": `${beam.rotation}deg`,
                "--beam-length": `${beam.length}px`,
                animationDelay: `${beam.delay ?? 0}s`,
              } as CSSProperties
            }
          />
        ))}

        {LAYERS.map((layer) => (
          <div
            key={layer.id}
            className={cn("diagram-layer", `diagram-layer--${layer.id}`)}
            data-layer={layer.id}
            style={
              {
                "--layer-depth": `${layer.depth}px`,
                "--layer-tilt": `${layer.tilt ?? 58}deg`,
                "--layer-rotate": `${layer.rotate ?? 0}deg`,
              } as CSSProperties
            }
          >
            <div className="diagram-layer__label">
              <span>{layer.label}</span>
              <p>{layer.subLabel}</p>
            </div>
            {layer.nodes.map((node) => (
              <div
                key={node.id}
                className={cn("diagram-node", node.className)}
                style={
                  {
                    "--node-translate-x": `${node.x}px`,
                    "--node-translate-y": `${node.y}px`,
                    "--node-translate-z": `${node.z ?? 0}px`,
                  } as CSSProperties
                }
              >
                <span className="diagram-node__label">{node.label}</span>
                {node.description && (
                  <span className="diagram-node__caption">
                    {node.description}
                  </span>
                )}
                <span className="diagram-node__glow" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EarlyAccessDiagram;
