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
    <div className="rounded-[1.75rem] border border-border/60 bg-background/82 p-6">
      <p className="text-4xl font-semibold tracking-tight">{displayValue}</p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-cyan">{label}</p>
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="pb-28">
      <section className="grid items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:py-20 2xl:gap-24 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="About Fireblocks"
            title="Designed to make digital asset operations feel governed, not improvised."
            description="Fireblocks exists to give treasury, operations, compliance, and engineering teams one product surface where control quality and speed can coexist."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
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

      <section className="px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="Principles"
            title="The product philosophy is simple: high-stakes workflows should feel legible."
            description="That means strong spacing, clear visual hierarchy, and enough structure for operators to understand what matters without parsing a crowded interface."
          />
        </Reveal>
        <div className="mt-14 grid gap-6 xl:grid-cols-3">
          {principles.map((principle, index) => (
            <Reveal key={principle.title} delay={index * 0.06}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="h-full rounded-[2rem] border-border/60 bg-card/76 p-2">
                  <CardHeader className="gap-5">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-cyan/20 bg-cyan-dim text-cyan">
                      <principle.icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-3">
                      <CardTitle className="text-2xl">{principle.title}</CardTitle>
                      <CardDescription className="text-base leading-7">
                        {principle.body}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/55 p-8 sm:p-10 xl:p-14">
          <div className="grid gap-10 xl:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <SectionHeading
                eyebrow="How we think"
                title="Every important workflow should answer three questions clearly."
                description="What can move, who can approve it, and what evidence will remain after the action completes."
              />
            </Reveal>
            <div className="grid gap-5">
              {[
                ['01', 'What is being governed?', 'Vault strategy, signer expectations, routing rules, and transfer boundaries need to be explicit.'],
                ['02', 'Who is accountable?', 'The people approving or executing actions should see their role and its effect on the workflow.'],
                ['03', 'What is the evidence trail?', 'If someone reviews the action later, the context should already exist inside the product.'],
              ].map(([step, title, body], index) => (
                <Reveal key={step} delay={index * 0.08}>
                  <div className="rounded-[2rem] border border-border/60 bg-background/82 p-6">
                    <div className="flex items-start gap-5">
                      <div className="min-w-14 rounded-full border border-cyan/20 bg-cyan-dim px-4 py-2 text-sm font-semibold text-cyan">
                        {step}
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <p className="text-base leading-7 text-muted-foreground">{body}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <div className="overflow-hidden rounded-[2.5rem] border border-cyan/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-cyan)_10%,var(--color-card)),color-mix(in_oklab,var(--color-emerald)_8%,var(--color-card)))] p-8 sm:p-10 xl:p-14">
            <div className="grid gap-10 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
                  See the operating surface
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  The story should end in a clear next step, not more clutter.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                  If a team understands the model, the next action should be obvious. That is the point of a better public UI.
                </p>
              </div>
              <div className="flex items-center">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/contact">
                    Contact the team
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
