'use client'

import { Clock3, Mail, MapPin, PhoneCall, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ContactForm } from '@/components/marketing/contact-form'
import { PlatformVisual } from '@/components/marketing/platform-visual'
import { Reveal } from '@/components/marketing/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'

const channels = [
  {
    icon: Mail,
    title: 'Sales and onboarding',
    body: 'Talk through rollout scope, operating pain points, and the best place to start.',
    value: 'sales@fireblocks.app',
  },
  {
    icon: ShieldCheck,
    title: 'Security and compliance',
    body: 'Coordinate due diligence, architecture reviews, and control questionnaire workflows.',
    value: 'security@fireblocks.app',
  },
  {
    icon: PhoneCall,
    title: 'Support readiness',
    body: 'Align on enablement, admin setup, and how teams adopt the operating model.',
    value: 'Enterprise response within 1 business day',
  },
] as const

export function ContactPage() {
  return (
    <div className="pb-28">
      <section className="grid items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-10 lg:py-20 2xl:gap-24 2xl:px-14">
        <Reveal>
          <SectionHeading
            eyebrow="Contact Fireblocks"
            title="Start the conversation with enough room for context."
            description="The contact experience should feel calm and premium. Teams need space to explain their workflow, not another crowded form surrounded by generic marketing blocks."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.75rem] border border-border/60 bg-background/82 p-5">
              <p className="text-sm font-medium">Best for</p>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Treasury modernization, policy controls, approval redesign, and institutional custody workflows.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-border/60 bg-background/82 p-5">
              <p className="text-sm font-medium">Response model</p>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Initial qualification, operator workflow mapping, and a focused next-step recommendation.
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.12}>
          <PlatformVisual
            badge="Conversation preview"
            title="What the first discussion should clarify"
            description="The best enterprise conversations identify the workflow, the control model, and the teams carrying operational responsibility."
            signals={[
              { label: 'Primary teams', value: '04' },
              { label: 'Review depth', value: '1:1' },
              { label: 'Response SLA', value: '24h' },
            ]}
            chips={['Onboarding path', 'Security review', 'Workflow mapping', 'Pilot planning']}
            floatingCards={[
              {
                icon: Clock3,
                title: 'Rapid triage',
                detail: 'We focus the first conversation around the workflow with the most operational friction.',
                tone: 'amber',
              },
              {
                icon: MapPin,
                title: 'Global operating fit',
                detail: 'Support coverage is structured for distributed institutional teams.',
                tone: 'cyan',
              },
            ]}
          />
        </Reveal>
      </section>

      <section className="grid gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 2xl:px-14">
        <div className="grid gap-5">
          {channels.map((channel, index) => (
            <Reveal key={channel.title} delay={index * 0.06}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="rounded-[2rem] border-border/60 bg-card/76">
                  <CardHeader className="gap-5">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-cyan/20 bg-cyan-dim text-cyan">
                      <channel.icon className="h-6 w-6" />
                    </span>
                    <div className="space-y-3">
                      <CardTitle className="text-xl">{channel.title}</CardTitle>
                      <CardDescription className="text-base leading-7">
                        {channel.body}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm font-medium text-foreground">
                    {channel.value}
                  </CardContent>
                </Card>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <Card className="rounded-[2rem] border-border/60 bg-card/78">
            <CardHeader className="space-y-4">
              <CardTitle className="text-2xl">Request a Fireblocks conversation</CardTitle>
              <CardDescription className="text-base leading-7">
                Share the workflow that matters most. The form is live and the layout now gives it enough room to feel deliberate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <section className="px-4 pt-4 sm:px-6 lg:px-10 2xl:px-14">
        <Reveal>
          <div className="overflow-hidden rounded-[2.5rem] border border-border/60 bg-card/55 p-8 sm:p-10 xl:p-14">
            <SectionHeading
              eyebrow="What happens next"
              title="A better contact page should make the next three steps obvious."
              description="This keeps the page useful even before someone fills the form."
            />
            <div className="mt-12 grid gap-5 xl:grid-cols-3">
              {[
                ['01', 'We review your workflow', 'We focus on the team, volume, approval path, and the operational risk you want to reduce first.'],
                ['02', 'We map the control model', 'We identify how policy, approvals, vault classes, and reporting should fit your operating environment.'],
                ['03', 'We recommend the next move', 'That may be a deeper product walkthrough, a pilot shape, or a security and compliance review path.'],
              ].map(([step, title, body], index) => (
                <Reveal key={step} delay={0.06 + index * 0.06}>
                  <div className="rounded-[2rem] border border-border/60 bg-background/82 p-6">
                    <div className="space-y-4">
                      <div className="inline-flex rounded-full border border-cyan/20 bg-cyan-dim px-4 py-2 text-sm font-semibold text-cyan">
                        {step}
                      </div>
                      <h3 className="text-xl font-semibold">{title}</h3>
                      <p className="text-base leading-7 text-muted-foreground">{body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
