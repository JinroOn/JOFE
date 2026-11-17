const row = (type, sessionId, status, resultAvailability, resultId, occurredAt) => ({
  key: `${type}:SESSION:${sessionId}`, sessionKey: `${type}:SESSION:${sessionId}`, sessionId, type,
  status, stage: type === 'LEGACY' ? 12 : 3, startedAt: occurredAt,
  completedAt: status === 'completed' ? occurredAt : null, occurredAt,
  resultKey: resultId === null ? null : `${type}:RESULT:${resultId}`, resultId, resultAvailability,
  resultStatus: type === 'EXPLORATION_V1' ? 'READY' : null,
  resultContractVersion: null, resultUnavailableReason: resultAvailability === 'UNAVAILABLE' ? 'CATALOG_INTEGRITY_ERROR' : null,
  runMode: type === 'LEGACY' ? null : 'DEV', testOnly: type !== 'LEGACY',
  nextAction: status === 'in_progress' ? 'RESUME' : resultAvailability === 'AVAILABLE' ? 'VIEW_RESULT' : 'NONE',
  links: { session: '/api/DO_NOT_NAVIGATE/session', resume: '/api/DO_NOT_NAVIGATE/resume', result: '/api/DO_NOT_NAVIGATE/result' },
});

// ID와 시간이 겹쳐도 서버 순서를 유지해야 한다. 시간순으로 다시 정렬하면 이 순서가 바뀐다.
const items = [
  row('EXPLORATION_V1', 11, 'completed', 'AVAILABLE', 501, '2026-11-15T10:00:00'),
  row('LEGACY', 11, 'completed', 'AVAILABLE', 101, '2026-11-17T10:00:00'),
  row('LEGACY', 12, 'completed', 'MISSING', null, '2026-11-14T10:00:00'),
  row('LEGACY', 13, 'completed', 'AMBIGUOUS', null, '2026-11-13T10:00:00'),
  row('EXPLORATION_V1', 14, 'completed', 'UNAVAILABLE', null, '2026-11-12T10:00:00'),
  row('LEGACY', 15, 'in_progress', 'NOT_COMPLETED', null, '2026-11-11T10:00:00'),
  row('EXPLORATION_V1', 16, 'in_progress', 'NOT_COMPLETED', null, '2026-11-10T10:00:00'),
  row('EXPLORATION_V1', 17, 'abandoned', 'NOT_COMPLETED', null, '2026-11-09T10:00:00'),
];
const cursor = 'signed-cursor+opaque/keep=value';
const page = (rows, hasMore = false, nextCursor = null) => ({
  items: rows, limit: 5, hasMore, nextCursor, filters: { type: 'ALL', status: 'ALL' }, runMode: 'DEV', testOnly: true,
});
const legacySession = (id, status = 'completed') => ({
  id, userId: 1, status, currentStep: 12, inputSnapshot: '{}',
  startedAt: '2026-11-17T10:00:00', completedAt: status === 'completed' ? '2026-11-17T11:00:00' : null,
  createdAt: '2026-11-17T10:00:00', updatedAt: '2026-11-17T11:00:00',
});
module.exports = { items, cursor, page, legacySession };
