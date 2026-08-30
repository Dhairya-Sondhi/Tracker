"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, Check, Flame, MoreHorizontal, Plus, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Cluster, Stack } from "@/components/layout/stack";

gsap.registerPlugin(ScrollTrigger);

const days = [40, 68, 82, 54, 96, 74, 88];

export function FoundationShowcase() {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    gsap.from("[data-reveal]", { y: 28, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 });
    gsap.utils.toArray<HTMLElement>("[data-section]").forEach((section) => {
      gsap.from(section.children, { scrollTrigger: { trigger: section, start: "top 80%" }, y: 22, opacity: 0, duration: 0.75, stagger: 0.07, ease: "power2.out" });
    });
  }, { scope: root });

  return <div ref={root}>
    <section id="foundation" className="relative overflow-hidden pb-24 pt-36 md:pb-32 md:pt-48">
      <div className="pointer-events-none absolute left-[58%] top-24 size-[28rem] rounded-full bg-lilac/35 blur-[110px] dark:bg-violet/10" />
      <Stack className="relative max-w-4xl gap-8">
        <Badge data-reveal><Sparkles size={11} /> Design foundation · 01</Badge>
        <h1 data-reveal className="display-xl max-w-[13ch]">A quieter way to become more.</h1>
        <p data-reveal className="body-lg max-w-[34rem] text-muted">Shape a personal growth practice around the life you actually live—with meaningful data, beautiful rituals, and room to evolve.</p>
        <Cluster data-reveal className="gap-2">
          <Button size="lg">Begin your practice <ArrowUpRight size={16} /></Button>
          <Button size="lg" variant="secondary">Explore the system</Button>
        </Cluster>
      </Stack>
    </section>

    <section id="components" data-section className="border-t border-line py-20 md:py-28">
      <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="eyebrow mb-3 text-violet">Living primitives</p><h2 className="display-md">Designed to compose.</h2></div>
        <p className="body-md max-w-sm text-muted">A tactile system of controls and surfaces, made for dense personal data without the clinical feeling.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-start justify-between">
            <div><Badge className="mb-4 border-0 bg-peach/30 text-ink dark:text-ink">Today</Badge><h3 className="heading-md">Morning movement</h3><p className="mt-1 text-sm text-muted">Gentle consistency · 12 week view</p></div>
            <Button size="icon" variant="ghost" aria-label="More options"><MoreHorizontal size={18} /></Button>
          </CardHeader>
          <CardContent>
            <div className="mb-7 flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-0.06em]">24</span><span className="mb-1 text-sm text-muted">day rhythm</span>
            </div>
            <div className="grid h-40 grid-cols-7 items-end gap-2 rounded-2xl border border-line bg-canvas/55 p-4">
              {days.map((height, i) => <div key={i} className="group flex h-full flex-col justify-end gap-2"><div className="w-full rounded-t-lg bg-violet/20 transition-colors group-hover:bg-violet/50" style={{ height: `${height}%` }} /><span className="text-center text-[10px] font-semibold text-subtle">{"MTWTFSS"[i]}</span></div>)}
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden lg:col-span-5">
          <div className="absolute right-0 top-0 size-44 rounded-full bg-blush/35 blur-3xl dark:bg-violet/10" />
          <CardContent className="relative flex h-full min-h-[360px] flex-col justify-between">
            <div className="flex items-start justify-between"><div className="grid size-11 place-items-center rounded-xl bg-blush/45 text-ink"><Flame size={19} /></div><Badge>Momentum</Badge></div>
            <div>
              <div className="mb-5 grid size-32 place-items-center rounded-full" style={{ background: "conic-gradient(#7356e8 0deg 286deg, var(--line) 286deg)" }}><div className="grid size-[7rem] place-items-center rounded-full bg-surface-raised"><span className="text-3xl font-semibold tracking-[-0.05em]">79%</span></div></div>
              <h3 className="heading-md">A week with intention.</h3><p className="mt-2 text-sm leading-relaxed text-muted">Five of seven rituals are moving with you.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-5"><CardContent><p className="eyebrow mb-6 text-blue-violet">Inputs</p><Stack className="gap-5"><Input id="practice" label="Name your practice" placeholder="Evening reflection" hint="Keep it specific, gentle, and yours." /><Input id="measure" label="Daily measure" defaultValue="20 minutes" /></Stack></CardContent></Card>
        <Card className="lg:col-span-7"><CardContent><p className="eyebrow mb-6 text-violet">Actions & signals</p><Stack className="gap-7"><Cluster><Button><Plus size={16} /> New ritual</Button><Button variant="secondary"><Target size={16} /> Link goal</Button><Button variant="ghost">Not now</Button></Cluster><Cluster><Badge className="bg-lilac/25 text-ink dark:text-ink"><Check size={11} /> Complete</Badge><Badge className="bg-blush/30 text-ink dark:text-ink">Reflect</Badge><Badge className="bg-peach/30 text-ink dark:text-ink">7 day rhythm</Badge></Cluster><div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/50 p-3"><div className="grid size-8 place-items-center rounded-lg bg-violet text-white"><Check size={15} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Read for 20 minutes</p><p className="text-xs text-muted">Completed quietly at 8:42 pm</p></div><span className="hidden text-xs text-subtle sm:block">Today</span></div></Stack></CardContent></Card>
      </div>
    </section>

    <section id="principles" data-section className="border-t border-line py-20 md:py-28">
      <p className="eyebrow mb-8 text-violet">Principles</p>
      <div className="grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3">
        {[['01','Clarity over density','Every signal earns its place.'],['02','Warmth in the data','Progress should feel human.'],['03','Built to become yours','Structure without prescription.']].map(([n,title,copy]) => <div key={n} className="bg-canvas p-7 md:p-9"><span className="mb-16 block text-xs font-bold text-subtle">{n}</span><h3 className="heading-md mb-3">{title}</h3><p className="text-sm text-muted">{copy}</p></div>)}
      </div>
    </section>
  </div>;
}
