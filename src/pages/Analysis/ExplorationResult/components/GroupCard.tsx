import { useState } from 'react';
import type { ExplorationGroupCard, ExplorationMajorCard, ReasonKind } from '../../../../types/exploration';
import EvidenceBadge from './EvidenceBadge';

const REASON_LABEL: Record<ReasonKind, { text: string; icon: string }> = {
  INTEREST: { text: '관심', icon: 'favorite' },
  ACTIVITY: { text: '활동', icon: 'directions_run' },
  LEARNING: { text: '학습', icon: 'menu_book' },
};

const MajorItem = ({ major }: { major: ExplorationMajorCard }) => (
  <li className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4">
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
  </li>
);

const GroupCard = ({ group, index }: { group: ExplorationGroupCard; index: number }) => {
  const [showCollapsed, setShowCollapsed] = useState(false);
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
          <MajorItem key={m.majorCode} major={m} />
        ))}
        {showCollapsed && collapsed.map((m) => <MajorItem key={m.majorCode} major={m} />)}
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
    </section>
  );
};

export default GroupCard;
