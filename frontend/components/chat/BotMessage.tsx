import ReactMarkdown from "react-markdown";
import ArborMark from "./ArborMark";

interface BotMessageProps {
  content: string;
}

export default function BotMessage({ content }: BotMessageProps) {
  return (
    <div className="flex gap-3 items-start">
      <ArborMark size={28} />
      <div className="flex-1 text-[14.5px] leading-[1.6] text-arbor-forest">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-75"
              >
                {children}
              </a>
            ),
            p: ({ children }) => (
              <p className="mb-3 last:mb-0">{children}</p>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
