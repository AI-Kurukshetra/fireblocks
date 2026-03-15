'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/layout/theme-toggle'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState(mode === 'login' ? 'a.chen@fireblocks.io' : '')
  const [password, setPassword] = useState(mode === 'login' ? 'Fireblocks#2026' : '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const copy = useMemo(() => {
    if (mode === 'signup') {
      return {
        eyebrow: 'Launch Your Workspace',
        title: 'Create Your Institutional Custody Tenant',
        description:
          'Provision an organization, bootstrap demo vaults, and activate Supabase-backed authentication in one step.',
        submit: 'Create Account',
        switchHref: '/login',
        switchLabel: 'Already have an account?',
        switchCta: 'Sign in',
      }
    }

    return {
      eyebrow: 'Secure Access',
      title: 'Sign In to Fireblocks',
      description:
        'Access your organization workspace with Supabase-authenticated credentials and enterprise session controls.',
      submit: 'Sign In',
      switchHref: '/signup',
      switchLabel: 'Need a workspace?',
      switchCta: 'Create account',
    }
  }, [mode])

  const handleSubmit = () => {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      try {
        const supabase = createClient()

        if (mode === 'signup') {
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
              data: {
                full_name: fullName,
                organization_name: organizationName,
              },
            },
          })

          if (signUpError) {
            setError(signUpError.message)
            return
          }

          if (data.session) {
            router.push('/dashboard')
            router.refresh()
            return
          }

          setMessage('Account created. Check your email to confirm your address, then sign in.')
          router.refresh()
          return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          return
        }

        router.push('/dashboard')
        router.refresh()
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : 'Authentication failed. Verify your Supabase environment variables.',
        )
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--cyan-dim),transparent_24%),radial-gradient(circle_at_80%_20%,var(--emerald-dim),transparent_20%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white_8%),var(--background))]" />
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="relative grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-12 shadow-premium lg:block">
          <div className="max-w-xl space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan">{copy.eyebrow}</p>
              <h1 className="text-5xl font-bold tracking-tight leading-[1.1]">
                Institutional-grade digital asset operations, without a dark-only UI.
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                Supabase authentication, seeded vault data, approval workflows, compliance records,
                API keys, and webhook infrastructure are provisioned behind this workspace.
              </p>
            </div>

            <div className="grid gap-5 pt-4">
              <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-6 shadow-premium-sm hover:shadow-premium hover:bg-background/90 transition-all hover-lift">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-emerald/30 bg-emerald-dim/50 text-emerald flex-shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Tenant bootstrap</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      New sign-ups create an organization, admin profile, demo vaults, transactions,
                      compliance posture, keys, and webhook endpoints.
                    </p>
                  </div>
                </div>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-6 shadow-premium-sm hover:shadow-premium hover:bg-background/90 transition-all hover-lift">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan flex-shrink-0">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Supabase-backed access</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Email/password auth, SSR session handling, role-aware API routes, and protected
                      dashboard navigation are all wired to the backend layer.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <Card className="border-border/60 bg-card/70 backdrop-blur-sm shadow-premium-lg">
          <CardHeader className="space-y-6 pb-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan">{copy.eyebrow}</p>
              <CardTitle className="text-3xl font-bold">{copy.title}</CardTitle>
            </div>
            <p className="text-base leading-7 text-muted-foreground">{copy.description}</p>
            <div className="flex items-start gap-3 rounded-2xl border border-cyan/20 bg-cyan-dim/10 px-4 py-4 mt-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-cyan flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Secure session handling</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Supabase-authenticated sessions, SSR protection, and role-aware tenant access.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {mode === 'signup' && (
              <>
                <div className="space-y-3">
                  <Label htmlFor="full-name" className="font-semibold">Full name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Alexandra Chen"
                    className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="organization-name" className="font-semibold">Organization</Label>
                  <Input
                    id="organization-name"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Fireblocks Capital Markets"
                    className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all"
                  />
                </div>
              </>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="font-semibold">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@institution.com"
                className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="password" className="font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use a strong passphrase"
                className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all"
              />
            </div>

            <div className="rounded-xl border border-amber/30 bg-amber-dim/20 px-4 py-4 text-sm text-amber font-medium">
              Failed login protection and account lockout are enforced at the backend layer.
            </div>

            {error && (
              <div className="rounded-xl border border-crimson/30 bg-crimson-dim/20 px-4 py-4 text-sm text-crimson font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-emerald/30 bg-emerald-dim/20 px-4 py-4 text-sm text-emerald font-medium">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                isPending ||
                !email.trim() ||
                !password.trim() ||
                (mode === 'signup' && (!fullName.trim() || !organizationName.trim()))
              }
              className="h-12 w-full bg-cyan text-obsidian font-semibold hover:bg-cyan/90 rounded-lg shadow-premium hover:shadow-premium-lg transition-all hover-lift"
            >
              {isPending ? 'Working...' : copy.submit}
              {!isPending && <ArrowRight className="h-5 w-5 ml-2" />}
            </Button>

            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-muted-foreground">{copy.switchLabel}</span>
              <Link href={copy.switchHref} className="font-semibold text-cyan hover:text-cyan/80 transition-colors">
                {copy.switchCta}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
