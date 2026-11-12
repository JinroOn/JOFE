import { useEffect, useRef, useState } from 'react';
import { getExplorationMajorProfile } from '../../../../api/exploration';
import type { ExplorationMajorCard, ExplorationMajorProfile } from '../../../../types/exploration';

interface MajorDetailDialogProps {
  major: ExplorationMajorCard;
  groupName: string;
  picked: boolean;
  compareFull: boolean;
  onToggleCompare: () => void;
  onClose: () => void;
}

// 결과 근거(내 응답)와 등록된 전공 정보를 나눠 보여준다. 점수·적합도는 보여주지 않는다.
const MajorDetailDialog = ({ major, groupName, picked, compareFull, onToggleCompare, onClose }: MajorDetailDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const [profile, setProfile] = useState<ExplorationMajorProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    let alive = true;
    getExplorationMajorProfile(major.majorCode)
      .then((res) => {
        if (!alive) return;
        setProfile(res);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [major.majorCode, attempt]);

  const titleId = `major-detail-${major.majorCode}`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className="w-[min(640px,calc(100vw-32px))] max-h-[calc(100vh-48px)] rounded-brand bg-surface-container-lowest p-0 text-on-surface backdrop:bg-black/40"
    >
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-outline-variant/20 bg-surface-container-lowest px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs text-on-surface-variant">
            {groupName}
            {profile?.category && ` · ${profile.category}`}
          </p>
          <h2 id={titleId} className="text-xl font-bold text-primary-container">{major.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="닫기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <section aria-labelledby={`${titleId}-mine`} className="rounded-lg bg-secondary-container/10 p-4">
          <h3 id={`${titleId}-mine`} className="text-sm font-bold text-secondary mb-2">내 응답에서 나타난 점</h3>
          <ul className="list-disc pl-4 space-y-1 text-sm text-on-surface-variant">
            {major.reasons.map((r) => (
              <li key={`${r.kind}-${r.reasonCode}`}>{r.text}</li>
            ))}
          </ul>
        </section>

        {failed && (
          <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            전공 정보를 불러오지 못했어요.{' '}
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-bold underline">
              다시 시도
            </button>
          </div>
        )}
        {!failed && !profile && <p role="status" className="text-sm text-on-surface-variant">전공 정보를 불러오는 중이에요…</p>}

        {profile && (
          <>
            {profile.description && (
              <section aria-labelledby={`${titleId}-about`}>
                <h3 id={`${titleId}-about`} className="text-sm font-bold text-primary-container mb-1">어떤 전공인가요</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{profile.description}</p>
              </section>
            )}

            {profile.keywords.length > 0 && (
              <section aria-labelledby={`${titleId}-kw`}>
                <h3 id={`${titleId}-kw`} className="text-sm font-bold text-primary-container mb-2">핵심 키워드</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {profile.keywords.map((k) => (
                    <li key={k} className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-primary-container">{k}</li>
                  ))}
                </ul>
              </section>
            )}

            {profile.bestFor && (
              <section aria-labelledby={`${titleId}-for`}>
                <h3 id={`${titleId}-for`} className="text-sm font-bold text-primary-container mb-1">이런 학생이 먼저 살펴보면 좋아요</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{profile.bestFor}</p>
              </section>
            )}

            {(profile.comparisonNote || profile.lessCentral.length > 0) && (
              <section aria-labelledby={`${titleId}-diff`}>
                <h3 id={`${titleId}-diff`} className="text-sm font-bold text-primary-container mb-1">비슷한 전공과의 차이</h3>
                {profile.comparisonNote && <p className="text-sm text-on-surface-variant leading-relaxed">{profile.comparisonNote}</p>}
                {profile.lessCentral.length > 0 && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    <span className="font-semibold text-primary-container">상대적으로 덜 다루는 것 · </span>
                    {profile.lessCentral.join(', ')}
                  </p>
                )}
              </section>
            )}

            {profile.relatedCareers.length > 0 && (
              <section aria-labelledby={`${titleId}-career`}>
                <h3 id={`${titleId}-career`} className="text-sm font-bold text-primary-container mb-2">관련 진로 예시</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {profile.relatedCareers.map((c) => (
                    <li key={c} className="rounded-lg border border-outline-variant/30 px-3 py-1 text-xs text-on-surface-variant">{c}</li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-on-surface-variant">진로는 예시일 뿐, 이 전공을 고르면 이렇게 된다는 뜻은 아니에요.</p>
              </section>
            )}

            <p className="text-[11px] text-outline">전공 정보 출처: 등록된 전공 프로필 ({profile.profileVersion})</p>
          </>
        )}
      </div>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-outline-variant/20 bg-surface-container-lowest px-5 py-3 sm:px-6">
        <button
          type="button"
          aria-pressed={picked}
          disabled={compareFull}
          onClick={onToggleCompare}
          className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
            picked ? 'bg-secondary text-white' : 'bg-surface-container-low text-secondary'
          }`}
        >
          {picked ? '비교에 담음' : compareFull ? '비교는 최대 3개' : '비교에 담기'}
        </button>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="min-h-[44px] rounded-lg bg-primary-container px-5 text-sm font-bold text-white"
        >
          닫기
        </button>
      </div>
    </dialog>
  );
};

export default MajorDetailDialog;
