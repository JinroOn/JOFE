import { useState } from 'react';
import type { ExplorationGroupCard, ExplorationMajorCard, ReasonKind } from '../../../../types/exploration';
import EvidenceBadge from './EvidenceBadge';
import MajorDetailDialog from './MajorDetailDialog';

const REASON_LABEL: Record<ReasonKind, { text: string; icon: string }> = {
  INTEREST: { text: '관심', icon: 'favorite' },
  ACTIVITY: { text: '활동', icon: 'directions_run' },
  LEARNING: { text: '학습', icon: 'menu_book' },
};

export interface CompareSelection {
  selected: string[];
  max: number;
  onToggle: (majorCode: string) => void;
}

interface MajorItemProps {
  major: ExplorationMajorCard;
  compare: CompareSelection;
  onDetail: () => void;
}

const MajorItem = ({ major, compare, onDetail }: MajorItemProps) => {
  const picked = compare.selected.includes(major.majorCode);
  const full = !picked && compare.selected.length >= compare.max;
  return (
    <li className={`rounded-xl border p-4 bg-surface-container-lowest ${picked ? 'border-secondary' : 'border-outline-variant/30'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="font-bold text-primary-container">{major.name}</h4>
        <EvidenceBadge level={major.evidenceLevel} />
      </div>
      <ul className="space-y-2">
        {major.reasons.map((r) => (
          <li key={`${r.kind}-${r.reasonCode}`} className="flex items-start gap-2 text-sm text-on-surface-variant">
            <span className="flex-none inline-flex items-center gap-1 rounded-md bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-primary-container">
              <span className="material-symbols-outlined text-[13px]" aria-hidden="true">{REASON_LABEL[r.kind].icon}</span>
              {REASON_LABEL[r.kind].text}
            </span>
            <span className="leading-relaxed">{r.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onDetail}
        className="min-h-[44px] inline-flex items-center gap-1 rounded-lg border border-outline-variant/40 px-3 text-sm font-semibold text-primary-container"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">info</span>
        자세히 보기
        <span className="sr-only"> — {major.name}</span>
      </button>
      <button
        type="button"
        aria-pressed={picked}
        disabled={full}
        onClick={() => compare.onToggle(major.majorCode)}
        className={`min-h-[44px] inline-flex items-center gap-1 rounded-lg px-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
          picked ? 'bg-secondary text-white' : 'bg-surface-container-low text-secondary'
        }`}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{picked ? 'check' : 'add'}</span>
        {picked ? '비교에 담음' : full ? `비교는 최대 ${compare.max}개` : '비교에 담기'}
        <span className="sr-only"> — {major.name}</span>
      </button>
      </div>
    </li>
  );
};

interface GroupCardProps {
  group: ExplorationGroupCard;
  index: number;
  compare: CompareSelection;
}

const GroupCard = ({ group, index, compare }: GroupCardProps) => {
  const [showCollapsed, setShowCollapsed] = useState(false);
  const [detail, setDetail] = useState<ExplorationMajorCard | null>(null);
  const visible = group.majors.filter((m) => !m.collapsed);
  const collapsed = group.majors.filter((m) => m.collapsed);
  const headingId = `group-${group.groupCode}`;

  return (
    <section aria-labelledby={headingId} className="rounded-brand bg-surface-container-low p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 id={headingId} className="text-lg font-bold text-primary-container">
          <span className="sr-only">탐색 후보 {index + 1}: </span>
          {group.name}
        </h3>
        <EvidenceBadge level={group.evidenceLevel} />
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{group.summary}</p>
      <ul className="space-y-3">
        {visible.map((m) => (
          <MajorItem key={m.majorCode} major={m} compare={compare} onDetail={() => setDetail(m)} />
        ))}
        {showCollapsed &&
          collapsed.map((m) => <MajorItem key={m.majorCode} major={m} compare={compare} onDetail={() => setDetail(m)} />)}
      </ul>
      {collapsed.length > 0 && (
        <button
          type="button"
          aria-expanded={showCollapsed}
          onClick={() => setShowCollapsed((v) => !v)}
          className="mt-3 min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-secondary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            {showCollapsed ? 'expand_less' : 'expand_more'}
          </span>
          {showCollapsed ? '접기' : `조금 낯설 수 있는 후보 ${collapsed.length}개 더 보기`}
        </button>
      )}
      {detail && (
        <MajorDetailDialog
          major={detail}
          groupName={group.name}
          picked={compare.selected.includes(detail.majorCode)}
          compareFull={!compare.selected.includes(detail.majorCode) && compare.selected.length >= compare.max}
          onToggleCompare={() => compare.onToggle(detail.majorCode)}
          onClose={() => setDetail(null)}
        />
      )}
    </section>
  );
};

export default GroupCard;
