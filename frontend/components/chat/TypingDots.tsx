export default function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center py-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-arbor-forest animate-td-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
