import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import type {
  SharedDiagnosisResult,
  SharedResultMajorScore,
} from '../../../types/results';
import type { Major } from '../../../types/major';
import type {
  RecommendedMajor,
  CapabilityRow,
} from '../Dashboard/types';
import {
  getSharedDiagnosisResult,
  getSharedResultMajorScores,
} from '../../../api/results';
import { getMajors } from '../../../api/major';
import DashboardRadarChart from '../Dashboard/components/DashboardRadarChart';
import AiCommentBanner from '../Dashboard/components/AiCommentBanner';
import RecommendedMajors from '../Dashboard/components/RecommendedMajors';
import CapabilityBarChart from '../Dashboard/components/CapabilityBarChart';
import { diagnosisEntryPath } from '../../../config/features';
import { getTopRankedScores } from '../../../utils/majorRank';
import {
  COMPETENCY_AXES,
  hasCompleteScores,
  parseCompetencyScores,
  parseMajorRequiredScores,
  scoreText,
} from '../../../utils/competencyScores';

// 잘못된 공유 링크와 일시적인 조회 실패를 구분합니다.
// Axios 오류 메시지는 화면에 직접 표시하지 않습니다.
type SharedResultError =
  | 'LINK_UNAVAILABLE'
  | 'LOAD_FAILED'
  | null;

const fixMojibake = (
  value?: string | null,
): string | undefined => value ?? undefined;

const clamp = (
  value: number,
  min: number,
  max: number,
) => Math.min(Math.max(value, min), max);

const mapMajorScoresToRecommendedMajors = (
  scores: SharedResultMajorScore[],
  majorMap: Map<number, Major>,
): RecommendedMajor[] =>
  [...scores]
    .sort((a, b) => a.rank - b.rank)
    .map((score) => {
      const major = majorMap.get(score.majorId);
      const strengths = fixMojibake(score.strengths);
      const weaknesses = fixMojibake(score.weaknesses);
      const recommendationReason = fixMojibake(
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
          recommendationReason ||
          strengths ||
          fixMojibake(major?.description) ||
          `성향 점수 ${Math.round(score.tendencyScore)}점, 역량 점수 ${Math.round(score.competencyScore)}점으로 산출된 추천 결과입니다.`,
      };
    });

// HTTP 404/410은 존재하지 않거나 더 이상 볼 수 없는 링크입니다.
// 그 외 오류는 일시적인 서버·네트워크 문제일 수 있습니다.
const classifySharedResultError = (
  error: unknown,
): Exclude<SharedResultError, null> => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 404 || status === 410) {
      return 'LINK_UNAVAILABLE';
    }
  }

  return 'LOAD_FAILED';
};

const SharedResult = () => {
  const { token } = useParams<{ token: string }>();

  const [result, setResult] = useState<
    SharedDiagnosisResult | null
  >(null);

  const [majors, setMajors] = useState<Major[]>([]);
  const [majorScores, setMajorScores] = useState<
    SharedResultMajorScore[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<SharedResultError>(null);

  // 서버·네트워크 오류가 발생했을 때 동일한 공유 링크를 재조회합니다.
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    const fetchData = async () => {
      try {
        const sharedResult =
          await getSharedDiagnosisResult(token);

        if (ignore) return;

        setResult(sharedResult);

        // 부가 데이터의 실패로 정상적인 공유 결과까지
        // 볼 수 없게 만들지 않습니다.
        const [majorList] = await Promise.all([
          getMajors().catch(() => [] as Major[]),

          getSharedResultMajorScores(token)
            .then((scores) => {
              if (!ignore) {
                setMajorScores(scores);
              }
            })
            .catch(() => undefined),
        ]);

        if (!ignore) {
          setMajors(majorList);
          setError(null);
        }
      } catch (caught) {
        if (!ignore) {
          setResult(null);
          setError(classifySharedResultError(caught));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      ignore = true;
    };
  }, [token, retryVersion]);

  const retry = () => {
    setResult(null);
    setMajors([]);
    setMajorScores([]);
    setError(null);
    setLoading(true);
    setRetryVersion((previous) => previous + 1);
  };

  const majorMap = useMemo(
    () =>
      new Map(
        majors.map((major) => [major.id, major]),
      ),
    [majors],
  );

  const userScores = useMemo(
    () => parseCompetencyScores(result?.competencyVector),
    [result?.competencyVector],
  );

  const jointTopScores = useMemo(() => getTopRankedScores(majorScores), [majorScores]);
  const topMajorScore = jointTopScores.length === 1 ? jointTopScores[0] : undefined;

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

  // 토큰이 없는 경우 무한 로딩하지 않고 안내 화면을 표시합니다.
  if (!token || error || (!loading && !result)) {
    const unavailable =
      !token ||
      error === 'LINK_UNAVAILABLE' ||
      (!error && !result);

    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4 py-12">
        <span
          className="material-symbols-outlined text-5xl text-on-surface-variant"
          aria-hidden="true"
        >
          {unavailable ? 'link_off' : 'error_outline'}
        </span>

        <h1 className="text-on-surface font-bold text-xl text-center">
          {unavailable
            ? '볼 수 없는 링크예요'
            : '공유 결과를 불러오지 못했어요'}
        </h1>

        <p className="max-w-md text-sm text-on-surface-variant text-center leading-relaxed">
          {unavailable
            ? '공유 링크가 올바르지 않거나 더 이상 사용할 수 없어요. 링크를 다시 확인하거나 공유한 사람에게 새 링크를 요청해 주세요.'
            : '일시적인 서버 또는 네트워크 문제일 수 있어요. 연결 상태를 확인한 뒤 다시 시도해 주세요.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {/* 서버 오류일 때만 재조회 버튼 표시 */}
          {!unavailable && (
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-[44px] items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                aria-hidden="true"
              >
                refresh
              </span>
              다시 시도
            </button>
          )}

          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-2 px-6 py-3 bg-surface-container-low text-primary-container rounded-[14px] font-bold hover:bg-surface-container transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p
          role="status"
          className="text-on-surface-variant font-bold"
        >
          결과를 불러오는 중...
        </p>
      </div>
    );
  }

  // 위 분기에서 결과 없음이 처리됩니다.
  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <header className="mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-bold text-xs mb-4">
            <span className="w-2 h-2 rounded-full bg-secondary" />
            공유된 진단 결과
          </span>

          <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight mb-4 leading-tight">
            {result.ownerNickname}님의 진로 역량 리포트
          </h1>

          <p className="text-on-surface-variant max-w-2xl text-base sm:text-lg leading-relaxed">
            JinroOn AI가 9가지 핵심 역량 지표를 바탕으로
            분석한 진로 역량 리포트입니다.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {userScores ? (
            <section className="md:col-span-5 bg-surface-container-lowest rounded-[14px] p-6 sm:p-8 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex flex-col items-center">
              <h3 className="w-full text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  analytics
                </span>
                9-Axis 역량 다이어그램
              </h3>

              {hasCompleteScores(userScores) ? (
                <div className="w-full max-w-[480px] aspect-square">
                  <DashboardRadarChart
                    scores={userScores.map(
                      (score) => score / 100,
                    )}
                    labels={COMPETENCY_AXES}
                  />
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant mb-4">
                  일부 역량 값이 누락되어 레이더 차트는
                  표시하지 않습니다.
                  확인된 점수만 표시합니다.
                </p>
              )}

              <div className="w-full mt-5">
                <p className="text-xs font-bold text-on-surface-variant mb-3">
                  현재 역량 점수
                </p>

                <div className="space-y-2">
                  {COMPETENCY_AXES.map((axis, index) => (
                    <div
                      key={axis}
                      className="flex justify-between bg-surface-container rounded-[10px] px-4 py-2 text-xs"
                    >
                      <span className="font-semibold text-primary-container">
                        {axis}
                      </span>

                      <span className="font-black text-secondary">
                        {scoreText(userScores[index] ?? null)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section className="md:col-span-5 bg-surface-container-lowest rounded-[14px] p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg sm:text-xl font-bold mb-4">
                역량 점수 정보가 없습니다
              </h3>

              <p className="text-sm text-on-surface-variant">
                공유된 결과에 역량 점수 정보가 없어
                차트를 표시하지 않습니다.
              </p>
            </section>
          )}

          <div className="md:col-span-7 space-y-6">
            <AiCommentBanner
              comment={result.aiComment ?? undefined}
              status={result.aiCommentStatus}
            />

            {recommendedMajors.length > 0 ? (
              <RecommendedMajors majors={recommendedMajors} />
            ) : (
              <p className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
                공유된 결과에 전공별 점수 정보가 없습니다.
              </p>
            )}
          </div>

          {userScores && jointTopScores.length === 1 && (
            <CapabilityBarChart
              rows={capabilityRows}
              targetMajorName={topMajor?.name}
              className="md:col-span-12"
            />
          )}

          {jointTopScores.length > 1 && (
            <section className="md:col-span-12 rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant">
              이 결과에는 공동 1위 전공이 {jointTopScores.length}개 있습니다.
              공유 화면에서는 어느 한 전공의 상대 비중을 대표 기준으로 표시하지 않습니다.
            </section>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            to={diagnosisEntryPath}
            className="inline-flex items-center gap-2 px-6 py-4 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow"
          >
            <span className="material-symbols-outlined">
              psychology
            </span>
            나도 진단해보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedResult;