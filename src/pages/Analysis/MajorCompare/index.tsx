import { useState, useMemo } from 'react';
import type { Major } from './types';
import CompareRadarChart from './components/CompareRadarChart';
import SliderPanel from './components/SliderPanel';
import FitnessCard from './components/FitnessCard';
import ComparisonTable from './components/ComparisonTable';

const AXES = ['수리·논리', '문제해결', '정보기술', '구현력', '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리'];

const MAJORS: Major[] = [
  {
    id: 'cs', name: '컴퓨터공학과', college: '공과대학',
    required: [8.0, 7.0, 8.0, 9.0, 9.0, 7.0, 6.0, 7.0, 7.0],
    employment: 'High', employmentPct: 85, startSalary: '4,800~',
  },
  {
    id: 'ds', name: '데이터사이언스', college: '융합전공',
    required: [8.0, 8.0, 7.0, 8.0, 7.0, 10.0, 7.0, 8.0, 7.0],
    employment: 'V.High', employmentPct: 92, startSalary: '5,500~',
  },
  {
    id: 'stat', name: '통계학과', college: '상경대학',
    required: [10.0, 9.0, 6.0, 5.0, 6.0, 10.0, 6.0, 6.0, 8.0],
    employment: 'Mid', employmentPct: 65, startSalary: '4,200~',
  },
];

const computeFitness = (userScores: number[], required: number[]) => {
  const avgDiff =
    userScores.reduce((sum, s, i) => sum + Math.abs(s - required[i]), 0) / userScores.length;
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - avgDiff / 10))));
};

const MajorCompare = () => {
  const [scores, setScores] = useState<number[]>([8.8, 8.2, 8.6, 7.4, 7.9, 9.1, 7.2, 8.4, 6.0]);

  const allFitness = useMemo(
    () => MAJORS.map((m) => computeFitness(scores, m.required)),
    [scores]
  );

  const bestIdx = allFitness.indexOf(Math.max(...allFitness));

  const handleSlider = (i: number, val: number) =>
    setScores((prev) => prev.map((s, idx) => (idx === i ? val : s)));

  const radarDatasets = [
    {
      label: '현재 역량',
      scores: scores.map((s) => s / 10),
      color: '#FFAB00',
      strokeDash: undefined as string | undefined,
    },
    {
      label: '목표 전공 필요 역량',
      scores: MAJORS[bestIdx].required.map((s) => s / 10),
      color: '#00677f',
      strokeDash: '4 2',
    },
  ];

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">

        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-semibold text-sm mb-4">
                AI 맞춤 분석
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tighter mb-4 leading-tight">
                미래를 향한 가장 정교한<br />전공 시뮬레이션
              </h1>
              <p className="text-on-surface-variant max-w-2xl text-base sm:text-lg leading-relaxed">
                나의 역량 지표를 조정하여 희망 전공과의 적합도 변화를 실시간으로 확인하세요.<br />
                AI가 당신의 잠재력을 데이터로 증명합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button className="px-6 py-4 bg-surface-container-lowest text-primary-container border border-outline-variant/20 rounded-[14px] font-bold shadow-sm hover:-translate-y-0.5 transition-all">
                분석 저장하기
              </button>
              <button className="px-6 py-4 bg-[#FFAB00] text-primary-container rounded-[14px] font-bold shadow-lg shadow-[#FFAB00]/20 hover:-translate-y-0.5 transition-all">
                보고서 다운로드
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          <aside className="md:col-span-4">
            <SliderPanel axes={AXES} scores={scores} onChange={handleSlider} />
          </aside>

          <div className="md:col-span-8 space-y-8">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-[14px] shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex flex-col items-center">
                <h3 className="text-lg font-bold self-start mb-4">역량 갭 분석</h3>
                <div className="w-full aspect-square max-w-[280px]">
                  <CompareRadarChart datasets={radarDatasets} labels={AXES} />
                </div>
                <div className="mt-6 flex flex-wrap gap-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FFAB00] shrink-0" />
                    <span className="text-xs font-bold text-on-surface-variant">현재 역량</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="2" className="shrink-0">
                      <line x1="0" y1="1" x2="20" y2="1" stroke="#00677f" strokeWidth="2" strokeDasharray="4 2" />
                    </svg>
                    <span className="text-xs font-bold text-on-surface-variant">목표 전공 필요 역량</span>
                  </div>
                </div>
              </section>

              <FitnessCard majors={MAJORS} allFitness={allFitness} bestIdx={bestIdx} />
            </div>

            <ComparisonTable majors={MAJORS} allFitness={allFitness} bestIdx={bestIdx} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default MajorCompare;
