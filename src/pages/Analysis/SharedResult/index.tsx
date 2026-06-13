import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { DiagnosisResult, ResultMajorScore } from '../../../types/results';
import type { Major } from '../../../types/major';
import type { RecommendedMajor, CapabilityRow } from '../Dashboard/types';
import { getSharedDiagnosisResult, getResultMajorScores } from '../../../api/results';
import { getMajors } from '../../../api/major';
import DashboardRadarChart from '../Dashboard/components/DashboardRadarChart';
import AiCommentBanner from '../Dashboard/components/AiCommentBanner';
import RecommendedMajors from '../Dashboard/components/RecommendedMajors';
import CapabilityBarChart from '../Dashboard/components/CapabilityBarChart';

const AXES = [
  '수리·논리', '문제해결', '정보기술', '구현력', '시스템이해',
  '데이터분석', '의사소통', '협업·윤리', '자기관리',
];

const COMPETENCY_KEYS = [
  'mathLogic', 'problemSolving', 'infoTech', 'implementation', 'systemUnderstanding',
  'dataAnalysis', 'communication', 'collaboration', 'selfManagement',
] as const;

const MAJOR_REQUIRED_KEYS = [
  'reqMathLogic', 'reqProblemSolving', 'reqInfoTech', 'reqImplementation', 'reqSystemUnderstanding',
  'reqDataAnalysis', 'reqCommunication', 'reqCollaboration', 'reqSelfManagement',
] as const;

const DEFAULT_USER_SCORES = [88, 82, 86, 74, 79, 91, 72, 84, 60];
const DEFAULT_MAJOR_REQUIRED_SCORES = [80, 70, 80, 90, 90, 70, 60, 70, 70];

const fixMojibake = (value?: string | null): string | undefined => value ?? undefined;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeScoreToHundred = (value: unknown, fallback: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric <= 1) return clamp(numeric * 100, 0, 100);
  if (numeric <= 10) return clamp(numeric * 10, 0, 100);
  return clamp(numeric, 0, 100);
};

const parseCompetencyScores = (competencyVector?: string | null) => {
  if (!competencyVector) return DEFAULT_USER_SCORES;
  try {
    const parsed = JSON.parse(competencyVector) as Record<string, unknown>;
    return COMPETENCY_KEYS.map((key, i) => normalizeScoreToHundred(parsed[key], DEFAULT_USER_SCORES[i]));
  } catch {
    return DEFAULT_USER_SCORES;
  }
};

const parseMajorRequiredScores = (major?: Major) => {
  if (!major) return DEFAULT_MAJOR_REQUIRED_SCORES;
  return MAJOR_REQUIRED_KEYS.map((key, i) =>
    normalizeScoreToHundred(major[key], DEFAULT_MAJOR_REQUIRED_SCORES[i])
  );
};

const mapMajorScoresToRecommendedMajors = (
  scores: ResultMajorScore[],
  majorMap: Map<number, Major>
): RecommendedMajor[] =>
  [...scores]
    .sort((a, b) => a.rank - b.rank)
    .map((score) => {
      const major = majorMap.get(score.majorId);
      const strengths = fixMojibake(score.strengths);
      const weaknesses = fixMojibake(score.weaknesses);
      const recommendationReason = fixMojibake(score.recommendationReason);
      return {
        rank: score.rank,
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
          recommendationReason ||
          strengths ||
          fixMojibake(major?.description) ||
          `성향 점수 ${Math.round(score.tendencyScore)}점, 역량 점수 ${Math.round(score.competencyScore)}점으로 산출된 추천 결과입니다.`,
      };
    });

const SharedResult = () => {
  const { token } = useParams<{ token: string }>();

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [majorScores, setMajorScores] = useState<ResultMajorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const fetchData = async () => {
      try {
        const sharedResult = await getSharedDiagnosisResult(token);
        if (ignore) return;
        setResult(sharedResult);

        const [majorList] = await Promise.all([
          getMajors().catch(() => [] as import('../../../types/major').Major[]),
          getResultMajorScores(sharedResult.id).then((s) => { if (!ignore) setMajorScores(s); }).catch(() => undefined),
        ]);
        if (!ignore) setMajors(majorList);
      } catch (e) {
        if (!ignore) {
          const msg = e instanceof Error ? e.message : String(e);
          const status = (e as { response?: { status?: number } }).response?.status;
          setError(`오류 (${status ?? 'unknown'}): ${msg}`);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void fetchData();
    return () => { ignore = true; };
  }, [token]);

  const majorMap = useMemo(() => new Map(majors.map((m) => [m.id, m])), [majors]);
  const userScores = useMemo(() => parseCompetencyScores(result?.competencyVector), [result?.competencyVector]);
  const topMajorScore = useMemo(() => [...majorScores].sort((a, b) => a.rank - b.rank)[0], [majorScores]);
  const topMajor = topMajorScore ? majorMap.get(topMajorScore.majorId) : undefined;
  const requiredScores = useMemo(() => parseMajorRequiredScores(topMajor), [topMajor]);

  const capabilityRows: CapabilityRow[] = useMemo(
    () => AXES.map((axis, i) => ({ axis, userScore: Math.round(userScores[i]), majorAvg: Math.round(requiredScores[i]) })),
    [userScores, requiredScores]
  );

  const recommendedMajors = useMemo(
    () => mapMajorScoresToRecommendedMajors(majorScores, majorMap),
    [majorScores, majorMap]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-on-surface-variant font-bold">결과를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">link_off</span>
        <p className="text-on-surface font-bold text-lg text-center">
          {error ?? '결과를 찾을 수 없습니다.'}
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
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
            진로 역량 리포트
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-base sm:text-lg leading-relaxed">
            JinroOn AI가 9가지 핵심 역량 지표를 바탕으로 분석한 진로 역량 리포트입니다.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <section className="md:col-span-5 bg-surface-container-lowest rounded-[14px] p-6 sm:p-8 shadow-[0px_20px_40px_rgba(10,25,47,0.06)] flex flex-col items-center">
            <h3 className="w-full text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">analytics</span>
              9-Axis 역량 다이어그램
            </h3>
            <div className="w-full max-w-[480px] aspect-square">
              <DashboardRadarChart scores={userScores.map((s) => s / 100)} labels={AXES} />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00D2FF] shrink-0" />
              <span className="text-xs font-bold text-on-surface-variant">현재 역량 점수</span>
            </div>
          </section>

          <div className="md:col-span-7 space-y-6">
            <AiCommentBanner
              comment={result.aiComment ?? undefined}
              status={result.aiCommentStatus}
            />
            {recommendedMajors.length > 0 && <RecommendedMajors majors={recommendedMajors} />}
          </div>

          {majorScores.length > 0 && (
            <CapabilityBarChart
              rows={capabilityRows}
              targetMajorName={topMajor?.name}
              className="md:col-span-12"
            />
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/diagnosis"
            className="inline-flex items-center gap-2 px-6 py-4 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow"
          >
            <span className="material-symbols-outlined">psychology</span>
            나도 진단해보기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharedResult;