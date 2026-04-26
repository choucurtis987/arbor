"use client";

import { useEffect, useRef } from "react";
import { SendIcon } from "./icons";

interface ComposerProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  variant: "welcome" | "conversation";
}

export default function Composer({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  variant,
}: ComposerProps) {
  const isWelcome = variant === "welcome";
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={[
        "flex items-center gap-[10px] bg-white border-[1.5px] border-arbor-forest/[.12] rounded-composer",
        isWelcome
          ? "py-3 px-[14px] shadow-composer"
          : "py-[10px] px-3 shadow-composer-sm",
      ].join(" ")}
    >
      <label htmlFor="chat-input" className="sr-only">
        Message
      </label>
      <input
        ref={inputRef}
        id="chat-input"
        value={input}
        onChange={handleInputChange}
        suppressHydrationWarning
        placeholder={
          isWelcome
            ? "Ask anything about your electricity bill…"
            : "Reply to Arbor…"
        }
        disabled={isLoading}
        className="flex-1 min-w-0 border-none outline-none text-[15px] text-arbor-forest bg-transparent placeholder:text-arbor-forest/40 py-2 px-1.5 disabled:opacity-50"
      />
      {isWelcome ? (
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center gap-1.5 bg-arbor-yellow text-arbor-forest border-none py-[9px] px-4 rounded-full cursor-pointer text-[13.5px] font-semibold disabled:opacity-40 shrink-0"
        >
          Send <SendIcon size={13} />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="w-[34px] h-[34px] rounded-full bg-arbor-yellow text-arbor-forest border-none grid place-items-center cursor-pointer disabled:opacity-40 shrink-0"
        >
          <SendIcon size={15} />
        </button>
      )}
    </form>
  );
}
