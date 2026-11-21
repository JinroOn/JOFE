import { useEffect, useRef, useState } from 'react';
import type {
  KeyboardEvent,
  ReactNode,
} from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { isExplorationMock } from '../../../../config/features';
import useExplorationStore from '../../../../store/useExplorationStore';
import {
  ABSTAIN_OPTION_CODES,
} from '../../../../types/exploration';
import type {
  ExplorationOption,
} from '../../../../types/exploration';
import MockBanner from '../components/MockBanner';
import StageStepper from './components/StageStepper';
import SaveStatus from './components/SaveStatus';

const isAbstain = (code: string) =>
  (ABSTAIN_OPTION_CODES as readonly string[]).includes(code);

const Panel = ({
  children,
}: {
  children: ReactNode;
}) => (
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

  // 모든 선택지의 실제 버튼 요소
  const optionRefs = useRef<
    Map<string, HTMLButtonElement>
  >(new Map());

  // 방향키 이동 시 현재 초점이 있는 선택지
  const [focusedCode, setFocusedCode] =
    useState<string | null>(null);

  const id = Number(sessionId);
  const loadedId = s.session?.sessionId;
  const { load } = s;

  useEffect(() => {
    if (
      Number.isFinite(id) &&
      loadedId !== id
    ) {
      void load(id);
    }
  }, [id, loadedId, load]);

  const current = s.issued[s.cursor];
  const currentIssuedId =
    current?.question.issuedId;

  useEffect(() => {
    if (
      s.phase === 'ANSWERING' &&
      currentIssuedId !== undefined
    ) {
      titleRef.current?.focus();
    }
  }, [currentIssuedId, s.phase]);

  const exit = () =>
    navigate('/diagnosis/exploration');

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
        <p className="text-primary-container font-bold mb-4">
          검사 주소가 올바르지 않아요.
        </p>

        <button
          type="button"
          className={primaryBtn}
          onClick={exit}
        >
          검사 안내로
        </button>
      </Panel>,
    );
  }

  if (
    s.phase === 'IDLE' ||
    s.phase === 'STARTING' ||
    s.phase === 'RESUMING'
  ) {
    return wrap(
      <Panel>
        <p
          className="text-on-surface-variant"
          role="status"
        >
          저장된 검사를 불러오는 중이에요…
        </p>
      </Panel>,
    );
  }

  if (s.phase === 'LOAD_FAILED') {
    const message =
      s.errorCode === 'SESSION_ABANDONED'
        ? '중단된 검사예요. 이 검사는 더 이상 이어할 수 없어요.'
        : s.errorCode === 'NOT_FOUND'
          ? '검사를 찾을 수 없어요.'
          : s.errorCode === 'INVALID_INPUT'
            ? '검사 요청 정보가 올바르지 않아요. 검사 안내로 돌아가 다시 시작해주세요.'
            : s.errorCode === 'NO_ACTIVE_CATALOG'
              ? '지금은 검사를 진행할 수 없어요. 잠시 후 다시 시도해주세요.'
              : '검사를 불러오지 못했어요. 연결 상태를 확인하고 다시 시도해주세요.';

    return wrap(
      <Panel>
        <p
          role="alert"
          className="text-primary-container font-bold mb-6"
        >
          {message}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {s.errorCode !== 'SESSION_ABANDONED' && (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => void load(id)}
            >
              다시 시도
            </button>
          )}

          <button
            type="button"
            className={secondaryBtn}
            onClick={exit}
          >
            검사 안내로
          </button>
        </div>
      </Panel>,
    );
  }

  if (s.phase === 'STAGE_NOTICE' && s.notice) {
    return wrap(
      <>
        {s.session && (
          <div className="mb-8">
            <StageStepper stage={s.session.stage} />
          </div>
        )}

        <Panel>
          <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">
            {s.notice.title}
          </h1>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-6">
            {s.notice.description}
          </p>

          <p className="inline-block text-xs font-semibold text-secondary bg-secondary-container/15 rounded-full px-4 py-1.5 mb-8">
            추가 질문 최대{' '}
            {s.notice.expectedMaxQuestions}개 · 자동 저장
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className={primaryBtn}
              onClick={() =>
                void s.continueAfterNotice()
              }
            >
              이어서 답하기
            </button>

            <button
              type="button"
              className={secondaryBtn}
              onClick={exit}
            >
              나중에 이어하기
            </button>
          </div>
        </Panel>
      </>,
    );
  }

  if (
    s.phase === 'READY_TO_COMPLETE' ||
    s.phase === 'COMPLETING'
  ) {
    const completing =
      s.phase === 'COMPLETING';

    return wrap(
      <Panel>
        <h1 className="text-xl sm:text-2xl font-bold text-primary-container mb-3">
          모든 질문에 답했어요
        </h1>

        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          결과를 만들면 이 검사의 답변은
          더 이상 바꿀 수 없어요.
        </p>

        <div className="mb-4 text-left">
          <SaveStatus
            saveState={s.saveState}
            onRetry={() => void s.retry()}
            onReload={() => void s.reloadLatest()}
            onExit={exit}
          />
        </div>

        <button
          type="button"
          className={primaryBtn}
          disabled={completing}
          onClick={() => void s.complete()}
        >
          {completing
            ? '결과를 만드는 중…'
            : '결과 만들기'}
        </button>
      </Panel>,
    );
  }

  if (s.phase === 'RESULT_READY') {
    return (
      <Navigate
        to={`/analysis/exploration/${id}`}
        replace
      />
    );
  }

  if (
    !current ||
    !s.session ||
    !s.progress
  ) {
    return wrap(
      <Panel>
        <p
          className="text-on-surface-variant"
          role="status"
        >
          다음 질문을 준비하는 중이에요…
        </p>

        <div className="mt-4 text-left">
          <SaveStatus
            saveState={s.saveState}
            onRetry={() => void s.retry()}
            onReload={() => void s.reloadLatest()}
            onExit={exit}
          />
        </div>
      </Panel>,
    );
  }

  const { question } = current;
  const saving =
    s.saveState === 'SAVING';

  const selectedCode =
    s.pending &&
    s.pending.issuedId === question.issuedId
      ? s.pending.optionCode
      : current.answerCode;

  const sorted = [...question.options].sort(
    (a, b) => a.order - b.order,
  );

  const mainOptions = sorted.filter(
    (option) => !isAbstain(option.code),
  );

  const abstainOptions = sorted.filter(
    (option) => isAbstain(option.code),
  );

  // 일반 선택지와 판단 보류 선택지 모두
  // 하나의 라디오 그룹 안에서 탐색합니다.
  const allOptions = [
    ...mainOptions,
    ...abstainOptions,
  ];

  const allOptionCodes = allOptions.map(
    (option) => option.code,
  );

  // 한 문항에서 Tab으로 진입할 수 있는 버튼은 하나입니다.
  // 방향키를 누르면 해당 버튼으로 초점이 옮겨집니다.
  const tabStopCode =
    focusedCode &&
    allOptionCodes.includes(focusedCode)
      ? focusedCode
      : selectedCode &&
          allOptionCodes.includes(selectedCode)
        ? selectedCode
        : allOptionCodes[0];

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    code: string,
  ) => {
    if (saving || allOptionCodes.length === 0) {
      return;
    }

    const currentIndex =
      allOptionCodes.indexOf(code);

    let nextIndex: number;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex =
          (currentIndex + 1) %
          allOptionCodes.length;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex =
          (
            currentIndex -
            1 +
            allOptionCodes.length
          ) % allOptionCodes.length;
        break;

      case 'Home':
        nextIndex = 0;
        break;

      case 'End':
        nextIndex = allOptionCodes.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const nextCode =
      allOptionCodes[nextIndex];

    setFocusedCode(nextCode);

    // 방향키만으로는 진단 답변을 저장하지 않습니다.
    // Enter 또는 Space로 선택할 때만 s.select()를 호출합니다.
    optionRefs.current
      .get(nextCode)
      ?.focus();
  };

  const stageIssued = s.issued.filter(
    (item) => item.stage === s.session!.stage,
  );

  const posInStage =
    stageIssued.findIndex(
      (item) =>
        item.question.issuedId ===
        question.issuedId,
    );

  const hasPrev = stageIssued
    .slice(0, posInStage)
    .some((item) => item.effective);

  const activeIssued = stageIssued.filter(
    (item) => item.effective,
  );

  const currentUnanswered =
    activeIssued.filter(
      (item) => item.answerCode === null,
    ).length;

  const additionalPossible = Math.max(
    0,
    s.progress.remainingMax,
  );

  const titleId =
    `q-${question.issuedId}`;

  const renderOption = (
    option: ExplorationOption,
    subtle: boolean,
  ) => {
    const checked =
      selectedCode === option.code;

    return (
      <button
        key={option.code}
        ref={(node) => {
          if (node) {
            optionRefs.current.set(
              option.code,
              node,
            );
          } else {
            optionRefs.current.delete(
              option.code,
            );
          }
        }}
        type="button"
        role="radio"
        aria-checked={checked}
        tabIndex={
          tabStopCode === option.code
            ? 0
            : -1
        }
        disabled={saving}
        onFocus={() =>
          setFocusedCode(option.code)
        }
        onKeyDown={(event) =>
          handleOptionKeyDown(
            event,
            option.code,
          )
        }
        onClick={() =>
          void s.select(option.code)
        }
        className={`w-full min-h-[44px] flex items-center gap-3 text-left rounded-xl border-2 px-4 py-3 motion-safe:transition-colors disabled:cursor-wait focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary ${
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
            checked
              ? 'border-secondary'
              : 'border-outline'
          }`}
        >
          {checked && (
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
          )}
        </span>

        <span
          className={`text-sm sm:text-base ${
            checked
              ? 'font-bold text-secondary'
              : 'text-primary-container'
          }`}
        >
          {option.text}
        </span>

        {checked && (
          <span className="sr-only">
            (선택됨)
          </span>
        )}
      </button>
    );
  };

  return wrap(
    <>
      <div className="mb-6">
        <StageStepper
          stage={s.session.stage}
        />
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mb-4 text-xs sm:text-sm text-on-surface-variant space-y-1"
      >
        <p>
          {s.progress.stage}단계 ·{' '}
          {s.progress.answered}개 완료 ·{' '}
          현재 질문 {currentUnanswered}개 남음
        </p>

        {additionalPossible > 0 && (
          <p>
            앞으로 최대 {additionalPossible}개 질문이
            더 나올 수 있어요.
          </p>
        )}
      </div>

      {s.adjustedNotice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-brand bg-secondary-container/15 px-4 py-3 mb-4 text-sm text-secondary"
        >
          <span>
            앞선 답변에 따라 다음 질문이 조정되었습니다.
          </span>

          <button
            type="button"
            onClick={s.dismissAdjusted}
            className="min-h-[44px] min-w-[44px] -my-3 -mr-2 text-secondary"
            aria-label="안내 닫기"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              close
            </span>
          </button>
        </div>
      )}

      {s.affectedCount > 0 && (
        <p
          role="status"
          className="rounded-brand bg-surface-container-low px-4 py-3 mb-4 text-sm text-on-surface-variant"
        >
          답변을 바꿔서 이후 질문{' '}
          {s.affectedCount}개가
          현재 결과에 쓰이지 않게 되었어요.
        </p>
      )}

      <section className="bg-surface-container-lowest rounded-brand border border-outline-variant/20 p-5 sm:p-8 cloud-shadow">
        <fieldset>
          <legend className="sr-only">
            {question.text}
          </legend>

          <h1
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="text-lg sm:text-xl font-bold text-primary-container leading-snug mb-6 outline-none"
          >
            {question.text}
          </h1>

          {/* 한 문항당 하나의 라디오 그룹 */}
          <div
            role="radiogroup"
            aria-labelledby={titleId}
            aria-describedby={`${titleId}-help`}
          >
            <p
              id={`${titleId}-help`}
              className="mb-3 text-xs text-on-surface-variant"
            >
              방향키로 답변 이동, Enter 또는
              Space로 선택할 수 있어요.
            </p>

            <div className="space-y-2">
              {mainOptions.map((option) =>
                renderOption(
                  option,
                  false,
                ),
              )}
            </div>

            {abstainOptions.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-on-surface-variant mb-2">
                  판단이 어렵다면
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {abstainOptions.map((option) =>
                    renderOption(
                      option,
                      true,
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </fieldset>
      </section>

      <div className="mt-4">
        <SaveStatus
          saveState={s.saveState}
          onRetry={() =>
            void s.retry()
          }
          onReload={() =>
            void s.reloadLatest()
          }
          onExit={exit}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          className={secondaryBtn}
          onClick={s.goPrev}
          disabled={!hasPrev || saving}
        >
          ← 이전 질문
        </button>

        {current.answerCode &&
          !s.pending && (
            <p className="text-xs text-on-surface-variant">
              답을 바꾸거나, 같은 답을 다시 누르면
              다음 질문으로 넘어가요.
            </p>
          )}
      </div>

      {stageIssued.some(
        (item) =>
          item.answerCode !== null ||
          !item.effective,
      ) && (
        <details className="mt-8 text-sm">
          <summary className="cursor-pointer min-h-[44px] flex items-center text-on-surface-variant font-semibold">
            이번 단계 답변 기록
          </summary>

          <ol className="mt-2 space-y-2">
            {stageIssued.map(
              (item, index) => (
                <li
                  key={item.question.issuedId}
                  className="rounded-lg bg-surface-container-low px-4 py-3"
                >
                  <p
                    className={
                      item.effective
                        ? 'text-primary-container'
                        : 'text-on-surface-variant line-through'
                    }
                  >
                    {index + 1}.{' '}
                    {item.question.text}
                  </p>

                  <p className="text-xs text-on-surface-variant mt-1">
                    {!item.effective
                      ? '현재 결과에 미사용'
                      : item.answerCode
                        ? item.question.options.find(
                            (option) =>
                              option.code ===
                              item.answerCode,
                          )?.text
                        : '아직 답하지 않음'}
                  </p>
                </li>
              ),
            )}
          </ol>
        </details>
      )}
    </>,
  );
};

export default ExplorationQuestion;