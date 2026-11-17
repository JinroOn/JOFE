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
  // 정보가 없는 축은 임의의 0점/예시 점수로 대체하지 않습니다.
  userScore: number | null;
  majorAvg: number | null;
}