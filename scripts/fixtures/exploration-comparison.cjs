// ResultComparisonProjector 및 ExplorationComparisonApiTest의 계약을 따르는 화면 검증용 자료.
const candidates = [
  ['MAJOR_ROW_2', '고고학과'], ['MAJOR_ROW_3', '사학과'], ['MAJOR_ROW_9', '역사문화학과'],
  ['MAJOR_ROW_11', '국어국문학과'], ['MAJOR_ROW_12', '영어영문학과'],
  ['MAJOR_ROW_13', '철학과'], ['MAJOR_ROW_14', '언어학과'],
  ['MAJOR_ROW_15', '문헌정보학과'], ['MAJOR_ROW_16', '문화인류학과'],
].map(([majorCode, majorName]) => ({ majorCode, majorName, groupCode: 'HUM' }));

const card = (code) => ({
  ...candidates.find((m) => m.majorCode === code),
  learningSets: ['LEARN_HUM'], activityAxes: ['ACT_RES'],
  primaryInterestAxes: ['INT_HUM'], secondaryInterestAxes: [],
  careerInformationStatus: 'NOT_PROVIDED', preparationInformationStatus: 'NOT_PROVIDED',
});

const result = {
  resultId: 34, sessionId: 21, status: 'READY', resultVersion: 'RESULT_V1', resultContractVersion: 'RESULT_V1',
  completedAt: '2026-11-16T07:00:00Z', reasonCodes: [],
  groups: [{ groupCode: 'HUM', majorCodes: candidates.slice(0, 7).map((m) => m.majorCode) }],
  majors: candidates.slice(0, 7).map((m) => ({ ...m, explanation: '응답을 바탕으로 먼저 탐색해볼 수 있는 전공이에요.' })),
  cautions: [], nextActivities: [],
  capabilities: { comparisonAvailable: true, supportAvailable: false, sharingAvailable: false, planAvailable: false },
  activityAvailability: 'UNAVAILABLE',
};

const overview = { resultId: 34, sessionId: 21, available: true, candidateChoices: candidates, reasonCode: 'SELECT_TWO_CANDIDATES' };
const unavailable = { ...overview, available: false, candidateChoices: [], reasonCode: 'COMPARISON_TARGET_UNAVAILABLE' };
const pair = (left, right, state = 'DISTINCT_DIRECTIONS') => ({
  resultId: 34, sessionId: 21, available: true, left: card(left), right: card(right), comparisonState: state,
  comparisonSets: state === 'DISTINCT_DIRECTIONS' ? [{
    comparisonSet: 'CMP-HISTORY',
    leftDirections: [{ directionCode: 'ARCHAEOLOGY_FIELD', descriptions: [{ questionId: 'Q-1', text: '유적과 유물을 직접 조사하는 활동' }] }],
    rightDirections: [{ directionCode: 'HISTORY_DOCUMENT', descriptions: [{ questionId: 'Q-1', text: '문헌과 기록을 읽고 비교하는 활동' }] }],
    focusResponses: [{ questionId: 'Q-1', answerText: '아직 잘 모르겠어요', uncertain: true, selectedDirection: null }],
  }] : [],
  skippedComparisonSets: state === 'SAME_DIRECTIONS' ? [{ comparisonSet: 'CMP-HISTORY', reasonCode: 'SAME_DIRECTION_MEMBERSHIP', declaredSkipPair: true }] : [],
  message: '고정된 매핑과 당시 응답을 나란히 확인하는 탐색 자료입니다.',
});

module.exports = { candidates, result, overview, unavailable, pair };
