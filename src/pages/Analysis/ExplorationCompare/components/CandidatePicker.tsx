import { useState } from 'react';
import type { ComparisonCandidate } from '../../../../types/exploration';

interface Props {
  candidates: ComparisonCandidate[];
  initialCodes: string[];
  onCompare: (codes: string[]) => void;
}

const CandidatePicker = ({ candidates, initialCodes, onCompare }: Props) => {
  const [selected, setSelected] = useState(() => initialCodes.filter((code) => candidates.some((m) => m.majorCode === code)).slice(0, 2));
  const toggle = (code: string) => setSelected((prev) => prev.includes(code)
    ? prev.filter((item) => item !== code) : prev.length < 2 ? [...prev, code] : prev);

  return (
    <section aria-labelledby="choose-title" className="rounded-brand bg-surface-container-low p-5 sm:p-6">
      <h2 id="choose-title" className="text-lg font-bold text-primary-container">비교할 전공을 2개 골라주세요</h2>
      <p role="status" className="mt-2 mb-5 text-sm text-on-surface-variant">{selected.length}개 선택했어요. 선택한 전공을 다시 누르면 해제돼요.</p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {candidates.map((major) => {
          const picked = selected.includes(major.majorCode);
          return <li key={major.majorCode}>
            <button type="button" aria-pressed={picked} disabled={!picked && selected.length === 2} onClick={() => toggle(major.majorCode)}
              className={`w-full min-h-[64px] rounded-xl border p-4 text-left disabled:opacity-50 ${picked ? 'bg-secondary text-white border-secondary' : 'bg-surface-container-lowest border-outline-variant/30 text-primary-container'}`}>
              <span className="font-bold">{major.name}</span>
              {major.groupName && <span className="block mt-1 text-xs">{major.groupName}</span>}
              {picked && <span className="sr-only"> — 선택됨</span>}
            </button>
          </li>;
        })}
      </ul>
      <button type="button" disabled={selected.length !== 2} onClick={() => onCompare(selected)}
        className="mt-6 min-h-[44px] rounded-lg bg-primary-container px-6 py-3 text-white font-bold disabled:opacity-50">
        두 전공 비교하기
      </button>
    </section>
  );
};

export default CandidatePicker;
