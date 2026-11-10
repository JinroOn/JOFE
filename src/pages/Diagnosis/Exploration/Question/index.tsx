import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { isExplorationMock } from '../../../../config/features';
import useExplorationStore from '../../../../store/useExplorationStore';
import { ABSTAIN_OPTION_CODES } from '../../../../types/exploration';
import type { ExplorationOption } from '../../../../types/exploration';
import MockBanner from '../components/MockBanner';
import StageStepper from './components/StageStepper';
import SaveStatus from './components/SaveStatus';

const isAbstain = (code: string) => (ABSTAIN_OPTION_CODES as readonly string[]).includes(code);

const Panel = ({ children }: { children: ReactNode }) => (
  <div className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-6 sm:p-10 text-center cloud-shadow">
    {children}
  </div>
);

const primaryBtn =
  'min-h-[44px] px-8 py-3 rounded-lg bg-primary-container text-white font-bold motion-safe:transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100';
const secondaryBtn =
  'min-h-[44px] px-6 py-3 rounded-lg border border-outline-variant text-primary-container font-semibold bg-surface-container-lowest';

const ExplorationQuestion = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const s = useExplorationStore();
  const titleRef = useRef<HTMLHeadingElement>(null);

  const id = Number(sessionId);
  const loadedId = s.session?.sessionId;
  const { load } = s;

  useEffect(() => {
    if (Number.isFinite(id) && loadedId !== id) void load(id);
  }, [id, loadedId, load]);

  const current = s.issued[s.cursor];
  const currentIssuedId = current?.question.issuedId;

  // 새 질문이 나오면 포커스를 질문 제목으로 옮긴다
  useEffect(() => {
    if (s.phase === 'ANSWERING' && currentIssuedId !== undefined) titleRef.current?.focus();
  }, [currentIssuedId, s.phase]);

  const exit = () => navigate('/diagnosis/exploration');

  const wrap = (children: ReactNode) => (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[760px] w-full mx-auto px-4 sm:px-8 pt-8 pb-24">
        {isExplorationMock && <MockBanner />}
        {children}
      </div>
    </div>
  );

  if (!Number.isFinite(id)) {
    return wrap(
      <Panel>
        <p className="text-primary-container font-bold mb-4">검사 주소가 올바르지 않아요.</p>
        <button type="button" className={primaryBtn} onClick={exit}>검사 안내로</button>
      </Panel>,
    );
  }

  if (s.phase === 'IDLE' || s.phase === 'STARTING' || s.phase === 'RESUMING') {
    return wrap(
      <Panel>
        <p className="text-on-surface-variant" role="status">저장된 검사를 불러오는 중이에요…</p>
      </Panel>,
    );
  }

  if (s.phase === 'LOAD_FAILED') {
    const message =
      s.errorCode === 'RESOURCE_NOT_FOUND'
        ? '검사를 찾을 수 없어요.'
        : s.errorCode === 'NO_ACTIVE_CATALOG'
          ? '지금은 검사를 진행할 수 없어요. 잠시 후 다시 시도해주세요.'
          : '검사를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해주세요.';
    return wrap(
      <Panel>
        <p role="alert" className="text-primary-container font-bold mb-6">{message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className={primaryBtn} onClick={() => void load(id)}>다시 시도</button>
          <button type="button" className={secondaryBtn} onClick={exit}>검사 안내로</button>
        </div>
      </Panel>,
    );
  }

  if (s.phase === 'STAGE_NOTICE' && s.notice) {
    return wrap(
      <>
        {s.session && <div className="mb-8"><StageStepper stage={s.session.stage} /></div>}
        <Panel>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">{s.notice.title}</h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-6">{s.notice.description}</p>
          <p className="inline-block text-xs font-semibold text-secondary bg-secondary-container/15 rounded-full px-4 py-1.5 mb-8">
            추가 질문 최대 {s.notice.expectedMaxQuestions}개 · 자동 저장
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={primaryBtn} onClick={() => void s.continueAfterNotice()}>
              이어서 답하기
            </button>
            <button type="button" className={secondaryBtn} onClick={exit}>나중에 이어하기</button>
          </div>
        </Panel>
      </>,
    );
  }

  if (s.phase === 'READY_TO_COMPLETE' || s.phase === 'COMPLETING') {
    const completing = s.phase === 'COMPLETING';
    return wrap(
      <Panel>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">모든 질문에 답했어요</h1>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          결과를 만들면 이 검사의 답변은 더 이상 바꿀 수 없어요.
        </p>
        <div className="mb-4 text-left">
          <SaveStatus saveState={s.saveState} onRetry={() => void s.retry()} onReload={() => void s.reloadLatest()} onExit={exit} />
        </div>
        <button type="button" className={primaryBtn} disabled={completing} onClick={() => void s.complete()}>
          {completing ? '결과를 만드는 중…' : '결과 만들기'}
        </button>
      </Panel>,
    );
  }

  if (s.phase === 'RESULT_READY') {
    return wrap(
      <Panel>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">결과가 준비됐어요</h1>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          결과 화면은 다음 작업에서 연결할 예정이에요. (결과 번호 {s.resultId})
        </p>
        <button type="button" className={secondaryBtn} onClick={exit}>검사 안내로</button>
      </Panel>,
    );
  }

  if (!current || !s.session || !s.progress) {
    return wrap(
      <Panel>
        <p className="text-on-surface-variant" role="status">다음 질문을 준비하는 중이에요…</p>
        <div className="mt-4 text-left">
          <SaveStatus saveState={s.saveState} onRetry={() => void s.retry()} onReload={() => void s.reloadLatest()} onExit={exit} />
        </div>
      </Panel>,
    );
  }

  const { question } = current;
  const saving = s.saveState === 'SAVING';
  const selectedCode =
    s.pending && s.pending.issuedId === question.issuedId ? s.pending.optionCode : current.answerCode;
  const sorted = [...question.options].sort((a, b) => a.order - b.order);
  const mainOptions = sorted.filter((o) => !isAbstain(o.code));
  const abstainOptions = sorted.filter((o) => isAbstain(o.code));
  const stageIssued = s.issued.filter((i) => i.stage === s.session!.stage);
  const posInStage = stageIssued.findIndex((i) => i.question.issuedId === question.issuedId);
  const hasPrev = stageIssued.slice(0, posInStage).some((i) => i.effective);
  const titleId = `q-${question.issuedId}`;

  const renderOption = (o: ExplorationOption, subtle: boolean) => {
    const checked = selectedCode === o.code;
    return (
      <button
        key={o.code}
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={saving}
        onClick={() => void s.select(o.code)}
        className={`w-full min-h-[44px] flex items-center gap-3 text-left rounded-xl border-2 px-4 py-3 motion-safe:transition-colors disabled:cursor-wait ${
          checked
            ? 'border-secondary bg-secondary/5'
            : subtle
              ? 'border-outline-variant/30 bg-surface-container-low hover:border-secondary/40'
              : 'border-outline-variant/30 bg-surface-container-lowest hover:border-secondary/50'
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex-none w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            checked ? 'border-secondary' : 'border-outline'
          }`}
        >
          {checked && <span className="w-2.5 h-2.5 rounded-full bg-secondary" />}
        </span>
        <span className={`text-sm sm:text-base ${checked ? 'font-bold text-secondary' : 'text-primary-container'}`}>
          {o.text}
        </span>
        {checked && <span className="sr-only">(선택됨)</span>}
      </button>
    );
  };

  return wrap(
    <>
      <div className="mb-6">
        <StageStepper stage={s.session.stage} />
      </div>

      <p className="text-xs sm:text-sm text-on-surface-variant mb-4">
        {s.progress.stage}단계 {s.progress.answered}개 완료 · 최대 {s.progress.remainingMax}개 남음
      </p>

      {s.adjustedNotice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-brand bg-secondary-container/15 px-4 py-3 mb-4 text-sm text-secondary">
          <span>앞선 답변에 따라 다음 질문이 조정되었습니다.</span>
          <button type="button" onClick={s.dismissAdjusted} className="min-h-[44px] min-w-[44px] -my-3 -mr-2 text-secondary" aria-label="안내 닫기">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      {s.affectedCount > 0 && (
        <p role="status" className="rounded-brand bg-surface-container-low px-4 py-3 mb-4 text-sm text-on-surface-variant">
          답변을 바꿔서 이후 질문 {s.affectedCount}개가 현재 결과에 쓰이지 않게 되었어요.
        </p>
      )}

      <section className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-5 sm:p-8 cloud-shadow">
        <fieldset>
          <legend className="sr-only">{question.text}</legend>
          <h1
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="text-lg sm:text-xl font-bold text-primary-container leading-snug mb-6 outline-none"
          >
            {question.text}
          </h1>
          <div role="radiogroup" aria-labelledby={titleId} className="space-y-2">
            {mainOptions.map((o) => renderOption(o, false))}
          </div>
          {abstainOptions.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-on-surface-variant mb-2">판단이 어렵다면</p>
              <div role="radiogroup" aria-label="판단이 어려울 때 고르는 답" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {abstainOptions.map((o) => renderOption(o, true))}
              </div>
            </div>
          )}
        </fieldset>
      </section>

      <div className="mt-4">
        <SaveStatus saveState={s.saveState} onRetry={() => void s.retry()} onReload={() => void s.reloadLatest()} onExit={exit} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button type="button" className={secondaryBtn} onClick={s.goPrev} disabled={!hasPrev || saving}>
          ← 이전 질문
        </button>
        {current.answerCode && !s.pending && (
          <button type="button" className={primaryBtn} onClick={s.goNextAnswered} disabled={saving}>
            다음 →
          </button>
        )}
      </div>

      {stageIssued.some((i) => i.answerCode !== null || !i.effective) && (
        <details className="mt-8 text-sm">
          <summary className="cursor-pointer min-h-[44px] flex items-center text-on-surface-variant font-semibold">
            이번 단계 답변 기록
          </summary>
          <ol className="mt-2 space-y-2">
            {stageIssued.map((i, n) => (
              <li key={i.question.issuedId} className="rounded-lg bg-surface-container-low px-4 py-3">
                <p className={i.effective ? 'text-primary-container' : 'text-on-surface-variant line-through'}>
                  {n + 1}. {i.question.text}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {!i.effective
                    ? '현재 결과에 미사용'
                    : i.answerCode
                      ? i.question.options.find((o) => o.code === i.answerCode)?.text
                      : '아직 답하지 않음'}
                </p>
              </li>
            ))}
          </ol>
        </details>
      )}
    </>,
  );
};

export default ExplorationQuestion;
