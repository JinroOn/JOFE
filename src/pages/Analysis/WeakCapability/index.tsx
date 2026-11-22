import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import RadarChart from './components/RadarChart';

import {
  getDiagnosisResults,
  getResultMajorScores,
} from '../../../api/results';

import { getMajor } from '../../../api/major';

import {
  getPlansByResult,
  getPlanItems,
  getPlanRiskNotes,
  completePlanItem,
  createPlan,
} from '../../../api/plan';

import type { DiagnosisResult } from '../../../types/results';
import type { MajorWeeklyPlanItem } from '../../../types/plan';

const AXES = [
  { label: '수리·논리력', sub: '알고리즘 / 수학적 사고' },
  { label: '문제해결력', sub: '논리적 분석 / 창의적 해결' },
  { label: '정보기술', sub: '프로그래밍 / 기술 이해' },
  { label: '구현력', sub: '코딩 / 설계 실현' },
  { label: '시스템이해', sub: '운영체제 / 컴퓨터구조' },
  { label: '데이터 분석', sub: '통계 / 데이터 시각화' },
  { label: '의사소통', sub: '발표 / 문서화' },
  { label: '협업·윤리', sub: '팀워크 / 직업윤리' },
  { label: '자기관리', sub: '시간관리 / 자기개발' },
];

const RANK_STYLES = [
  {
    color: 'text-error',
    barColor: 'bg-error',
    border: 'border-error/20',
    badge: 'bg-error/10 text-error',
  },
  {
    color: 'text-[#FF6B35]',
    barColor: 'bg-[#FF6B35]',
    border: 'border-[#FF6B35]/20',
    badge: 'bg-[#FF6B35]/10 text-[#FF6B35]',
  },
  {
    color: 'text-[#FFAB00]',
    barColor: 'bg-[#FFAB00]',
    border: 'border-[#FFAB00]/20',
    badge: 'bg-[#FFAB00]/10 text-[#FFAB00]',
  },
];

const statusStyle: Record<string, string> = {
  done:
    'bg-secondary-container/20 border-secondary-container/40 text-secondary',
  current:
    'bg-primary-container text-white border-primary-container shadow-lg',
  locked:
    'bg-surface-container border-outline-variant/20 text-on-surface-variant/50',
};

const statusIcon: Record<string, string> = {
  done: 'check_circle',
  current: 'radio_button_checked',
  locked: 'lock',
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
  'mathLogic',
  'problemSolving',
  'infoTech',
  'implementation',
  'systemUnderstanding',
  'dataAnalysis',
  'communication',
  'collaboration',
  'selfManagement',
] as const;

function parseVector(value: string | null): number[] | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed.map(Number);
    }

    if (parsed !== null && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;

      return COMPETENCY_KEYS.map(
        (key) => Number(record[key] ?? 0),
      );
    }
  } catch {
    // 기존 쉼표 구분 형식도 지원합니다.
  }

  const parts = value.split(',').map(Number);

  return parts.some(Number.isNaN) ? null : parts;
}

function normalizeScores(raw: number[]): number[] {
  const max = Math.max(...raw);

  return raw.map((value) =>
    max > 1 ? value / 100 : value,
  );
}

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
}

// 진단 결과 없음 / API 조회 실패 / 비교 정보 없음 안내
const StatusScreen = ({
  title,
  description,
  icon,
  buttonText,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  buttonText: string;
  onClick: () => void;
}) => (
  <div className="min-h-screen bg-surface pb-24">
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <header className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-4">
          <span
            className="material-symbols-outlined text-[14px]"
            aria-hidden="true"
          >
            analytics
          </span>
          역량 점수 비교
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-primary-container tracking-tight">
          취약 역량 심층 분석
        </h1>
      </header>

      <section
        role="status"
        className="max-w-[760px] mx-auto rounded-[14px] border border-outline-variant/20 bg-surface-container-lowest px-6 py-12 sm:p-14 text-center shadow-sm"
      >
        <span
          className="material-symbols-outlined text-5xl text-secondary mb-5"
          aria-hidden="true"
        >
          {icon}
        </span>

        <h2 className="text-xl sm:text-2xl font-bold text-primary-container mb-4">
          {title}
        </h2>

        <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed break-keep mb-7">
          {description}
        </p>

        <button
          type="button"
          onClick={onClick}
          className="min-h-[44px] rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          {buttonText}
        </button>
      </section>
    </div>
  </div>
);

const WeakCapability = () => {
  const navigate = useNavigate();

  const [results, setResults] =
    useState<DiagnosisResult[]>([]);

  const [selectedResultId, setSelectedResultId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  const [resultsLoadError, setResultsLoadError] =
    useState(false);

  const [resultsVersion, setResultsVersion] =
    useState(0);

  const [comparisonAvailable, setComparisonAvailable] =
    useState(false);

  const [comparisonVersion, setComparisonVersion] =
    useState(0);

  const [currentScores, setCurrentScores] =
    useState<number[]>(Array(9).fill(0));

  const [targetScores, setTargetScores] =
    useState<number[]>(Array(9).fill(0));

  const [topMajorName, setTopMajorName] =
    useState('');

  const [topMajorScoreId, setTopMajorScoreId] =
    useState<number | null>(null);

  const [planItems, setPlanItems] =
    useState<MajorWeeklyPlanItem[]>([]);

  const [riskNotes, setRiskNotes] =
    useState<string[]>([]);

  const [completing, setCompleting] =
    useState<number | null>(null);

  const [confirmingId, setConfirmingId] =
    useState<number | null>(null);

  const [generatingPlan, setGeneratingPlan] =
    useState(false);

  const [planGenerateError, setPlanGenerateError] =
    useState(false);

  const [confirmingRegenerate, setConfirmingRegenerate] =
    useState(false);

  // --------------------------------------------------
  // 기존 진단 결과 목록 조회
  //
  // GET /results는 기존 역량 진단 결과입니다.
  // 탐색 진단 결과는 여기에 포함하지 않습니다.
  //
  // ESLint 수정:
  // useEffect에서 동기적으로 setState를 호출하지 않습니다.
  // --------------------------------------------------

  useEffect(() => {
    let active = true;

    getDiagnosisResults()
      .then((data) => {
        if (!active) return;

        setResultsLoadError(false);

        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );

        setResults(sorted);

        if (sorted.length > 0) {
          setSelectedResultId(sorted[0].id);
        } else {
          setSelectedResultId(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!active) return;

        setResultsLoadError(true);
        setResults([]);
        setSelectedResultId(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resultsVersion]);

  // --------------------------------------------------
  // 선택한 기존 진단 회차의 점수와 계획 조회
  //
  // ESLint 수정:
  // 비동기 요청 전에 상태를 즉시 변경하지 않습니다.
  // 기존 점수는 조회 응답 이후에 갱신합니다.
  // --------------------------------------------------

  useEffect(() => {
    if (
      selectedResultId === null ||
      results.length === 0
    ) {
      return;
    }

    const selected = results.find(
      (result) => result.id === selectedResultId,
    );

    if (!selected) return;

    let active = true;

    const load = async () => {
      try {
        const rawVector = parseVector(
          selected.competencyVector,
        );

        const validVector =
          rawVector !== null &&
          rawVector.length === 9 &&
          rawVector.every(Number.isFinite);

        // 먼저 요청을 실행합니다.
        // Promise가 완료된 뒤 상태를 갱신합니다.
        const [scoresResponse, plansResponse] =
          await Promise.allSettled([
            getResultMajorScores(selected.id),
            getPlansByResult(selected.id),
          ]);

        if (!active) return;

        // 이전 회차의 데이터를 초기화합니다.
        setComparisonAvailable(false);
        setCurrentScores(Array(9).fill(0));
        setTargetScores(Array(9).fill(0));
        setTopMajorName('');
        setTopMajorScoreId(null);

        setPlanItems([]);
        setRiskNotes([]);

        setConfirmingId(null);
        setConfirmingRegenerate(false);
        setGeneratingPlan(false);
        setPlanGenerateError(false);

        // 유효한 역량 점수와 전공별 점수가 있을 때만
        // 실제 비교 기준을 조회합니다.
        if (
          validVector &&
          scoresResponse.status === 'fulfilled' &&
          scoresResponse.value.length > 0
        ) {
          const top = scoresResponse.value.reduce(
            (a, b) => (a.rank < b.rank ? a : b),
          );

          const major = await getMajor(
            top.majorId,
          ).catch(() => null);

          if (!active) return;

          if (major) {
            const requirements = [
              major.reqMathLogic,
              major.reqProblemSolving,
              major.reqInfoTech,
              major.reqImplementation,
              major.reqSystemUnderstanding,
              major.reqDataAnalysis,
              major.reqCommunication,
              major.reqCollaboration,
              major.reqSelfManagement,
            ];

            const hasRequirements =
              requirements.some(
                (value) =>
                  value !== null &&
                  Number.isFinite(value),
              );

            if (hasRequirements) {
              setCurrentScores(
                normalizeScores(rawVector),
              );

              setTargetScores(
                requirements.map(
                  (value) => (value ?? 0) / 100,
                ),
              );

              setTopMajorName(major.name);
              setTopMajorScoreId(top.id);
              setComparisonAvailable(true);
            }
          }
        }

        // 기존 학습 로드맵 및 주의사항 조회
        if (
          plansResponse.status === 'fulfilled' &&
          plansResponse.value.length > 0
        ) {
          const succeeded = plansResponse.value
            .filter(
              (plan) =>
                plan.aiPlanStatus === 'SUCCEEDED',
            )
            .sort((a, b) => a.id - b.id);

          const activePlan =
            succeeded.find(
              (plan) => plan.activeVersion,
            ) ??
            succeeded[succeeded.length - 1] ??
            null;

          if (activePlan) {
            const [items, notes] =
              await Promise.all([
                getPlanItems(activePlan.id).catch(
                  () => [],
                ),
                getPlanRiskNotes(activePlan.id).catch(
                  () => [],
                ),
              ]);

            if (!active) return;

            setPlanItems(
              [...items].sort(
                (a, b) => a.weekNo - b.weekNo,
              ),
            );

            setRiskNotes(
              notes.map((note) => note.note),
            );
          }
        }
      } catch {
        // 데이터 조회 오류를 진단 미완료로
        // 잘못 판단하지 않습니다.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [
    selectedResultId,
    results,
    comparisonVersion,
  ]);

  // --------------------------------------------------
  // 기존 AI 학습 로드맵 생성
  // --------------------------------------------------

  const handleCreatePlan = async () => {
    if (
      !selectedResultId ||
      !topMajorScoreId ||
      generatingPlan
    ) {
      return;
    }

    setGeneratingPlan(true);
    setPlanGenerateError(false);

    try {
      const plan = await createPlan({
        diagnosisResultId: selectedResultId,
        resultMajorScoreId: topMajorScoreId,
        activeVersion: true,
      });

      if (plan.aiPlanStatus === 'SUCCEEDED') {
        const [items, notes] =
          await Promise.all([
            getPlanItems(plan.id).catch(() => []),
            getPlanRiskNotes(plan.id).catch(() => []),
          ]);

        setPlanItems(
          [...items].sort(
            (a, b) => a.weekNo - b.weekNo,
          ),
        );

        setRiskNotes(
          notes.map((note) => note.note),
        );
      } else {
        setPlanGenerateError(true);
      }
    } catch {
      setPlanGenerateError(true);
    } finally {
      setGeneratingPlan(false);
    }
  };

  // --------------------------------------------------
  // 기존 학습 항목 완료 처리
  // --------------------------------------------------

  const handleComplete = async (
    item: MajorWeeklyPlanItem,
  ) => {
    if (
      item.isCompleted ||
      completing !== null
    ) {
      return;
    }

    setCompleting(item.id);
    setConfirmingId(null);

    try {
      await completePlanItem(item.id);

      setPlanItems((previous) =>
        previous.map((planItem) =>
          planItem.id === item.id
            ? {
                ...planItem,
                isCompleted: true,
              }
            : planItem,
        ),
      );
    } finally {
      setCompleting(null);
    }
  };

  // --------------------------------------------------
  // 프론트엔드 점수 차이 계산
  // AI 모델 분석이 아닌 단순 점수 비교입니다.
  // --------------------------------------------------

  const weakItems = AXES.map(
    (axis, index) => ({
      axis,
      current: Math.round(
        (currentScores[index] ?? 0) * 100,
      ),
      target: Math.round(
        (targetScores[index] ?? 0) * 100,
      ),
      gap:
        (targetScores[index] ?? 0) -
        (currentScores[index] ?? 0),
    }),
  )
    .filter((item) => item.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
    .map((item, index) => ({
      rank: index + 1,
      area: item.axis.label,
      sub: item.axis.sub,
      grade: getGrade(item.current),
      current: item.current,
      target: item.target,
      ...RANK_STYLES[index],
    }));

  const firstIncompleteIdx =
    planItems.findIndex(
      (item) => !item.isCompleted,
    );

  const getRoadmapStatus = (
    index: number,
    item: MajorWeeklyPlanItem,
  ): string => {
    if (item.isCompleted) {
      return 'done';
    }

    if (index === firstIncompleteIdx) {
      return 'current';
    }

    return 'locked';
  };

  const completedCount =
    planItems.filter(
      (item) => item.isCompleted,
    ).length;

  const progressPct =
    planItems.length > 0
      ? Math.round(
          (completedCount / planItems.length) * 100,
        )
      : 0;

  const selectedResult =
    results.find(
      (result) =>
        result.id === selectedResultId,
    ) ?? null;

  // --------------------------------------------------
  // 로딩
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div
          role="status"
          className="flex flex-col items-center gap-3 text-on-surface-variant"
        >
          <span
            className="material-symbols-outlined animate-spin text-4xl"
            aria-hidden="true"
          >
            progress_activity
          </span>

          <p className="text-sm">
            역량 진단 결과를 확인하고 있어요…
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // 기존 진단 결과 조회 실패
  // --------------------------------------------------

  if (resultsLoadError) {
    return (
      <StatusScreen
        icon="error_outline"
        title="기존 진단 결과를 불러오지 못했어요"
        description="일시적으로 결과를 확인할 수 없습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요."
        buttonText="다시 확인하기"
        onClick={() => {
          // 수정: 사용자 클릭 시 로딩 상태 설정
          setLoading(true);
          setResultsVersion(
            (previous) => previous + 1,
          );
        }}
      />
    );
  }

  // --------------------------------------------------
  // 기존 진단 미완료
  // 탐색 진단만 완료한 계정도 해당합니다.
  // --------------------------------------------------

  if (results.length === 0) {
    return (
      <StatusScreen
        icon="assignment"
        title="기존 진단을 완료하면 볼 수 있어요"
        description="취약 역량 심층 분석은 기존 진단의 역량 점수를 바탕으로 제공됩니다. 전공 탐색 진단은 이 화면에서 사용하는 역량 점수를 생성하지 않습니다."
        buttonText="기존 진단 시작하기"
        onClick={() => navigate('/diagnosis')}
      />
    );
  }

  // --------------------------------------------------
  // 결과는 있으나 비교 자료가 없는 경우
  // --------------------------------------------------

  if (
    !comparisonAvailable ||
    !topMajorName
  ) {
    return (
      <StatusScreen
        icon="info"
        title="역량 비교 정보를 확인할 수 없어요"
        description="기존 진단 결과는 있지만 역량 점수 또는 1위 전공의 비교 기준을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요."
        buttonText="비교 정보 다시 확인하기"
        onClick={() => {
          // 수정: 사용자 클릭 시 로딩 상태 설정
          setLoading(true);
          setComparisonVersion(
            (previous) => previous + 1,
          );
        }}
      />
    );
  }

  // --------------------------------------------------
  // 정상적인 기존 진단 결과 화면
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">

        {/* 상단 제목 및 설명 */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-4">
              <span
                className="material-symbols-outlined text-[14px]"
                aria-hidden="true"
              >
                analytics
              </span>

              역량 점수 비교
            </span>

            <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight leading-tight mb-4">
              취약 역량 심층 분석
            </h1>

            <p className="text-on-surface-variant text-base sm:text-lg leading-relaxed">
              기존 진단에서 1위로 나온{' '}
              <span className="font-semibold text-secondary">
                '{topMajorName}'
              </span>
              의 요구 역량과 진단 점수를 비교했습니다.
              <br className="hidden sm:block" />

              {weakItems.length > 0
                ? ` 비교 기준보다 낮은 역량 ${weakItems.length}개를 먼저 확인해보세요.`
                : ' 모든 역량이 해당 전공의 비교 기준을 충족하고 있습니다.'}
            </p>
          </div>

          {selectedResult && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant shrink-0">
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                schedule
              </span>

              {formatDate(selectedResult.createdAt)}
            </div>
          )}
        </header>

        {/* 기존 진단 회차 선택 */}
        {results.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant shrink-0">
              진단 회차
            </span>

            {results.length <= 5 ? (
              <div className="flex flex-wrap gap-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setSelectedResultId(result.id);
                    }}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      result.id === selectedResultId
                        ? 'bg-primary-container text-white shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>
                      {results.length - index}회차
                    </span>

                    <span
                      className={`text-xs font-normal ${
                        result.id === selectedResultId
                          ? 'text-white/70'
                          : 'text-on-surface-variant/60'
                      }`}
                    >
                      {formatDate(result.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedResultId ?? ''}
                onChange={(event) => {
                  setLoading(true);
                  setSelectedResultId(
                    Number(event.target.value),
                  );
                }}
                aria-label="진단 회차 선택"
                className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container outline-none cursor-pointer"
              >
                {results.map((result, index) => (
                  <option
                    key={result.id}
                    value={result.id}
                  >
                    {results.length - index}회차 ·{' '}
                    {formatDate(result.createdAt)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* 역량 비교 및 레이더 차트 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              {weakItems.length > 0
                ? `비교 기준 미달 역량 ${weakItems.length}개`
                : '역량 비교 결과'}
            </h2>

            {weakItems.length === 0 ? (
              <div
                role="status"
                className="bg-surface-container-lowest rounded-[14px] p-8 text-center text-on-surface-variant border border-outline-variant/10"
              >
                <span
                  className="material-symbols-outlined text-4xl mb-2 block text-secondary"
                  aria-hidden="true"
                >
                  check_circle
                </span>

                <p className="font-bold text-primary-container mb-2">
                  모든 역량이 비교 기준을 충족합니다
                </p>

                <p className="text-sm leading-relaxed">
                  현재 기존 진단 점수가 1위 전공의
                  요구 역량 이상으로 나타났습니다.
                  이 비교는 진단 점수를 바탕으로 한
                  참고 정보입니다.
                </p>
              </div>
            ) : (
              weakItems.map((item) => (
                <div
                  key={item.rank}
                  className={`bg-surface-container-lowest rounded-[14px] p-5 sm:p-6 border ${item.border} shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-3xl font-black ${item.color} leading-none`}
                      >
                        #{item.rank}
                      </span>

                      <div>
                        <p className="font-bold text-lg text-primary-container">
                          {item.area}
                        </p>

                        <p className="text-sm text-on-surface-variant mt-0.5">
                          {item.sub}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-xl font-black px-3 py-1 rounded-[14px] shrink-0 ${item.badge}`}
                    >
                      {item.grade}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium text-on-surface-variant">
                      <span>현재 역량</span>
                      <span className={item.color}>
                        {item.current}%
                      </span>
                    </div>

                    <div className="relative w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${item.barColor} rounded-full transition-all duration-700`}
                        style={{
                          width: `${item.current}%`,
                        }}
                      />

                      <div
                        className="absolute top-0 h-full w-0.5 bg-secondary/70"
                        style={{
                          left: `${item.target}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>
                        기준까지{' '}
                        <span className="font-bold text-on-surface">
                          +{item.target - item.current}%p
                        </span>
                      </span>

                      <span>
                        비교 기준: {item.target}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 레이더 차트와 점수 비교 안내 */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-surface-container-lowest rounded-[14px] p-5 sm:p-6 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex-1">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                역량 점수 비교 차트
              </p>

              <div className="flex justify-center items-center gap-4 mb-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 border-t-2 border-dashed border-secondary-container inline-block" />
                  1위 전공 요구값
                </span>

                <span className="flex items-center gap-1.5 text-on-surface-variant">
                  <span className="w-5 h-0.5 bg-error inline-block rounded-full" />
                  현재 역량
                </span>
              </div>

              <div className="w-full aspect-square">
                <RadarChart
                  currentScores={currentScores}
                  targetScores={targetScores}
                />
              </div>
            </div>

            {/* AI 인사이트가 아닌 점수 비교 안내 */}
            <div className="bg-primary-container/5 border border-primary-container/10 rounded-[14px] p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="material-symbols-outlined text-secondary text-[20px]"
                  aria-hidden="true"
                >
                  bar_chart
                </span>

                <span className="text-base font-bold text-primary-container">
                  점수 비교 안내
                </span>
              </div>

              {weakItems.length > 0 ? (
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary-container">
                    {weakItems[0].area}
                  </span>
                  의 현재 점수가 비교 기준보다{' '}
                  <span className="font-bold text-error">
                    {weakItems[0].target -
                      weakItems[0].current}
                    %p
                  </span>{' '}
                  낮게 나타났습니다.

                  {weakItems[1] && (
                    <>
                      {' '}
                      <span className="font-bold text-primary-container">
                        {weakItems[1].area}
                      </span>
                      도 함께 비교해보세요.
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  현재 점수가 모든 비교 기준을
                  충족하고 있습니다. 이 안내는
                  진단 점수를 비교한 결과이며,
                  AI가 별도로 분석한 내용은 아닙니다.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-primary-container/10 flex items-center justify-between text-sm text-on-surface-variant">
                <span>학습 로드맵</span>

                <span className="font-bold text-secondary">
                  {planItems.length > 0
                    ? `${planItems.length}주`
                    : '아직 생성되지 않음'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 기존 학습 로드맵 유지 */}
        {planItems.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-5 gap-3">
              <h2 className="font-black text-xl text-primary-container">
                {planItems.length}주 학습 로드맵
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                  진행률{' '}
                  <span className="font-bold text-secondary">
                    {progressPct}%
                  </span>
                </span>

                {confirmingRegenerate ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-on-surface-variant">
                      재생성할까요?
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingRegenerate(false);
                        void handleCreatePlan();
                      }}
                      disabled={generatingPlan}
                      className="text-xs font-bold bg-primary-container text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {generatingPlan
                        ? '생성 중…'
                        : '확인'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmingRegenerate(false)
                      }
                      disabled={generatingPlan}
                      className="text-xs font-bold bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-lg hover:bg-surface-container-high transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmingRegenerate(true)
                    }
                    disabled={generatingPlan}
                    className="flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      refresh
                    </span>
                    재생성
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {planItems.map((item, index) => {
                const status =
                  getRoadmapStatus(index, item);

                const isConfirming =
                  confirmingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-[14px] border px-4 py-3.5 flex flex-col gap-3 w-full transition-all ${statusStyle[status]}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-[20px] mt-0.5 shrink-0">
                        {completing === item.id
                          ? 'hourglass_empty'
                          : statusIcon[status]}
                      </span>

                      <div className="flex-1">
                        <p className="text-xs font-bold opacity-60">
                          WEEK {item.weekNo}
                        </p>

                        <p className="text-sm font-semibold mt-0.5 leading-snug">
                          {item.goal}
                        </p>
                      </div>

                      {status === 'current' &&
                        !isConfirming && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmingId(item.id)
                          }
                          disabled={completing !== null}
                          className="shrink-0 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg px-2.5 py-1 transition-colors"
                        >
                          완료
                        </button>
                      )}
                    </div>

                    {isConfirming && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-white/20">
                        <p className="text-xs font-bold opacity-80">
                          이번 주 학습을 완료했나요?
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void handleComplete(item)
                            }
                            disabled={completing !== null}
                            className="flex-1 text-xs font-bold bg-white text-primary-container rounded-lg py-1.5 hover:bg-white/90 transition-colors disabled:opacity-50"
                          >
                            {completing === item.id
                              ? '처리 중…'
                              : '완료하기'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmingId(null)
                            }
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

            {/* 기존 로드맵 주의사항 */}
            {riskNotes.length > 0 && (
              <div className="mt-6 bg-[#FFAB00]/5 border border-[#FFAB00]/20 rounded-[14px] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#FFAB00] text-[18px]">
                    warning
                  </span>

                  <span className="text-sm font-bold text-primary-container">
                    학습 주의사항
                  </span>
                </div>

                <ul className="space-y-2">
                  {riskNotes.map((note, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-on-surface-variant"
                    >
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
            <span
              className="material-symbols-outlined text-4xl mb-2 block text-on-surface-variant"
              aria-hidden="true"
            >
              route
            </span>

            <p className="font-medium text-on-surface-variant mb-2">
              아직 학습 로드맵이 없습니다.
            </p>

            {generatingPlan ? (
              <div className="mt-4 flex flex-col items-center gap-2">
                <span
                  className="material-symbols-outlined animate-spin text-2xl text-secondary"
                  aria-hidden="true"
                >
                  progress_activity
                </span>

                <p className="text-sm text-secondary font-medium">
                  AI가 맞춤형 로드맵을 생성하고 있어요...
                </p>
              </div>
            ) : planGenerateError ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-error font-medium">
                  로드맵 생성에 실패했습니다.
                </p>

                {topMajorScoreId && (
                  <button
                    type="button"
                    onClick={() =>
                      void handleCreatePlan()
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white text-sm font-bold rounded-[12px] hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                    다시 시도
                  </button>
                )}
              </div>
            ) : topMajorScoreId ? (
              <button
                type="button"
                onClick={() =>
                  void handleCreatePlan()
                }
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container text-white text-sm font-bold rounded-[12px] hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                학습 로드맵 생성하기
              </button>
            ) : (
              <p className="text-sm text-on-surface-variant/70 mt-1">
                역량 진단을 완료하면 학습 계획을
                만들 수 있습니다.
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WeakCapability;