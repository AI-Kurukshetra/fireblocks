'use client'

import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  FileCheck2,
  Globe,
  KeyRound,
  Radar,
  ShieldCheck,
  Sparkles,
  WalletCards,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Reveal } from '@/components/marketing/reveal'
import { PlatformVisual } from '@/components/marketing/platform-visual'
import { SectionHeading } from '@/components/marketing/section-heading'
import { useCountUp } from '@/hooks/use-count-up'

const heroStats = [
  {
    value: 24,
    suffix: '/7',
    label: 'policy supervision',
  },
  {
    value: 18,
    suffix: '+',
    label: 'network rails',
  },
  {
    value: 99.98,
    suffix: '%',
    label: 'audit readiness',
  },
] as const

const valuePillars = [
  {
    icon: ShieldCheck,
    title: 'Govern before assets move',
    body: 'Apply approval rules, signer thresholds, whitelists, and exception handling before anything leaves treasury control.',
  },
  {
    icon: WalletCards,
    title: 'Operate every vault class',
    body: 'Run hot, warm, and cold wallet strategies from one operating layer with institutional routing and visibility.',
  },
  {
    icon: FileCheck2,
    title: 'Stay evidence-ready',
    body: 'Convert workflow activity into audit-ready reporting, policy traceability, and clear oversight for compliance teams.',
  },
] as const

const operatingModel = [
  {
    icon: BriefcaseBusiness,
    title: 'Treasury and operations',
    body: 'Initiate transfers, move liquidity, and manage vault posture without relying on side channels or manual approval chains.',
  },
  {
    icon: Radar,
    title: 'Risk and compliance',
    body: 'Review risk context, suspicious flow, counterparty exposure, and exportable evidence from the same operating surface.',
  },
  {
    icon: KeyRound,
    title: 'Platform and engineering',
    body: 'Extend workflows through APIs, webhooks, and governed key access instead of maintaining brittle internal tooling.',
  },
] as const

const faqs = [
  {
    question: 'Who is Fireblocks designed for?',
    answer:
      'Fireblocks is aimed at institutions running digital asset operations at scale, including funds, treasuries, OTC desks, custodians, and fintech platforms with governed wallet workflows.',
  },
  {
    question: 'What makes the experience feel operational instead of promotional?',
    answer:
      'The product narrative is built around policy control, execution discipline, compliance readiness, and system visibility rather than generic blockchain messaging.',
  },
  {
    question: 'Can internal teams integrate Fireblocks programmatically?',
    answer:
      'Yes. The platform is structured to support API-led execution, webhook-driven workflows, and secure, role-aware operational automation.',
  },
]

function HeroMetric({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const displayValue = useCountUp(value, {
    decimals: suffix === '%' ? 2 : 0,
    suffix,
  })

  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-background/78 px-5 py-5 shadow-[0_18px_50px_-38px_rgba(2,132,199,0.35)]">
      <p className="text-3xl font-semibold tracking-tight">{displayValue}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-cyan">{label}</p>
    </div>
  )
}

export function HomePage({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) {
  const primaryHref = isAuthenticated ? '/dashboard' : '/signup'

  return (
    <div className="pb-28">
      <section className="grid min-h-[calc(100vh-4.5rem)] items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-20 2xl:gap-24 2xl:px-14">
        <div className="max-w-3xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-background/82 px-4 py-2 text-sm text-cyan">
              <Sparkles className="h-4 w-4" />
              Institutional digital asset operating system
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-balance sm:text-6xl xl:text-7xl">
              Digital asset operations that feel controlled, legible, and built for institutions.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Fireblocks brings custody, treasury movement, approvals, and audit readiness into one clear operating layer so teams stop stitching critical workflows together by hand.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href={primaryHref}>
                {isAuthenticated ? 'Open dashboard' : 'Request access'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link href="/about">Explore the platform story</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.2} className="mt-12 grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <HeroMetric key={stat.label} {...stat} />
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <PlatformVisual
            badge="Control center"
            title="A command surface that shows control, not just activity"
            description="Monitor governed throughput, approval posture, and policy coverage from a layout designed for finance and security operators."
            signals={[
              { label: 'Protected AUC', value: '$412M' },
              { label: 'Approval SLA', value: '4.2m' },
              { label: 'Rule coverage', value: '24/7' },
            ]}
            chips={['Policy routing', 'Multi-sig approvals', 'Key governance', 'Audit exports']}
            floatingCards={[
              {
                icon: ShieldCheck,
                title: 'Approval policy active',
                detail: 'Dual-approval and whitelist controls are applied to high-value treasury movement.',
                tone: 'emerald',
              },
              {
                icon: Globe,
                title: 'Multi-chain visibility',
                detail: 'Cross-network operations stay inside the same governed workflow and evidence trail.',
                tone: 'cyan',
              },
            ]}
          />
        </Reveal>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="Why teams buy in"
            title="Fewer screens, better spacing, and a clearer story around control."
            description="The public experience should explain why the product matters to treasury, operations, compliance, and engineering without compressing everything into one card wall."
          />
        </Reveal>
        <div className="mt-14 grid gap-6 xl:grid-cols-3">
          {valuePillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.06}>
              <Card className="h-full rounded-[2rem] border-border/60 bg-card/74 p-2">
                <CardHeader className="gap-5 pb-2">
                  <span className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-cyan/20 bg-cyan-dim text-cyan">
                    <pillar.icon className="h-6 w-6" />
                  </span>
                  <div className="space-y-3">
                    <CardTitle className="text-2xl">{pillar.title}</CardTitle>
                    <CardDescription className="text-base leading-7">
                      {pillar.body}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6 lg:px-10 2xl:px-14">
        <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/55 p-8 sm:p-10 xl:p-14">
          <div className="grid items-start gap-12 xl:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <SectionHeading
                eyebrow="Operating model"
                title="Built around the teams that actually carry operational risk."
                description="Fireblocks organizes the workflow so each function gets context it can act on, instead of inheriting incomplete handoffs from another system."
              />
            </Reveal>
            <div className="grid gap-5">
              {operatingModel.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[2rem] border border-border/60 bg-background/82 p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-emerald/20 bg-emerald-dim text-emerald">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="text-base leading-7 text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="What teams say"
            title="The strongest feedback is about clarity."
            description="Operators describe Fireblocks as infrastructure-like because the interface keeps approvals, policy signals, and evidence close together."
          />
          <div className="mt-10 space-y-5">
            {[
              {
                quote:
                  'Fireblocks gave our operations desk a single place to govern key controls, approvals, and reporting without slowing treasury execution.',
                name: 'Maya Rosen',
                role: 'Head of Digital Asset Operations, Northbridge Capital',
              },
              {
                quote:
                  'The product feels like infrastructure instead of a dashboard. That matters when audit, security, and treasury all need the same source of truth.',
                name: 'Daniel Park',
                role: 'Director of Custody Engineering, Helix Markets',
              },
            ].map((item, index) => (
              <Reveal key={item.name} delay={0.08 + index * 0.06}>
                <Card className="rounded-[2rem] border-border/60 bg-card/74">
                  <CardContent className="px-7 py-7">
                    <p className="text-lg leading-8 text-foreground">"{item.quote}"</p>
                    <div className="mt-6">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="rounded-[2rem] border-border/60 bg-card/74 px-6 sm:px-8">
            <CardHeader className="px-0 pt-8">
              <CardTitle className="text-2xl">Questions that come up early</CardTitle>
              <CardDescription className="text-base leading-7">
                The public pages should answer the core evaluation questions without forcing users into the product first.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-8">
              <Accordion type="single" collapsible>
                {faqs.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger className="py-5 text-left text-base font-medium hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-7 text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="px-4 pt-6 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <div className="overflow-hidden rounded-[2.5rem] border border-cyan/20 bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-cyan)_11%,var(--color-card)),color-mix(in_oklab,var(--color-emerald)_10%,var(--color-card)))] p-8 sm:p-10 xl:p-14">
            <div className="grid gap-10 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan">
                  Ready for a better first impression
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  Move from a crowded product pitch to a cleaner institutional narrative.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
                  Fireblocks should look like a serious operating system from the first screen, with space, rhythm, and enough visual structure to feel premium.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href={primaryHref}>
                    {isAuthenticated ? 'Open dashboard' : 'Talk to the team'}
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
