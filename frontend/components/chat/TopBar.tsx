import ArborMark from "./ArborMark";

interface TopBarProps {
  onBack?: () => void;
}

export default function TopBar({ onBack }: TopBarProps) {
  return (
    <header className="flex items-center px-8 py-[18px] border-b border-arbor-forest/[.08] gap-3">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Start new conversation"
          className="flex items-center justify-center w-8 h-8 rounded-full text-arbor-forest/50 hover:text-arbor-forest hover:bg-arbor-forest/[.06] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <div className="flex items-center gap-[10px]">
        <ArborMark size={28} />
        <span className="font-semibold text-[17px] tracking-[-0.3px] text-arbor-forest">
          Arbor
        </span>
      </div>
    </header>
  );
}
