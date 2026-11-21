import { useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  ComparisonCandidate,
} from '../../../../types/exploration';

interface Props {
  candidates: ComparisonCandidate[];
  initialCodes: string[];
  onCompare: (codes: string[]) => void;
}

const COMPARE_MAX = 2;

const CandidatePicker = ({
  candidates,
  initialCodes,
  onCompare,
}: Props) => {
  const [selected, setSelected] = useState(() =>
    initialCodes
      .filter((code) =>
        candidates.some(
          (major) => major.majorCode === code,
        ),
      )
      .slice(0, COMPARE_MAX),
  );

  const toggle = (code: string) => {
    setSelected((previous) =>
      previous.includes(code)
        ? previous.filter(
            (item) => item !== code,
          )
        : previous.length < COMPARE_MAX
          ? [...previous, code]
          : previous,
    );
  };

  const ready =
    selected.length === COMPARE_MAX;

  const compareBar =
    selected.length > 0
      ? createPortal(
          <div
            role="region"
            aria-label="전공 비교 선택"
            className="fixed inset-x-0 bottom-0 z-[80] border-t border-outline-variant/30 bg-surface-container-lowest/95 backdrop-blur shadow-[0_-10px_35px_rgba(10,25,47,0.12)] px-4 py-3"
          >
            <div className="max-w-[1040px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p
                  role="status"
                  aria-live="polite"
                  className="text-sm font-bold text-primary-container"
                >
                  비교에 담은 전공{' '}
                  {selected.length}/{COMPARE_MAX}
                </p>

                <p className="mt-1 text-xs text-on-surface-variant">
                  {ready
                    ? '전공 2개를 선택했습니다. 바로 비교할 수 있어요.'
                    : '전공 1개를 더 선택하면 비교할 수 있어요.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelected([])
                  }
                  className="shrink-0 min-h-[44px] rounded-lg px-4 text-sm font-semibold text-on-surface-variant"
                >
                  비우기
                </button>

                <button
                  type="button"
                  disabled={!ready}
                  onClick={() =>
                    onCompare(selected)
                  }
                  className="flex-1 sm:flex-none min-h-[44px] rounded-lg bg-primary-container px-6 py-3 text-white font-bold disabled:opacity-50"
                >
                  두 전공 비교하기
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <section
        aria-labelledby="choose-title"
        className="rounded-brand bg-surface-container-low p-5 sm:p-6 pb-32 sm:pb-28"
      >
        <h2
          id="choose-title"
          className="text-lg font-bold text-primary-container"
        >
          비교할 전공을 2개 골라주세요
        </h2>

        <p
          role="status"
          className="mt-2 mb-5 text-sm text-on-surface-variant"
        >
          {selected.length}개 선택했어요.
          선택한 전공을 다시 누르면 해제돼요.
        </p>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {candidates.map((major) => {
            const picked = selected.includes(
              major.majorCode,
            );

            return (
              <li key={major.majorCode}>
                <button
                  type="button"
                  aria-pressed={picked}
                  disabled={
                    !picked && ready
                  }
                  onClick={() =>
                    toggle(major.majorCode)
                  }
                  className={`w-full min-h-[64px] rounded-xl border p-4 text-left disabled:opacity-50 ${
                    picked
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-surface-container-lowest border-outline-variant/30 text-primary-container'
                  }`}
                >
                  <span className="font-bold">
                    {major.name}
                  </span>

                  {major.groupName && (
                    <span className="block mt-1 text-xs">
                      {major.groupName}
                    </span>
                  )}

                  {picked && (
                    <span className="sr-only">
                      {' '}— 선택됨
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {compareBar}
    </>
  );
};

export default CandidatePicker;