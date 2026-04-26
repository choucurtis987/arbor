interface UserBubbleProps {
  content: string;
}

export default function UserBubble({ content }: UserBubbleProps) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[75%] bg-arbor-forest text-arbor-cream py-[11px] px-[15px] text-[14.5px] leading-[1.5] whitespace-pre-wrap"
        style={{ borderRadius: 16, borderBottomRightRadius: 6 }}
      >
        {content}
      </div>
    </div>
  );
}
