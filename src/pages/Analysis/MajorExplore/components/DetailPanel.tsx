import { useEffect, useState } from 'react';
import type { Major } from '../types';

type ScoreRow = {
  label: string;
  score: number | null;
};

const DIFFICULTY_LABEL: Record<
  NonNullable<Major['difficulty']>,
  string
> = {
  low: '낮음',
  mid: '보통',
  high: '높음',
};

// 전공별 역량 및 성향 점수 표시 컴포넌트
const ScoreSection = ({
  title,
  rows,
}: {
  title: string;
  rows: ScoreRow[];
}) => {
  const available = rows.filter(
    (row) =>
      row.score !== null &&
      Number.isFinite(row.score),
  );

  // 각 영역 내 최댓값을 기준으로 막대 길이 계산
  const maximum = Math.max(
    1,
    ...available.map((row) => row.score ?? 0),
  );

  return (
    <section className="bg-surface-container-low rounded-2xl p-5 sm:p-6">
      <h3 className="text-base font-bold text-primary-container mb-1">
        {title}
      </h3>

      <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
        전공 데이터에 등록된 가중치입니다.
        막대 길이는 이 전공에서 가장 큰 값을 기준으로 표시합니다.
      </p>

      {available.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          등록된 점수 데이터가 없습니다.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map(({ label, score }) => {
            const width =
              score === null
                ? 0
                : Math.max(
                    0,
                    Math.min(100, (score / maximum) * 100),
                  );

            return (
              <div key={label}>
                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm mb-1.5">
                  <span className="font-medium text-on-surface-variant">
                    {label}
                  </span>

                  <span className="font-bold text-primary-container tabular-nums">
                    {score === null ? '미등록' : score}
                  </span>
                </div>

                <div className="h-2.5 w-full bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const DetailPanel = ({
  major,
  onClose,
  onAddToCompare,
  inCompare,
  bookmarked,
  onBookmark,
}: {
  major: Major;
  onClose: () => void;
  onAddToCompare: (major: Major) => void;
  inCompare: boolean;
  bookmarked: boolean;
  onBookmark: (id: number) => void | Promise<void>;
}) => {
  const [bookmarking, setBookmarking] = useState(false);

  // ESC 키로 상세 화면 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 백엔드에 등록된 관련 직업 목록
  const careerList = (major.careerPaths ?? '')
    .split(/[,;/\n]/)
    .map((career) => career.trim())
    .filter(Boolean);

  // 백엔드 핵심 역량 9개
  const competencies: ScoreRow[] = [
    {
      label: '수리·논리',
      score: major.reqMathLogic,
    },
    {
      label: '문제해결',
      score: major.reqProblemSolving,
    },
    {
      label: '정보기술',
      score: major.reqInfoTech,
    },
    {
      label: '구현력',
      score: major.reqImplementation,
    },
    {
      label: '시스템이해',
      score: major.reqSystemUnderstanding,
    },
    {
      label: '데이터분석',
      score: major.reqDataAnalysis,
    },
    {
      label: '의사소통',
      score: major.reqCommunication,
    },
    {
      label: '협업·윤리',
      score: major.reqCollaboration,
    },
    {
      label: '자기관리',
      score: major.reqSelfManagement,
    },
  ];

  // 백엔드 전공 성향 9개
  const tendencies: ScoreRow[] = [
    {
      label: '논리탐구형',
      score: major.tendLogicalInquiry,
    },
    {
      label: '실용기술형',
      score: major.tendPracticalTech,
    },
    {
      label: '예술창의형',
      score: major.tendArtCreative,
    },
    {
      label: '사회협력형',
      score: major.tendSocialCooperation,
    },
    {
      label: '생명보건형',
      score: major.tendLifeHealth,
    },
    {
      label: '교육지도형',
      score: major.tendEducationGuide,
    },
    {
      label: '이론학문형',
      score: major.tendTheoryAcademic,
    },
    {
      label: '데이터분석형',
      score: major.tendDataAnalytics,
    },
    {
      label: '시스템운용형',
      score: major.tendSystemOperation,
    },
  ];

  // 별도로 등록된 과락 기준만 표시
  const thresholds = [
    {
      label: '수리·논리',
      value: major.thrMathLogic,
    },
    {
      label: '정보기술',
      value: major.thrInfoTech,
    },
  ].filter(
    ({ value }) => value !== null && value > 0,
  );

  const handleBookmark = async () => {
    if (bookmarked || bookmarking) return;

    setBookmarking(true);

    try {
      await onBookmark(major.id);
    } finally {
      setBookmarking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`${major.name} 상세 정보`}
    >
      {/* 배경 */}
      <div
        className="absolute inset-0 bg-primary-container/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 전공 상세 패널 */}
      <div className="relative w-full md:max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="전공 상세 닫기"
          className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface">
            close
          </span>
        </button>

        {/* 전공명 및 카테고리 */}
        <div className="relative w-full min-h-[180px] sm:min-h-[200px] shrink-0 bg-gradient-to-br from-primary-container to-secondary flex items-end px-6 sm:px-8 pb-6">
          <div>
            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-md text-xs font-bold mb-2">
              {major.category ?? '기타'}
            </span>

            <h2 className="text-3xl font-extrabold text-white leading-tight">
              {major.name}
            </h2>
          </div>
        </div>

        {/* 상세 정보 본문 */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-6 space-y-6 sm:space-y-8 flex-1">
          {/* 학과 소개 */}
          <section>
            <h3 className="text-base font-bold text-primary-container mb-3 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-secondary-container rounded-full inline-block" />
              학과 소개
            </h3>

            <p className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-line">
              {major.description?.trim() ||
                '등록된 학과 소개가 없습니다.'}
            </p>
          </section>

          {/* 전공 난이도 */}
          <section className="rounded-xl border border-outline-variant/20 bg-white p-4">
            <p className="text-xs text-on-surface-variant mb-2">
              전공 난이도
            </p>

            <p className="font-bold text-lg text-primary-container">
              {major.difficulty
                ? DIFFICULTY_LABEL[major.difficulty]
                : '미등록'}
            </p>
          </section>

          {/* 핵심 역량 9개 */}
          <ScoreSection
            title="전공 핵심 역량 분석"
            rows={competencies}
          />

          {/* 학업 성향 9개 */}
          <ScoreSection
            title="전공 성향 분석"
            rows={tendencies}
          />

          {/* 과락 기준 */}
          <section className="rounded-2xl border border-outline-variant/20 p-5 sm:p-6">
            <h3 className="text-base font-bold text-primary-container mb-4">
              과락 기준
            </h3>

            {thresholds.length === 0 ? (
              <p className="text-sm text-on-surface-variant">
                별도로 설정된 과락 기준이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {thresholds.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-on-surface-variant">
                      {label}
                    </span>

                    <span className="font-bold text-primary-container">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 관련 직업 */}
          <section>
            <h3 className="text-base font-bold text-primary-container mb-4">
              관련 직업 및 진로
            </h3>

            {careerList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {careerList.map((career, index) => (
                  <span
                    key={`${career}-${index}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-outline-variant/20 rounded-full text-sm font-medium text-on-surface hover:border-secondary/40 hover:shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      work
                    </span>

                    {career}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                등록된 관련 직업 정보가 없습니다.
              </p>
            )}
          </section>

          {/* 데이터 설명 */}
          <p className="text-xs text-on-surface-variant leading-relaxed">
            표시된 역량 및 성향 점수는 전공별 데이터에
            등록된 가중치입니다.
            개인의 진단 결과나 합격 가능성을 의미하지 않습니다.
          </p>
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 sm:p-6 bg-white border-t border-outline-variant/20 flex gap-3 shrink-0 sticky bottom-0">
          {/* 북마크 */}
          <button
            type="button"
            onClick={handleBookmark}
            disabled={bookmarked || bookmarking}
            className={`flex-1 py-3.5 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${
              bookmarked
                ? 'border-[#FFAB00] text-[#FFAB00]'
                : 'border-primary-container text-primary-container hover:bg-primary-container/5'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: bookmarked
                  ? "'FILL' 1"
                  : "'FILL' 0",
              }}
            >
              {bookmarking ? 'hourglass_empty' : 'bookmark'}
            </span>

            {bookmarked ? '북마크됨' : '북마크'}
          </button>

          {/* 전공 비교 */}
          <button
            type="button"
            onClick={() => onAddToCompare(major)}
            disabled={inCompare}
            className={`flex-[1.5] py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              inCompare
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : 'bg-[#FFAB00] text-primary-container shadow-lg hover:opacity-90 active:scale-95'
            }`}
          >
            <span className="material-symbols-outlined">
              compare_arrows
            </span>

            {inCompare
              ? '비교 목록에 담김'
              : '전공 비교에 담기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;