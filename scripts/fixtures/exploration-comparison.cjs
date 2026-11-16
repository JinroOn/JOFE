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

const preparationResponse = { questionId: 'PREP-1', questionText: '실험 수업을 해본 경험이 있나요?', answerText: '아직 경험이 없어요', usage: 'PREPARATION_RESPONSE_ONLY' };
const displayResult = {
  ...result,
  displayVersion: 'RESULT_DISPLAY_V1_0', displaySource: 'COMPLETION_SNAPSHOT',
  groups: [{ ...result.groups[0], name: '인문', summary: '언어·역사·문화에 관한 전공을 먼저 탐색해볼 수 있습니다.', evidenceLevel: 'LOW_EVIDENCE', reasonCodes: ['USED_INTEREST_AXIS_INSUFFICIENT'] }],
  majors: result.majors.map((major) => ({
    ...major, name: major.majorName, majorId: null, collapsed: false, evidenceLevel: 'LOW_EVIDENCE',
    reasons: [
      { kind: 'INTEREST', reasonCode: 'INTEREST_RESPONSES_USED', text: '인문·언어·역사에 관한 관심 응답을 탐색 단서로 참고했습니다.' },
      { kind: 'ACTIVITY', reasonCode: 'ACTIVITY_RESPONSES_USED', text: '조사와 연구에 관한 활동 응답을 탐색 단서로 참고했습니다.' },
      { kind: 'LEARNING', reasonCode: 'LEARNING_EVIDENCE_NOT_USED', text: '학습 응답이 충분하지 않아 해당 근거를 사용하지 않았습니다.' },
    ],
  })),
  cautions: [{ majorCode: 'MAJOR_ROW_2', tagCode: 'CAUTION_MATH', text: '수학을 어떤 방식으로 사용하는지 확인해볼 수 있습니다.', checkAction: '공식 교육과정에서 기초 과목과 예시 과제를 확인해보세요.', usage: 'DEV_EXPLORATION_CHECK_ONLY' }],
  preparationResponses: [preparationResponse],
  recheckAxes: [{ metricCode: 'INT_HUM', name: '인문·언어·역사', reasonCode: 'INTEREST_RESPONSES_INSUFFICIENT' }],
  cautionAvailability: 'EVALUATED', cautionUnavailableReason: null,
};

module.exports = { candidates, result, overview, unavailable, pair, preparationResponse, displayResult };
