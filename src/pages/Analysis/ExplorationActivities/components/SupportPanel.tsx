import { useEffect, useRef, useState } from 'react';
import {
  createMutationId,
  saveExplorationSupportAnswer,
  startExplorationSupport,
  toExplorationErrorCode,
} from '../../../../api/exploration';
import type { ExplorationErrorCode, SupportSession } from '../../../../types/exploration';

interface SupportPanelProps {
  resultId: number;
  personalized: boolean;
  onChanged: () => void;
}

type Mode = 'IDLE' | 'LOADING' | 'ANSWERING' | 'DONE';

// 결과 후 선택 질문(탐색 활동 선호). 응답은 활동만 바꾸고 추천 전공·순서는 바꾸지 않는다.
const SupportPanel = ({ resultId, personalized, onChanged }: SupportPanelProps) => {
  const [mode, setMode] = useState<Mode>(personalized ? 'DONE' : 'IDLE');
  const [support, setSupport] = useState<SupportSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ExplorationErrorCode | null>(null);
  const [pending, setPending] = useState<{ issuedId: number; optionCode: string; id: string } | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const start = async (fromBeginning: boolean) => {
    setMode('LOADING');
    setError(null);
    try {
      const res = await startExplorationSupport(resultId, 'ACTIVITY');
      const map = Object.fromEntries(res.answers.map((a) => [a.issuedId, a.optionCode]));
      setSupport(res);
      setAnswers(map);
      const firstOpen = res.issuedQuestions.findIndex((q) => !map[q.issuedId]);
      setIndex(fromBeginning || firstOpen === -1 ? 0 : firstOpen);
      setMode('ANSWERING');
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
        expectedRevision: support.supportRevision,
        clientMutationId: target.id,
      });
      setPending(null);
      setSupport({ ...support, supportRevision: res.supportRevision });
      setAnswers((prev) => ({ ...prev, [res.issuedId]: res.optionCode }));
      if (index + 1 < support.issuedQuestions.length) setIndex(index + 1);
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
    setMode('DONE');
    onChanged();
  };

  if (mode === 'IDLE' || mode === 'DONE') {
    return (
      <section aria-labelledby="support-title" className="rounded-brand bg-surface-container-low p-5 sm:p-6">
        <h2 id="support-title" className="font-bold text-primary-container mb-1">
          {mode === 'DONE' ? '내 상황에 맞춘 활동이에요' : '내 상황에 맞게 활동 바꾸기'}
        </h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
          시간·비용·장소와 해보고 싶은 방식을 알려주면 활동을 바꿔드려요. 최대 5개 질문이고, 답해도 추천 전공과
          순서는 바뀌지 않아요.
        </p>
        {error && (
          <p role="alert" className="text-sm text-error mb-3">
            질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </p>
        )}
        <button
          type="button"
          onClick={() => void start(mode === 'DONE')}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-primary-container text-white text-sm font-bold"
        >
          {mode === 'DONE' ? '답변 다시 고르기' : '질문에 답하기'}
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

  const selected = pending?.issuedId === question.issuedId ? pending.optionCode : answers[question.issuedId];
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
              <button type="button" onClick={() => void start(false)} className="min-h-[44px] px-4 rounded-lg bg-primary-container text-white text-sm font-bold">
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
