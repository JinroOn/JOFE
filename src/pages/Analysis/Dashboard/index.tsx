import { useEffect, useMemo, useState } from 'react';
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

const AXES = [
  '수리·논리',
  '문제해결',
  '정보기술',
  '구현력',
  '시스템이해',
  '데이터분석',
  '의사소통',
  '협업·윤리',
  '자기관리',
];

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

const MAJOR_REQUIRED_KEYS = [
  'reqMathLogic',
  'reqProblemSolving',
  'reqInfoTech',
  'reqImplementation',
  'reqSystemUnderstanding',
  'reqDataAnalysis',
  'reqCommunication',
  'reqCollaboration',
  'reqSelfManagement',
] as const;

const DEFAULT_USER_SCORES = [88, 82, 86, 74, 79, 91, 72, 84, 60];
const DEFAULT_MAJOR_REQUIRED_SCORES = [80, 70, 80, 90, 90, 70, 60, 70, 70];

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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const fixMojibake = (value?: string | null) => {
  if (!value) {
    return undefined;
  }

  const looksMojibake = /[ÃÂìíêëð]|[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/.test(value);

  if (!looksMojibake) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(
      [...value].map((char) => {
        const mappedByte = CP1252_REVERSE_MAP[char];

        if (mappedByte !== undefined) {
          return mappedByte;
        }

        const code = char.codePointAt(0) ?? 0;

        if (code <= 0xff) {
          return code;
        }

        return 0x3f;
      })
    );

    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    return decoded.includes('�') ? value : decoded;
  } catch {
    return value;
  }
};

const normalizeScoreToHundred = (value: unknown, fallback: number) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  if (numeric <= 1) {
    return clamp(numeric * 100, 0, 100);
  }

  if (numeric <= 10) {
    return clamp(numeric * 10, 0, 100);
  }

  return clamp(numeric, 0, 100);
};

const parseCompetencyScores = (competencyVector?: string | null) => {
  if (!competencyVector) {
    return DEFAULT_USER_SCORES;
  }

  try {
    const parsed = JSON.parse(competencyVector) as Record<string, unknown>;

    return COMPETENCY_KEYS.map((key, index) =>
      normalizeScoreToHundred(parsed[key], DEFAULT_USER_SCORES[index])
    );
  } catch {
    return DEFAULT_USER_SCORES;
  }
};

const parseMajorRequiredScores = (major?: Major) => {
  if (!major) {
    return DEFAULT_MAJOR_REQUIRED_SCORES;
  }

  return MAJOR_REQUIRED_KEYS.map((key, index) =>
    normalizeScoreToHundred(major[key], DEFAULT_MAJOR_REQUIRED_SCORES[index])
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

      const majorName = fixMojibake(major?.name);
      const majorCategory = fixMojibake(major?.category);
      const majorDescription = fixMojibake(major?.description);
      const majorCareerPaths = fixMojibake(major?.careerPaths);

      const strengths = fixMojibake(score.strengths);
      const weaknesses = fixMojibake(score.weaknesses);
      const recommendationReason = fixMojibake(score.recommendationReason);

      return {
        rank: score.rank,
        majorId: score.majorId,
        name: majorName ?? `전공 ID ${score.majorId}`,
        category: majorCategory,
        difficulty: major?.difficulty ?? undefined,
        careerPaths: majorCareerPaths,
        suitability: Math.round(clamp(score.finalScore, 0, 100)),
        tendencyScore: score.tendencyScore,
        competencyScore: score.competencyScore,
        failed: score.failed,
        strengths,
        weaknesses,
        description:
          recommendationReason ||
          strengths ||
          majorDescription ||
          `성향 점수 ${Math.round(score.tendencyScore)}점, 역량 점수 ${Math.round(
            score.competencyScore
          )}점으로 산출된 추천 결과입니다.`,
      };
    });

const getSafeDisplayName = (user?: DisplayUser) => {
  const fixedNickname = fixMojibake(user?.nickname);
  const fixedName = fixMojibake(user?.name);
  const fixedUsername = fixMojibake(user?.username);
  const emailName = user?.email?.split('@')[0];

  if (fixedNickname?.trim() && !/^테스트유저\d+$/.test(fixedNickname)) {
    return fixedNickname;
  }

  if (fixedName?.trim()) {
    return fixedName;
  }

  if (fixedUsername?.trim()) {
    return fixedUsername;
  }

  if (emailName?.trim()) {
    return emailName;
  }

  return fixedNickname || '사용자';
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return fixMojibake(response.data.message) ?? response.data.message;
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

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const [results, setResults] = useState<DiagnosisResult[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
  const [majorScores, setMajorScores] = useState<ResultMajorScore[]>([]);

  const [isFetchingResults, setIsFetchingResults] = useState(true);
  const [isFetchingMajorScores, setIsFetchingMajorScores] = useState(false);
  const [isGeneratingAiComment, setIsGeneratingAiComment] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [aiCommentError, setAiCommentError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchDashboardData = async () => {
      try {
        setIsFetchingResults(true);
        setError(null);

        const [resultData, majorData] = await Promise.all([
          getDiagnosisResults(),
          getMajors(),
        ]);

        if (ignore) {
          return;
        }

        const sortedResults = [...resultData].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setResults(sortedResults);
        setMajors(majorData);
        setSelectedResultId(sortedResults[0]?.id ?? null);
      } catch (e) {
        if (ignore) {
          return;
        }

        setError(getApiErrorMessage(e, '진단 결과 또는 전공 목록 조회 중 오류가 발생했습니다.'));
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
  }, []);

  useEffect(() => {
    if (!selectedResultId) {
      return;
    }

    let ignore = false;

    const fetchMajorScores = async () => {
      try {
        setIsFetchingMajorScores(true);
        setError(null);

        const data = await getResultMajorScores(selectedResultId);

        if (ignore) {
          return;
        }

        setMajorScores(data);
      } catch (e) {
        if (ignore) {
          return;
        }

        setError(getApiErrorMessage(e, '전공별 점수 조회 중 오류가 발생했습니다.'));
        setMajorScores([]);
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

  const majorMap = useMemo(
    () => new Map(majors.map((major) => [major.id, major])),
    [majors]
  );

  const selectedResult = useMemo(
    () => results.find((result) => result.id === selectedResultId) ?? null,
    [results, selectedResultId]
  );

  const userScores = useMemo(
    () => parseCompetencyScores(selectedResult?.competencyVector),
    [selectedResult?.competencyVector]
  );

  const topMajorScore = useMemo(
    () => [...majorScores].sort((a, b) => a.rank - b.rank)[0],
    [majorScores]
  );

  const topMajor = topMajorScore ? majorMap.get(topMajorScore.majorId) : undefined;

  const requiredScores = useMemo(
    () => parseMajorRequiredScores(topMajor),
    [topMajor]
  );

  const capabilityRows: CapabilityRow[] = useMemo(
    () =>
      AXES.map((axis, index) => ({
        axis,
        userScore: Math.round(userScores[index]),
        majorAvg: Math.round(requiredScores[index]),
      })),
    [userScores, requiredScores]
  );

  const recommendedMajors = useMemo(
    () => mapMajorScoresToRecommendedMajors(majorScores, majorMap),
    [majorScores, majorMap]
  );

  const topRecommendedMajor = recommendedMajors[0];

  const displayName = getSafeDisplayName(user as DisplayUser);

  const handleGenerateAiComment = async () => {
    if (!selectedResultId) {
      return;
    }

    try {
      setIsGeneratingAiComment(true);
      setAiCommentError(null);

      const updatedResult = await generateAiComment(selectedResultId);

      setResults((prev) =>
        prev.map((result) => (result.id === updatedResult.id ? updatedResult : result))
      );
    } catch (e) {
      setAiCommentError(getApiErrorMessage(e, 'AI 추천 설명 생성 중 오류가 발생했습니다.'));
    } finally {
      setIsGeneratingAiComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
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

        {isFetchingResults && (
          <div className="mb-6 rounded-[14px] bg-surface-container-lowest border border-outline-variant/20 p-5 font-bold text-on-surface-variant">
            진단 결과와 전공 데이터를 조회하는 중입니다...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-[14px] border border-red-200 bg-red-50 p-5 font-bold text-red-600">
            API 호출 오류: {error}
          </div>
        )}

        {!isFetchingResults && results.length === 0 && !error && (
          <div className="mb-6 rounded-[14px] border border-[#FFAB00]/30 bg-[#FFAB00]/10 p-5 font-bold text-primary-container">
            로그인한 사용자에게 저장된 진단 결과가 없습니다. 먼저 진단을 완료하거나 테스트 데이터를 생성하세요.
          </div>
        )}

        {results.length > 1 && (
          <section className="mb-8 flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant shrink-0">진단 회차</span>
            {results.length <= 5 ? (
              <div className="flex gap-2">
                {results.map((result, idx) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setSelectedResultId(result.id);
                      setAiCommentError(null);
                    }}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      result.id === selectedResultId
                        ? 'bg-primary-container text-white shadow-md'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span>{results.length - idx}회차</span>
                    <span className={`text-xs font-normal ${result.id === selectedResultId ? 'text-white/70' : 'text-on-surface-variant/60'}`}>
                      {new Date(result.createdAt)
                        .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                        .replace(/\. /g, '.').replace(/\.$/, '')}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={selectedResultId ?? ''}
                onChange={(e) => {
                  setSelectedResultId(Number(e.target.value));
                  setAiCommentError(null);
                }}
                className="rounded-[12px] border border-outline-variant/30 bg-white px-4 py-2.5 text-sm font-bold text-primary-container outline-none cursor-pointer"
              >
                {results.map((result, idx) => (
                  <option key={result.id} value={result.id}>
                    {results.length - idx}회차 ·{' '}
                    {new Date(result.createdAt)
                      .toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      .replace(/\. /g, '.').replace(/\.$/, '')}
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

            <div className="w-full max-w-[480px] aspect-square">
              <DashboardRadarChart
                scores={userScores.map((score) => score / 100)}
                labels={AXES}
              />
            </div>

            <div className="mt-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#00D2FF] shrink-0" />
              <span className="text-xs font-bold text-on-surface-variant">
                현재 역량 점수
              </span>
            </div>
          </section>

          <div className="md:col-span-7 space-y-6">
            <AiCommentBanner
              comment={fixMojibake(selectedResult?.aiComment)}
              status={selectedResult?.aiCommentStatus}
              errorMessage={fixMojibake(selectedResult?.aiCommentErrorMessage) || aiCommentError}
              isGenerating={isGeneratingAiComment}
              disabled={!selectedResultId}
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

          <CapabilityBarChart
            rows={capabilityRows}
            targetMajorName={fixMojibake(topMajor?.name)}
            className="md:col-span-12"
          />
        </div>

        <ShareSection userName={displayName} topMajor={topRecommendedMajor} shareToken={selectedResult?.shareToken} />

        <footer className="mt-8 flex flex-wrap justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-4 bg-primary-container text-white rounded-[14px] font-bold hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            리포트 저장 (PDF)
          </button>

          <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">image</span>
            이미지 저장
          </button>

          <button className="flex items-center gap-2 px-6 py-4 bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-[14px] font-bold hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">print</span>
            인쇄
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;