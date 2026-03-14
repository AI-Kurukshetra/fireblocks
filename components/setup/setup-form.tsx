'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--cyan-dim),transparent_28%),radial-gradient(circle_at_90%_10%,var(--emerald-dim),transparent_18%),linear-gradient(180deg,color-mix(in_oklab,var(--background)_92%,white_8%),var(--background))] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1500px] gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <section className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Badge className="w-fit bg-cyan-dim text-cyan">Workspace onboarding</Badge>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
              Configure your Fireblocks tenant before access is unlocked
            </h1>
            <p className="max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
              Add the organization profile, assign operating contacts, choose the subscription plan,
              and continue to Stripe Checkout. Payment details stay entirely on Stripe.
            </p>
          </div>

          <Card className="overflow-hidden border-border bg-card/90">
            <CardContent className="grid gap-6 p-6">
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
                  <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
                    <item.icon className="h-5 w-5 text-cyan" />
                    <p className="mt-4 text-sm font-semibold text-text-primary">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-border bg-background/75 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <ShieldCheck className="h-4 w-4 text-cyan" />
                    Setup readiness
                  </div>
                  <div className="mt-4 space-y-3">
                    {completionItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card/70 px-4 py-3"
                      >
                        <span className="text-sm text-text-primary">{item.label}</span>
                        <span className="text-xs font-medium text-text-muted">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan/15 bg-cyan-dim/10 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                    <CreditCard className="h-4 w-4 text-cyan" />
                    Hosted billing
                  </div>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    The app stores only synced customer and subscription identifiers. Card entry,
                    payment method updates, and invoices stay on Stripe-hosted surfaces.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-text-primary">
                    <CheckCircle2 className="h-4 w-4 text-emerald" />
                    No custom card form in-app
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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

        <Card className="border-border bg-card/94 shadow-[0_24px_80px_-30px_color-mix(in_oklab,var(--cyan)_24%,transparent)]">
          <CardHeader className="space-y-4 border-b border-border/80 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-cyan">
                  <Landmark className="h-4 w-4" />
                  Organization onboarding
                </div>
                <CardTitle className="text-2xl">Set up the account owner workspace</CardTitle>
                <CardDescription className="max-w-2xl text-sm leading-6">
                  This record becomes the source of truth for tenant identity, billing contacts,
                  policy context, and access gating.
                </CardDescription>
              </div>
              <div className="hidden rounded-2xl border border-border bg-background/70 px-4 py-3 text-right lg:block">
                <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Selected plan</p>
                <p className="mt-1 text-base font-semibold text-text-primary">
                  {selectedPlanRecord?.name ?? 'Starter'}
                </p>
                <p className="text-xs text-text-muted">
                  {billingInterval === 'annual' ? 'Annual' : 'Monthly'} billing
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-dim/20 text-cyan">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Business profile</h2>
                  <p className="text-sm text-text-muted">
                    Core identity and registration data for the organization tenant.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization name</Label>
                  <Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Legal name</Label>
                  <Input value={legalName} onChange={(event) => setLegalName(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Business type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="h-11 bg-background">
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
                <div className="space-y-2">
                  <Label>Registration country</Label>
                  <Input value={registrationCountry} onChange={(event) => setRegistrationCountry(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Registration number</Label>
                  <Input value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Tax ID</Label>
                  <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(event) => setWebsite(event.target.value)} className="h-11 bg-background" placeholder="https://company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 bg-background" />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-dim/20 text-emerald">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Operating contacts</h2>
                  <p className="text-sm text-text-muted">
                    These contacts are used for billing, compliance coordination, and operational workflows.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Billing email</Label>
                  <Input value={billingEmail} onChange={(event) => setBillingEmail(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Operations email</Label>
                  <Input value={operationsEmail} onChange={(event) => setOperationsEmail(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Compliance email</Label>
                  <Input value={complianceEmail} onChange={(event) => setComplianceEmail(event.target.value)} className="h-11 bg-background" />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-dim/20 text-amber">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">Registered address</h2>
                  <p className="text-sm text-text-muted">
                    Jurisdiction and address details feed the tenant profile and reporting context.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Address line 1</Label>
                  <Input value={addressLine1} onChange={(event) => setAddressLine1(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address line 2</Label>
                  <Input value={addressLine2} onChange={(event) => setAddressLine2(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(event) => setCity(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>State / Region</Label>
                  <Input value={stateRegion} onChange={(event) => setStateRegion(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Postal code</Label>
                  <Input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={country} onChange={(event) => setCountry(event.target.value)} className="h-11 bg-background" />
                </div>
              </div>
            </section>

            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-dim/20 text-cyan">
                    <Globe2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Subscription plan</h2>
                    <p className="text-sm text-text-muted">
                      Choose a package here and continue to Stripe to complete billing.
                    </p>
                  </div>
                </div>
                <Select
                  value={normalizeBillingInterval(billingInterval)}
                  onValueChange={(value) => setBillingInterval(normalizeBillingInterval(value as OrganizationProfile['billing_interval']))}
                >
                  <SelectTrigger className="h-11 w-40 bg-background">
                    <SelectValue placeholder="Monthly" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isActive = selectedPlan === plan.code
                  const price = billingInterval === 'annual' ? plan.annual_price_usd : plan.monthly_price_usd

                  return (
                    <button
                      key={plan.code}
                      type="button"
                      onClick={() => setSelectedPlan(plan.code)}
                      className={
                        isActive
                          ? 'rounded-3xl border border-cyan bg-cyan-dim/15 p-5 text-left shadow-[0_20px_50px_-30px_color-mix(in_oklab,var(--cyan)_35%,transparent)]'
                          : 'rounded-3xl border border-border bg-background/75 p-5 text-left'
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-text-primary">{plan.name}</p>
                        {isActive ? <Badge className="bg-cyan text-obsidian">Selected</Badge> : null}
                      </div>
                      <p className="mt-4 text-3xl font-semibold text-text-primary">${price.toLocaleString()}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                        per {billingInterval === 'annual' ? 'year' : 'month'}
                      </p>
                      <p className="mt-4 text-sm leading-6 text-text-muted">{plan.description}</p>
                      <div className="mt-5 rounded-2xl border border-border bg-card/70 p-3">
                        <p className="text-xs text-text-muted">
                          {(plan.limits.monthly_tx_limit ?? 0).toLocaleString()} tx / month
                        </p>
                        <p className="mt-1 text-xs text-text-muted">
                          {((plan.limits.auc_limit_usd ?? 0) / 1_000_000).toLocaleString()}M USD AUC limit
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedPlanRecord ? (
                <div className="grid gap-4 rounded-3xl border border-border bg-background/75 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Current selection</p>
                    <p className="mt-2 text-2xl font-semibold text-text-primary">
                      {selectedPlanRecord.name}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      ${planPrice.toLocaleString()} per {billingInterval === 'annual' ? 'year' : 'month'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlanRecord.features.slice(0, 8).map((feature) => (
                      <Badge key={feature} className="bg-cyan-dim/20 text-cyan">
                        {formatFeatureLabel(feature)}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <div className="flex flex-col gap-4 rounded-3xl border border-border bg-background/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Continue to hosted Stripe Checkout</p>
                <p className="mt-1 text-sm text-text-muted">
                  Subscription and payment details are completed outside the app on Stripe.
                </p>
              </div>
              <Button
                type="button"
                className="h-11 min-w-52 bg-cyan text-obsidian hover:bg-cyan/90"
                onClick={handleSubmit}
                disabled={isPending || isFinalizingCheckout}
              >
                {isPending ? 'Saving...' : isFinalizingCheckout ? 'Confirming Stripe...' : 'Review and continue'}
                {!isPending && !isFinalizingCheckout && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
