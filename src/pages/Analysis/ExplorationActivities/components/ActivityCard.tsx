import type { ActivityKind, ActivityTag, ExplorationActivity } from '../../../../types/exploration';

const KIND_LABEL: Record<ActivityKind, { text: string; icon: string }> = {
  INFO_CHECK: { text: '정보 확인', icon: 'search' },
  HANDS_ON: { text: '직접 해보기', icon: 'construction' },
  COMPARE_ASK: { text: '비교·질문', icon: 'compare_arrows' },
};

const TAG_LABEL: Record<ActivityTag, string> = {
  FREE: '무료',
  ONLINE: '온라인',
  SOLO: '혼자 가능',
  WITH_OTHERS: '다른 사람과 함께',
};

interface ActivityCardProps {
  activity: ExplorationActivity;
  compact?: boolean;
}

const ActivityCard = ({ activity, compact = false }: ActivityCardProps) => (
  <article className="flex flex-col h-full rounded-brand bg-surface-container-lowest border border-outline-variant/20 p-5 cloud-shadow">
    <p className="inline-flex items-center gap-1 text-xs font-bold text-secondary mb-2">
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{KIND_LABEL[activity.kind].icon}</span>
      {KIND_LABEL[activity.kind].text} · {activity.duration}
    </p>
    <h3 className="font-bold text-primary-container mb-2">{activity.title}</h3>
    <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{activity.description}</p>
    {!compact && (
      <dl className="space-y-2 text-xs text-on-surface-variant mb-3">
        <div>
          <dt className="font-semibold text-primary-container">알게 되는 것</dt>
          <dd className="leading-relaxed">{activity.outcome}</dd>
        </div>
        <div>
          <dt className="font-semibold text-primary-container">결과물 예시</dt>
          <dd className="leading-relaxed">{activity.exampleOutput}</dd>
        </div>
      </dl>
    )}
    {activity.tags.length > 0 && (
      <ul className="mt-auto flex flex-wrap gap-1.5" aria-label="활동 조건">
        {activity.tags.map((t) => (
          <li key={t} className="rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-primary-container">
            {TAG_LABEL[t]}
          </li>
        ))}
      </ul>
    )}
  </article>
);

export default ActivityCard;
