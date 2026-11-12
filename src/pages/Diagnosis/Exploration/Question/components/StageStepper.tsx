import type { ExplorationStage } from '../../../../../types/exploration';

const STAGES: { key: ExplorationStage; label: string }[] = [
  { key: 'STAGE_1', label: '공통 탐색' },
  { key: 'STAGE_2', label: '맞춤 탐색' },
  { key: 'STAGE_3', label: '탐색 전 확인' },
];

interface StageStepperProps {
  stage: ExplorationStage;
}

// 분기에 따라 분모가 바뀌므로 퍼센트 대신 단계형 진행 막대를 쓴다
const StageStepper = ({ stage }: StageStepperProps) => {
  const current = STAGES.findIndex((s) => s.key === stage);
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="검사 단계">
      {STAGES.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s.key} aria-current={state === 'current' ? 'step' : undefined}>
            <div
              className={`h-1.5 rounded-full ${
                state === 'todo' ? 'bg-surface-container-high' : state === 'done' ? 'bg-secondary/60' : 'bg-secondary'
              }`}
            />
            <p
              className={`mt-2 text-[11px] sm:text-xs ${
                state === 'current' ? 'font-bold text-primary-container' : 'text-on-surface-variant'
              }`}
            >
              {i + 1}단계 · {s.label}
              {state === 'done' && <span className="sr-only"> (완료)</span>}
            </p>
          </li>
        );
      })}
    </ol>
  );
};

export default StageStepper;
