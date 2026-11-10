import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getExplorationComparison, toExplorationErrorCode } from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationComparison, ExplorationErrorCode, ExplorationResult } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';

type ProfileKey = 'learning' | 'activities' | 'careerDirections' | 'checkPoints';

const ASPECTS: { key: ProfileKey | 'reasons'; title: string; icon: string }[] = [
  { key: 'reasons', title: '내 응답에서 나타난 점', icon: 'person' },
  { key: 'learning', title: '주로 배우는 내용', icon: 'menu_book' },
  { key: 'activities', title: '주로 하는 활동', icon: 'directions_run' },
  { key: 'careerDirections', title: '이어지는 진로 방향', icon: 'signpost' },
  { key: 'checkPoints', title: '확인해볼 점', icon: 'fact_check' },
];

const COLS: Record<number, string> = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

const primaryBtn = 'min-h-[44px] px-6 py-3 rounded-lg bg-primary-container text-white font-bold';
const secondaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg border border-outline-variant text-primary-container font-semibold bg-surface-container-lowest';

const Shell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-surface">
    <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
      {isExplorationMock && <MockBanner />}
      {children}
    </div>
  </div>
);

const Message = ({ title, body, children }: { title: string; body?: string; children?: ReactNode }) => (
  <div className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-6 sm:p-10 text-center cloud-shadow">
    <h1 className="text-xl font-bold text-primary-container mb-3">{title}</h1>
    {body && <p className="text-sm text-on-surface-variant mb-6">{body}</p>}
    {children}
  </div>
);

const reasonsOf = (result: ExplorationResult, code: string) =>
  result.groups.flatMap((g) => g.majors).find((m) => m.majorCode === code)?.reasons.map((r) => r.text) ?? [];

const CompareView = ({ data, result }: { data: ExplorationComparison; result: ExplorationResult }) => {
  const cols = COLS[data.majors.length] ?? 'md:grid-cols-2';
  return (
    <>
      <div className={`hidden md:grid ${cols} gap-3 mb-3 md:sticky md:top-20 md:z-10 bg-surface py-2`} aria-hidden="true">
        {data.majors.map((m) => (
          <div key={m.majorCode} className="rounded-brand bg-primary-container text-white px-4 py-3">
            <p className="font-bold">{m.name}</p>
            <p className="text-xs opacity-80">{m.groupName}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {ASPECTS.map((aspect) => (
          <section key={aspect.key} aria-labelledby={`aspect-${aspect.key}`}>
            <h2 id={`aspect-${aspect.key}`} className="flex items-center gap-2 font-bold text-primary-container mb-3">
              <span className="material-symbols-outlined text-[20px] text-secondary" aria-hidden="true">{aspect.icon}</span>
              {aspect.title}
            </h2>
            <div className={`grid grid-cols-1 ${cols} gap-3`}>
              {data.majors.map((m) => {
                const items = aspect.key === 'reasons' ? reasonsOf(result, m.majorCode) : m[aspect.key];
                return (
                  <div key={m.majorCode} className="rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-4">
                    <p className="text-xs font-bold text-secondary mb-2">{m.name}</p>
                    {items.length > 0 ? (
                      <ul className="space-y-1.5 text-sm text-on-surface-variant leading-relaxed list-disc pl-4">
                        {items.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-on-surface-variant">아직 정리된 정보가 없어요.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {(data.commonPoints.length > 0 || data.differences.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-10">
          {data.commonPoints.length > 0 && (
            <section aria-labelledby="common-title" className="rounded-brand bg-surface-container-low p-5">
              <h2 id="common-title" className="font-bold text-primary-container mb-2">비슷한 점</h2>
              <ul className="space-y-1.5 text-sm text-on-surface-variant list-disc pl-4">
                {data.commonPoints.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          )}
          {data.differences.length > 0 && (
            <section aria-labelledby="diff-title" className="rounded-brand bg-surface-container-low p-5">
              <h2 id="diff-title" className="font-bold text-primary-container mb-2">이런 점이 달라요</h2>
              <ul className="space-y-1.5 text-sm text-on-surface-variant list-disc pl-4">
                {data.differences.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="text-xs text-on-surface-variant mt-8 leading-relaxed">{data.sourceNote}</p>
    </>
  );
};

const ExplorationCompare = () => {
  const { sessionId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  const codes = useMemo(
    () => [...new Set((params.get('majors') ?? '').split(',').map((c) => c.trim()).filter(Boolean))],
    [params],
  );
  const codesKey = codes.join(',');
  const { state: resultState, retry: retryResult } = useExplorationResult(id);
  const [data, setData] = useState<ExplorationComparison | null>(null);
  const [error, setError] = useState<ExplorationErrorCode | null>(null);
  const [attempt, setAttempt] = useState(0);

  const resultId = resultState.kind === 'READY' ? resultState.result.resultId : null;
  const validCount = codes.length >= 2 && codes.length <= 3;

  useEffect(() => {
    if (resultId === null || !validCount) return;
    let alive = true;
    getExplorationComparison(resultId, codesKey.split(','))
      .then((res) => alive && setData(res))
      .catch((e) => alive && setError(toExplorationErrorCode(e)));
    return () => {
      alive = false;
    };
  }, [resultId, codesKey, validCount, attempt]);

  const backToResult = () => navigate(`/analysis/exploration/${id}`);

  const header = (
    <header className="mb-6">
      <button type="button" onClick={backToResult} className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
        결과로 돌아가기
      </button>
      <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">후보 전공 나란히 보기</h1>
      <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
        어느 쪽이 더 낫다는 뜻이 아니에요. 배우는 내용과 활동이 어떻게 다른지 살펴보고, 직접 더 알아볼 전공을 골라보세요.
      </p>
    </header>
  );

  if (!Number.isFinite(id) || !validCount) {
    return (
      <Shell>
        <Message title="비교할 전공을 2~3개 골라주세요" body="결과 화면에서 &quot;비교에 담기&quot;로 전공을 고를 수 있어요.">
          <button type="button" className={primaryBtn} onClick={backToResult}>결과로 돌아가기</button>
        </Message>
      </Shell>
    );
  }

  if (resultState.kind === 'ERROR' || resultState.kind === 'TIMEOUT' || error) {
    const invalid = error === 'INVALID_REQUEST';
    return (
      <Shell>
        <Message
          title={invalid ? '이 결과에 있는 전공만 비교할 수 있어요' : '비교 정보를 불러오지 못했어요'}
          body={invalid ? '결과 화면에서 다시 골라주세요.' : '잠시 후 다시 시도해주세요.'}
        >
          <div role="alert" className="flex flex-wrap justify-center gap-2">
            {!invalid && (
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  setError(null);
                  setData(null);
                  if (resultState.kind !== 'READY') retryResult();
                  setAttempt((n) => n + 1);
                }}
              >
                다시 시도
              </button>
            )}
            <button type="button" className={secondaryBtn} onClick={backToResult}>결과로 돌아가기</button>
          </div>
        </Message>
      </Shell>
    );
  }

  if (resultState.kind !== 'READY' || !data) {
    return (
      <Shell>
        {header}
        <p role="status" className="text-sm text-on-surface-variant">비교 정보를 불러오는 중이에요…</p>
      </Shell>
    );
  }

  return (
    <Shell>
      {header}
      <CompareView data={data} result={resultState.result} />
    </Shell>
  );
};

export default ExplorationCompare;
