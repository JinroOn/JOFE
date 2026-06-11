import type { Major } from '../../../types/major';

export type { Major };

export function getCategoryStyle(category: string | null) {
  switch (category) {
    case '공학계열':
      return { icon: 'code', iconBg: 'bg-secondary-container/10', iconColor: 'text-secondary', categoryColor: 'text-secondary' };
    case '자연과학계열':
      return { icon: 'biotech', iconBg: 'bg-[#FFAB00]/10', iconColor: 'text-[#FFAB00]', categoryColor: 'text-[#FFAB00]' };
    case '인문사회계열':
      return { icon: 'account_balance', iconBg: 'bg-purple-50', iconColor: 'text-purple-600', categoryColor: 'text-purple-600' };
    case '의약계열':
      return { icon: 'local_hospital', iconBg: 'bg-red-50', iconColor: 'text-red-500', categoryColor: 'text-red-500' };
    case '예체능계열':
      return { icon: 'palette', iconBg: 'bg-green-50', iconColor: 'text-green-600', categoryColor: 'text-green-600' };
    default:
      return { icon: 'school', iconBg: 'bg-surface-container', iconColor: 'text-on-surface-variant', categoryColor: 'text-on-surface-variant' };
  }
}

export function getReqScores(major: Major): number[] {
  return [
    (major.reqMathLogic ?? 0) / 100,
    (major.reqProblemSolving ?? 0) / 100,
    (major.reqInfoTech ?? 0) / 100,
    (major.reqImplementation ?? 0) / 100,
    (major.reqSystemUnderstanding ?? 0) / 100,
    (major.reqDataAnalysis ?? 0) / 100,
    (major.reqCommunication ?? 0) / 100,
    (major.reqCollaboration ?? 0) / 100,
    (major.reqSelfManagement ?? 0) / 100,
  ];
}
