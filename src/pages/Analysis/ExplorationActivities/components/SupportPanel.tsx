import { useEffect, useRef, useState } from 'react';
import {
  createMutationId,
  saveExplorationSupportAnswer,
  startExplorationActivitySupport,
  toExplorationErrorCode,
} from '../../../../api/exploration';
import type { ExplorationErrorCode, SupportSession } from '../../../../types/exploration';

interface SupportPanelProps {
  resultId: number;
  personalized: boolean;
  onChanged: () => void;
}

type Mode = 'IDLE' | 'LOADING' | 'ANSWERING' | 'DONE' | 'UNAVAILABLE';

// 결과 후 선택 질문(탐색 활동 선호). 응답은 활동만 바꾸고 추천 전공·순서는 바꾸지 않는다.
const SupportPanel = ({ resultId, personalized, onChanged }: SupportPanelProps) => {
  const [mode, setMode] = useState<Mode>(personalized ? 'DONE' : 'IDLE');
  const [support, setSupport] = useState<Pick<SupportSession, 'supportRevision' | 'issuedQuestions' | 'answers'> | null>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ExplorationErrorCode | null>(null);
  const [pending, setPending] = useState<{ issuedId: number; optionCode: string; id: string } | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const start = async () => {
    setMode('LOADING');
    setError(null);
    setPending(null);
    try {
      const res = await startExplorationActivitySupport(resultId);
      setSupport(res);
      const answered = new Set(res.answers.map(({ issuedId }) => issuedId));
      const firstOpen = res.issuedQuestions.findIndex(({ issuedId }) => !answered.has(issuedId));
      setIndex(Math.max(firstOpen, 0));
      setMode(res.issuedQuestions.length ? 'ANSWERING' : 'UNAVAILABLE');
    } catch (e) {
      setError(toExplorationErrorCode(e));
      setMode(personalized ? 'DONE' : 'IDLE');
    }
  };

  const question = support?.issuedQuestions[index];

  useEffect(() => {
    if (mode === 'ANSWERING') titleRef.current?.focus();
  }, [mode, index]);

  const save = async (target = pending) => {
    if (!support || !target) return;
    setSaving(true);
    setError(null);
    try {
      const res = await saveExplorationSupportAnswer(resultId, target.issuedId, {
        optionCode: target.optionCode,
        expectedSupportRevision: support.supportRevision,
        clientMutationId: target.id,
      });
      setPending(null);
      setSupport(res);
      const savedIndex = res.issuedQuestions.findIndex(({ issuedId }) => issuedId === target.issuedId);
      if (savedIndex >= 0 && savedIndex + 1 < res.issuedQuestions.length) setIndex(savedIndex + 1);
      else {
        setMode('DONE');
        onChanged();
      }
    } catch (e) {
      setError(toExplorationErrorCode(e));
    } finally {
      setSaving(false);
    }
  };

  const select = (optionCode: string) => {
    if (!question || saving) return;
    const next = { issuedId: question.issuedId, optionCode, id: createMutationId() };
    setPending(next);
    void save(next);
  };

  const finishEarly = () => {
    setPending(null);
    setError(null);
    setMode('DONE');
    onChanged();
  };

  if (mode === 'UNAVAILABLE') {
    return (
      <p role="status" className="rounded-brand bg-surface-container-low p-5 sm:p-6 text-sm text-on-surface-variant">
        이 결과에서 추가로 답할 활동 맞춤 질문이 없어요.
      </p>
    );
  }

  if (mode === 'IDLE' || mode === 'DONE') {
    return (
      <section aria-labelledby="support-title" className="rounded-brand bg-surface-container-low p-5 sm:p-6">
        <h2 id="support-title" className="font-bold text-primary-container mb-1">
          {mode === 'DONE' ? '내 상황에 맞춘 활동이에요' : '내 상황에 맞게 활동 바꾸기'}
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
          해보고 싶은 활동 방식을 알려주면 추천 활동에 반영해요. 질문은 원하는 만큼 답할 수 있어요.
        </p>
        {error && (
          <p role="alert" className="text-sm text-error mb-3">
            질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}
        <button
          type="button"
          onClick={() => void start()}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-primary-container text-white text-sm font-bold"
        >
          {mode === 'DONE' ? '답변 확인하기' : '질문에 답하기'}
        </button>
      </section>
    );
  }

  if (mode === 'LOADING' || !support || !question) {
    return (
      <section className="rounded-brand bg-surface-container-low p-5 sm:p-6">
        <p role="status" className="text-sm text-on-surface-variant">질문을 불러오는 중이에요…</p>
      </section>
    );
  }

  const savedAnswer = support.answers.find(({ issuedId }) => issuedId === question.issuedId)?.optionCode;
  const selected = pending?.issuedId === question.issuedId ? pending.optionCode : savedAnswer;
  const options = [...question.options].sort((a, b) => a.order - b.order);
  const titleId = `support-q-${question.issuedId}`;

  return (
    <section aria-labelledby={titleId} className="rounded-brand bg-surface-container-low p-5 sm:p-6">
      <p className="text-xs text-on-surface-variant mb-2">
        활동 맞춤 질문 {index + 1} / {support.issuedQuestions.length}
      </p>
      <fieldset>
        <legend className="sr-only">{question.text}</legend>
        <h2 id={titleId} ref={titleRef} tabIndex={-1} className="font-bold text-primary-container mb-4 outline-none">
          {question.text}
        </h2>
        <div role="radiogroup" aria-labelledby={titleId} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {options.map((o) => {
            const checked = selected === o.code;
            return (
              <button
                key={o.code}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={saving}
                onClick={() => select(o.code)}
                className={`min-h-[44px] flex items-center gap-3 text-left rounded-xl border-2 px-4 py-3 text-sm disabled:cursor-wait ${
                  checked ? 'border-secondary bg-secondary/5 font-bold text-secondary' : 'border-outline-variant/30 bg-surface-container-lowest text-primary-container'
                }`}
              >
                <span aria-hidden="true" className={`flex-none w-4 h-4 rounded-full border-2 ${checked ? 'border-secondary bg-secondary' : 'border-outline'}`} />
                {o.text}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite" className="mt-3 min-h-[20px]">
        {saving && <p className="text-xs text-on-surface-variant">저장 중…</p>}
        {error && (
          <div role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            <p className="mb-2">
              {error === 'STALE_REVISION'
                ? '다른 창에서 답변이 먼저 바뀌었어요. 최신 상태를 불러온 뒤 다시 골라주세요.'
                : '답변을 저장하지 못했어요. 고른 답은 그대로 남아 있어요.'}
            </p>
            {error === 'STALE_REVISION' ? (
              <button type="button" onClick={() => void start()} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
                최신 상태 불러오기
              </button>
            ) : (
              <button type="button" onClick={() => void save()} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
                다시 시도
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={index === 0 || saving}
          onClick={() => setIndex(index - 1)}
          className="min-h-[44px] px-4 rounded-lg border border-outline-variant text-sm font-semibold text-primary-container bg-surface-container-lowest disabled:opacity-50"
        >
          ← 이전
        </button>
        <button type="button" disabled={saving} onClick={finishEarly} className="min-h-[44px] px-4 text-sm font-semibold text-on-surface-variant">
          여기까지만 답하기
        </button>
      </div>
    </section>
  );
};

export default SupportPanel;
