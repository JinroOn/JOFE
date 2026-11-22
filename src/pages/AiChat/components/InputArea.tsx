import type { SyntheticEvent } from 'react';

const quickQuestions = [
  '추천 강의 리스트 보기',
  '필요한 코딩 역량은?',
  '관련 자격증 추천',
  '현직자 인터뷰 자료',
];

interface Props {
  message: string;
  onChange: (value: string) => void;
  onSubmit: (
    event: SyntheticEvent<HTMLFormElement>,
  ) => void;
  onQuickQuestion: (question: string) => void;
  disabled?: boolean;
}

const InputArea = ({
  message,
  onChange,
  onSubmit,
  onQuickQuestion,
  disabled = false,
}: Props) => (
  <div className="shrink-0 px-4 pb-6 md:px-8">
    <div className="mx-auto max-w-[780px]">
      <div className="mb-3 flex flex-wrap gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onQuickQuestion(question)}
            disabled={disabled}
            className="rounded-full border border-outline-variant/30 bg-white px-4 py-2 text-xs font-medium text-on-surface-variant shadow-sm transition hover:-translate-y-0.5 hover:border-secondary-container hover:text-secondary disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg"
      >
        <label htmlFor="ai-chat-message" className="sr-only">
          AI 컨설턴트에게 보낼 질문
        </label>

        <input
          id="ai-chat-message"
          value={message}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={
            disabled
              ? '전송 중...'
              : 'AI 컨설턴트에게 진로 고민을 물어보세요...'
          }
          disabled={disabled}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-outline disabled:opacity-60"
        />

        {/* 작동하지 않는 첨부·이미지 버튼 제거 */}

        <button
          type="submit"
          aria-label="메시지 보내기"
          disabled={disabled || !message.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-white shadow-md transition hover:-translate-y-0.5 hover:opacity-90 disabled:opacity-50"
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
          >
            arrow_upward
          </span>
        </button>
      </form>

      <p className="mt-3 text-center text-[11px] text-on-surface-variant">
        진로온 AI 진로 상담 · 답변은 참고 자료로 활용해 주세요.
      </p>
    </div>
  </div>
);

export default InputArea;