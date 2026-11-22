import { useState } from 'react';
import type { RecommendedMajor } from '../types';

interface ShareSectionProps {
  userName: string;
  topMajor?: RecommendedMajor;
  shareToken?: string | null;
}

const DOT_COORDS: [number, number][] = [
  [200, 40],
  [330, 120],
  [360, 200],
  [300, 320],
  [200, 360],
  [80, 300],
  [40, 200],
  [120, 80],
];

const AXIS_LABELS = [
  {
    label: 'Logic',
    cls: 'top-[2%] left-1/2 -translate-x-1/2',
  },
  {
    label: 'Creative',
    cls: 'top-[20%] right-0',
  },
  {
    label: 'Social',
    cls: 'top-1/2 -translate-y-1/2 right-0',
  },
  {
    label: 'Leadership',
    cls: 'bottom-[10%] right-[8%]',
  },
  {
    label: 'Technical',
    cls: 'bottom-[2%] left-1/2 -translate-x-1/2',
  },
  {
    label: 'Analysis',
    cls: 'bottom-[10%] left-[8%]',
  },
  {
    label: 'Focus',
    cls: 'top-1/2 -translate-y-1/2 left-0',
  },
  {
    label: 'Vision',
    cls: 'top-[20%] left-0',
  },
];

const ShareSection = ({
  userName,
  topMajor,
  shareToken,
}: ShareSectionProps) => {
  const [copied, setCopied] = useState(false);

  const suitability = topMajor?.suitability ?? 0;

  const shareUrl = shareToken
    ? `${window.location.origin}/results/share/${shareToken}`
    : window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <section className="dot-grid relative mt-12 overflow-hidden rounded-[14px] border border-white/5 bg-[#0A192F] shadow-[0px_20px_40px_rgba(10,25,47,0.3)]">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary-container/20 blur-[100px]" />

      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-on-tertiary-container/10 blur-[100px]" />

      <div className="relative z-10 flex items-center justify-between px-8 pt-8 sm:px-12 sm:pt-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container shadow-[0_0_20px_rgba(0,210,255,0.4)]">
            <span
              className="material-symbols-outlined text-base text-primary-container"
              style={{
                fontVariationSettings: '"FILL" 1',
              }}
            >
              explore
            </span>
          </div>

          <span className="font-headline text-xl font-extrabold tracking-tighter text-white">
            JinroOn
          </span>
        </div>

        <div className="glass-panel flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-secondary-container" />

          <span className="whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-secondary-container">
            Live Analysis Report
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-10 px-8 py-8 sm:px-12 sm:py-10 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-8">
          <div>
            <h2 className="font-headline mb-6 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {userName}님의
              <br />
              진로 역량 리포트
            </h2>

            <div className="glass-panel rounded-[14px] border border-white/10 p-5 shadow-xl sm:p-6">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-widest text-on-primary-container opacity-70">
                {(topMajor?.tieCount ?? 1) > 1
                  ? 'Joint Top Recommended Majors'
                  : 'Top Recommended Major'}
              </div>

              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                    {topMajor?.name ?? '추천 전공 없음'}
                  </div>

                  <div className="font-medium text-secondary-container">
                    {topMajor?.category ??
                      '진단 결과 기반 추천'}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-3xl font-black leading-none text-secondary-container sm:text-4xl">
                    {suitability}
                    <span className="text-lg sm:text-xl">
                      %
                    </span>
                  </div>

                  <div className="text-[10px] uppercase tracking-tighter text-white/50">
                    Suitability Score
                  </div>
                </div>
              </div>

              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-secondary-container shadow-[0_0_10px_rgba(0,210,255,0.6)]"
                  style={{ width: `${suitability}%` }}
                />
              </div>
            </div>
          </div>

          {/* 수정: 동작하지 않는 카카오톡 공유 버튼 제거 */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="glass-panel flex items-center gap-2 whitespace-nowrap rounded-[14px] border border-white/10 px-5 py-3.5 font-bold text-white transition-all hover:border-white/30 active:scale-95"
            >
              <span className="material-symbols-outlined">
                {copied ? 'check' : 'link'}
              </span>

              {copied ? '복사됨!' : '링크 복사'}
            </button>
          </div>
        </div>

        <div className="relative flex min-h-[260px] flex-1 items-center justify-center sm:min-h-[320px]">
          <div className="absolute inset-0 rounded-full bg-secondary-container/5 blur-[80px]" />

          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <svg
              className="radar-glow max-h-[320px] w-full"
              viewBox="0 0 400 400"
            >
              {[180, 140, 100, 60].map((radius) => (
                <circle
                  key={radius}
                  cx="200"
                  cy="200"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
              ))}

              <line
                x1="200"
                y1="20"
                x2="200"
                y2="380"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              <line
                x1="20"
                y1="200"
                x2="380"
                y2="200"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              <line
                x1="72"
                y1="72"
                x2="328"
                y2="328"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              <line
                x1="72"
                y1="328"
                x2="328"
                y2="72"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              <polygon
                points="200,40 330,120 360,200 300,320 200,360 80,300 40,200 120,80"
                fill="rgba(0,210,255,0.15)"
                stroke="#00D2FF"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {DOT_COORDS.map(([cx, cy], index) => (
                <circle
                  key={`${cx}-${cy}-${index}`}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#00D2FF"
                />
              ))}
            </svg>

            {AXIS_LABELS.map(({ label, cls }) => (
              <div
                key={label}
                className={`absolute text-[10px] font-bold uppercase tracking-widest text-white/60 sm:text-xs ${cls}`}
              >
                {label}
              </div>
            ))}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-full border border-secondary-container/30 sm:h-20 sm:w-20">
                <span
                  className="material-symbols-outlined text-3xl text-secondary-container sm:text-4xl"
                  style={{
                    fontVariationSettings: '"FILL" 1',
                  }}
                >
                  psychology
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-secondary-container/50 to-transparent" />
    </section>
  );
};

export default ShareSection;