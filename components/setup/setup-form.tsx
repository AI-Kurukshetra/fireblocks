'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  Globe2,
  Landmark,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useApiList } from '@/hooks/use-api-list'
import { useApiResource } from '@/hooks/use-api-resource'
import { toast } from '@/hooks/use-toast'
import type { OrganizationProfile, PlanCatalogRecord } from '@/types'

const businessTypes = [
  'Asset Manager',
  'Exchange',
  'Custodian',
  'Treasury',
  'Fintech Platform',
] as const

function normalizeBillingInterval(value: OrganizationProfile['billing_interval'] | null | undefined) {
  return value === 'annual' ? 'annual' : 'monthly'
}

function formatFeatureLabel(feature: string) {
  return feature.replaceAll('_', ' ')
}

export function SetupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isFinalizingCheckout, setIsFinalizingCheckout] = useState(false)
  const { data: plans } = useApiList<PlanCatalogRecord>({ endpoint: '/api/v1/plans' })
  const { data: setupState, reload: reloadSetupState } = useApiResource<{
    organization: OrganizationProfile
    requires_setup: boolean
  }>({ endpoint: '/api/v1/setup' })
  const organization = setupState?.organization
  const [organizationName, setOrganizationName] = useState(organization?.name ?? '')
  const [legalName, setLegalName] = useState(organization?.legal_name ?? organization?.name ?? '')
  const [businessType, setBusinessType] = useState(organization?.business_type ?? 'Asset Manager')
  const [registrationCountry, setRegistrationCountry] = useState(organization?.registration_country ?? 'United States')
  const [registrationNumber, setRegistrationNumber] = useState(organization?.registration_number ?? '')
  const [taxId, setTaxId] = useState(organization?.tax_id ?? '')
  const [website, setWebsite] = useState(organization?.website ?? '')
  const [phone, setPhone] = useState(organization?.phone ?? '')
  const [billingEmail, setBillingEmail] = useState(organization?.billing_email ?? '')
  const [operationsEmail, setOperationsEmail] = useState(organization?.operations_email ?? '')
  const [complianceEmail, setComplianceEmail] = useState(organization?.compliance_email ?? '')
  const [addressLine1, setAddressLine1] = useState(organization?.address_line_1 ?? '')
  const [addressLine2, setAddressLine2] = useState(organization?.address_line_2 ?? '')
  const [city, setCity] = useState(organization?.city ?? '')
  const [stateRegion, setStateRegion] = useState(organization?.state_region ?? '')
  const [postalCode, setPostalCode] = useState(organization?.postal_code ?? '')
  const [country, setCountry] = useState(organization?.country ?? 'United States')
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalogRecord['code']>(organization?.plan ?? 'starter')
  const [billingInterval, setBillingInterval] = useState<OrganizationProfile['billing_interval']>(
    normalizeBillingInterval(organization?.billing_interval),
  )

  useEffect(() => {
    if (!organization) {
      return
    }

    setOrganizationName((current) => current || organization.name || '')
    setLegalName((current) => current || organization.legal_name || organization.name || '')
    setBusinessType((current) => current || organization.business_type || 'Asset Manager')
    setRegistrationCountry((current) => current || organization.registration_country || 'United States')
    setRegistrationNumber((current) => current || organization.registration_number || '')
    setTaxId((current) => current || organization.tax_id || '')
    setWebsite((current) => current || organization.website || '')
    setPhone((current) => current || organization.phone || '')
    setBillingEmail((current) => current || organization.billing_email || '')
    setOperationsEmail((current) => current || organization.operations_email || '')
    setComplianceEmail((current) => current || organization.compliance_email || '')
    setAddressLine1((current) => current || organization.address_line_1 || '')
    setAddressLine2((current) => current || organization.address_line_2 || '')
    setCity((current) => current || organization.city || '')
    setStateRegion((current) => current || organization.state_region || '')
    setPostalCode((current) => current || organization.postal_code || '')
    setCountry((current) => current || organization.country || 'United States')
    setSelectedPlan(organization.plan)
    setBillingInterval(normalizeBillingInterval(organization.billing_interval))
  }, [organization])

  useEffect(() => {
    const checkoutState = searchParams.get('checkout')
    const sessionId = searchParams.get('session_id')

    if (checkoutState !== 'success' || !sessionId) {
      return
    }

    let cancelled = false
    setIsFinalizingCheckout(true)

    const finalizeCheckout = async () => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (cancelled) {
          return
        }

        try {
          const response = await fetch('/api/v1/billing/finalize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              session_id: sessionId,
            }),
          })

          const payload = await response.json()

          if (!response.ok) {
            throw new Error(payload.error?.message ?? 'Unable to finalize Stripe checkout.')
          }

          if (payload.data?.completed) {
            reloadSetupState()
            router.push('/dashboard')
            router.refresh()
            return
          }
        } catch (error) {
          if (!cancelled) {
            toast({
              title: 'Billing confirmation pending',
              description:
                error instanceof Error ? error.message : 'Stripe checkout confirmation is still pending.',
              variant: 'destructive',
            })
          }
          break
        }

        await new Promise((resolve) => {
          window.setTimeout(resolve, 1500)
        })
      }

      if (!cancelled) {
        reloadSetupState()
        setIsFinalizingCheckout(false)
      }
    }

    void finalizeCheckout()

    return () => {
      cancelled = true
    }
  }, [reloadSetupState, router, searchParams])

  const selectedPlanRecord = useMemo(
    () => plans.find((plan) => plan.code === selectedPlan) ?? plans[0],
    [plans, selectedPlan],
  )
  const planPrice = selectedPlanRecord
    ? billingInterval === 'annual'
      ? selectedPlanRecord.annual_price_usd
      : selectedPlanRecord.monthly_price_usd
    : 0
  const completionItems = [
    { label: 'Business profile', value: organizationName.trim() && legalName.trim() ? 'Ready' : 'Required' },
    { label: 'Operating contacts', value: billingEmail.trim() && operationsEmail.trim() ? 'Ready' : 'Required' },
    { label: 'Billing setup', value: `${billingInterval === 'annual' ? 'Annual' : 'Monthly'} on Stripe` },
  ]

  async function handleSubmit() {
    startTransition(async () => {
      try {
        const response = await fetch('/api/v1/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            organization_name: organizationName,
            legal_name: legalName,
            business_type: businessType,
            registration_country: registrationCountry,
            registration_number: registrationNumber,
            tax_id: taxId,
            website,
            phone,
            billing_email: billingEmail,
            operations_email: operationsEmail,
            compliance_email: complianceEmail,
            address_line_1: addressLine1,
            address_line_2: addressLine2,
            city,
            state_region: stateRegion,
            postal_code: postalCode,
            country,
            plan: selectedPlan,
            billing_interval: billingInterval,
          }),
        })

        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error?.message ?? 'Setup failed')
        }

        if (payload.data?.redirect_url) {
          window.location.href = payload.data.redirect_url
          return
        }

        toast({
          title: 'Workspace configured',
          description: 'Organization setup is complete.',
        })
        router.push('/dashboard')
        router.refresh()
      } catch (error) {
        toast({
          title: 'Setup failed',
          description: error instanceof Error ? error.message : 'Unable to complete setup.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--cyan-dim),transparent_28%),radial-gradient(circle_at_90%_10%,var(--emerald-dim),transparent_18%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white_8%),var(--background))] px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-10 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="space-y-8 xl:sticky xl:top-12 xl:self-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan-dim/20 px-4 py-2 w-fit font-semibold text-cyan text-sm">
            <Globe2 className="h-4 w-4" />
            Workspace onboarding
          </div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Configure your Fireblocks tenant before access is unlocked
            </h1>
            <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              Add the organization profile, assign operating contacts, choose the subscription plan,
              and continue to Stripe Checkout. Payment details stay entirely on Stripe.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-premium">
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: Building2,
                    title: '1. Business',
                    body: 'Capture the legal entity, registration footprint, and operating identity.',
                  },
                  {
                    icon: FileCheck2,
                    title: '2. Controls',
                    body: 'Store the billing, compliance, and operations contacts used across the tenant.',
                  },
                  {
                    icon: CreditCard,
                    title: '3. Billing',
                    body: 'Select the plan here, then finish subscription setup on hosted Stripe pages.',
                  },
                ].map((item) => (
                  <motion.div key={item.title} whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-5 shadow-premium-sm hover:shadow-premium hover:bg-background/90 transition-all hover-lift">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 font-bold text-foreground">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-6 shadow-premium-sm hover:shadow-premium hover:bg-background/90 transition-all hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">Setup readiness</h3>
                  </div>
                  <div className="mt-5 space-y-3">
                    {completionItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3 transition-all"
                      >
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        <span className="text-xs font-bold text-cyan">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-cyan/20 bg-cyan-dim/10 backdrop-blur-sm p-6 shadow-premium-sm hover:shadow-premium hover:bg-cyan-dim/15 transition-all hover-lift">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">Hosted billing</h3>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    The app stores only synced customer and subscription identifiers. Card entry,
                    payment method updates, and invoices stay on Stripe-hosted surfaces.
                  </p>
                  <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald/20 bg-emerald-dim/10 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald flex-shrink-0" />
                    <span className="font-semibold text-foreground">No custom card form in-app</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {searchParams.get('checkout') === 'cancelled' ? (
            <div className="rounded-2xl border border-amber/30 bg-amber-dim px-4 py-3 text-sm text-amber">
              Checkout was cancelled. Your setup values are still here and you can continue again.
            </div>
          ) : null}
          {searchParams.get('checkout') === 'success' ? (
            <div className="rounded-2xl border border-cyan/25 bg-cyan-dim/15 px-4 py-3 text-sm text-cyan">
              {isFinalizingCheckout
                ? 'Stripe checkout completed. Confirming subscription and unlocking the dashboard now.'
                : 'Stripe checkout completed. If redirect is delayed, the subscription sync is still finalizing.'}
            </div>
          ) : null}
        </section>

        <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm shadow-premium-lg overflow-hidden">
          <div className="space-y-6 border-b border-border/40 p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-cyan">
                  <Landmark className="h-5 w-5" />
                  Organization onboarding
                </div>
                <h2 className="text-3xl font-bold">Set up the account owner workspace</h2>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                  This record becomes the source of truth for tenant identity, billing contacts,
                  policy context, and access gating.
                </p>
              </div>
              <div className="hidden rounded-xl border border-border/60 bg-background/70 backdrop-blur-sm px-5 py-4 text-right lg:block shadow-premium-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selected plan</p>
                <p className="mt-2 text-xl font-bold text-foreground">
                  {selectedPlanRecord?.name ?? 'Starter'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">
                  {billingInterval === 'annual' ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-8">
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Business profile</h3>
                  <p className="text-sm text-muted-foreground">
                    Core identity and registration data for the organization tenant.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="font-semibold">Organization name</Label>
                  <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Legal name</Label>
                  <Input value={legalName} onChange={(event) => setLegalName(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Business type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Registration country</Label>
                  <Input value={registrationCountry} onChange={(event) => setRegistrationCountry(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Registration number</Label>
                  <Input value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Tax ID</Label>
                  <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Website</Label>
                  <Input value={website} onChange={(event) => setWebsite(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" placeholder="https://company.com" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Phone</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-emerald/30 bg-emerald-dim/50 text-emerald">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Operating contacts</h3>
                  <p className="text-sm text-muted-foreground">
                    These contacts are used for billing, compliance coordination, and operational workflows.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-3">
                  <Label className="font-semibold">Billing email</Label>
                  <Input value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Operations email</Label>
                  <Input value={operationsEmail} onChange={(event) => setOperationsEmail(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Compliance email</Label>
                  <Input value={complianceEmail} onChange={(event) => setComplianceEmail(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-amber/30 bg-amber-dim/50 text-amber">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Registered address</h3>
                  <p className="text-sm text-muted-foreground">
                    Jurisdiction and address details feed the tenant profile and reporting context.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <Label className="font-semibold">Address line 1</Label>
                  <Input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label className="font-semibold">Address line 2</Label>
                  <Input value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">City</Label>
                  <Input value={city} onChange={(event) => setCity(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">State / Region</Label>
                  <Input value={stateRegion} onChange={(event) => setStateRegion(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Postal code</Label>
                  <Input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Country</Label>
                  <Input value={country} onChange={(event) => setCountry(event.target.value)} className="h-12 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all" />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-cyan/30 bg-cyan-dim/50 text-cyan">
                    <Globe2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Subscription plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a package here and continue to Stripe to complete billing.
                    </p>
                  </div>
                </div>
                <Select
                  value={normalizeBillingInterval(billingInterval)}
                  onValueChange={(value) => setBillingInterval(normalizeBillingInterval(value as OrganizationProfile['billing_interval']))}
                >
                  <SelectTrigger className="h-12 w-44 bg-background/70 border-border/60 rounded-lg shadow-premium-sm focus:shadow-premium focus:border-cyan/50 transition-all">
                    <SelectValue placeholder="Monthly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isActive = selectedPlan === plan.code
                  const price = billingInterval === 'annual' ? plan.annual_price_usd : plan.monthly_price_usd

                  return (
                    <motion.button
                      key={plan.code}
                      type="button"
                      onClick={() => setSelectedPlan(plan.code)}
                      whileHover={{ y: -2 }}
                      className={
                        isActive
                          ? 'group rounded-2xl border-2 border-cyan bg-cyan-dim/15 backdrop-blur-sm p-7 text-left shadow-premium-lg hover:shadow-premium-lg transition-all'
                          : 'group rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-7 text-left shadow-premium-sm hover:shadow-premium hover:border-cyan/30 hover:bg-background/80 transition-all hover-lift'
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xl font-bold text-foreground">{plan.name}</p>
                        {isActive ? <Badge className="bg-cyan text-obsidian font-semibold">Selected</Badge> : null}
                      </div>
                      <p className="mt-5 text-4xl font-bold text-foreground">${price.toLocaleString()}</p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        per {billingInterval === 'annual' ? 'year' : 'month'}
                      </p>
                      <p className="mt-5 text-base leading-7 text-muted-foreground">{plan.description}</p>
                      <div className="mt-6 rounded-xl border border-border/40 bg-card/50 p-4 space-y-2">
                        <p className="text-sm font-semibold text-foreground">
                          {(plan.limits.monthly_tx_limit ?? 0).toLocaleString()} tx / month
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {((plan.limits.auc_limit_usd ?? 0) / 1_000_000).toLocaleString()}M USD AUC limit
                        </p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {selectedPlanRecord ? (
                <motion.div whileHover={{ y: -2 }} className="group grid gap-6 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-7 lg:grid-cols-[0.9fr_1.1fr] shadow-premium-sm hover:shadow-premium hover:bg-background/90 transition-all hover-lift">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Current selection</p>
                    <p className="mt-3 text-3xl font-bold text-foreground">
                      {selectedPlanRecord.name}
                    </p>
                    <p className="mt-2 text-base font-semibold text-muted-foreground">
                      ${planPrice.toLocaleString()} per {billingInterval === 'annual' ? 'year' : 'month'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 items-start justify-end">
                    {selectedPlanRecord.features.slice(0, 8).map((feature) => (
                      <Badge key={feature} className="bg-cyan-dim/30 text-cyan font-medium">
                        {formatFeatureLabel(feature)}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </section>

            <motion.div whileHover={{ y: -2 }} className="group flex flex-col gap-6 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-sm p-7 sm:flex-row sm:items-center sm:justify-between shadow-premium hover:shadow-premium-lg hover:bg-background/90 transition-all hover-lift">
              <div>
                <p className="text-base font-bold text-foreground">Continue to hosted Stripe Checkout</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Subscription and payment details are completed outside the app on Stripe.
                </p>
              </div>
              <Button
                type="button"
                className="h-12 min-w-56 bg-cyan text-obsidian font-semibold rounded-lg shadow-premium hover:shadow-premium-lg hover:bg-cyan/90 transition-all hover-lift"
                onClick={handleSubmit}
                disabled={isPending || isFinalizingCheckout}
              >
                {isPending ? 'Saving...' : isFinalizingCheckout ? 'Confirming Stripe...' : 'Review and continue'}
                {!isPending && !isFinalizingCheckout && <ChevronRight className="h-5 w-5 ml-2" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
