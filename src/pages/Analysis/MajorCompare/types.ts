import type { Major } from '../../../types/major';

export type { Major };

export function getRequiredScores(major: Major): number[] {
  return [
    (major.reqMathLogic ?? 0) / 10,
    (major.reqProblemSolving ?? 0) / 10,
    (major.reqInfoTech ?? 0) / 10,
    (major.reqImplementation ?? 0) / 10,
    (major.reqSystemUnderstanding ?? 0) / 10,
    (major.reqDataAnalysis ?? 0) / 10,
    (major.reqCommunication ?? 0) / 10,
    (major.reqCollaboration ?? 0) / 10,
    (major.reqSelfManagement ?? 0) / 10,
  ];
}
