import { ArchitectureBlueprint, CostEstimation } from '../types';

export function estimateCost(architecture: ArchitectureBlueprint): CostEstimation {
  const serviceCount = architecture.services.filter(s => s.type === 'service').length;
  const dbCount = architecture.services.filter(s => s.type === 'database').length;
  const cacheCount = architecture.services.filter(s => s.type === 'cache').length;
  const queueCount = architecture.services.filter(s => s.type === 'queue').length;
  
  // Base compute cost per service (assuming small instances)
  const computeCost = serviceCount * 50; // $50/month per service
  
  // Database costs
  const storageCost = dbCount * 100; // $100/month per database
  
  // Network and additional services
  const networkCost = serviceCount * 20; // $20/month network per service
  const additionalCost = (cacheCount * 30) + (queueCount * 40); // Cache: $30, Queue: $40
  
  const total = computeCost + storageCost + networkCost + additionalCost;
  
  return {
    monthly_cost: total,
    breakdown: {
      compute: computeCost,
      storage: storageCost,
      network: networkCost,
      additional: additionalCost,
    },
    assumptions: [
      `${serviceCount} services @ $50/month each`,
      `${dbCount} databases @ $100/month each`,
      `Network traffic @ $20/service/month`,
      `${cacheCount} cache instances @ $30/month each`,
      `${queueCount} message queues @ $40/month each`,
      'Estimates based on moderate traffic (1M requests/month)',
      'Costs may vary based on actual usage and cloud provider',
    ],
  };
}

export function simulateLoad(architecture: ArchitectureBlueprint) {
  const serviceCount = architecture.services.filter(s => s.type === 'service').length;
  const hasCache = architecture.services.some(s => s.type === 'cache');
  const hasQueue = architecture.services.some(s => s.type === 'queue');
  const hasLoadBalancer = architecture.services.some(s => s.type === 'load-balancer');
  
  // Base latency factors
  let baseLatency = 50; // ms
  if (hasCache) baseLatency *= 0.7; // Cache reduces latency by 30%
  if (hasLoadBalancer) baseLatency *= 0.9; // Load balancer adds small overhead
  if (hasQueue) baseLatency *= 1.2; // Async processing adds latency
  
  // Generate load points
  const loadPoints = [];
  for (let load = 100; load <= 10000; load += 500) {
    const scalingFactor = architecture.scaling_model === 'horizontal' ? 0.8 : 1.2;
    const latency = baseLatency + (load / (serviceCount * 100)) * scalingFactor;
    const successRate = Math.max(0.95, 1 - (load / 50000));
    
    loadPoints.push({
      load,
      latency: Math.round(latency),
      success_rate: Math.round(successRate * 100) / 100,
    });
  }
  
  return {
    max_rps: serviceCount * 1000 * (hasLoadBalancer ? 1.5 : 1),
    avg_latency_ms: Math.round(baseLatency),
    p95_latency_ms: Math.round(baseLatency * 1.5),
    p99_latency_ms: Math.round(baseLatency * 2),
    load_points: loadPoints,
  };
}

