import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getExplorationActivities, toExplorationErrorCode } from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationActivities as ActivitiesData, ExplorationErrorCode } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import ActivityCard from './components/ActivityCard';
import SupportPanel from './components/SupportPanel';

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const ExplorationActivities = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  const { state: resultState, retry: retryResult } = useExplorationResult(id);
  const resultId = resultState.kind === 'READY' ? resultState.result.resultId : null;
  const [data, setData] = useState<ActivitiesData | null>(null);
  const [error, setError] = useState<ExplorationErrorCode | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (resultId === null) return;
    let alive = true;
    getExplorationActivities(resultId)
      .then((res) => {
        if (!alive) return;
        setData(res);
        setError(null);
      })
      .catch((e) => alive && setError(toExplorationErrorCode(e)));
    return () => {
      alive = false;
    };
  }, [resultId, version]);

  const backToResult = () => navigate(`/analysis/exploration/${id}`);
  const failed = resultState.kind === 'ERROR' || resultState.kind === 'TIMEOUT' || error !== null;

  return (
    <Shell>
      <header className="mb-8">
        <button type="button" onClick={backToResult} className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          결과로 돌아가기
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">탐색 활동</h1>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          후보 전공을 직접 알아보는 작은 활동이에요. 특별한 장비나 비용 없이 시작할 수 있고, 해보면서 생각이
          바뀌어도 괜찮아요.
        </p>
      </header>

      {failed && (
        <div role="alert" className="rounded-brand bg-error-container px-5 py-4 text-sm text-on-error-container mb-8">
          <p className="mb-3">활동을 불러오지 못했어요. 잠시 후 다시 시도해주세요.</p>
          <button
            type="button"
            className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold"
            onClick={() => {
              setError(null);
              if (resultState.kind !== 'READY') retryResult();
              setVersion((v) => v + 1);
            }}
          >
            다시 시도
          </button>
        </div>
      )}

      {!failed && !data && <p role="status" className="text-sm text-on-surface-variant">활동을 불러오는 중이에요…</p>}

      {data && resultId !== null && (
        <>
          <section aria-labelledby="base-title" className="mb-8">
            <h2 id="base-title" className="text-lg font-bold text-primary-container mb-1">이번 주에 해볼 수 있는 활동</h2>
            <p className="text-sm text-on-surface-variant mb-4" aria-live="polite">
              {data.personalizationNote ?? '짧은 정보 확인, 직접 해보기, 비교·질문을 하나씩 골랐어요.'}
            </p>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.base.map((a) => (
                <li key={a.activityCode}>
                  <ActivityCard activity={a} />
                </li>
              ))}
            </ol>
          </section>

          <div className="mb-10">
            <SupportPanel resultId={resultId} personalized={data.personalized} onChanged={() => setVersion((v) => v + 1)} />
          </div>

          {data.groups.length > 0 && (
            <section aria-labelledby="group-title">
              <h2 id="group-title" className="text-lg font-bold text-primary-container mb-1">전공군·전공별로 더 해볼 수 있는 활동</h2>
              <p className="text-sm text-on-surface-variant mb-4">관심 가는 전공군을 펼쳐서 골라보세요.</p>
              <div className="space-y-3">
                {data.groups.map((g, i) => (
                  <details key={g.groupCode} open={i === 0} className="group rounded-brand bg-surface-container-low">
                    <summary className="min-h-[44px] cursor-pointer list-none flex items-center justify-between gap-2 px-5 py-4 font-bold text-primary-container">
                      {g.groupName}
                      <span className="material-symbols-outlined text-[20px] group-open:rotate-180 motion-safe:transition-transform" aria-hidden="true">
                        expand_more
                      </span>
                    </summary>
                    <div className="px-5 pb-5">
                      <h3 className="text-sm font-semibold text-on-surface-variant mb-2">전공군 공통 활동</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                        {g.common.map((a) => (
                          <li key={a.activityCode}>
                            <ActivityCard activity={a} compact />
                          </li>
                        ))}
                      </ul>
                      <h3 className="text-sm font-semibold text-on-surface-variant mb-2">전공별 활동</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {g.majors.map((m) => (
                          <li key={m.majorCode}>
                            <p className="text-xs font-bold text-secondary mb-1">{m.name}</p>
                            <ActivityCard activity={m.activity} compact />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Shell>
  );
};

export default ExplorationActivities;
