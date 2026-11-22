export interface RecommendedMajor {
  rank: number;
  displayRank?: number | null;
  tieCount?: number | null;
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
  // 학생 점수와 전공별 상대 가중치는 서로 다른 척도입니다.
  userScore: number | null;
  majorAvg: number | null;
}