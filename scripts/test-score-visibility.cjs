const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = join(__dirname, '..');

function compile(relativePath, dependencies = {}) {
  const source = readFileSync(join(root, relativePath), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, {
    exports,
    require: (name) => {
      if (!Object.hasOwn(dependencies, name)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const score = compile('src/utils/score.ts');
const utils = compile('src/utils/competencyScores.ts', { './score': score });

const complete = {
  mathLogic: 8,
  problemSolving: 0,
  infoTech: 15,
  implementation: 25,
  systemUnderstanding: 31,
  dataAnalysis: 70,
  communication: 75,
  collaboration: 90,
  selfManagement: 100,
};

test('missing/invalid competency vector does not produce example scores', () => {
  assert.equal(utils.parseCompetencyScores(null), null);
  assert.equal(utils.parseCompetencyScores(''), null);
  assert.equal(utils.parseCompetencyScores('{invalid'), null);
  assert.equal(utils.parseCompetencyScores('[]'), null);
  assert.equal(utils.parseCompetencyScores('{}'), null);
});

test('actual zero remains zero and 8 stays 8 (no 10x or 100x)', () => {
  const scores = utils.parseCompetencyScores(JSON.stringify(complete));
  assert.equal(scores[0], 8);
  assert.equal(scores[1], 0);
  assert.equal(utils.hasCompleteScores(scores), true);
});

test('missing score is null, not an example score or zero', () => {
  const scores = utils.parseCompetencyScores(JSON.stringify({ mathLogic: 8, problemSolving: null }));
  assert.equal(scores[0], 8);
  assert.equal(scores[1], null);
  assert.equal(scores[5], null);
  assert.equal(utils.hasCompleteScores(scores), false);
  assert.equal(utils.scoreText(null), '-');
});

test('empty strings and booleans are not interpreted as scores', () => {
  assert.equal(utils.toNullableScore(''), null);
  assert.equal(utils.toNullableScore('   '), null);
  assert.equal(utils.toNullableScore(null), null);
  assert.equal(utils.toNullableScore(false), null);
  assert.equal(utils.toNullableScore('not-a-number'), null);
  assert.equal(utils.toNullableScore(0), 0);
  assert.equal(utils.toNullableScore(8), 8);
  assert.equal(utils.toNullableScore(-9), 0);
  assert.equal(utils.toNullableScore(102), 100);
});

test('missing major scores remain null', () => {
  assert.equal(utils.parseMajorRequiredScores(undefined).every((value) => value === null), true);
  const scores = utils.parseMajorRequiredScores({ reqMathLogic: 0, reqProblemSolving: null, reqDataAnalysis: 8 });
  assert.equal(scores[0], 0);
  assert.equal(scores[1], null);
  assert.equal(scores[5], 8);
});

test('both pages hide radar for incomplete scores and no longer use default arrays', () => {
  for (const file of [
    'src/pages/Analysis/Dashboard/index.tsx',
    'src/pages/Analysis/SharedResult/index.tsx',
  ]) {
    const text = readFileSync(join(root, file), 'utf8');
    assert.doesNotMatch(text, /DEFAULT_USER_SCORES|DEFAULT_MAJOR_REQUIRED_SCORES/);
    assert.match(text, /hasCompleteScores\(userScores\)/);
  }
});
