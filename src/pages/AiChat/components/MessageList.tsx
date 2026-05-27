import type { ChatMessage } from '../types';

const MessageList = ({ messages }: { messages: ChatMessage[] }) => (
  <div className="flex-1 overflow-y-auto px-4 md:px-8">
    <div className="mx-auto max-w-[780px] space-y-8 py-8">
      {messages.map((chat) => {
        if (chat.role === 'user') {
          return (
            <div key={chat.id} className="flex justify-end">
              <div className="max-w-[640px] rounded-t-2xl rounded-bl-2xl bg-primary-container px-6 py-5 text-sm font-semibold leading-7 text-white shadow-xl">
                {chat.content}
              </div>
              <div className="ml-3 mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container/20 text-secondary">
                <span className="material-symbols-outlined text-[16px]">person</span>
              </div>
            </div>
          );
        }

        return (
          <div key={chat.id} className="flex gap-3">
            <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-white">
              <span className="material-symbols-outlined text-[16px]">smart_toy</span>
            </div>
            <div
              className={`max-w-[680px] rounded-2xl bg-white px-6 py-5 text-sm leading-7 text-on-surface shadow-sm ${
                chat.steps ? 'border-l-4 border-secondary-container' : ''
              }`}
            >
              {chat.content.split('\n').map((line, lineIndex) => (
                <p key={`${chat.id}-${lineIndex}`} className="mb-3 last:mb-0">
                  {line}
                </p>
              ))}

              {chat.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {chat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary-container/30 px-4 py-1.5 text-xs font-bold text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {chat.steps && (
                <div className="mt-4 space-y-4">
                  {chat.steps.map((step, index) => (
                    <div key={step.title} className="flex gap-3">
                      <span className="shrink-0 font-extrabold text-secondary-container">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <p>
                        <strong className="font-extrabold text-on-surface">{step.title}: </strong>
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default MessageList;
