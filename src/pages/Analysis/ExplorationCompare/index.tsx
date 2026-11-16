import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getExplorationComparison, toExplorationErrorCode } from '../../../api/exploration';
import { isExplorationMock } from '../../../config/features';
import useExplorationResult from '../../../hooks/useExplorationResult';
import type { ExplorationComparison, ExplorationErrorCode } from '../../../types/exploration';
import MockBanner from '../../Diagnosis/Exploration/components/MockBanner';
import CandidatePicker from './components/CandidatePicker';
import ComparisonDetails from './components/ComparisonDetails';

const primaryBtn = 'min-h-[44px] px-6 py-3 rounded-lg bg-primary-container text-white font-bold';
const secondaryBtn = 'min-h-[44px] px-6 py-3 rounded-lg border border-outline-variant text-primary-container font-semibold bg-surface-container-lowest';

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
    <h2 className="text-xl font-bold text-primary-container mb-3">{title}</h2>
    {body && <p className="text-sm text-on-surface-variant mb-6">{body}</p>}
    {children}
  </div>
);

type LoadedComparison = { key: string; data?: ExplorationComparison; error?: ExplorationErrorCode };

const ComparisonPage = ({ sessionId }: { sessionId: number }) => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const rawCodes = params.get('majors') ?? '';
  const codes = useMemo(() => [...new Set(rawCodes.split(',').map((c) => c.trim()).filter(Boolean))], [rawCodes]);
  const { state: resultState, retry: retryResult } = useExplorationResult(sessionId);
  const [loaded, setLoaded] = useState<LoadedComparison | null>(null);
  const [attempt, setAttempt] = useState(0);
  const resultId = resultState.kind === 'READY' ? resultState.result.resultId : null;
  const key = `${resultId}:${codes.join(',')}:${attempt}`;
  const current = loaded?.key === key ? loaded : null;

  // 결과 화면 아래에서 진입하거나 비교 대상을 바꿔도 화면 첫머리부터 보여준다.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [rawCodes]);

  useEffect(() => {
    if (resultId === null || codes.length > 2) return;
    let alive = true;
    const pair: [string, string] | undefined = codes.length === 2 ? [codes[0], codes[1]] : undefined;
    getExplorationComparison(resultId, pair)
      .then((data) => { if (alive) setLoaded({ key, data }); })
      .catch((error) => { if (alive) setLoaded({ key, error: toExplorationErrorCode(error) }); });
    return () => { alive = false; };
  }, [resultId, codes, key]);

  const choose = (selected: string[]) => {
    const next = new URLSearchParams(params);
    if (selected.length) next.set('majors', selected.join(','));
    else next.delete('majors');
    setParams(next);
  };
  const back = () => navigate(`/analysis/exploration/${sessionId}`);
  const error = resultState.kind === 'ERROR' ? resultState.code : current?.error;
  const invalid = error === 'INVALID_INPUT' || error === 'MAJOR_NOT_IN_RESULT';
  const unavailable = error === 'COMPARISON_TARGET_UNAVAILABLE';
  const missing = error === 'NOT_FOUND';
  const data = current?.data;

  return (
    <Shell>
      <header className="mb-6">
        <button type="button" onClick={back} className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary mb-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          결과로 돌아가기
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-container">후보 전공 나란히 보기</h1>
        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
          어느 쪽이 더 낫다는 뜻이 아니에요. 탐색 방향의 차이를 살펴보고, 직접 더 알아볼 전공을 골라보세요.
        </p>
      </header>

      {codes.length > 2 ? (
        <Message title="비교할 전공을 2개 골라주세요" body="두 전공을 골라 나란히 볼 수 있어요.">
          <button type="button" className={primaryBtn} onClick={() => choose([])}>전공 다시 고르기</button>
        </Message>
      ) : error || resultState.kind === 'TIMEOUT' ? (
        <Message
          title={invalid ? '이 결과에 있는 전공만 비교할 수 있어요' : unavailable ? '지금은 두 전공을 비교할 수 없어요' : missing ? '비교할 결과를 찾을 수 없어요' : '비교 정보를 불러오지 못했어요'}
          body={invalid ? '결과 후보에서 서로 다른 두 전공을 다시 골라주세요.' : unavailable ? '비교할 결과 후보가 두 개 이상 필요해요.' : missing ? '검사를 끝까지 마쳤는지 확인해주세요.' : '잠시 후 다시 시도해주세요.'}
        >
          <div role="alert" className="flex flex-wrap justify-center gap-2">
            {invalid ? <button type="button" className={primaryBtn} onClick={() => choose([])}>전공 다시 고르기</button> : !unavailable && !missing && (
              <button type="button" className={primaryBtn} onClick={() => {
                if (resultState.kind !== 'READY') retryResult();
                setAttempt((n) => n + 1);
              }}>다시 시도</button>
            )}
            <button type="button" className={secondaryBtn} onClick={back}>결과로 돌아가기</button>
          </div>
        </Message>
      ) : resultState.kind !== 'READY' || !data ? (
        <p role="status" className="text-sm text-on-surface-variant">비교 정보를 불러오는 중이에요…</p>
      ) : !data.available ? (
        <Message title="아직 비교할 전공이 충분하지 않아요" body="비교할 결과 후보가 두 개 이상 생기면 나란히 볼 수 있어요.">
          <button type="button" className={secondaryBtn} onClick={back}>결과로 돌아가기</button>
        </Message>
      ) : codes.length < 2 ? (
        <CandidatePicker key={key} candidates={data.candidateChoices} initialCodes={codes} onCompare={choose} />
      ) : data.majors.length !== 2 ? (
        <Message title="두 전공의 비교 자료를 확인할 수 없어요" body="전공을 다시 고르거나 잠시 후 다시 확인해주세요.">
          <button type="button" className={secondaryBtn} onClick={() => choose([])}>전공 다시 고르기</button>
        </Message>
      ) : (
        <>
          <div className="mb-5 flex justify-end">
            <button type="button" className={secondaryBtn} onClick={() => choose([])}>다른 전공 고르기</button>
          </div>
          <ComparisonDetails data={data} result={resultState.result} />
        </>
      )}
    </Shell>
  );
};

const ExplorationCompare = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const id = Number(sessionId);
  if (!Number.isSafeInteger(id) || id <= 0) return (
    <Shell><Message title="검사 정보를 확인해주세요" body="진단 이력에서 결과를 다시 열어주세요.">
      <button type="button" className={secondaryBtn} onClick={() => navigate('/mypage')}>진단 이력으로</button>
    </Message></Shell>
  );
  return <ComparisonPage key={id} sessionId={id} />;
};

export default ExplorationCompare;
