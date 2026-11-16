const STATUS_LABEL: Record<
  string,
  { text: string; cls: string }
> = {
  DRAFT: {
    text: '작성 중',
    cls: 'bg-surface-container-high text-on-surface-variant',
  },
  REVIEWED: {
    text: '검토 완료',
    cls: 'bg-blue-100 text-blue-700',
  },
  ACTIVE: {
    text: '사용 중',
    cls: 'bg-green-100 text-green-700',
  },
  ARCHIVED: {
    text: '보관',
    cls: 'bg-surface-container text-on-surface-variant',
  },
};

const StatusBadge = ({
  status,
}: {
  status: string | null | undefined;
}) => {
  const badge = status
    ? STATUS_LABEL[status]
    : undefined;

  const label = badge ?? {
    text: '상태 미확인',
    cls: 'bg-surface-container-high text-on-surface-variant',
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${label.cls}`}
    >
      {label.text}
    </span>
  );
};

export default StatusBadge;
