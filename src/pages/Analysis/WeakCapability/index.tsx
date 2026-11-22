import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getDiagnosisResults,
  getResultMajorScores,
} from '../../../api/results';
import { getMajors } from '../../../api/major';
import {
  getPlansByResult,
  getPlanItems,
  getPlanRiskNotes,
  completePlanItem,
  createPlan,
} from '../../../api/plan';

import type {
  DiagnosisResult,
  ResultMajorScore,
} from '../../../types/results';
import type { Major } from '../../../types/major';
import type {
  MajorWeeklyPlan,
  MajorWeeklyPlanItem,
} from '../../../types/plan';

import {
  COMPETENCY_AXES,
  parseCompetencyScores,
  parseMajorRequiredScores,
  scoreText,
} from '../../../utils/competencyScores';

import {
  getRankLabel,
  getTopRankedScores,
} from '../../../utils/majorRank';

type ResultListState = 'LOADING' | 'READY' | 'ERROR';

interface ResultSnapshot {
  resultId: number;
  revision: number;
  scores: ResultMajorScore[];
  majors: Major[];
  plans: MajorWeeklyPlan[];
  loadError: boolean;
}

interface PlanDetailSnapshot {
  planId: number;
  items: MajorWeeklyPlanItem[];
  riskNotes: string[];
}

// JOBE #163에서 사용하는 weaknessFocus 코드와 표시 이름.
// 쉼표로 구분된 최대 2개를 사용합니다.
const WEAKNESS_LABELS: Record<string, string> = {
  mathLogicalScore: '수리·논리',
  problemSolvingScore: '문제 해결',
  infoTechUtilizationScore: '정보기술 활용',
  softwareImplementationScore: '구현력',
  systemUnderstandingScore: '시스템 이해',
  dataAnalysisScore: '자료 분석',
  communicationScore: '의사소통',
  collaborationScore: '협업',
  selfManagementScore: '자기관리',
};

const parseWeaknessFocus = (
  value: string | null | undefined,
): string[] => {
  if (!value?.trim()) return [];

  const codes = value
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);

  const names = codes
    .map((code) => WEAKNESS_LABELS[code])
    .filter((name): name is string => Boolean(name));

  return [...new Set(names)].slice(0, 2);
};

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR');

const StatusScreen = ({
  title,
  description,
  buttonText,
  onClick,
}: {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) => (
  <main className="min-h-screen bg-surface px-4 py-12">
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-black text-primary-container">
        취약 역량 심층 분석
      </h1>

      <section className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-8 text-center shadow-sm sm:p-12">
        <span
          className="material-symbols-outlined mb-4 text-5xl text-secondary"
          aria-hidden="true"
        >
          info
        </span>

        <h2 className="mb-3 text-xl font-bold text-primary-container">
          {title}
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
          {description}
        </p>

        <button
          type="button"
          onClick={onClick}
          className="min-h-[44px] rounded-xl bg-primary-container px-6 py-3 font-bold text-white"
        >
          {buttonText}
        </button>
      </section>
    </div>
  </main>
);

const LoadingScreen = () => (
  <div
    className="flex min-h-[60vh] items-center justify-center bg-surface"
    role="status"
  >
    <div className="flex items-center gap-3 text-sm text-on-surface-variant">
      <span
        className="material-symbols-outlined animate-spin"
        aria-hidden="true"
      >
        progress_activity
      </span>

      기존 진단 결과를 확인하고 있어요…
    </div>
  </div>
);

const WeakCapability = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [resultsState, setResultsState] =
    useState<ResultListState>('LOADING');
  const [resultsRevision, setResultsRevision] = useState(0);

  const [chosenResultId, setChosenResultId] =
    useState<number | null>(null);

  const [revision, setRevision] = useState(0);
  const [snapshot, setSnapshot] =
    useState<ResultSnapshot | null>(null);

  const [choice, setChoice] = useState<{
    resultId: number;
    scoreId: number;
  } | null>(null);

  const [planDetail, setPlanDetail] =
    useState<PlanDetailSnapshot | null>(null);

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);
  const [confirmingItemId, setConfirmingItemId] =
    useState<number | null>(null);
  const [completingItemId, setCompletingItemId] =
    useState<number | null>(null);

  // 기존 역량 진단 결과만 조회합니다.
  // 탐색 진단은 이 화면의 점수 대상이 아닙니다.
  useEffect(() => {
    let active = true;

    getDiagnosisResults()
      .then((items) => {
        if (!active) return;

        setResults(
          [...items].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          ),
        );

        setResultsState('READY');
      })
      .catch(() => {
        if (active) {
          setResultsState('ERROR');
        }
      });

    return () => {
      active = false;
    };
  }, [resultsRevision]);

  const selectedResultId = results.some(
    (item) => item.id === chosenResultId,
  )
    ? chosenResultId
    : results[0]?.id ?? null;

  const selectedResult =
    results.find((item) => item.id === selectedResultId) ?? null;

  // 신규: 백엔드가 저장한 보완 역량만 표시합니다.
  // 종합평 생성 여부와 관계없이 결과 API의 값을 사용합니다.
  const weaknessNames = useMemo(
    () => parseWeaknessFocus(selectedResult?.weaknessFocus),
    [selectedResult?.weaknessFocus],
  );

  useEffect(() => {
    if (selectedResultId === null) return;

    let active = true;

    const load = async () => {
      try {
        const [scores, majors, plans] = await Promise.all([
          getResultMajorScores(selectedResultId),
          getMajors().catch(() => [] as Major[]),
          getPlansByResult(selectedResultId).catch(
            () => [] as MajorWeeklyPlan[],
          ),
        ]);

        if (!active) return;

        setSnapshot({
          resultId: selectedResultId,
          revision,
          scores,
          majors,
          plans,
          loadError: false,
        });
      } catch {
        if (active) {
          setSnapshot({
            resultId: selectedResultId,
            revision,
            scores: [],
            majors: [],
            plans: [],
            loadError: true,
          });
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [selectedResultId, revision]);

  const data =
    snapshot?.resultId === selectedResultId &&
    snapshot.revision === revision
      ? snapshot
      : null;

  const sortedScores = useMemo(
    () => [...(data?.scores ?? [])].sort((a, b) => a.rank - b.rank),
    [data],
  );

  const leaders = useMemo(
    () => getTopRankedScores(sortedScores),
    [sortedScores],
  );

  const majorMap = useMemo(
    () =>
      new Map(
        (data?.majors ?? []).map((major) => [major.id, major]),
      ),
    [data],
  );

  // 단독 1위는 자동 선택합니다.
  // 공동 1위에서는 사용자가 전공을 직접 선택합니다.
  const chosenScore =
    leaders.length === 1
      ? leaders[0]
      : leaders.find(
          (score) =>
            choice?.resultId === selectedResultId &&
            choice.scoreId === score.id,
        ) ?? null;

  const selectedMajor = chosenScore
    ? majorMap.get(chosenScore.majorId)
    : undefined;

  const chosenName = chosenScore
    ? selectedMajor?.name ?? `전공 ID ${chosenScore.majorId}`
    : '';

  const studentScores = useMemo(
    () => parseCompetencyScores(selectedResult?.competencyVector),
    [selectedResult?.competencyVector],
  );

  const weights = useMemo(
    () => parseMajorRequiredScores(selectedMajor),
    [selectedMajor],
  );

  // 선택한 전공 점수 행 ID와 연결된 계획만 사용합니다.
  const activePlan = useMemo(() => {
    if (!chosenScore || !data) return null;

    const ownPlans = data.plans
      .filter(
        (plan) =>
          plan.resultMajorScoreId === chosenScore.id &&
          plan.aiPlanStatus === 'SUCCEEDED',
      )
      .sort((a, b) => b.id - a.id);

    return (
      ownPlans.find((plan) => plan.activeVersion) ??
      ownPlans[0] ??
      null
    );
  }, [chosenScore, data]);

  const activePlanId = activePlan?.id ?? null;

  useEffect(() => {
    if (activePlanId === null) return;

    let active = true;

    Promise.all([
      getPlanItems(activePlanId),
      getPlanRiskNotes(activePlanId),
    ])
      .then(([items, notes]) => {
        if (!active) return;

        setPlanDetail({
          planId: activePlanId,
          items: [...items].sort((a, b) => a.weekNo - b.weekNo),
          riskNotes: notes.map((note) => note.note),
        });
      })
      .catch(() => {
        if (active) {
          setPlanDetail({
            planId: activePlanId,
            items: [],
            riskNotes: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, [activePlanId]);

  const visiblePlanDetail =
    activePlan && planDetail?.planId === activePlan.id
      ? planDetail
      : null;

  const planItems = visiblePlanDetail?.items ?? [];
  const riskNotes = visiblePlanDetail?.riskNotes ?? [];

  const completedCount = planItems.filter(
    (item) => item.isCompleted,
  ).length;

  const progress =
    planItems.length > 0
      ? Math.round((completedCount / planItems.length) * 100)
      : 0;

  const firstIncomplete = planItems.findIndex(
    (item) => !item.isCompleted,
  );

  const chooseMajor = (score: ResultMajorScore) => {
    if (generatingPlan || selectedResultId === null) return;

    setChoice({
      resultId: selectedResultId,
      scoreId: score.id,
    });

    setRegenerateConfirm(false);
    setConfirmingItemId(null);
    setPlanError(false);
  };

  const selectResult = (resultId: number) => {
    if (generatingPlan) return;

    setChosenResultId(resultId);
    setChoice(null);
    setRegenerateConfirm(false);
    setPlanError(false);
  };

  const createSelectedPlan = async () => {
    if (
      selectedResultId === null ||
      !chosenScore ||
      generatingPlan
    ) {
      return;
    }

    setGeneratingPlan(true);
    setPlanError(false);

    try {
      const plan = await createPlan({
        diagnosisResultId: selectedResultId,
        resultMajorScoreId: chosenScore.id,
        activeVersion: true,
      });

      if (plan.aiPlanStatus === 'SUCCEEDED') {
        // 선택한 전공은 유지하고 계획 목록만 새로 조회합니다.
        setRevision((value) => value + 1);
      } else {
        setPlanError(true);
      }
    } catch {
      setPlanError(true);
    } finally {
      setGeneratingPlan(false);
      setRegenerateConfirm(false);
    }
  };

  const completeSelectedItem = async (
    item: MajorWeeklyPlanItem,
  ) => {
    if (item.isCompleted || completingItemId !== null) return;

    setCompletingItemId(item.id);

    try {
      await completePlanItem(item.id);

      setPlanDetail((previous) =>
        previous && previous.planId === activePlan?.id
          ? {
              ...previous,
              items: previous.items.map((row) =>
                row.id === item.id
                  ? { ...row, isCompleted: true }
                  : row,
              ),
            }
          : previous,
      );

      setConfirmingItemId(null);
    } catch {
      // 실패한 경우 완료 표시를 변경하지 않습니다.
    } finally {
      setCompletingItemId(null);
    }
  };

  if (resultsState === 'LOADING') {
    return <LoadingScreen />;
  }

  if (resultsState === 'ERROR') {
    return (
      <StatusScreen
        title="기존 진단 결과를 불러오지 못했어요"
        description="일시적인 조회 문제일 수 있습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요."
        buttonText="다시 불러오기"
        onClick={() => {
          setResultsState('LOADING');
          setResultsRevision((value) => value + 1);
        }}
      />
    );
  }

  if (results.length === 0 || selectedResultId === null) {
    return (
      <StatusScreen
        title="기존 진단을 완료하면 볼 수 있어요"
        description="탐색 진단은 이 화면에서 사용하는 역량 점수를 생성하지 않습니다. 먼저 기존 전공 진단을 완료해 주세요."
        buttonText="기존 진단 시작하기"
        onClick={() => navigate('/diagnosis')}
      />
    );
  }

  if (!data) {
    return <LoadingScreen />;
  }

  if (data.loadError) {
    return (
      <StatusScreen
        title="전공별 점수 정보를 불러오지 못했어요"
        description="진단 결과는 있지만 전공별 점수 조회에 실패했습니다."
        buttonText="점수 다시 확인하기"
        onClick={() => setRevision((value) => value + 1)}
      />
    );
  }

  if (sortedScores.length === 0) {
    return (
      <StatusScreen
        title="전공별 점수 정보가 없습니다"
        description="기존 진단 결과는 있으나 연결된 전공별 점수가 없어 순위와 계획을 표시하지 않습니다."
        buttonText="결과 리포트로 이동"
        onClick={() => navigate('/analysis/dashboard')}
      />
    );
  }

  return (
    <main className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-[1280px] space-y-8 px-4 pt-10 sm:px-8">
        <header>
          <span className="mb-3 inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            기존 진단 · 역량 점수 참고 정보
          </span>

          <h1 className="mb-3 text-3xl font-black text-primary-container sm:text-4xl">
            취약 역량 심층 분석
          </h1>

          {/* 수정: 개발 진행 문구 대신 실제 서비스 안내 */}
          <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant sm:text-base">
            기존 진단에서 상대적으로 낮게 나타난 역량을
            살펴보고, 추천 전공의 역량별 중요도를 참고할
            수 있습니다. 학생 점수와 전공별 상대 가중치는
            서로 다른 기준이므로 직접 비교하여 목표
            미달 여부를 판단하지 않습니다.
          </p>

          {selectedResult && (
            <p className="mt-2 text-xs text-on-surface-variant">
              선택한 진단: {formatDate(selectedResult.createdAt)}
            </p>
          )}
        </header>

        {results.length > 1 && (
          <section
            aria-label="진단 회차 선택"
            className="flex flex-wrap items-center gap-3"
          >
            <label
              htmlFor="weak-result-select"
              className="text-sm font-semibold text-on-surface-variant"
            >
              진단 회차
            </label>

            <select
              id="weak-result-select"
              value={selectedResultId}
              disabled={generatingPlan}
              onChange={(event) =>
                selectResult(Number(event.target.value))
              }
              className="min-h-[44px] rounded-lg border border-outline-variant/30 bg-white px-3 text-sm font-bold text-primary-container"
            >
              {results.map((result, index) => (
                <option key={result.id} value={result.id}>
                  {results.length - index}회차 ·{' '}
                  {formatDate(result.createdAt)}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* 신규: 종합평과 동일한 weaknessFocus를 표시 */}
        {weaknessNames.length > 0 && (
          <section
            aria-labelledby="weakness-focus-title"
            className="rounded-2xl border border-secondary/20 bg-secondary/5 p-5 sm:p-7"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="material-symbols-outlined text-secondary"
                aria-hidden="true"
              >
                fact_check
              </span>

              <h2
                id="weakness-focus-title"
                className="text-xl font-bold text-primary-container"
              >
                우선 살펴볼 역량
              </h2>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {weaknessNames.map((name) => (
                <span
                  key={name}
                  className="rounded-lg border border-secondary/20 bg-white px-4 py-2 text-sm font-bold text-primary-container"
                >
                  {name}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-on-surface-variant">
              현재 응답에서 우선 살펴볼 역량은{' '}
              <strong className="text-primary-container">
                {weaknessNames.join(', ')}
              </strong>
              입니다. 이 안내는 전공의 합격이나
              적합 여부를 뜻하지 않습니다.
            </p>
          </section>
        )}

        {/* 기존 공동 순위 선택 기능 유지 */}
        <section className="rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="mb-3 text-xl font-bold text-primary-container">
            최상위 추천 전공
          </h2>

          {leaders.length > 1 ? (
            <>
              <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">
                최상위 순위는 {getRankLabel(leaders[0])}이며,
                해당 전공이 {leaders.length}개 있습니다.
                저장 순서로 전공을 자동 선택하지 않습니다.
                내용을 살펴볼 전공을 직접 선택해 주세요.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {leaders.map((score) => (
                  <button
                    key={score.id}
                    type="button"
                    aria-pressed={chosenScore?.id === score.id}
                    disabled={generatingPlan}
                    onClick={() => chooseMajor(score)}
                    className={`min-h-[70px] rounded-xl border p-4 text-left transition-colors disabled:opacity-50 ${
                      chosenScore?.id === score.id
                        ? 'border-secondary bg-secondary/10 text-primary-container'
                        : 'border-outline-variant/30 bg-surface-container-lowest hover:border-secondary/60'
                    }`}
                  >
                    <span className="mb-1 block text-xs font-bold text-secondary">
                      {getRankLabel(score)}
                    </span>

                    <span className="font-bold text-primary-container">
                      {majorMap.get(score.majorId)?.name ??
                        `전공 ID ${score.majorId}`}
                    </span>

                    <span className="mt-1 block text-xs text-on-surface-variant">
                      최종 {score.finalScore.toFixed(1)}점
                    </span>
                  </button>
                ))}
              </div>

              {!chosenScore && (
                <p
                  role="status"
                  className="mt-4 font-bold text-secondary"
                >
                  비교 정보를 확인할 전공을 선택해 주세요.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed text-on-surface-variant">
              기존 진단에서 {getRankLabel(leaders[0])}로 나온
              전공은
              <strong className="ml-1 text-primary-container">
                {majorMap.get(leaders[0].majorId)?.name ??
                  `전공 ID ${leaders[0].majorId}`}
              </strong>
              입니다.
            </p>
          )}
        </section>

        {chosenScore && (
          <>
            <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-7">
              <h2 className="mb-3 text-xl font-bold text-primary-container">
                {chosenName} · 역량 관련 정보
              </h2>

              <p className="mb-5 text-sm leading-relaxed text-on-surface-variant">
                학생 역량은 0~100점으로 표시되며,
                전공별 수치는 전공 내 역량의 상대적인
                중요도입니다. 서로 다른 기준이므로
                점수 차이나 목표 달성률을 계산하지 않습니다.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {COMPETENCY_AXES.map((axis, index) => (
                  <div
                    key={axis}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4"
                  >
                    <h3 className="mb-3 text-sm font-bold text-primary-container">
                      {axis}
                    </h3>

                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">
                        학생 역량
                      </span>

                      <strong className="text-secondary">
                        {scoreText(studentScores?.[index] ?? null)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">
                        전공 내 상대 가중치
                      </span>

                      <strong className="text-primary-container">
                        {weights[index] === null
                          ? '미제공'
                          : weights[index]?.toFixed(1)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* 수정: 백엔드 논의·개발 진행 문구 제거 */}
              <div
                role="note"
                className="mt-5 rounded-xl bg-secondary/10 p-4 text-sm leading-relaxed text-on-surface-variant"
              >
                전공별 상대 가중치는 해당 전공에서 중요하게
                다루는 역량을 참고하기 위한 정보입니다.
                학생의 점수와 직접 비교하여 역량이
                부족하다고 판단하는 기준은 아닙니다.
              </div>
            </section>

            {/* 기존 학습 로드맵 기능 유지 */}
            <section className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-primary-container">
                    {chosenName} · 학습 로드맵
                  </h2>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    계획 생성 대상은 현재 선택한 전공입니다.
                  </p>
                </div>

                {activePlan && visiblePlanDetail && (
                  <span className="rounded-full bg-surface-container px-3 py-1 text-sm font-bold text-secondary">
                    진행률 {progress}%
                  </span>
                )}
              </div>

              {activePlan && !visiblePlanDetail ? (
                <p
                  role="status"
                  className="py-10 text-center text-sm text-on-surface-variant"
                >
                  선택한 전공의 학습 계획을 불러오는 중이에요…
                </p>
              ) : activePlan && visiblePlanDetail ? (
                <>
                  <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
                    {regenerateConfirm ? (
                      <>
                        <span className="text-sm text-on-surface-variant">
                          이 전공의 계획을 재생성할까요?
                        </span>

                        <button
                          type="button"
                          disabled={generatingPlan}
                          onClick={() => void createSelectedPlan()}
                          className="min-h-[44px] rounded-lg bg-primary-container px-4 font-bold text-white disabled:opacity-50"
                        >
                          {generatingPlan ? '생성 중…' : '확인'}
                        </button>

                        <button
                          type="button"
                          disabled={generatingPlan}
                          onClick={() => setRegenerateConfirm(false)}
                          className="min-h-[44px] rounded-lg bg-surface-container px-4 font-semibold"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRegenerateConfirm(true)}
                        className="min-h-[44px] rounded-lg bg-surface-container px-4 text-sm font-bold text-secondary"
                      >
                        로드맵 재생성
                      </button>
                    )}
                  </div>

                  {planItems.length === 0 && (
                    <p className="py-5 text-center text-sm text-on-surface-variant">
                      로드맵의 주간 항목을 확인할 수 없어요.
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {planItems.map((item, index) => {
                      const status = item.isCompleted
                        ? '완료'
                        : index === firstIncomplete
                          ? '진행 가능'
                          : '대기';

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-secondary">
                              WEEK {item.weekNo}
                            </span>

                            <span className="text-xs text-on-surface-variant">
                              {status}
                            </span>
                          </div>

                          <p className="mb-3 text-sm font-semibold text-primary-container">
                            {item.goal}
                          </p>

                          {!item.isCompleted &&
                            index === firstIncomplete &&
                            (confirmingItemId === item.id ? (
                              <div className="space-y-2">
                                <p className="text-xs text-on-surface-variant">
                                  이 학습을 완료했나요?
                                </p>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={completingItemId !== null}
                                    onClick={() =>
                                      void completeSelectedItem(item)
                                    }
                                    className="min-h-[44px] flex-1 rounded-lg bg-primary-container px-3 text-xs font-bold text-white disabled:opacity-50"
                                  >
                                    {completingItemId === item.id
                                      ? '처리 중…'
                                      : '완료하기'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={completingItemId !== null}
                                    onClick={() =>
                                      setConfirmingItemId(null)
                                    }
                                    className="min-h-[44px] flex-1 rounded-lg border border-outline-variant/30 px-3 text-xs font-bold"
                                  >
                                    취소
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmingItemId(item.id)
                                }
                                className="min-h-[44px] rounded-lg bg-secondary px-4 text-xs font-bold text-white"
                              >
                                완료
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </div>

                  {riskNotes.length > 0 && (
                    <div className="mt-5 rounded-xl border border-[#FFAB00]/20 bg-[#FFAB00]/5 p-4">
                      <h3 className="mb-3 font-bold text-primary-container">
                        학습 주의사항
                      </h3>

                      <ul className="list-disc space-y-2 pl-5 text-sm text-on-surface-variant">
                        {riskNotes.map((note, index) => (
                          <li key={`${index}-${note}`}>
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-surface-container-low p-6 text-center">
                  <p className="mb-4 text-sm text-on-surface-variant">
                    {chosenName}의 학습 로드맵이 아직 없습니다.
                  </p>

                  <button
                    type="button"
                    onClick={() => void createSelectedPlan()}
                    disabled={generatingPlan}
                    className="min-h-[44px] rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {generatingPlan
                      ? 'AI 로드맵 생성 중…'
                      : '학습 로드맵 생성하기'}
                  </button>
                </div>
              )}

              {planError && (
                <p
                  role="alert"
                  className="mt-4 text-sm font-semibold text-error"
                >
                  계획을 생성하지 못했습니다.
                  잠시 후 다시 시도해 주세요.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default WeakCapability;