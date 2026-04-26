import Image from "next/image";

interface ArborMarkProps {
  size?: number;
  className?: string;
}

export default function ArborMark({ size = 28, className }: ArborMarkProps) {
  return (
    <Image
      src="/arbor-mark.jpeg"
      alt="Arbor"
      width={size}
      height={size}
      className={["rounded-full", className].filter(Boolean).join(" ")}
      style={{ flexShrink: 0 }}
    />
  );
}
