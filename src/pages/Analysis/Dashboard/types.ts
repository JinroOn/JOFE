export interface RecommendedMajor {
  rank: number;
  majorId: number;
  name: string;
  category?: string;
  difficulty?: string;
  careerPaths?: string;
  suitability: number;
  tendencyScore: number;
  competencyScore: number;
  failed: boolean;
  description: string;
  strengths?: string;
  weaknesses?: string;
}

export interface CapabilityRow {
  axis: string;
  userScore: number;
  majorAvg: number;
}