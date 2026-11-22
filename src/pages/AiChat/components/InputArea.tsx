import type { SyntheticEvent } from 'react';

// 서비스에 없는 자료(강의 목록, 인터뷰)를 묻는 질문은 두지 않는다
const quickQuestions = [
  '전공을 고를 때 무엇을 먼저 볼까?',
  '필요한 코딩 역량은?',
  '관련 자격증 추천',
  '관심 전공을 미리 경험해 볼 방법은?',
];

interface Props {
  message: string;
  onChange: (v: string) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  onQuickQuestion: (q: string) => void;
  disabled?: boolean;
}

const InputArea = ({ message, onChange, onSubmit, onQuickQuestion, disabled = false }: Props) => (
  <div className="shrink-0 px-4 pb-6 md:px-8">
    <div className="mx-auto max-w-[780px]">
      <div className="mb-3 flex flex-wrap gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question}
            onClick={() => onQuickQuestion(question)}
            className="rounded-full border border-outline-variant/30 bg-white px-4 py-2 text-xs font-medium text-on-surface-variant shadow-sm transition hover:-translate-y-0.5 hover:border-secondary-container hover:text-secondary"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg"
      >
        <input
          value={message}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? '전송 중...' : 'AI 컨설턴트에게 진로 고민을 물어보세요...'}
          disabled={disabled}
          className="h-10 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-outline break-keep">
        AI 답변은 참고용이며, 합격이나 취업 가능성은 판단하지 않습니다.
      </p>
    </div>
  </div>
);

export default InputArea;
