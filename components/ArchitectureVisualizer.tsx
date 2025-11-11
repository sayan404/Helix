"use client";

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { ArchitectureBlueprint, SystemNode, SystemEdge } from "@/lib/types";

interface Props {
  architecture: ArchitectureBlueprint | null;
}

const nodeColors: Record<string, string> = {
  service: "#3b82f6",
  database: "#10b981",
  cache: "#f59e0b",
  queue: "#a855f7",
  gateway: "#ec4899",
  cdn: "#06b6d4",
  "load-balancer": "#8b5cf6",
};

export function ArchitectureVisualizer({ architecture }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const typeConfig: Record<
    string,
    { color: string; lane: number; icon: string; label: string }
  > = {
    service: {
      color: "#3b82f6",
      lane: 0.45,
      icon: "🧩",
      label: "Service",
    },
    database: {
      color: "#10b981",
      lane: 0.85,
      icon: "🗄️",
      label: "Database",
    },
    cache: {
      color: "#f59e0b",
      lane: 0.15,
      icon: "⚡",
      label: "Cache",
    },
    queue: {
      color: "#a855f7",
      lane: 0.28,
      icon: "📬",
      label: "Queue",
    },
    gateway: {
      color: "#ec4899",
      lane: 0.58,
      icon: "🚪",
      label: "Gateway",
    },
    cdn: {
      color: "#06b6d4",
      lane: 0.2,
      icon: "🌐",
      label: "CDN",
    },
    "load-balancer": {
      color: "#8b5cf6",
      lane: 0.5,
      icon: "⚖️",
      label: "Load Balancer",
    },
  };

  useEffect(() => {
    if (!architecture || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1200;
    const height = 700;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const nodeWidth = 180;
    const nodeHeight = 100;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Add arrow markers for directed edges - LARGER and MORE VISIBLE
    const defs = svg.append("defs");

    // Create arrow markers for each type
    ["sync", "async", "pub-sub"].forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -8 16 16")
        .attr("refX", 54)
        .attr("refY", 0)
        .attr("markerWidth", 9)
        .attr("markerHeight", 9)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-8L16,0L0,8L4,0Z")
        .attr(
          "fill",
          type === "async"
            ? "#94a3b8"
            : type === "pub-sub"
            ? "#f59e0b"
            : "#64748b"
        )
        .attr("opacity", 1);
    });

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add dark background
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "#0f172a")
      .attr("rx", 18);

    // Add subtle drop shadow filter for nodes
    const shadowFilter = defs
      .append("filter")
      .attr("id", "node-shadow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    shadowFilter
      .append("feDropShadow")
      .attr("dx", "0")
      .attr("dy", "12")
      .attr("stdDeviation", "12")
      .attr("flood-color", "rgba(15,23,42,0.35)");

    // Calculate lane distributions for readable layout
    const typeCounts: Record<string, number> = {};
    architecture.services.forEach((service) => {
      const t = service.type;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const typeIndex: Record<string, number> = {};

    const defaultLane = 0.5;

    const nodes: (SystemNode & {
      x?: number;
      y?: number;
      fx?: number | null;
      fy?: number | null;
      targetX?: number;
      targetY?: number;
      icon?: string;
      color?: string;
      displayType?: string;
      count?: number;
    })[] = architecture.services.map((service, i, arr) => {
      const config = typeConfig[service.type] || {
        color: "#38bdf8",
        lane: defaultLane,
        icon: "🧠",
        label: service.type,
      };
      const count = typeCounts[service.type] || arr.length;
      const index = typeIndex[service.type] || 0;
      const spacingY = innerHeight / (count + 1);

      const targetX = config.lane * innerWidth;
      const targetY = spacingY * (index + 1);
      typeIndex[service.type] = index + 1;

      return {
        ...service,
        x: targetX,
        y: targetY,
        targetX,
        targetY,
        icon: config.icon,
        color: config.color,
        displayType: config.label,
      };
    });

    // Create links
    const links = architecture.connections
      .map((conn) => ({
        source: nodes.find((n) => n.id === conn.source),
        target: nodes.find((n) => n.id === conn.target),
        type: conn.type,
        protocol: conn.protocol,
      }))
      .filter((link) => link.source && link.target);

    // Create force simulation with MUCH BETTER spacing
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(220)
          .strength(0.7)
      )
      .force("charge", d3.forceManyBody().strength(-1200))
      .force("center", d3.forceCenter(innerWidth / 2, innerHeight / 2))
      .force("collision", d3.forceCollide().radius((nodeWidth / 2) * 1.1))
      .force(
        "x",
        d3.forceX((d: any) => d.targetX || innerWidth / 2).strength(0.4)
      )
      .force(
        "y",
        d3.forceY((d: any) => d.targetY || innerHeight / 2).strength(0.4)
      )
      .alphaDecay(0.01)
      .velocityDecay(0.3);

    // Draw links with arrows - STRAIGHT LINES
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d: any) => {
        if (d.type === "async") return "#94a3b8";
        if (d.type === "pub-sub") return "#f59e0b";
        return "#64748b";
      })
      .attr("stroke-opacity", 0.9)
      .attr("stroke-width", 4)
      .attr("stroke-dasharray", (d: any) => (d.type === "async" ? "10,5" : "0"))
      .attr("marker-end", (d: any) => `url(#arrow-${d.type})`)
      .attr("stroke-linecap", "round");

    // Draw link labels with better styling - MORE PROMINENT
    const linkLabels = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("g")
      .data(links)
      .enter()
      .append("g");

    // Background for labels
    linkLabels
      .append("rect")
      .attr("fill", "#1e293b")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1.5)
      .attr("rx", 6)
      .attr("ry", 6);

    // Label text
    linkLabels
      .append("text")
      .attr("font-size", 13)
      .attr("font-weight", "700")
      .attr("fill", "#f1f5f9")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text((d: any) => `${d.protocol || d.type}`);

    // Draw nodes with card layout + icons
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .style("cursor", "grab")
      .call(
        d3
          .drag<any, any>()
          .on("start", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            d3.select(event.sourceEvent.target.parentNode).style(
              "cursor",
              "grabbing"
            );
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            d3.select(event.sourceEvent.target.parentNode).style(
              "cursor",
              "grab"
            );
          })
      );

    // Node card background
    node
      .append("rect")
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .attr("rx", 20)
      .attr("fill", (d: any) => {
        const base = d.color || nodeColors[d.type] || "#38bdf8";
        return d3.color(base)?.copy({ opacity: 0.18 })?.formatRgb() || base;
      })
      .attr("stroke", (d: any) => d.color || nodeColors[d.type] || "#38bdf8")
      .attr("stroke-width", 2)
      .style("filter", "url(#node-shadow)");

    // Node icon container
    node
      .append("rect")
      .attr("width", 48)
      .attr("height", 48)
      .attr("x", -nodeWidth / 2 + 16)
      .attr("y", -nodeHeight / 2 + 16)
      .attr("rx", 12)
      .attr("fill", (d: any) => {
        const base = d.color || nodeColors[d.type] || "#38bdf8";
        return d3.color(base)?.copy({ opacity: 0.2 })?.formatRgb() || base;
      })
      .attr("stroke", (d: any) => d.color || nodeColors[d.type] || "#38bdf8")
      .attr("stroke-width", 1.2);

    // Node icon (emoji-based for clarity)
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", -nodeWidth / 2 + 40)
      .attr("y", -nodeHeight / 2 + 46)
      .attr("font-size", 28)
      .text((d: any) => d.icon || "🧠");

    // Node name
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.1em")
      .attr("x", 20)
      .attr("font-size", 15)
      .attr("font-weight", "700")
      .attr("fill", "#f8fafc")
      .text((d: any) => d.name)
      .each(function (d: any) {
        const text = d3.select(this);
        const words = d.name.split(/\s+/);
        if (words.length > 1) {
          text.text("");
          words.forEach((word: string, i: number) => {
            text
              .append("tspan")
              .attr("x", 20)
              .attr("dy", i === 0 ? "-0.3em" : "1.1em")
              .text(word);
          });
        }
      });

    // Node type label
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", 20)
      .attr("dy", "1.7em")
      .attr("font-size", 11)
      .attr("font-weight", "600")
      .attr("fill", "#cbd5e1")
      .attr("opacity", 0.9)
      .text((d: any) => d.displayType || d.type);

    // Technology badge
    node
      .filter((d: any) => d.technology)
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", 20)
      .attr("dy", "3.2em")
      .attr("font-size", 9)
      .attr("font-weight", "600")
      .attr("fill", "#94a3b8")
      .text((d: any) => d.technology);

    // Tooltips with detailed info
    node
      .append("title")
      .text(
        (d: any) =>
          `${d.name}\n` +
          `Type: ${d.type}\n` +
          `Technology: ${d.technology || "N/A"}\n` +
          `${d.description || ""}`
      );

    // Update positions on each tick
    simulation.on("tick", () => {
      // Constrain nodes to stay within bounds
      nodes.forEach((d: any) => {
        const halfW = nodeWidth / 2;
        const halfH = nodeHeight / 2;
        d.x = Math.max(halfW, Math.min(innerWidth - halfW, d.x));
        d.y = Math.max(halfH, Math.min(innerHeight - halfH, d.y));
      });

      // Update links with STRAIGHT lines (like AWS diagrams)
      link.attr("x1", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const padding = Math.min(nodeWidth, nodeHeight) / 2 - 14;
        return d.source.x + (dx / len) * padding;
      });
      link.attr("y1", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const padding = Math.min(nodeWidth, nodeHeight) / 2 - 14;
        return d.source.y + (dy / len) * padding;
      });
      link.attr("x2", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const padding = Math.min(nodeWidth, nodeHeight) / 2 - 10;
        return d.target.x - (dx / len) * padding;
      });
      link.attr("y2", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const padding = Math.min(nodeWidth, nodeHeight) / 2 - 10;
        return d.target.y - (dy / len) * padding;
      });

      // Update link labels
      linkLabels.attr("transform", (d: any) => {
        const x = (d.source.x + d.target.x) / 2;
        const y = (d.source.y + d.target.y) / 2;
        return `translate(${x},${y})`;
      });

      // Position label backgrounds based on text size
      linkLabels.selectAll("rect").each(function (this: any) {
        const text = d3.select(this.parentNode).select("text");
        const bbox = (text.node() as any).getBBox();
        d3.select(this)
          .attr("x", bbox.x - 6)
          .attr("y", bbox.y - 3)
          .attr("width", bbox.width + 12)
          .attr("height", bbox.height + 6);
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [architecture]);

  if (!architecture) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/30">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">
            Generate an architecture to see the visualization
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            Enter a system description and click "Generate Architecture"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-950/80 rounded-xl border border-slate-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-2xl border border-slate-800/50">
        <h4 className="font-bold mb-3 text-slate-200 text-lg">
          Architecture Legend
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {Array.from(new Set(architecture.services.map((s) => s.type))).map(
            (type) => {
              const config = typeConfig[type] || {
                color: "#38bdf8",
                icon: "🧠",
                label: type,
              };
              return (
                <div
                  key={type}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner"
                    style={{
                      backgroundColor: d3
                        .color(config.color)
                        ?.copy({ opacity: 0.18 })
                        ?.toString(),
                      border: `1px solid ${config.color}`,
                    }}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100">
                      {config.label}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{type}</p>
                  </div>
                </div>
              );
            }
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <h5 className="font-semibold mb-2 text-slate-200 text-sm">
            Connection Types
          </h5>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-10 h-0.5 bg-slate-500 rounded-full" />
              <span>Sync / Request-Response</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-0.5 rounded-full"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, #94a3b8 0, #94a3b8 6px, transparent 6px, transparent 12px)",
                }}
              />
              <span>Async / Event Queue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-0.5 bg-amber-500 rounded-full" />
              <span>Pub/Sub Broadcast</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-slate-800/50">
        <p className="text-slate-300 text-sm">
          💡 <span className="font-semibold">Tip:</span> Drag nodes to rearrange
          the diagram
        </p>
      </div>
    </div>
  );
}
