export interface SystemNode {
  id: string;
  name: string;
  type: 'service' | 'database' | 'cache' | 'queue' | 'gateway' | 'cdn' | 'load-balancer';
  technology?: string;
  description?: string;
}

export interface SystemEdge {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'pub-sub';
  protocol?: string;
}

export interface ArchitectureBlueprint {
  id: string;
  prompt: string;
  services: SystemNode[];
  connections: SystemEdge[];
  patterns: string[];
  scaling_model: 'horizontal' | 'vertical' | 'hybrid';
  summary: string;
  estimated_cost?: CostEstimation;
  created_at: string;
  updated_at: string;
}

export interface CostEstimation {
  monthly_cost: number;
  breakdown: {
    compute: number;
    storage: number;
    network: number;
    additional: number;
  };
  assumptions: string[];
}

export interface ScalabilityMetrics {
  max_rps: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  load_points: Array<{
    load: number;
    latency: number;
    success_rate: number;
  }>;
}

export interface CodeTemplate {
  service_name: string;
  files: {
    [filename: string]: string;
  };
}

export interface ExportPackage {
  architecture: ArchitectureBlueprint;
  code_templates: CodeTemplate[];
  docker_compose: string;
  dockerfile: string;
}

