'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CheckCheck,
  Eye,
  ShieldCheck,
  Waypoints,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Reveal } from '@/components/marketing/reveal'
import { PlatformVisual } from '@/components/marketing/platform-visual'
import { SectionHeading } from '@/components/marketing/section-heading'
import { useCountUp } from '@/hooks/use-count-up'

const principles = [
  {
    icon: ShieldCheck,
    title: 'Control should be visible',
    body: 'Policy boundaries, approval states, and operational responsibilities should be obvious at a glance to the people managing risk.',
  },
  {
    icon: Waypoints,
    title: 'Workflows should not fragment',
    body: 'Treasury, compliance, and engineering teams should operate from shared context instead of rebuilding decisions across separate tools.',
  },
  {
    icon: Eye,
    title: 'Evidence should be continuous',
    body: 'Audit trails, reporting context, and system health should exist as part of the workflow, not as an afterthought.',
  },
] as const

function StatBlock({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const displayValue = useCountUp(value, {
    decimals: suffix === '%' ? 0 : 0,
    suffix,
  })

  return (
    <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-7 shadow-premium hover:shadow-premium hover:bg-card/65 transition-all hover-lift">
      <p className="text-5xl font-bold tracking-tight text-foreground">{displayValue}</p>
      <p className="mt-4 text-xs uppercase tracking-widest text-cyan/80 font-semibold">{label}</p>
    </motion.div>
  )
}

export function AboutPage() {
  return (
    <div className="pb-28">
      <section className="grid items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:py-24 2xl:gap-28 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="About Fireblocks"
            title="Designed to make digital asset operations feel governed, not improvised."
            description="Fireblocks exists to give treasury, operations, compliance, and engineering teams one product surface where control quality and speed can coexist."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            <StatBlock value={3} suffix="x" label="fewer handoffs" />
            <StatBlock value={24} suffix="/7" label="control visibility" />
            <StatBlock value={18} suffix="+" label="network coverage" />
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <PlatformVisual
            badge="Mission profile"
            title="Built around infrastructure thinking"
            description="The interface, data model, and workflow language all bias toward accountability, control clarity, and audit-friendly execution."
            signals={[
              { label: 'Control domains', value: '06' },
              { label: 'Shared teams', value: '04' },
              { label: 'Evidence paths', value: '100%' },
            ]}
            chips={['Approvals', 'Vault policy', 'Compliance context', 'Exportable reporting']}
            floatingCards={[
              {
                icon: ShieldCheck,
                title: 'Policy first',
                detail: 'Operator actions are framed by rules, not just interface permissions.',
                tone: 'cyan',
              },
              {
                icon: CheckCheck,
                title: 'Audit continuity',
                detail: 'Evidence is generated as the workflow happens instead of after a review starts.',
                tone: 'emerald',
              },
            ]}
          />
        </Reveal>
      </section>

      <section className="px-4 py-28 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="Principles"
            title="The product philosophy is simple: high-stakes workflows should feel legible."
            description="That means strong spacing, clear visual hierarchy, and enough structure for operators to understand what matters without parsing a crowded interface."
          />
        </Reveal>
        <div className="mt-16 grid gap-8 xl:grid-cols-3">
          {principles.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 0.06}>
              <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }} className="group h-full rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-premium hover:shadow-premium-lg hover:bg-card/80 hover:border-emerald/30 transition-all duration-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan/30 bg-cyan-dim/50 text-cyan shadow-premium-sm group-hover:shadow-premium group-hover:border-cyan/50 transition-all">
                  <principle.icon className="h-8 w-8" />
                </div>
                <div className="mt-6 space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight leading-snug">{principle.title}</h3>
                  <p className="text-base leading-7 text-muted-foreground">
                    {principle.body}
                  </p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-28 sm:px-6 lg:px-10 2xl:px-14">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-10 sm:p-12 xl:p-16 shadow-premium">
          <div className="grid gap-14 xl:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <SectionHeading
                eyebrow="How we think"
                title="Every important workflow should answer three questions clearly."
                description="What can move, who can approve it, and what evidence will remain after the action completes."
              />
            </Reveal>
            <div className="grid gap-6">
              {[
                ['01', 'What is being governed?', 'Vault strategy, signer expectations, routing rules, and transfer boundaries need to be explicit.'],
                ['02', 'Who is accountable?', 'The people approving or executing actions should see their role and its effect on the workflow.'],
                ['03', 'What is the evidence trail?', 'If someone reviews the action later, the context should already exist inside the product.'],
              ].map(([step, title, body], index) => (
                <Reveal key={step} delay={index * 0.08}>
                  <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-7 shadow-premium-sm hover:shadow-premium hover:bg-background/90 hover:border-emerald/30 transition-all duration-300">
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0 min-w-14 h-12 rounded-xl border-2 border-cyan/30 bg-cyan-dim/50 flex items-center justify-center text-base font-bold text-cyan shadow-premium-sm group-hover:shadow-premium group-hover:border-cyan/50 transition-all">
                        {step}
                      </div>
                      <div className="space-y-3 flex-1">
                        <h3 className="text-xl font-bold">{title}</h3>
                        <p className="text-base leading-7 text-muted-foreground">{body}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-12 pb-16 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <motion.div 
            whileHover={{ y: -2 }}
            className="overflow-hidden rounded-3xl border-2 border-cyan/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-cyan)_11%,var(--color-card)),color-mix(in_oklab,var(--color-emerald)_10%,var(--color-card)))] p-10 sm:p-12 xl:p-16 shadow-premium-lg hover:shadow-premium-lg hover:border-cyan/40 transition-all duration-300"
          >
            <div className="grid gap-12 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="max-w-3xl space-y-6">
                <p className="text-sm font-bold uppercase tracking-widest text-cyan">
                  See the operating surface
                </p>
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
                  The story should end in a clear next step, not more clutter.
                </h2>
                <p className="text-base sm:text-lg leading-8 text-muted-foreground max-w-2xl">
                  If a team understands the model, the next action should be obvious. That is the point of a better public UI.
                </p>
              </div>
              <div className="flex items-center">
                <Button asChild size="lg" className="rounded-full px-9 font-semibold h-12 shadow-premium hover:shadow-premium-lg hover-lift">
                  <Link href="/contact">
                    Contact the team
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </section>
    </div>
  )
}
