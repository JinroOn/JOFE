import { useEffect, useState } from 'react';
import RadarChart from './components/RadarChart';
import { getDiagnosisResults, getResultMajorScores } from '../../../api/results';
import { getMajor } from '../../../api/major';
import { getPlansByResult, getPlanItems, getPlanRiskNotes, completePlanItem, createPlan } from '../../../api/plan';
import type { DiagnosisResult } from '../../../types/results';
import type { MajorWeeklyPlanItem } from '../../../types/plan';

const AXES = [
  { label: '수리·논리력',   sub: '알고리즘 / 수학적 사고' },
  { label: '문제해결력',    sub: '논리적 분석 / 창의적 해결' },
  { label: '정보기술',      sub: '프로그래밍 / 기술 이해' },
  { label: '구현력',        sub: '코딩 / 설계 실현' },
  { label: '시스템이해',    sub: '운영체제 / 컴퓨터구조' },
  { label: '데이터 분석',   sub: '통계 / 데이터 시각화' },
  { label: '의사소통',      sub: '발표 / 문서화' },
  { label: '협업·윤리',     sub: '팀워크 / 직업윤리' },
  { label: '자기관리',      sub: '시간관리 / 자기개발' },
];

const RANK_STYLES = [
  { color: 'text-error',     barColor: 'bg-error',     border: 'border-error/20',     badge: 'bg-error/10 text-error' },
  { color: 'text-[#FF6B35]', barColor: 'bg-[#FF6B35]', border: 'border-[#FF6B35]/20', badge: 'bg-[#FF6B35]/10 text-[#FF6B35]' },
  { color: 'text-[#FFAB00]', barColor: 'bg-[#FFAB00]', border: 'border-[#FFAB00]/20', badge: 'bg-[#FFAB00]/10 text-[#FFAB00]' },
];

const statusStyle: Record<string, string> = {
  done:    'bg-secondary-container/20 border-secondary-container/40 text-secondary',
  current: 'bg-primary-container text-white border-primary-container shadow-lg',
  locked:  'bg-surface-container border-outline-variant/20 text-on-surface-variant/50',
};

const statusIcon: Record<string, string> = {
  done:    'check_circle',
  current: 'radio_button_checked',
  locked:  'lock',
};

function getGrade(score: number): string {
  if (score < 30) return 'D-';
  if (score < 40) return 'D';
  if (score < 50) return 'D+';
  if (score < 55) return 'C-';
  if (score < 65) return 'C';
  if (score < 70) return 'C+';
  if (score < 75) return 'B-';
  if (score < 80) return 'B';
  if (score < 85) return 'B+';
  if (score < 90) return 'A-';
  if (score < 95) return 'A';
  return 'A+';
}

const COMPETENCY_KEYS = [
  'mathLogic', 'problemSolving', 'infoTech', 'implementation',
  'systemUnderstanding', 'dataAnalysis', 'communication', 'collaboration', 'selfManagement',
] as const;

function parseVector(s: string | null): number[] | null {
  if (!s) return null;
  try {
    const p = JSON.parse(s) as unknown;
    if (Array.isArray(p)) return (p as unknown[]).map(Number);
    if (p && typeof p === 'object') {
      return COMPETENCY_KEYS.map((k) => Number((p as Record<string, unknown>)[k] ?? 0));
    }
  } catch { /* fallthrough to comma-split */ }
  const parts = s.split(',').map(Number);
  return parts.some(isNaN) ? null : parts;
}

function normalizeScores(raw: number[]): number[] {
  const max = Math.max(...raw);
  return raw.map((v) => (max > 1 ? v / 100 : v));
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

const WeakCapability = () => {
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScores, setCurrentScores] = useState<number[]>(Array(9).fill(0));
  const [targetScores, setTargetScores] = useState<number[]>(Array(9).fill(0));
  const [topMajorName, setTopMajorName] = useState('');
  const [topMajorScoreId, setTopMajorScoreId] = useState<number | null>(null);
  const [planItems, setPlanItems] = useState<MajorWeeklyPlanItem[]>([]);
  const [riskNotes, setRiskNotes] = useState<string[]>([]);
  const [completing, setCompleting] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planGenerateError, setPlanGenerateError] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  useEffect(() => {
    getDiagnosisResults()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setResults(sorted);
        if (sorted.length > 0) setSelectedResultId(sorted[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedResultId || results.length === 0) return;

    const selected = results.find((r) => r.id === selectedResultId);
    if (!selected) return;

    const load = async () => {
      setLoading(true);
      setConfirmingId(null);
      setConfirmingRegenerate(false);
      setGeneratingPlan(false);
      setPlanGenerateError(false);
      try {
        const rawVec = parseVector(selected.competencyVector);
        setCurrentScores(rawVec?.length === 9 ? normalizeScores(rawVec) : Array(9).fill(0));

        const [scoresRes, plansRes] = await Promise.allSettled([
          getResultMajorScores(selected.id),
          getPlansByResult(selected.id),
        ]);

        if (scoresRes.status === 'fulfilled' && scoresRes.value.length > 0) {
          const top = scoresRes.value.reduce((a, b) => (a.rank < b.rank ? a : b));
          setTopMajorScoreId(top.id);
          const major = await getMajor(top.majorId).catch(() => null);
          if (major) {
            setTopMajorName(major.name);
            setTargetScores([
              (major.reqMathLogic ?? 0) / 100,
              (major.reqProblemSolving ?? 0) / 100,
              (major.reqInfoTech ?? 0) / 100,
              (major.reqImplementation ?? 0) / 100,
              (major.reqSystemUnderstanding ?? 0) / 100,
              (major.reqDataAnalysis ?? 0) / 100,
              (major.reqCommunication ?? 0) / 100,
              (major.reqCollaboration ?? 0) / 100,
              (major.reqSelfManagement ?? 0) / 100,
            ]);
          } else {
            setTopMajorName('');
            setTargetScores(Array(9).fill(0));
          }
        } else {
          setTopMajorScoreId(null);
          setTopMajorName('');
          setTargetScores(Array(9).fill(0));
        }

        if (plansRes.status === 'fulfilled' && plansRes.value.length > 0) {
          const succeeded = plansRes.value.filter((p) => p.aiPlanStatus === 'SUCCEEDED');
          const activePlan =
            succeeded.find((p) => p.activeVersion) ??
            succeeded[succeeded.length - 1] ??
            null;
          if (activePlan) {
            const [items, notes] = await Promise.all([
              getPlanItems(activePlan.id).catch(() => []),
              getPlanRiskNotes(activePlan.id).catch(() => []),
            ]);
            setPlanItems(items.sort((a, b) => a.weekNo - b.weekNo));
            setRiskNotes(notes.map((n) => n.note));
          } else {
            setPlanItems([]);
            setRiskNotes([]);
          }
        } else {
          setPlanItems([]);
        }
      } catch { /* silent — partial data is acceptable */ }
      finally { setLoading(false); }
    };

    void load();
  }, [selectedResultId, results]);

  const handleCreatePlan = async () => {
    if (!selectedResultId || !topMajorScoreId || generatingPlan) return;
    setGeneratingPlan(true);
    setPlanGenerateError(false);

    try {
      const plan = await createPlan({
        diagnosisResultId: selectedResultId,
        resultMajorScoreId: topMajorScoreId,
        activeVersion: true,
      });

      if (plan.aiPlanStatus === 'SUCCEEDED') {
        const [items, notes] = await Promise.all([
          getPlanItems(plan.id).catch(() => []),
          getPlanRiskNotes(plan.id).catch(() => []),
        ]);
        setPlanItems(items.sort((a, b) => a.weekNo - b.weekNo));
        setRiskNotes(notes.map((n) => n.note));
      } else {
        setPlanGenerateError(true);
      }
    } catch {
      setPlanGenerateError(true);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleComplete = async (item: MajorWeeklyPlanItem) => {
    if (item.isCompleted || completing !== null) return;
    setCompleting(item.id);
    setConfirmingId(null);
    try {
      await completePlanItem(item.id);
      setPlanItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isCompleted: true } : p))
      );
    } finally {
      setCompleting(null);
    }
  };

  const weakItems = AXES.map((axis, i) => ({
    axis,
    current: Math.round((currentScores[i] ?? 0) * 100),
    target: Math.round((targetScores[i] ?? 0) * 100),
    gap: (targetScores[i] ?? 0) - (currentScores[i] ?? 0),
  }))
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((item, idx) => ({
      rank: idx + 1,
      area: item.axis.label,
      sub: item.axis.sub,
      grade: getGrade(item.current),
      current: item.current,
      target: item.target,
      ...RANK_STYLES[idx],
    }));

  const firstIncompleteIdx = planItems.findIndex((p) => !p.isCompleted);
  const getRoadmapStatus = (idx: number, item: MajorWeeklyPlanItem): string => {
    if (item.isCompleted) return 'done';
    if (idx === firstIncompleteIdx) return 'current';
    return 'locked';
  };

  const completedCount = planItems.filter((p) => p.isCompleted).length;
  const progressPct =
    planItems.length > 0 ? Math.round((completedCount / planItems.length) * 100) : 0;

  const selectedResult = results.find((r) => r.id === selectedResultId) ?? null;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">

        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-[14px]">analytics</span>
              AI 역량 심층 분석
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight leading-tight mb-4">
              취약 역량 심층 분석
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed">
              {topMajorName ? (
                <>
                  목표하신 <span className="font-semibold text-secondary">'{topMajorName}'</span> 전공 대비 보완이
                  필요한 상위 3가지 역량을 AI가 분석했습니다.
                </>
              ) : (
                <>역량 분석 결과를 기반으로 보완이 필요한 상위 3가지 역량을 AI가 분석했습니다.</>
              )}
              <br className="hidden sm:block" />
              주차별 학습 계획을 통해 역량 갭을 메워보세요.
            </p>
          </div>
          {selectedResult && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              {formatDate(selectedResult.createdAt)}
            </div>
          )}
        </header>

        {results.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant shrink-0">진단 회차</span>
            {results.length <= 5 ? (
              <div className="flex gap-2">
                {results.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedResultId(result.id)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      result.id === selectedResultId
                        ? 'bg-primary-container text-white shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{results.length - idx}회차</span>
                    <span className={`text-xs font-normal ${result.id === selectedResultId ? 'text-white/70' : 'text-on-surface-variant/60'}`}>
                      {formatDate(result.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedResultId ?? ''}
                onChange={(e) => setSelectedResultId(Number(e.target.value))}
                className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container outline-none cursor-pointer"
              >
                {results.map((result, idx) => (
                  <option key={result.id} value={result.id}>
                    {results.length - idx}회차 · {formatDate(result.createdAt)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              TOP 3 취약 역량
            </h2>
            {weakItems.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-[14px] p-8 text-center text-on-surface-variant border border-outline-variant/10">
                <span className="material-symbols-outlined text-4xl mb-2 block">sentiment_very_satisfied</span>
                <p className="font-medium">진단 결과가 없거나 모든 역량이 목표치를 충족합니다.</p>
              </div>
            ) : (
              weakItems.map((item) => (
                <div
                  key={item.rank}
                  className={`bg-surface-container-lowest rounded-[14px] p-5 sm:p-6 border ${item.border} shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`text-3xl font-black ${item.color} leading-none`}>
                        #{item.rank}
                      </span>
                      <div>
                        <p className="font-bold text-lg text-primary-container">{item.area}</p>
                        <p className="text-sm text-on-surface-variant mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                    <span className={`text-xl font-black px-3 py-1 rounded-[14px] shrink-0 ${item.badge}`}>
                      {item.grade}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
                      <span>현재 역량</span>
                      <span className={item.color}>{item.current}%</span>
                    </div>
                    <div className="relative w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${item.barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${item.current}%` }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-secondary/70"
                        style={{ left: `${item.target}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>
                        목표까지{' '}
                        <span className="font-bold text-on-surface">+{item.target - item.current}%</span> 필요
                      </span>
                      <span>목표: {item.target}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-surface-container-lowest rounded-[14px] p-5 sm:p-6 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                역량 레이더 분석
              </p>
              <div className="flex justify-center items-center gap-4 mb-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 border-t-2 border-dashed border-secondary-container inline-block" />
                  목표 역량
                </span>
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 bg-error inline-block rounded-full" />
                  현재 역량
                </span>
              </div>
              <div className="w-full aspect-square">
                <RadarChart currentScores={currentScores} targetScores={targetScores} />
              </div>
            </div>

            <div className="bg-primary-container/5 border border-primary-container/10 rounded-[14px] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary text-[20px]">auto_awesome</span>
                <span className="text-base font-bold text-primary-container">AI 학습 인사이트</span>
              </div>
              {weakItems.length > 0 ? (
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary-container">{weakItems[0].area}</span>이(가) 목표 대비{' '}
                  <span className="font-bold text-error">
                    {weakItems[0].target - weakItems[0].current}%p
                  </span>{' '}
                  부족합니다.
                  {weakItems[1] && (
                    <>
                      {' '}
                      <span className="font-bold text-primary-container">{weakItems[1].area}</span> 보완을
                      병행 학습하는 것을 권장합니다.
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  역량 진단 후 인사이트를 확인할 수 있습니다.
                </p>
              )}
              <div className="mt-4 pt-4 border-t border-primary-container/10 flex items-center justify-between text-sm text-on-surface-variant">
                <span>예상 개선 기간</span>
                <span className="font-bold text-secondary">
                  약 {planItems.length > 0 ? planItems.length : 12}주
                </span>
              </div>
            </div>
          </div>
        </div>

        {planItems.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-xl text-primary-container">
                {planItems.length}주 학습 로드맵
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  진행률 <span className="font-bold text-secondary">{progressPct}%</span>
                </span>
                {confirmingRegenerate ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-on-surface-variant">재생성할까요?</span>
                    <button
                      onClick={() => { setConfirmingRegenerate(false); void handleCreatePlan(); }}
                      disabled={generatingPlan}
                      className="text-xs font-bold bg-primary-container text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {generatingPlan ? '생성 중…' : '확인'}
                    </button>
                    <button
                      onClick={() => setConfirmingRegenerate(false)}
                      disabled={generatingPlan}
                      className="text-xs font-bold bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingRegenerate(true)}
                    disabled={generatingPlan}
                    className="flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">refresh</span>
                    재생성
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {planItems.map((item, idx) => {
                const status = getRoadmapStatus(idx, item);
                const isConfirming = confirmingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-[14px] border px-4 py-3.5 flex flex-col gap-3 w-full transition-all ${statusStyle[status]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">
                        {completing === item.id ? 'hourglass_empty' : statusIcon[status]}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs font-bold opacity-60">WEEK {item.weekNo}</p>
                        <p className="text-sm font-semibold mt-0.5 leading-snug">{item.goal}</p>
                      </div>
                      {status === 'current' && !isConfirming && (
                        <button
                          onClick={() => setConfirmingId(item.id)}
                          disabled={completing !== null}
                          className="shrink-0 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          완료
                        </button>
                      )}
                    </div>
                    {isConfirming && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-white/20">
                        <p className="text-xs font-bold opacity-80">이번 주 학습을 완료했나요?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleComplete(item)}
                            disabled={completing !== null}
                            className="flex-1 text-xs font-bold bg-white text-primary-container rounded-lg py-1.5 hover:bg-white/90 transition-colors disabled:opacity-50"
                          >
                            {completing === item.id ? '처리 중…' : '완료하기'}
                          </button>
                          <button
                            onClick={() => setConfirmingId(null)}
                            disabled={completing !== null}
                            className="flex-1 text-xs font-bold bg-white/20 rounded-lg py-1.5 hover:bg-white/30 transition-colors disabled:opacity-50"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {riskNotes.length > 0 && (
              <div className="mt-6 bg-[#FFAB00]/5 border border-[#FFAB00]/20 rounded-[14px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#FFAB00] text-[18px]">warning</span>
                  <span className="text-sm font-bold text-primary-container">학습 주의사항</span>
                </div>
                <ul className="space-y-2">
                  {riskNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FFAB00]/60 shrink-0" />
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-[14px] p-8 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl mb-2 block text-on-surface-variant">
              route
            </span>
            <p className="font-medium text-on-surface-variant mb-2">아직 학습 로드맵이 없습니다.</p>
            {generatingPlan ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-2xl text-secondary">progress_activity</span>
                <p className="text-sm text-secondary font-medium">AI가 맞춤형 로드맵을 생성하고 있어요...</p>
              </div>
            ) : planGenerateError ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-error font-medium">로드맵 생성에 실패했습니다.</p>
                {topMajorScoreId && (
                  <button
                    onClick={handleCreatePlan}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white text-sm font-bold rounded-[12px] hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    다시 시도
                  </button>
                )}
              </div>
            ) : topMajorScoreId ? (
              <button
                onClick={handleCreatePlan}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white text-sm font-bold rounded-[12px] hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                학습 로드맵 생성하기
              </button>
            ) : (
              <p className="text-sm text-on-surface-variant/70 mt-1">
                역량 진단을 완료하면 맞춤형 학습 계획이 생성됩니다.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WeakCapability;
