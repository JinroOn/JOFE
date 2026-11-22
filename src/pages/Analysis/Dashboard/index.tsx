import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { RecommendedMajor, CapabilityRow } from './types';
import type { DiagnosisResult, ResultMajorScore } from '../../../types/results';
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
import { getDisplayRank, getTopRankedScores } from '../../../utils/majorRank';
import {
  COMPETENCY_AXES,
  hasCompleteScores,
  parseCompetencyScores,
  parseMajorRequiredScores,
  scoreText,
} from '../../../utils/competencyScores';

const CP1252_REVERSE_MAP: Record<string, number> = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86,
  '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
  'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95,
  '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

type DisplayUser = {
  nickname?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
} | null;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const fixMojibake = (value?: string | null) => {
  if (!value) return undefined;
  const looksMojibake = /[ÃÂìíêëð]|[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(value);
  if (!looksMojibake) return value;
  try {
    const bytes = Uint8Array.from([...value].map((char) => {
      const mapped = CP1252_REVERSE_MAP[char];
      if (mapped !== undefined) return mapped;
      const code = char.codePointAt(0) ?? 0;
      return code <= 0xff ? code : 0x3f;
    }));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
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
      const reason = fixMojibake(score.recommendationReason);
      return {
        rank: score.rank,
        displayRank: score.displayRank,
        tieCount: score.tieCount,
        majorId: score.majorId,
        name: fixMojibake(major?.name) ?? `전공 ID ${score.majorId}`,
        category: fixMojibake(major?.category),
        difficulty: major?.difficulty ?? undefined,
        careerPaths: fixMojibake(major?.careerPaths),
        suitability: Math.round(clamp(score.finalScore, 0, 100)),
        tendencyScore: score.tendencyScore,
        competencyScore: score.competencyScore,
        failed: score.failed,
        strengths,
        weaknesses,
        description:
          reason || strengths || fixMojibake(major?.description) ||
          `성향 점수 ${Math.round(score.tendencyScore)}점, 역량 점수 ${Math.round(score.competencyScore)}점으로 산출된 추천 결과입니다.`,
      };
    });

const getSafeDisplayName = (user?: DisplayUser) => {
  const nickname = fixMojibake(user?.nickname);
  const name = fixMojibake(user?.name);
  const username = fixMojibake(user?.username);
  const emailName = user?.email?.split('@')[0];
  if (nickname?.trim() && !/^테스트유저\d+$/.test(nickname)) return nickname;
  if (name?.trim()) return name;
  if (username?.trim()) return username;
  if (emailName?.trim()) return emailName;
  return nickname || '사용자';
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as {
      response?: { status?: number; data?: { message?: string } };
    }).response;
    if (response?.data?.message) {
      return fixMojibake(response.data.message) ?? response.data.message;
    }
    if (response?.status) return `${fallback} 상태 코드: ${response.status}`;
  }
  if (error instanceof Error) return fixMojibake(error.message) ?? error.message;
  return fallback;
};

const EmptyScores = ({ hasResult }: { hasResult: boolean }) => (
  <section className="rounded-[14px] bg-surface-container-lowest border border-outline-variant/20 p-8 text-center space-y-4">
    <span className="material-symbols-outlined text-5xl text-on-surface-variant" aria-hidden="true">
      analytics
    </span>
    <h2 className="text-xl font-extrabold text-primary-container">
      {hasResult ? '역량 점수 정보가 없습니다' : '저장된 진단 결과가 없습니다'}
    </h2>
    <p className="text-sm text-on-surface-variant">
      {hasResult
        ? '저장된 결과에 역량 점수 정보가 없어 차트와 순위를 표시하지 않습니다.'
        : '진단을 완료하면 실제 결과에 기반한 역량 점수와 전공 분석을 확인할 수 있습니다.'}
    </p>
    <Link
      to={diagnosisEntryPath}
      className="inline-flex items-center justify-center rounded-[12px] bg-primary-container text-white font-bold px-6 py-3"
    >
      진단 시작하기
    </Link>
  </section>
);

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const requestedResultParam = searchParams.get('resultId');
  const requestedResultId = requestedResultParam === null ? null : Number(requestedResultParam);
  const user = useAuthStore((state) => state.user);
  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [majorScoreSnapshot, setMajorScoreSnapshot] = useState<{
    resultId: number;
    scores: ResultMajorScore[];
  } | null>(null);
  const [isFetchingResults, setIsFetchingResults] = useState(true);
  const [isFetchingMajorScores, setIsFetchingMajorScores] = useState(false);
  const [isGeneratingAiComment, setIsGeneratingAiComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCommentError, setAiCommentError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchDashboardData = async () => {
      try {
        const [resultData, majorData] = await Promise.all([
          getDiagnosisResults(), getMajors(),
        ]);
        if (ignore) return;
        const sorted = [...resultData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setResults(sorted);
        setMajors(majorData);
        if (requestedResultId !== null && !sorted.some((result) => result.id === requestedResultId)) {
          setSelectedResultId(null);
          setError('요청한 진단 결과를 찾을 수 없습니다. 진단 이력에서 다시 확인해주세요.');
        } else {
          setSelectedResultId(requestedResultId ?? sorted[0]?.id ?? null);
        }
      } catch (e) {
        if (!ignore) {
          setError(getApiErrorMessage(e, '진단 결과 또는 전공 목록 조회 중 오류가 발생했습니다.'));
        }
      } finally {
        if (!ignore) setIsFetchingResults(false);
      }
    };
    void fetchDashboardData();
    return () => { ignore = true; };
  }, [requestedResultId]);

  useEffect(() => {
    if (selectedResultId === null) return;
    let ignore = false;
    const fetchMajorScores = async () => {
      try {
        setIsFetchingMajorScores(true);
        const scores = await getResultMajorScores(selectedResultId);
        if (!ignore) setMajorScoreSnapshot({ resultId: selectedResultId, scores });
      } catch (e) {
        if (!ignore) {
          setError(getApiErrorMessage(e, '전공별 점수 조회 중 오류가 발생했습니다.'));
          setMajorScoreSnapshot({ resultId: selectedResultId, scores: [] });
        }
      } finally {
        if (!ignore) setIsFetchingMajorScores(false);
      }
    };
    void fetchMajorScores();
    return () => { ignore = true; };
  }, [selectedResultId]);

  const majorScores = useMemo(
    () => majorScoreSnapshot?.resultId === selectedResultId ? majorScoreSnapshot.scores : [],
    [majorScoreSnapshot, selectedResultId],
  );
  const majorMap = useMemo(() => new Map(majors.map((major) => [major.id, major])), [majors]);
  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedResultId) ?? null,
    [results, selectedResultId],
  );
  const userScores = useMemo(
    () => parseCompetencyScores(selectedResult?.competencyVector),
    [selectedResult?.competencyVector],
  );

  // 공동 1위일 때 저장 순서 첫 전공을 단독 1위로 고르지 않습니다.
  const jointTopScores = useMemo(() => getTopRankedScores(majorScores), [majorScores]);
  const topMajorScore = jointTopScores.length === 1 ? jointTopScores[0] : undefined;

  const topMajor = topMajorScore ? majorMap.get(topMajorScore.majorId) : undefined;
  const requiredScores = useMemo(() => parseMajorRequiredScores(topMajor), [topMajor]);
  const capabilityRows: CapabilityRow[] = useMemo(
    () => COMPETENCY_AXES.map((axis, index) => ({
      axis,
      userScore: userScores?.[index] ?? null,
      majorAvg: requiredScores[index] ?? null,
    })),
    [userScores, requiredScores],
  );
  const recommendedMajors = useMemo(
    () => mapMajorScoresToRecommendedMajors(majorScores, majorMap),
    [majorScores, majorMap],
  );
  const displayName = getSafeDisplayName(user as DisplayUser);

  const handleGenerateAiComment = async () => {
    if (selectedResultId === null) return;
    try {
      setIsGeneratingAiComment(true);
      setAiCommentError(null);
      const updated = await generateAiComment(selectedResultId);
      setResults((previous) => previous.map((result) => result.id === updated.id ? updated : result));
    } catch (e) {
      setAiCommentError(getApiErrorMessage(e, 'AI 추천 설명 생성 중 오류가 발생했습니다.'));
    } finally {
      setIsGeneratingAiComment(false);
    }
  };

  const hasResults = selectedResult !== null;
  const hasScores = userScores !== null;
  const showReport = !isFetchingResults && hasResults && hasScores;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {showReport && (
          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-bold text-xs mb-4">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  AI 인공지능 분석 완료
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-primary-container tracking-tight mb-4 leading-tight">
                  {displayName}님의 <span className="text-secondary">진로 역량 리포트</span>
                </h1>
                <p className="text-on-surface-variant max-w-2xl text-base sm:text-lg leading-relaxed">
                  JinroOn AI가 9가지 핵심 역량 지표를 바탕으로 가장 적합한 전공과 진로 방향을 도출했습니다.
                  <br />
                  본 데이터는 진단 결과와 전공 추천 API 응답을 기반으로 생성되었습니다.
                </p>
              </div>
              <div className="shrink-0">
                <button className="flex items-center gap-2 px-6 py-4 rounded-[14px] bg-[#FFAB00] text-primary-container font-bold shadow-lg shadow-[#FFAB00]/20 hover:-translate-y-0.5 transition-all">
                  <span className="material-symbols-outlined">download</span>
                  리포트 다운로드 (PDF)
                </button>
              </div>
            </div>
          </header>
        )}

        {isFetchingResults && (
          <div role="status" className="mb-6 rounded-[14px] bg-surface-container-lowest border border-outline-variant/20 p-5 font-bold text-on-surface-variant">
            진단 결과와 전공 데이터를 조회하는 중입니다...
          </div>
        )}
        {error && (
          <div role="alert" className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-5 font-bold text-red-600">
            API 호출 오류: {error}
          </div>
        )}
        {!isFetchingResults && !error && !hasResults && <EmptyScores hasResult={false} />}
        {!isFetchingResults && hasResults && !hasScores && (
          <>
            {results.length > 1 && (
              <div className="mb-6 flex items-center gap-3">
                <label htmlFor="missing-score-result" className="text-sm font-bold text-on-surface-variant">
                  다른 진단 회차
                </label>
                <select
                  id="missing-score-result"
                  value={selectedResultId ?? ''}
                  onChange={(e) => {
                    setSelectedResultId(Number(e.target.value));
                    setAiCommentError(null);
                  }}
                  className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container"
                >
                  {results.map((result, idx) => (
                    <option key={result.id} value={result.id}>
                      {results.length - idx}회차 · {new Date(result.createdAt).toLocaleDateString('ko-KR')}
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
                <span className="text-xs font-bold text-on-surface-variant shrink-0">진단 회차</span>
                {results.length <= 5 ? (
                  <div className="flex flex-wrap gap-2">
                    {results.map((result, idx) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => { setSelectedResultId(result.id); setAiCommentError(null); }}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                          result.id === selectedResultId
                            ? 'bg-primary-container text-white shadow-md'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        <span>{results.length - idx}회차</span>
                        <span className={`text-xs font-normal ${result.id === selectedResultId ? 'text-white/70' : 'text-on-surface-variant/60'}`}>
                          {new Date(result.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric', month: '2-digit', day: '2-digit',
                          }).replace(/\. /g, '.').replace(/\.$/, '')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    value={selectedResultId ?? ''}
                    onChange={(e) => { setSelectedResultId(Number(e.target.value)); setAiCommentError(null); }}
                    className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container outline-none cursor-pointer"
                  >
                    {results.map((result, idx) => (
                      <option key={result.id} value={result.id}>
                        {results.length - idx}회차 · {new Date(result.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                        }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </option>
                    ))}
                  </select>
                )}
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <section className="md:col-span-5 bg-surface-container-lowest rounded-[14px] p-6 sm:p-8 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex flex-col items-center">
                <h3 className="w-full text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">analytics</span>
                  9-Axis 역량 다이어그램
                </h3>
                {hasCompleteScores(userScores) ? (
                  <div className="w-full max-w-[480px] aspect-square">
                    <DashboardRadarChart scores={userScores.map((score) => score / 100)} labels={COMPETENCY_AXES} />
                  </div>
                ) : (
                  <p className="w-full text-sm text-on-surface-variant mb-4">
                    일부 역량 값이 없어 레이더 차트와 순위를 표시하지 않습니다. 확인된 점수만 아래에 표시합니다.
                  </p>
                )}
                <div className="mt-6 flex items-center gap-2 mb-5">
                  <span className="w-3 h-3 rounded-full bg-[#00D2FF] shrink-0" />
                  <span className="text-xs font-bold text-on-surface-variant">현재 역량 점수</span>
                </div>
                <div className="w-full">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    {hasCompleteScores(userScores) ? '역량 순위' : '역량 점수 (누락값 -)'}
                  </p>
                  <div className="space-y-2">
                    {(hasCompleteScores(userScores)
                      ? COMPETENCY_AXES.map((axis, i) => ({ axis, score: userScores[i] }))
                          .sort((a, b) => b.score - a.score)
                      : COMPETENCY_AXES.map((axis, i) => ({ axis, score: userScores?.[i] ?? null }))
                    ).map(({ axis, score }, rank) => (
                      <div key={axis} className="flex items-center gap-3 bg-surface-container rounded-[10px] px-4 py-2">
                        {hasCompleteScores(userScores) && (
                          <span className={`text-xs font-black w-4 shrink-0 ${
                            rank === 0 ? 'text-[#FFAB00]' : rank === 1 ? 'text-on-surface-variant'
                              : rank === 2 ? 'text-[#CD7F32]' : 'text-on-surface-variant/40'
                          }`}>{rank + 1}</span>
                        )}
                        <span className="flex-1 text-xs font-semibold text-primary-container">{axis}</span>
                        <span className="text-xs font-black text-secondary">{scoreText(score)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="md:col-span-7 space-y-6">
                <AiCommentBanner
                  comment={fixMojibake(selectedResult?.aiComment)}
                  status={selectedResult?.aiCommentStatus}
                  errorMessage={fixMojibake(selectedResult?.aiCommentErrorMessage) || aiCommentError}
                  isGenerating={isGeneratingAiComment}
                  disabled={selectedResultId === null}
                  onGenerate={handleGenerateAiComment}
                />
                {isFetchingMajorScores ? (
                  <div className="bg-surface-container-lowest p-6 rounded-[14px] shadow-sm text-on-surface-variant font-bold">
                    전공별 점수 데이터를 조회하는 중입니다...
                  </div>
                ) : (
                  <RecommendedMajors majors={recommendedMajors} />
                )}
              </div>

              {jointTopScores.length > 1 ? (
                <section className="md:col-span-12 rounded-[14px] bg-surface-container-lowest p-6 text-sm text-on-surface-variant">
                  공동 1위 전공이 {jointTopScores.length}개입니다. 임의의 한 전공을 선정해 비교하지 않습니다.
                  <Link to="/analysis/weak" className="ml-2 font-bold text-secondary underline">
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

            <ShareSection
              userName={displayName}
              topMajor={jointTopScores.length > 1 && recommendedMajors[0]
                ? {
                    ...recommendedMajors[0],
                    name: `${recommendedMajors[0].name} 외 ${jointTopScores.length - 1}개 전공 (공동 ${getDisplayRank(jointTopScores[0])}위)`,
                    category: '공동 1위 전공',
                  }
                : recommendedMajors[0]}
              shareToken={selectedResult?.shareToken}
            />

            <footer className="mt-8 flex flex-wrap justify-center gap-4">
              <button className="flex items-center gap-2 px-6 py-4 bg-primary-container text-white rounded-[14px] font-bold shadow-sm">
                <span className="material-symbols-outlined">picture_as_pdf</span> 리포트 저장 (PDF)
              </button>
              <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">image</span> 이미지 저장
              </button>
              <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">print</span> 인쇄
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;