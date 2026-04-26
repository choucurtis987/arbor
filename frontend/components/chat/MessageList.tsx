"use client";

import { useEffect, useRef } from "react";
import type { Message } from "ai";
import ArborMark from "./ArborMark";
import UserBubble from "./UserBubble";
import BotMessage from "./BotMessage";
import TypingDots from "./TypingDots";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div
      className="flex-1 overflow-y-auto py-8"
      aria-live="polite"
      aria-label="Chat messages"
    >
      <div className="max-w-[720px] mx-auto px-8 flex flex-col gap-[22px]">
        {messages.map((m) =>
          m.role === "user" ? (
            <UserBubble key={m.id} content={m.content} />
          ) : (
            <BotMessage key={m.id} content={m.content} />
          )
        )}
        {isLoading && lastIsUser && (
          <div className="flex gap-3 items-start">
            <ArborMark size={28} />
            <div className="bg-white border border-arbor-forest/10 rounded-card py-3 px-4">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
