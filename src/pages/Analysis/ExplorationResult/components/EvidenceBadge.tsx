import type { EvidenceLevel } from '../../../../types/exploration';

// 색만으로 구분하지 않도록 아이콘과 문구를 함께 쓴다
const LABEL: Record<EvidenceLevel, { text: string; icon: string; className: string }> = {
  CONFIRMED: { text: '여러 응답에서 확인', icon: 'task_alt', className: 'bg-secondary/10 text-secondary' },
  LOW_EVIDENCE: { text: '일부 응답에서 확인', icon: 'radio_button_partial', className: 'bg-surface-container-high text-on-surface-variant' },
  NO_EVIDENCE: { text: '확인할 정보 부족', icon: 'help', className: 'bg-surface-container-high text-on-surface-variant' },
};

const EvidenceBadge = ({ level }: { level: EvidenceLevel }) => {
  const { text, icon, className } = LABEL[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{icon}</span>
      <span>
        <span className="sr-only">근거 수준: </span>
        {text}
      </span>
    </span>
  );
};

export default EvidenceBadge;
