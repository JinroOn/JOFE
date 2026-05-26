export interface RecommendedMajor {
  rank: number;
  name: string;
  suitability: number;
  description: string;
}

export interface CapabilityRow {
  axis: string;
  userScore: number;
  majorAvg: number;
}
