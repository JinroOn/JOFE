import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import type {
  RecommendedMajor,
  CapabilityRow,
} from './types';

import type {
  DiagnosisResult,
  ResultMajorScore,
} from '../../../types/results';

import type { Major } from '../../../types/major';

import {
  generateAiComment,
  getDiagnosisResults,
  getResultMajorScores,
} from '../../../api/results';

import { getMajors } from '../../../api/major';
import useAuthStore from '../../../store/useAuthStore';

import DashboardRadarChart from './components/DashboardRadarChart';
import AiCommentBanner from './components/AiCommentBanner';
import RecommendedMajors from './components/RecommendedMajors';
import CapabilityBarChart from './components/CapabilityBarChart';
import ShareSection from './components/ShareSection';

import { diagnosisEntryPath } from '../../../config/features';

import {
  getDisplayRank,
  getTopRankedScores,
} from '../../../utils/majorRank';

import {
  COMPETENCY_AXES,
  hasCompleteScores,
  parseCompetencyScores,
  parseMajorRequiredScores,
  scoreText,
} from '../../../utils/competencyScores';

const CP1252_REVERSE_MAP: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  'ƒ': 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  'ˆ': 0x88,
  '‰': 0x89,
  'Š': 0x8a,
  '‹': 0x8b,
  'Œ': 0x8c,
  'Ž': 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  'š': 0x9a,
  '›': 0x9b,
  'œ': 0x9c,
  'ž': 0x9e,
  'Ÿ': 0x9f,
};

type DisplayUser = {
  nickname?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
} | null;

const clamp = (
  value: number,
  min: number,
  max: number,
) => Math.min(Math.max(value, min), max);

const fixMojibake = (value?: string | null) => {
  if (!value) return undefined;

  const looksMojibake =
    /[ÃÂìíêëð]|[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(
      value,
    );

  if (!looksMojibake) return value;

  try {
    const bytes = Uint8Array.from(
      [...value].map((char) => {
        const mapped = CP1252_REVERSE_MAP[char];

        if (mapped !== undefined) {
          return mapped;
        }

        const code = char.codePointAt(0) ?? 0;

        return code <= 0xff ? code : 0x3f;
      }),
    );

    const decoded = new TextDecoder('utf-8', {
      fatal: false,
    }).decode(bytes);

    return decoded.includes('�') ? value : decoded;
  } catch {
    return value;
  }
};

const mapMajorScoresToRecommendedMajors = (
  scores: ResultMajorScore[],
  majorMap: Map<number, Major>,
): RecommendedMajor[] =>
  [...scores]
    .sort((a, b) => a.rank - b.rank)
    .map((score) => {
      const major = majorMap.get(score.majorId);
      const strengths = fixMojibake(score.strengths);
      const weaknesses = fixMojibake(score.weaknesses);
      const reason = fixMojibake(
        score.recommendationReason,
      );

      return {
        rank: score.rank,
        displayRank: score.displayRank,
        tieCount: score.tieCount,
        majorId: score.majorId,

        name:
          fixMojibake(major?.name) ??
          `전공 ID ${score.majorId}`,

        category: fixMojibake(major?.category),
        difficulty: major?.difficulty ?? undefined,
        careerPaths: fixMojibake(major?.careerPaths),

        suitability: Math.round(
          clamp(score.finalScore, 0, 100),
        ),

        tendencyScore: score.tendencyScore,
        competencyScore: score.competencyScore,
        failed: score.failed,
        strengths,
        weaknesses,

        description:
          reason ||
          strengths ||
          fixMojibake(major?.description) ||
          `성향 점수 ${Math.round(score.tendencyScore)}점, 역량 점수 ${Math.round(score.competencyScore)}점으로 산출된 추천 결과입니다.`,
      };
    });

const getSafeDisplayName = (
  user?: DisplayUser,
) => {
  const nickname = fixMojibake(user?.nickname);
  const name = fixMojibake(user?.name);
  const username = fixMojibake(user?.username);
  const emailName = user?.email?.split('@')[0];

  if (
    nickname?.trim() &&
    !/^테스트유저\d+$/.test(nickname)
  ) {
    return nickname;
  }

  if (name?.trim()) return name;
  if (username?.trim()) return username;
  if (emailName?.trim()) return emailName;

  return nickname || '사용자';
};

const getApiErrorMessage = (
  error: unknown,
  fallback: string,
) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
      }
    ).response;

    if (response?.data?.message) {
      return (
        fixMojibake(response.data.message) ??
        response.data.message
      );
    }

    if (response?.status) {
      return `${fallback} 상태 코드: ${response.status}`;
    }
  }

  if (error instanceof Error) {
    return fixMojibake(error.message) ?? error.message;
  }

  return fallback;
};

const EmptyScores = ({
  hasResult,
}: {
  hasResult: boolean;
}) => (
  <section className="space-y-4 rounded-[14px] border border-outline-variant/20 bg-surface-container-lowest p-8 text-center">
    <span
      className="material-symbols-outlined text-5xl text-on-surface-variant"
      aria-hidden="true"
    >
      analytics
    </span>

    <h2 className="text-xl font-extrabold text-primary-container">
      {hasResult
        ? '역량 점수 정보가 없습니다'
        : '저장된 진단 결과가 없습니다'}
    </h2>

    <p className="text-sm text-on-surface-variant">
      {hasResult
        ? '저장된 결과에 역량 점수 정보가 없어 차트와 순위를 표시하지 않습니다.'
        : '진단을 완료하면 실제 결과에 기반한 역량 점수와 전공 분석을 확인할 수 있습니다.'}
    </p>

    <Link
      to={diagnosisEntryPath}
      className="inline-flex items-center justify-center rounded-[12px] bg-primary-container px-6 py-3 font-bold text-white"
    >
      진단 시작하기
    </Link>
  </section>
);

const Dashboard = () => {
  const [searchParams] = useSearchParams();

  const requestedResultParam =
    searchParams.get('resultId');

  const requestedResultId =
    requestedResultParam === null
      ? null
      : Number(requestedResultParam);

  const user = useAuthStore((state) => state.user);

  const [results, setResults] =
    useState<DiagnosisResult[]>([]);

  const [majors, setMajors] =
    useState<Major[]>([]);

  const [selectedResultId, setSelectedResultId] =
    useState<number | null>(null);

  const [majorScoreSnapshot, setMajorScoreSnapshot] =
    useState<{
      resultId: number;
      scores: ResultMajorScore[];
    } | null>(null);

  const [isFetchingResults, setIsFetchingResults] =
    useState(true);

  const [
    isFetchingMajorScores,
    setIsFetchingMajorScores,
  ] = useState(false);

  const [
    isGeneratingAiComment,
    setIsGeneratingAiComment,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [aiCommentError, setAiCommentError] =
    useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchDashboardData = async () => {
      try {
        const [resultData, majorData] = await Promise.all([
          getDiagnosisResults(),
          getMajors(),
        ]);

        if (ignore) return;

        const sorted = [...resultData].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );

        setResults(sorted);
        setMajors(majorData);

        if (
          requestedResultId !== null &&
          !sorted.some(
            (result) => result.id === requestedResultId,
          )
        ) {
          setSelectedResultId(null);
          setError(
            '요청한 진단 결과를 찾을 수 없습니다. 진단 이력에서 다시 확인해주세요.',
          );
        } else {
          setSelectedResultId(
            requestedResultId ?? sorted[0]?.id ?? null,
          );
        }
      } catch (caught) {
        if (!ignore) {
          setError(
            getApiErrorMessage(
              caught,
              '진단 결과 또는 전공 목록 조회 중 오류가 발생했습니다.',
            ),
          );
        }
      } finally {
        if (!ignore) {
          setIsFetchingResults(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      ignore = true;
    };
  }, [requestedResultId]);

  useEffect(() => {
    if (selectedResultId === null) return;

    let ignore = false;

    const fetchMajorScores = async () => {
      try {
        setIsFetchingMajorScores(true);

        const scores = await getResultMajorScores(
          selectedResultId,
        );

        if (!ignore) {
          setMajorScoreSnapshot({
            resultId: selectedResultId,
            scores,
          });
        }
      } catch (caught) {
        if (!ignore) {
          setError(
            getApiErrorMessage(
              caught,
              '전공별 점수 조회 중 오류가 발생했습니다.',
            ),
          );

          setMajorScoreSnapshot({
            resultId: selectedResultId,
            scores: [],
          });
        }
      } finally {
        if (!ignore) {
          setIsFetchingMajorScores(false);
        }
      }
    };

    void fetchMajorScores();

    return () => {
      ignore = true;
    };
  }, [selectedResultId]);

  const majorScores = useMemo(
    () =>
      majorScoreSnapshot?.resultId === selectedResultId
        ? majorScoreSnapshot.scores
        : [],
    [majorScoreSnapshot, selectedResultId],
  );

  const majorMap = useMemo(
    () =>
      new Map(
        majors.map((major) => [major.id, major]),
      ),
    [majors],
  );

  const selectedResult = useMemo(
    () =>
      results.find(
        (result) => result.id === selectedResultId,
      ) ?? null,
    [results, selectedResultId],
  );

  const userScores = useMemo(
    () =>
      parseCompetencyScores(
        selectedResult?.competencyVector,
      ),
    [selectedResult?.competencyVector],
  );

  // 기존 공동 순위 처리를 유지합니다.
  const jointTopScores = useMemo(
    () => getTopRankedScores(majorScores),
    [majorScores],
  );

  const topMajorScore =
    jointTopScores.length === 1
      ? jointTopScores[0]
      : undefined;

  const topMajor = topMajorScore
    ? majorMap.get(topMajorScore.majorId)
    : undefined;

  const requiredScores = useMemo(
    () => parseMajorRequiredScores(topMajor),
    [topMajor],
  );

  const capabilityRows: CapabilityRow[] = useMemo(
    () =>
      COMPETENCY_AXES.map((axis, index) => ({
        axis,
        userScore: userScores?.[index] ?? null,
        majorAvg: requiredScores[index] ?? null,
      })),
    [userScores, requiredScores],
  );

  const recommendedMajors = useMemo(
    () =>
      mapMajorScoresToRecommendedMajors(
        majorScores,
        majorMap,
      ),
    [majorScores, majorMap],
  );

  const displayName = getSafeDisplayName(
    user as DisplayUser,
  );

  // 실제 AI 종합평 생성은 기존대로 유지합니다.
  const handleGenerateAiComment = async () => {
    if (selectedResultId === null) return;

    try {
      setIsGeneratingAiComment(true);
      setAiCommentError(null);

      const updated = await generateAiComment(
        selectedResultId,
      );

      setResults((previous) =>
        previous.map((result) =>
          result.id === updated.id ? updated : result,
        ),
      );
    } catch (caught) {
      setAiCommentError(
        getApiErrorMessage(
          caught,
          'AI 추천 설명 생성 중 오류가 발생했습니다.',
        ),
      );
    } finally {
      setIsGeneratingAiComment(false);
    }
  };

  const hasResults = selectedResult !== null;
  const hasScores = userScores !== null;

  const showReport =
    !isFetchingResults && hasResults && hasScores;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-[1280px] px-4 pt-12 sm:px-6 lg:px-8">
        {showReport && (
          <header className="mb-12">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                {/* 수정: AI 생성 여부와 관계없이 진단 결과로 표시 */}
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container/20 px-3 py-1 text-xs font-bold text-secondary">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  진단 결과
                </span>

                <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-primary-container md:text-5xl">
                  {displayName}님의{' '}
                  <span className="text-secondary">
                    진로 역량 리포트
                  </span>
                </h1>

                {/* 수정: 점수로 산출된 추천을 AI 생성으로 표현하지 않음 */}
                <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  9가지 역량과 성향 점수를 바탕으로
                  먼저 살펴볼 전공을 정리했습니다.
                  <br />
                  이 결과는 진단 응답과 전공 추천
                  점수에 기반한 참고 자료입니다.
                </p>
              </div>

              {/* 동작하지 않는 PDF 다운로드 버튼 제거 */}
            </div>
          </header>
        )}

        {isFetchingResults && (
          <div
            role="status"
            className="mb-6 rounded-[14px] border border-outline-variant/20 bg-surface-container-lowest p-5 font-bold text-on-surface-variant"
          >
            진단 결과와 전공 데이터를 조회하는 중입니다...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-5 font-bold text-red-600"
          >
            API 호출 오류: {error}
          </div>
        )}

        {!isFetchingResults &&
          !error &&
          !hasResults && (
            <EmptyScores hasResult={false} />
          )}

        {!isFetchingResults &&
          hasResults &&
          !hasScores && (
            <>
              {results.length > 1 && (
                <div className="mb-6 flex items-center gap-3">
                  <label
                    htmlFor="missing-score-result"
                    className="text-sm font-bold text-on-surface-variant"
                  >
                    다른 진단 회차
                  </label>

                  <select
                    id="missing-score-result"
                    value={selectedResultId ?? ''}
                    onChange={(event) => {
                      setSelectedResultId(
                        Number(event.target.value),
                      );

                      setAiCommentError(null);
                    }}
                    className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container"
                  >
                    {results.map((result, index) => (
                      <option
                        key={result.id}
                        value={result.id}
                      >
                        {results.length - index}회차 ·{' '}
                        {new Date(
                          result.createdAt,
                        ).toLocaleDateString('ko-KR')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <EmptyScores hasResult />
            </>
          )}

        {showReport && (
          <>
            {results.length > 1 && (
              <section className="mb-8 flex items-center gap-3">
                <span className="shrink-0 text-xs font-bold text-on-surface-variant">
                  진단 회차
                </span>

                {results.length <= 5 ? (
                  <div className="flex flex-wrap gap-2">
                    {results.map((result, index) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => {
                          setSelectedResultId(result.id);
                          setAiCommentError(null);
                        }}
                        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all ${
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
                          {new Date(
                            result.createdAt,
                          )
                            .toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                            .replace(/\. /g, '.')
                            .replace(/\.$/, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={selectedResultId ?? ''}
                    onChange={(event) => {
                      setSelectedResultId(
                        Number(event.target.value),
                      );

                      setAiCommentError(null);
                    }}
                    className="cursor-pointer rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container outline-none"
                  >
                    {results.map((result, index) => (
                      <option
                        key={result.id}
                        value={result.id}
                      >
                        {results.length - index}회차 ·{' '}
                        {new Date(
                          result.createdAt,
                        )
                          .toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                          })
                          .replace(/\. /g, '.')
                          .replace(/\.$/, '')}
                      </option>
                    ))}
                  </select>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <section className="flex flex-col items-center rounded-[14px] bg-surface-container-lowest p-6 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] sm:p-8 md:col-span-5">
                <h3 className="mb-6 flex w-full items-center gap-2 text-lg font-bold sm:text-xl">
                  <span className="material-symbols-outlined text-secondary">
                    analytics
                  </span>
                  9-Axis 역량 다이어그램
                </h3>

                {hasCompleteScores(userScores) ? (
                  <div className="aspect-square w-full max-w-[480px]">
                    <DashboardRadarChart
                      scores={userScores.map(
                        (score) => score / 100,
                      )}
                      labels={COMPETENCY_AXES}
                    />
                  </div>
                ) : (
                  <p className="mb-4 w-full text-sm text-on-surface-variant">
                    일부 역량 값이 없어 레이더 차트와
                    순위를 표시하지 않습니다.
                    확인된 점수만 아래에 표시합니다.
                  </p>
                )}

                <div className="mb-5 mt-6 flex items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-full bg-[#00D2FF]" />
                  <span className="text-xs font-bold text-on-surface-variant">
                    현재 역량 점수
                  </span>
                </div>

                <div className="w-full">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {hasCompleteScores(userScores)
                      ? '역량 순위'
                      : '역량 점수 (누락값 -)'}
                  </p>

                  <div className="space-y-2">
                    {(hasCompleteScores(userScores)
                      ? COMPETENCY_AXES.map((axis, index) => ({
                          axis,
                          score: userScores[index],
                        })).sort((a, b) => b.score - a.score)
                      : COMPETENCY_AXES.map((axis, index) => ({
                          axis,
                          score: userScores?.[index] ?? null,
                        }))
                    ).map(({ axis, score }, rank) => (
                      <div
                        key={axis}
                        className="flex items-center gap-3 rounded-[10px] bg-surface-container px-4 py-2"
                      >
                        {hasCompleteScores(userScores) && (
                          <span
                            className={`w-4 shrink-0 text-xs font-black ${
                              rank === 0
                                ? 'text-[#FFAB00]'
                                : rank === 1
                                  ? 'text-on-surface-variant'
                                  : rank === 2
                                    ? 'text-[#CD7F32]'
                                    : 'text-on-surface-variant/40'
                            }`}
                          >
                            {rank + 1}
                          </span>
                        )}

                        <span className="flex-1 text-xs font-semibold text-primary-container">
                          {axis}
                        </span>

                        <span className="text-xs font-black text-secondary">
                          {scoreText(score)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="space-y-6 md:col-span-7">
                {/* 실제 AI 종합평 영역은 기존대로 유지 */}
                <AiCommentBanner
                  comment={fixMojibake(
                    selectedResult?.aiComment,
                  )}
                  status={selectedResult?.aiCommentStatus}
                  errorMessage={
                    fixMojibake(
                      selectedResult?.aiCommentErrorMessage,
                    ) || aiCommentError
                  }
                  isGenerating={isGeneratingAiComment}
                  disabled={selectedResultId === null}
                  onGenerate={handleGenerateAiComment}
                />

                {isFetchingMajorScores ? (
                  <div className="rounded-[14px] bg-surface-container-lowest p-6 font-bold text-on-surface-variant shadow-sm">
                    전공별 점수 데이터를 조회하는 중입니다...
                  </div>
                ) : (
                  <RecommendedMajors
                    majors={recommendedMajors}
                  />
                )}
              </div>

              {/* 공동 1위는 기존처럼 특정 한 전공의 값을
                  임의의 대표 기준으로 표시하지 않습니다. */}
              {jointTopScores.length > 1 ? (
                <section className="rounded-[14px] bg-surface-container-lowest p-6 text-sm text-on-surface-variant md:col-span-12">
                  공동 1위 전공이 {jointTopScores.length}개입니다.
                  임의의 한 전공을 선정해 비교하지 않습니다.

                  <Link
                    to="/analysis/weak"
                    className="ml-2 font-bold text-secondary underline"
                  >
                    전공 선택 후 역량 정보 보기
                  </Link>
                </section>
              ) : (
                <CapabilityBarChart
                  rows={capabilityRows}
                  targetMajorName={fixMojibake(topMajor?.name)}
                  className="md:col-span-12"
                />
              )}
            </div>

            {/* 공유 카드와 링크 복사는 유지 */}
            <ShareSection
              userName={displayName}
              topMajor={
                jointTopScores.length > 1 &&
                recommendedMajors[0]
                  ? {
                      ...recommendedMajors[0],
                      name: `${recommendedMajors[0].name} 외 ${
                        jointTopScores.length - 1
                      }개 전공 (공동 ${getDisplayRank(
                        jointTopScores[0],
                      )}위)`,
                      category: '공동 1위 전공',
                    }
                  : recommendedMajors[0]
              }
              shareToken={selectedResult?.shareToken}
            />

            {/* 수정: 기능이 없는 PDF·이미지·인쇄 버튼 제거 */}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;