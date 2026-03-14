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

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden overflow-hidden rounded-[32px] border border-border bg-card/82 p-10 backdrop-blur-md lg:block">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{copy.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-text-primary">
              Institutional-grade digital asset operations, without a dark-only UI.
            </h1>
            <p className="mt-4 text-base leading-7 text-text-muted">
              Supabase authentication, seeded vault data, approval workflows, compliance records,
              API keys, and webhook infrastructure are provisioned behind this workspace.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-border bg-background/80 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald" />
                <div>
                  <p className="font-medium text-text-primary">Tenant bootstrap</p>
                  <p className="mt-1 text-sm text-text-muted">
                    New sign-ups create an organization, admin profile, demo vaults, transactions,
                    compliance posture, keys, and webhook endpoints.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-5">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-cyan" />
                <div>
                  <p className="font-medium text-text-primary">Supabase-backed access</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Email/password auth, SSR session handling, role-aware API routes, and protected
                    dashboard navigation are all wired to the backend layer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-border bg-card/94 shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--cyan)_22%,transparent)]">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-text-muted">{copy.eyebrow}</p>
                <CardTitle className="mt-3 text-2xl">{copy.title}</CardTitle>
              </div>
            </div>
            <CardDescription className="text-sm leading-6">{copy.description}</CardDescription>
            <div className="flex items-start gap-3 rounded-2xl border border-cyan/15 bg-cyan-dim/10 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-cyan" />
              <div>
                <p className="text-sm font-medium text-text-primary">Secure session handling</p>
                <p className="text-xs leading-5 text-text-muted">
                  Supabase-authenticated sessions, SSR protection, and role-aware tenant access.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Alexandra Chen"
                    className="h-11 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization-name">Organization</Label>
                  <Input
                    id="organization-name"
                    value={organizationName}
                    onChange={(event) => setOrganizationName(event.target.value)}
                    placeholder="Fireblocks Capital Markets"
                    className="h-11 bg-background"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@institution.com"
                className="h-11 bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use a strong passphrase"
                className="h-11 bg-background"
              />
            </div>

            <div className="rounded-2xl border border-amber/30 bg-amber-dim px-4 py-3 text-sm text-amber">
              Failed login protection and account lockout are enforced at the backend layer.
            </div>

            {error && (
              <div className="rounded-2xl border border-crimson/30 bg-crimson-dim px-4 py-3 text-sm text-crimson">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald/30 bg-emerald-dim px-4 py-3 text-sm text-emerald">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
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
              className="h-11 w-full bg-cyan text-obsidian hover:bg-cyan/90"
            >
              {isPending ? 'Working...' : copy.submit}
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{copy.switchLabel}</span>
              <Link href={copy.switchHref} className="font-medium text-cyan hover:text-cyan/80">
                {copy.switchCta}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
