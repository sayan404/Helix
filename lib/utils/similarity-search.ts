import { ArchitectureBlueprint } from '../types';

export function calculateSimilarity(
  design1: ArchitectureBlueprint,
  design2: ArchitectureBlueprint
): number {
  let score = 0;
  let maxScore = 0;

  // Pattern similarity (40% weight)
  const patternWeight = 40;
  const sharedPatterns = design1.patterns.filter(p => design2.patterns.includes(p));
  const patternScore = (sharedPatterns.length / Math.max(design1.patterns.length, design2.patterns.length)) * patternWeight;
  score += patternScore;
  maxScore += patternWeight;

  // Service count similarity (20% weight)
  const countWeight = 20;
  const count1 = design1.services.length;
  const count2 = design2.services.length;
  const countDiff = Math.abs(count1 - count2);
  const countScore = Math.max(0, (1 - countDiff / Math.max(count1, count2))) * countWeight;
  score += countScore;
  maxScore += countWeight;

  // Scaling model match (20% weight)
  const scalingWeight = 20;
  if (design1.scaling_model === design2.scaling_model) {
    score += scalingWeight;
  }
  maxScore += scalingWeight;

  // Component type similarity (20% weight)
  const componentWeight = 20;
  const types1 = new Set(design1.services.map(s => s.type));
  const types2 = new Set(design2.services.map(s => s.type));
  const sharedTypes = [...types1].filter(t => types2.has(t));
  const typeScore = (sharedTypes.length / Math.max(types1.size, types2.size)) * componentWeight;
  score += typeScore;
  maxScore += componentWeight;

  return Math.round((score / maxScore) * 100);
}

export function findSimilarArchitectures(
  target: ArchitectureBlueprint,
  allDesigns: ArchitectureBlueprint[],
  limit: number = 5
): Array<{ design: ArchitectureBlueprint; similarity: number }> {
  const results = allDesigns
    .filter(d => d.id !== target.id)
    .map(design => ({
      design,
      similarity: calculateSimilarity(target, design),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}

