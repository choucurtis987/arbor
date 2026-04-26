import { BoltIcon, ReceiptIcon, HouseIcon, HelpIcon } from "./icons";
import type { ReactNode } from "react";

interface Chip {
  icon: ReactNode;
  title: string;
  description: string;
}

const CHIPS: Chip[] = [
  {
    icon: <BoltIcon size={15} />,
    title: "How does Arbor save me money?",
    description: "Understand supply vs. delivery charges",
  },
  {
    icon: <ReceiptIcon size={15} />,
    title: "What will my next bill look like?",
    description: "After switching to a new supplier",
  },
  {
    icon: <HouseIcon size={15} />,
    title: "I'm moving to a new address",
    description: "Transfer or pause my plan",
  },
  {
    icon: <HelpIcon size={15} />,
    title: "Can I switch back anytime?",
    description: "Cancel or change suppliers",
  },
];

interface SuggestionGridProps {
  onSubmit: (text: string) => void;
}

export default function SuggestionGrid({ onSubmit }: SuggestionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mt-[18px]">
      {CHIPS.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSubmit(chip.title)}
          className="bg-white border border-arbor-forest/10 rounded-card py-3 px-[14px] text-left cursor-pointer flex flex-col gap-1 hover:border-arbor-forest/25 transition-colors"
        >
          <span className="flex items-center gap-2 text-arbor-forest">
            {chip.icon}
            <span className="font-medium text-[13.5px]">{chip.title}</span>
          </span>
          <span className="text-[12.5px] text-arbor-forest/55 pl-[22px]">
            {chip.description}
          </span>
        </button>
      ))}
    </div>
  );
}
