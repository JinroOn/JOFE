import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Major } from './types';
import { getRequiredScores } from './types';
import { getMajor } from '../../../api/major';
import CompareRadarChart from './components/CompareRadarChart';
import SliderPanel from './components/SliderPanel';
import FitnessCard from './components/FitnessCard';
import ComparisonTable from './components/ComparisonTable';

const AXES = ['수리·논리', '문제해결', '정보기술', '구현력', '시스템이해', '데이터분석', '의사소통', '협업·윤리', '자기관리'];

const computeFitness = (userScores: number[], required: number[]) => {
  const avgDiff =
    userScores.reduce((sum, s, i) => sum + Math.abs(s - required[i]), 0) / userScores.length;
  return Math.round(Math.max(0, Math.min(100, 100 * (1 - avgDiff / 10))));
};

const MajorCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idsParam = searchParams.get('ids') ?? '';
  const ids = useMemo(
    () => idsParam.split(',').map(Number).filter((n) => n > 0),
    [idsParam],
  );

  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(ids.length > 0);
  const [scores, setScores] = useState<number[]>([5, 5, 5, 5, 5, 5, 5, 5, 5]);

  useEffect(() => {
    if (ids.length === 0) return;
    Promise.all(ids.map(getMajor))
      .then(setMajors)
      .finally(() => setLoading(false));
  }, [ids]);

  const allFitness = useMemo(
    () => majors.map((m) => computeFitness(scores, getRequiredScores(m))),
    [scores, majors],
  );

  const bestIdx = allFitness.length > 0 ? allFitness.indexOf(Math.max(...allFitness)) : 0;

  const handleSlider = (i: number, val: number) =>
    setScores((prev) => prev.map((s, idx) => (idx === i ? val : s)));

  const radarDatasets =
    majors.length > 0
      ? [
          {
            label: '현재 역량',
            scores: scores.map((s) => s / 10),
            color: '#FFAB00',
            strokeDash: undefined as string | undefined,
          },
          {
            label: '목표 전공 필요 역량',
            scores: getRequiredScores(majors[bestIdx]).map((s) => s / 10),
            color: '#00677f',
            strokeDash: '4 2',
          },
        ]
      : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (majors.length === 0) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">compare_arrows</span>
        <p className="text-on-surface-variant font-medium">비교할 전공을 전공 탐색에서 선택해주세요.</p>
        <button
          onClick={() => navigate('/diagnosis/explore')}
          className="px-6 py-3 bg-primary-container text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          전공 탐색으로 이동
        </button>
      </div>
    );
  }

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
                나의 역량 지표를 조정하여 희망 전공과의 적합도 변화를 실시간으로 확인하세요.
              </p>
            </div>
            <button
              onClick={() => navigate('/diagnosis/explore')}
              className="px-6 py-4 bg-surface-container-lowest text-primary-container border border-outline-variant/20 rounded-[14px] font-bold shadow-sm hover:-translate-y-0.5 transition-all shrink-0"
            >
              전공 다시 선택
            </button>
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
                    <span className="text-xs font-bold text-on-surface-variant">
                      {majors[bestIdx].name} 필요 역량
                    </span>
                  </div>
                </div>
              </section>

              <FitnessCard majors={majors} allFitness={allFitness} bestIdx={bestIdx} />
            </div>

            <ComparisonTable majors={majors} allFitness={allFitness} bestIdx={bestIdx} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MajorCompare;
