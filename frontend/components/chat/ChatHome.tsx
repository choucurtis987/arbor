"use client";

import { useChat } from "ai/react";
import TopBar from "./TopBar";
import WelcomeHero from "./WelcomeHero";
import Composer from "./Composer";
import SuggestionGrid from "./SuggestionGrid";
import MessageList from "./MessageList";

export default function ChatHome() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, setMessages, append } =
    useChat({ api: "/api/chat", streamProtocol: "text" });

  const isWelcome = messages.length === 0;

  function handleBack() {
    setMessages([]);
    setInput("");
  }

  function handleChipSubmit(text: string) {
    append({ role: "user", content: text });
  }

  return (
    <div className="flex flex-col h-screen bg-arbor-cream text-arbor-forest font-sans">
      <TopBar onBack={isWelcome ? undefined : handleBack} />

      {isWelcome ? (
        <div className="flex-1 flex flex-col items-center justify-center px-10 pb-20 gap-7 overflow-y-auto min-h-0">
          <WelcomeHero />
          <div className="w-full max-w-[680px]">
            <Composer
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              variant="welcome"
            />
            <SuggestionGrid onSubmit={handleChipSubmit} />
            <p className="text-center mt-[18px] text-[11.5px] text-arbor-forest/50">
              Arbor&rsquo;s assistant gives general info. For account questions,{" "}
              contact{" "}
              <a
                href="mailto:support@joinarbor.com"
                className="underline hover:opacity-75"
              >
                support@joinarbor.com
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <>
          <MessageList messages={messages} isLoading={isLoading} />
          <div className="px-8 pb-[22px] pt-4 shrink-0">
            <div className="max-w-[720px] mx-auto">
              <Composer
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                variant="conversation"
              />
              <p className="text-center mt-[10px] text-[11.5px] text-arbor-forest/50">
                Arbor&rsquo;s assistant gives general info. For account
                questions, contact{" "}
                <a
                  href="mailto:support@joinarbor.com"
                  className="underline hover:opacity-75"
                >
                  support@joinarbor.com
                </a>
                .
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
