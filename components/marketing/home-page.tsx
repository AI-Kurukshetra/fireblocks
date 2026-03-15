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
    <motion.div 
      whileHover={{ y: -2 }}
      className="group rounded-2xl border border-border/60 bg-card/50 px-6 py-6 shadow-premium hover-lift backdrop-blur-sm hover:bg-card/70 transition-all"
    >
      <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">{displayValue}</p>
      <p className="mt-3 text-xs uppercase tracking-widest text-cyan/80 font-semibold">{label}</p>
    </motion.div>
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
      <section className="grid min-h-[calc(100vh-4.5rem)] items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-24 2xl:gap-32 2xl:px-14">
        <div className="max-w-3xl space-y-8">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-background/82 backdrop-blur-sm px-4 py-2 text-sm font-medium text-cyan hover:bg-cyan-dim/40 transition-colors">
              <Sparkles className="h-4 w-4" />
              Institutional digital asset operating system
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[1.05]">
              Digital asset operations that feel controlled, legible, and built for institutions.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-2xl">
              Fireblocks brings custody, treasury movement, approvals, and audit readiness into one clear operating layer so teams stop stitching critical workflows together by hand.
            </p>
          </Reveal>
          <Reveal delay={0.15} className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
            <Button asChild size="lg" className="rounded-full px-8 font-semibold h-12 shadow-premium hover:shadow-premium-lg hover-lift">
              <Link href={primaryHref}>
                {isAuthenticated ? 'Open dashboard' : 'Request access'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 font-semibold h-12 border-2 hover:bg-secondary/80">
              <Link href="/about">Explore the platform story</Link>
            </Button>
          </Reveal>
          <Reveal delay={0.2} className="pt-6 grid gap-4 sm:grid-cols-3">
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

      <section className="px-4 py-28 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="Why teams buy in"
            title="Fewer screens, better spacing, and a clearer story around control."
            description="The public experience should explain why the product matters to treasury, operations, compliance, and engineering without compressing everything into one card wall."
          />
        </Reveal>
        <div className="mt-16 grid gap-8 xl:grid-cols-3">
          {valuePillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.06}>
              <motion.div
                whileHover={{ y: -6 }}
                className="group h-full rounded-3xl border border-border/60 bg-card/60 p-8 shadow-premium backdrop-blur-sm hover:bg-card/80 hover:shadow-premium-lg hover:border-cyan/30 transition-all duration-300 cursor-default"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan/30 bg-cyan-dim/50 text-cyan shadow-premium-sm group-hover:shadow-premium group-hover:border-cyan/50 transition-all">
                  <pillar.icon className="h-8 w-8" />
                </div>
                <div className="mt-6 space-y-4">
                  <h3 className="text-2xl font-bold tracking-tight leading-snug">{pillar.title}</h3>
                  <p className="text-base leading-7 text-muted-foreground">
                    {pillar.body}
                  </p>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="px-4 py-28 sm:px-6 lg:px-10 2xl:px-14">
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/50 backdrop-blur-sm p-10 sm:p-12 xl:p-16 shadow-premium">
          <div className="grid items-start gap-14 xl:grid-cols-[0.85fr_1.15fr]">
            <Reveal>
              <SectionHeading
                eyebrow="Operating model"
                title="Built around the teams that actually carry operational risk."
                description="Fireblocks organizes the workflow so each function gets context it can act on, instead of inheriting incomplete handoffs from another system."
              />
            </Reveal>
            <div className="grid gap-6">
              {operatingModel.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-7 shadow-premium-sm hover:shadow-premium hover:bg-background/90 hover:border-emerald/30 transition-all duration-300 cursor-default"
                  >
                    <div className="flex items-start gap-5">
                      <span className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-emerald/30 bg-emerald-dim/50 text-emerald flex-shrink-0 shadow-premium-sm group-hover:shadow-premium group-hover:border-emerald/50 transition-all">
                        <item.icon className="h-6 w-6" />
                      </span>
                      <div className="space-y-3 flex-1">
                        <h3 className="text-xl font-bold">{item.title}</h3>
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

      <section className="grid gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="What teams say"
            title="The strongest feedback is about clarity."
            description="Operators describe Fireblocks as infrastructure-like because the interface keeps approvals, policy signals, and evidence close together."
          />
          <div className="mt-12 space-y-6">
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
                <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-premium hover:shadow-premium hover:bg-card/75 transition-all duration-300">
                  <p className="text-lg leading-8 text-foreground italic">"{item.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-dim/50 border border-cyan/30" />
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 sm:p-10 shadow-premium">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold">Questions that come up early</h3>
                <p className="mt-2 text-base leading-7 text-muted-foreground">
                  The public pages should answer the core evaluation questions without forcing users into the product first.
                </p>
              </div>
              <Accordion type="single" collapsible>
                {faqs.map((item) => (
                  <AccordionItem key={item.question} value={item.question}>
                    <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline text-foreground hover:text-cyan">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base leading-7 text-muted-foreground pt-2">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Reveal>
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
                  Ready for a better first impression
                </p>
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
                  Move from a crowded product pitch to a cleaner institutional narrative.
                </h2>
                <p className="text-base sm:text-lg leading-8 text-muted-foreground max-w-2xl">
                  Fireblocks should look like a serious operating system from the first screen, with space, rhythm, and enough visual structure to feel premium.
                </p>
              </div>
              <div className="flex items-center">
                <Button asChild size="lg" className="rounded-full px-9 font-semibold h-12 shadow-premium hover:shadow-premium-lg hover-lift">
                  <Link href={primaryHref}>
                    {isAuthenticated ? 'Open dashboard' : 'Talk to the team'}
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
