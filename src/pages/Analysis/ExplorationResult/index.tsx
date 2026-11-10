import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ActivityKind, ExplorationResult } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import GroupCard from './components/GroupCard';

const ACTIVITY_LABEL: Record<ActivityKind, { text: string; icon: string }> = {
  INFO_CHECK: { text: '정보 확인', icon: 'search' },
  HANDS_ON: { text: '직접 해보기', icon: 'construction' },
  COMPARE_ASK: { text: '비교·질문', icon: 'compare_arrows' },
};

const primaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg bg-primary-container text-white font-bold motion-safe:transition-transform hover:scale-[1.02] active:scale-95';
const secondaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg border border-outline-variant text-primary-container font-semibold bg-surface-container-lowest';

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[880px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const StatusPanel = ({ title, body, children }: { title: string; body?: string; children?: ReactNode }) => (
  <div className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-6 sm:p-10 text-center cloud-shadow">
    <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">{title}</h1>
    {body && <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{body}</p>}
    {children}
  </div>
);

const ResultView = ({ result, onExit }: { result: ExplorationResult; onExit: () => void }) => {
  const noCandidate = result.status === 'NO_SUPPORTED_CANDIDATE';
  return (
    <>
      <header className="mb-8">
        <p className="text-xs text-on-surface-variant mb-2">
          {formatDate(result.createdAt)} 완료한 전공 탐색 진단
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container leading-snug">
          {noCandidate ? '탐색을 시작할 작은 활동부터 해볼까요?' : '먼저 탐색해볼 수 있는 전공이에요'}
        </h1>
        {!noCandidate && (
          <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
            응답에서 나타난 관심·활동·공부 방식을 바탕으로 골랐어요. 순서는 먼저 살펴보기 좋은 차례일 뿐, 잘하거나
            못하는 정도를 뜻하지 않아요.
          </p>
        )}
      </header>

      {result.notes.length > 0 && (
        <div role="note" className="rounded-brand bg-secondary-container/15 px-5 py-4 mb-8 text-sm text-primary-container space-y-1">
          {result.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      )}

      {result.groups.length > 0 && (
        <section aria-labelledby="groups-title" className="mb-10">
          <h2 id="groups-title" className="sr-only">탐색 후보 전공군</h2>
          <div className="space-y-4">
            {result.groups.map((g, i) => (
              <GroupCard key={g.groupCode} group={g} index={i} />
            ))}
          </div>
        </section>
      )}

      {result.recheckAxes.length > 0 && (
        <section aria-labelledby="recheck-title" className="mb-10">
          <h2 id="recheck-title" className="text-lg font-bold text-primary-container mb-2">다시 확인해볼 관심 분야</h2>
          <p className="text-sm text-on-surface-variant mb-3">
            아래 분야는 응답만으로는 판단할 정보가 충분하지 않았어요. 관련 활동을 해본 뒤 다시 확인해보세요.
          </p>
          <ul className="flex flex-wrap gap-2">
            {result.recheckAxes.map((a) => (
              <li key={a.metricCode} className="rounded-full bg-surface-container-high px-4 py-2 text-sm font-semibold text-primary-container">
                {a.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.cautions.length > 0 && (
        <section aria-labelledby="caution-title" className="mb-10">
          <h2 id="caution-title" className="text-lg font-bold text-primary-container mb-3">탐색하면서 확인해볼 점</h2>
          <ul className="space-y-3">
            {result.cautions.slice(0, 2).map((c) => (
              <li key={c.tagCode} className="rounded-brand border border-outline-variant/30 bg-surface-container-lowest p-5">
                <p className="flex items-start gap-2 font-semibold text-primary-container mb-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5" aria-hidden="true">info</span>
                  {c.text}
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed pl-7">
                  <span className="font-semibold text-primary-container">이렇게 확인해보세요 · </span>
                  {c.checkAction}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.nextActivities.length > 0 && (
        <section aria-labelledby="activity-title" className="mb-10">
          <h2 id="activity-title" className="text-lg font-bold text-primary-container mb-3">이번 주에 해볼 수 있는 탐색 활동</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.nextActivities.map((a) => (
              <li key={a.activityCode} className="flex flex-col rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5 cloud-shadow">
                <p className="inline-flex items-center gap-1 text-xs font-bold text-secondary mb-2">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{ACTIVITY_LABEL[a.kind].icon}</span>
                  {ACTIVITY_LABEL[a.kind].text} · {a.duration}
                </p>
                <p className="font-bold text-primary-container mb-2">{a.title}</p>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{a.description}</p>
                <p className="mt-auto text-xs text-on-surface-variant border-t border-outline-variant/20 pt-3">
                  <span className="font-semibold text-primary-container">알게 되는 것 · </span>
                  {a.outcome}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="next-title" className="rounded-brand bg-surface-container-low p-5 sm:p-6 mb-8">
        <h2 id="next-title" className="font-bold text-primary-container mb-3">다음으로 할 수 있는 것</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled className={`${secondaryBtn} opacity-60 cursor-not-allowed`}>
            후보 전공 비교하기 (준비 중)
          </button>
          <button type="button" disabled className={`${secondaryBtn} opacity-60 cursor-not-allowed`}>
            결과에 대해 AI에게 묻기 (준비 중)
          </button>
          <button type="button" onClick={onExit} className={primaryBtn}>
            검사 안내로
          </button>
        </div>
      </section>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        이 결과는 능력이나 적성을 판정하거나 합격·취업 가능성을 예측하지 않아요. 지금의 응답을 바탕으로 먼저 살펴볼
        방향을 제안한 것이며, 탐색하면서 생각이 바뀌면 다시 검사할 수 있어요. 완료된 결과는 바뀌지 않고 그대로
        보관돼요. (결과 버전 {result.resultVersion})
      </p>
    </>
  );
};

const ExplorationResultPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  const { state, retry } = useExplorationResult(id);
  const exit = () => navigate('/diagnosis/exploration');

  if (!Number.isFinite(id)) {
    return (
      <Shell>
        <StatusPanel title="결과 주소가 올바르지 않아요.">
          <button type="button" className={primaryBtn} onClick={exit}>검사 안내로</button>
        </StatusPanel>
      </Shell>
    );
  }

  if (state.kind === 'LOADING' || state.kind === 'GENERATING') {
    return (
      <Shell>
        <StatusPanel
          title={state.kind === 'GENERATING' ? '결과를 정리하고 있어요' : '결과를 불러오는 중이에요'}
          body="응답을 바탕으로 먼저 살펴볼 전공과 근거를 정리하고 있어요. 이 화면을 나가도 결과는 저장돼요."
        >
          <div role="status" aria-live="polite" className="flex justify-center">
            <span className="material-symbols-outlined text-[32px] text-secondary motion-safe:animate-spin" aria-hidden="true">
              progress_activity
            </span>
            <span className="sr-only">결과를 기다리는 중</span>
          </div>
        </StatusPanel>
      </Shell>
    );
  }

  if (state.kind === 'TIMEOUT' || state.kind === 'ERROR') {
    const notFound = state.kind === 'ERROR' && state.code === 'RESOURCE_NOT_FOUND';
    return (
      <Shell>
        <StatusPanel
          title={notFound ? '결과를 찾을 수 없어요' : state.kind === 'TIMEOUT' ? '결과 정리가 평소보다 오래 걸리고 있어요' : '결과를 불러오지 못했어요'}
          body={notFound ? '검사를 끝까지 마쳤는지 확인해주세요.' : '답변은 저장되어 있어요. 잠시 후 다시 확인해주세요.'}
        >
          <div role="alert" className="flex flex-wrap justify-center gap-2">
            {!notFound && (
              <button type="button" className={primaryBtn} onClick={retry}>다시 확인하기</button>
            )}
            <button type="button" className={secondaryBtn} onClick={exit}>검사 안내로</button>
          </div>
        </StatusPanel>
      </Shell>
    );
  }

  return (
    <Shell>
      <ResultView result={state.result} onExit={exit} />
    </Shell>
  );
};

export default ExplorationResultPage;
