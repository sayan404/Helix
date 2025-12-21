// For now, we'll use in-memory storage
export const architectureStore: any[] = [];

export function saveArchitecture(architecture: any) {
  architectureStore.push(architecture);
  return architecture.id;
}

export function findSimilarArchitectures(targetArchitecture: any, limit: number = 5) {
  // This is handled by the similarity-search utility
  return [];
}

