import ArborMark from "./ArborMark";

export default function WelcomeHero() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-[76px] h-[76px] rounded-full bg-arbor-yellow overflow-hidden shadow-hero-glow">
        <ArborMark size={76} className="scale-[1.25] origin-center" />
      </div>
      <div>
        <h1 className="m-0 text-[38px] font-medium tracking-[-1px] leading-[1.1] text-arbor-forest">
          How can we help you today?
        </h1>
        <p className="mt-3 text-base text-arbor-forest/65 max-w-[560px] leading-relaxed">
          Ask anything about your electricity bill, supply rates, or how Arbor
          works. We&rsquo;re here to help you save without the fine print.
        </p>
      </div>
    </div>
  );
}
