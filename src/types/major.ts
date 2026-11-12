export type MajorDifficulty = 'low' | 'mid' | 'high';

export interface MajorRequest {
  name?: string;
  category?: string;
  difficulty?: MajorDifficulty;
  description?: string;
  careerPaths?: string;

  reqMathLogic?: number;
  reqProblemSolving?: number;
  reqInfoTech?: number;
  reqImplementation?: number;
  reqSystemUnderstanding?: number;
  reqDataAnalysis?: number;
  reqCommunication?: number;
  reqCollaboration?: number;
  reqSelfManagement?: number;

  tendLogicalInquiry?: number;
  tendPracticalTech?: number;
  tendArtCreative?: number;
  tendSocialCooperation?: number;
  tendLifeHealth?: number;
  tendEducationGuide?: number;
  tendTheoryAcademic?: number;
  tendDataAnalytics?: number;
  tendSystemOperation?: number;

  thrMathLogic?: number;
  thrInfoTech?: number;
}

export interface Major {
  id: number;
  createdAt: string;
  updatedAt: string;

  name: string;
  category: string | null;
  difficulty: MajorDifficulty | null;
  description: string | null;
  careerPaths: string | null;

  reqMathLogic: number | null;
  reqProblemSolving: number | null;
  reqInfoTech: number | null;
  reqImplementation: number | null;
  reqSystemUnderstanding: number | null;
  reqDataAnalysis: number | null;
  reqCommunication: number | null;
  reqCollaboration: number | null;
  reqSelfManagement: number | null;

  tendLogicalInquiry: number | null;
  tendPracticalTech: number | null;
  tendArtCreative: number | null;
  tendSocialCooperation: number | null;
  tendLifeHealth: number | null;
  tendEducationGuide: number | null;
  tendTheoryAcademic: number | null;
  tendDataAnalytics: number | null;
  tendSystemOperation: number | null;

  thrMathLogic: number | null;
  thrInfoTech: number | null;
}