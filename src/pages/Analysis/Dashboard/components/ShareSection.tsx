import { useState } from 'react';
import type { RecommendedMajor } from '../types';

interface ShareSectionProps {
  userName: string;
  topMajor?: RecommendedMajor;
  shareToken?: string | null;
}

const ShareSection = ({
  userName,
  topMajor,
  shareToken,
}: ShareSectionProps) => {
  const [copyStatus, setCopyStatus] = useState<
    'IDLE' | 'SUCCESS' | 'ERROR'
  >('IDLE');

  const isJointFirstPlace =
    (topMajor?.tieCount ?? 1) > 1;

  const suitability = topMajor?.suitability ?? null;

  const shareUrl = shareToken
    ? `${window.location.origin}/results/share/${encodeURIComponent(
        shareToken,
      )}`
    : null;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('SUCCESS');
    } catch {
      setCopyStatus('ERROR');
    }
  };

  return (
    <section className="dot-grid relative mt-12 overflow-hidden rounded-[14px] border border-white/5 bg-[#0A192F] shadow-[0px_20px_40px_rgba(10,25,47,0.3)]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary-container/20 blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-on-tertiary-container/10 blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center justify-between gap-4 px-6 pt-7 sm:px-12 sm:pt-10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-container shadow-[0_0_20px_rgba(0,210,255,0.4)]">
            <span
              className="material-symbols-outlined text-base text-primary-container"
              style={{
                fontVariationSettings: '"FILL" 1',
              }}
              aria-hidden="true"
            >
              explore
            </span>
          </div>

          <span className="font-headline text-xl font-extrabold tracking-tighter text-white">
            JinroOn
          </span>
        </div>

        <span className="glass-panel rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold tracking-widest text-secondary-container">
          CAREER REPORT
        </span>
      </div>

      <div className="relative z-10 px-6 pb-9 pt-8 sm:px-12 sm:pb-12 sm:pt-10">
        <div className="max-w-3xl">
          <div className="mb-7">
            <p className="mb-3 text-sm font-semibold text-secondary-container">
              진단 결과 공유
            </p>

            <h2 className="font-headline text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              {userName}님의
              <br />
              진로 역량 리포트
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/70">
              진단을 통해 추천된 전공과 결과를
              공유할 수 있습니다.
            </p>
          </div>

          <div className="glass-panel rounded-[14px] border border-white/10 p-5 shadow-xl sm:p-7">
            <p className="mb-3 text-xs font-bold tracking-widest text-white/70">
              {isJointFirstPlace
                ? '공동 1위 추천 전공'
                : '최상위 추천 전공'}
            </p>

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <h3 className="break-words text-2xl font-bold text-white sm:text-3xl">
                  {topMajor?.name ?? '추천 전공 없음'}
                </h3>

                <p className="mt-2 text-sm font-medium text-secondary-container">
                  {topMajor?.category ??
                    '진단 결과 기반 추천'}
                </p>
              </div>

              {suitability !== null && (
                <div className="shrink-0 sm:text-right">
                  <p className="text-3xl font-black leading-none text-secondary-container sm:text-4xl">
                    {suitability}
                    <span className="ml-0.5 text-lg">
                      %
                    </span>
                  </p>

                  <p className="mt-2 text-[11px] font-medium text-white/60">
                    전공 적합도
                  </p>
                </div>
              )}
            </div>

            {suitability !== null && (
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-secondary-container"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, suitability),
                    )}%`,
                  }}
                />
              </div>
            )}

            {isJointFirstPlace && (
              <p className="mt-5 text-sm leading-relaxed text-white/75">
                이 진단에는 공동 1위 전공이 여러 개
                있습니다. 저장 순서가 빠른 전공만
                단독 1위로 판단하지 않습니다.
                전체 추천 전공은 공유된 결과에서
                확인할 수 있습니다.
              </p>
            )}
          </div>

          {/* 사용자별 실제 역량 점수를 사용하지 않는
              고정 SVG 8축 그래프는 제거했습니다. */}
          <div className="mt-8 flex flex-col items-start gap-3">
            {shareUrl ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopy();
                  }}
                  className="glass-panel inline-flex min-h-[44px] items-center gap-2 rounded-[14px] border border-white/10 px-5 py-3.5 font-bold text-white transition-all hover:border-white/30 active:scale-95"
                >
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    {copyStatus === 'SUCCESS'
                      ? 'check'
                      : 'link'}
                  </span>

                  {copyStatus === 'SUCCESS'
                    ? '복사됨!'
                    : '공유 링크 복사'}
                </button>

                {copyStatus === 'SUCCESS' && (
                  <p
                    role="status"
                    className="text-sm text-white/75"
                  >
                    공유 링크를 클립보드에 복사했습니다.
                  </p>
                )}

                {copyStatus === 'ERROR' && (
                  <p
                    role="alert"
                    className="text-sm text-red-200"
                  >
                    링크를 복사하지 못했습니다.
                    브라우저 권한을 확인해 주세요.
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                이 진단에는 공유 링크가 제공되지
                않았습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-secondary-container/50 to-transparent"
        aria-hidden="true"
      />
    </section>
  );
};

export default ShareSection;