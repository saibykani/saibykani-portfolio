"use client";

import Image from "next/image";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import resumeData from "@/data/resumeData.json";
import { Reveal, SectionHeading } from "@/components/ui/primitives";

const titles = ["Regression stability up ~40%", "Validated at 2x–3x peak load", "Release sign-offs you can trust"];

const bgs = [
  "bg-[radial-gradient(94.21%_78.4%_at_50%_29.91%,rgba(39,61,180,0.7),rgba(15,9,38,0.4))]",
  "bg-[radial-gradient(84.35%_70.19%_at_50%_38.11%,rgba(2,96,101,0.57),rgba(5,136,178,0.06))]",
  "bg-[radial-gradient(90%_75%_at_50%_30%,rgba(126,34,206,0.55),rgba(20,8,38,0.3))]",
];

export default function Achievements() {
  const track = useRef<HTMLDivElement>(null);
  const items = resumeData.achievements;
  const exp = resumeData.experience[0];

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="mask-x py-10">
      <SectionHeading eyebrow="Recognition" title="Milestones worth" highlight="celebrating" className="container mx-auto mb-16 md:mb-20" />

      <Reveal className="container relative">
        <div ref={track} className="-ml-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]">
          {items.map((a, i) => (
            <div key={i} className="min-w-0 shrink-0 grow-0 basis-full snap-start pl-4 sm:basis-1/2 lg:basis-1/3">
              <div
                className={`${bgs[i % bgs.length]} relative mx-1 flex h-full select-none flex-col justify-between overflow-hidden rounded-xl bg-black p-5 shadow-border sm:mx-2 md:rounded-2xl lg:p-6`}
              >
                <div>
                  <h4 className="mb-2 font-instrument text-xl font-bold tracking-wide text-white/95 md:text-2xl">{titles[i] ?? "Achievement"}</h4>
                  <p className="mb-6 text-base font-extralight tracking-tight text-white/85 md:text-lg">{a}</p>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="relative size-10 overflow-hidden rounded-full bg-white">
                    <Image src="/logo.png" alt="" fill sizes="40px" className="object-contain" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium tracking-wide text-white/95">{exp.company}</span>
                    <span className="text-xs text-white/70">{exp.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-3 lg:hidden">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next" className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Reveal>
    </section>
  );
}
