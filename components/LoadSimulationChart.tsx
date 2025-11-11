'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ScalabilityMetrics } from '@/lib/types';

interface Props {
  metrics: ScalabilityMetrics | null;
}

export function LoadSimulationChart({ metrics }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!metrics || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(metrics.load_points, d => d.load) || 1000])
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(metrics.load_points, d => d.latency) || 100])
      .range([height - margin.top - margin.bottom, 0]);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .append('text')
      .attr('fill', '#000')
      .attr('x', (width - margin.left - margin.right) / 2)
      .attr('y', 35)
      .attr('text-anchor', 'middle')
      .text('Requests per Second');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('fill', '#000')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -(height - margin.top - margin.bottom) / 2)
      .attr('text-anchor', 'middle')
      .text('Latency (ms)');

    // Add the line
    const line = d3.line<any>()
      .x(d => x(d.load))
      .y(d => y(d.latency))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(metrics.load_points)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add dots
    g.selectAll('.dot')
      .data(metrics.load_points)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.load))
      .attr('cy', d => y(d.latency))
      .attr('r', 3)
      .attr('fill', '#3b82f6');

  }, [metrics]);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Run simulation to see performance metrics</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white rounded-lg border p-4">
      <svg ref={svgRef} className="w-full" />
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Max RPS</p>
          <p className="text-lg font-semibold">{metrics.max_rps.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Latency</p>
          <p className="text-lg font-semibold">{metrics.avg_latency_ms}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">P95 Latency</p>
          <p className="text-lg font-semibold">{metrics.p95_latency_ms}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">P99 Latency</p>
          <p className="text-lg font-semibold">{metrics.p99_latency_ms}ms</p>
        </div>
      </div>
    </div>
  );
}

