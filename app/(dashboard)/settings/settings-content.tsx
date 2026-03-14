'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, Globe, KeySquare, Plus, Shield, Users, Webhook } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiList } from '@/hooks/use-api-list'
import { useApiResource } from '@/hooks/use-api-resource'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import type {
  ApiKeyRecord,
  OrganizationProfile,
  PlanCatalogRecord,
  SubscriptionRecord,
  SystemStatus,
  UsageSummary,
  User,
  WebhookRecord,
} from '@/types'

const tabs = [
  { value: 'general', label: 'General', icon: Globe },
  { value: 'security', label: 'Security', icon: Shield },
  { value: 'api-keys', label: 'API Keys', icon: KeySquare },
  { value: 'webhooks', label: 'Webhooks', icon: Webhook },
  { value: 'team', label: 'Team', icon: Users },
  { value: 'billing', label: 'Billing', icon: CreditCard },
] as const

export function SettingsContent() {
  const searchParams = useSearchParams()
  const billingQueryState = searchParams.get('billing')
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [enforce2fa, setEnforce2fa] = useState(true)
  const [reauth, setReauth] = useState(true)
  const [allowlist, setAllowlist] = useState('10.24.0.0/16, 52.14.72.0/24, 2001:db8::/48')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [createKeyOpen, setCreateKeyOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<User | null>(null)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<User['role']>('viewer')
  const [keyName, setKeyName] = useState('')
  const [keyExpiry, setKeyExpiry] = useState('90')
  const [keyPermissions, setKeyPermissions] = useState<Array<'read' | 'write' | 'admin'>>(['read'])
  const [latestPlaintextKey, setLatestPlaintextKey] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [isBillingActionPending, setIsBillingActionPending] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCatalogRecord['code']>('starter')
  const [selectedBillingInterval, setSelectedBillingInterval] =
    useState<OrganizationProfile['billing_interval']>('monthly')
  const { data: users, error: usersError, reload: reloadUsers } = useApiList<User>({
    endpoint: '/api/v1/users',
  })
  const { data: apiKeys, error: apiKeysError, reload: reloadKeys } = useApiList<ApiKeyRecord>({
    endpoint: '/api/v1/keys',
  })
  const { data: webhooks, error: webhooksError } = useApiList<WebhookRecord>({
    endpoint: '/api/v1/webhooks',
  })
  const { data: systems, error: systemsError } = useApiList<SystemStatus>({
    endpoint: '/api/v1/system-health',
  })
  const { data: organization, error: organizationError } = useApiResource<OrganizationProfile>({
    endpoint: '/api/v1/organization',
  })
  const { data: billing, error: billingError, reload: reloadBilling } = useApiResource<{
    organization: OrganizationProfile
    plan: PlanCatalogRecord
    subscription: SubscriptionRecord | null
    usage: UsageSummary
  }>({
    endpoint: '/api/v1/billing/subscription',
  })
  const { data: usage, error: usageError } = useApiResource<UsageSummary>({
    endpoint: '/api/v1/billing/usage',
  })
  const { data: plans } = useApiList<PlanCatalogRecord>({
    endpoint: '/api/v1/plans',
  })
  const { data: currentUser } = useApiResource<{
    userId: string
    authUserId: string
    orgId: string
    role: User['role']
    email: string
    name: string
  }>({
    endpoint: '/api/v1/me',
  })

  const teamCoverage = useMemo(
    () => `${users.filter((user) => user.two_fa_enabled).length}/${users.length} members on 2FA`,
    [users]
  )
  const degradedSystems = systems.filter((system) => system.status !== 'online')
  const loadError =
    organizationError ?? billingError ?? usageError ?? usersError ?? apiKeysError ?? webhooksError ?? systemsError
  const canSubmitInvite = inviteName.trim() && inviteEmail.trim()
  const canCreateKey = keyName.trim() && keyPermissions.length > 0
  const activeOrganization = billing?.organization ?? organization
  const activeUsage = usage ?? activeOrganization?.usage_summary
  const activePlan = billing?.plan ?? plans.find((plan) => plan.code === activeOrganization?.plan)
  const subscription = billing?.subscription

  useEffect(() => {
    if (!activeOrganization) {
      return
    }

    setSelectedPlan(activeOrganization.plan)
    setSelectedBillingInterval(activeOrganization.billing_interval)
  }, [activeOrganization])

  useEffect(() => {
    if (billingQueryState === 'success') {
      toast({
        title: 'Billing updated',
        description: 'Stripe checkout completed. Subscription details are syncing now.',
      })
      reloadBilling()
    }

    if (billingQueryState === 'cancelled') {
      toast({
        title: 'Billing checkout cancelled',
        description: 'No payment details were collected in-app. You can resume in Stripe anytime.',
      })
    }
    // `reloadBilling` is intentionally omitted to avoid retriggering on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingQueryState])

  const resetInviteForm = () => {
    setInviteName('')
    setInviteEmail('')
    setInviteRole('viewer')
  }

  const resetKeyForm = () => {
    setKeyName('')
    setKeyExpiry('90')
    setKeyPermissions(['read'])
  }

  const handleInviteMember = async () => {
    setIsInviting(true)

    try {
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Invite failed with status ${response.status}`)
      }

      toast({
        title: 'Member invited',
        description: `${inviteEmail.trim()} has been invited to this workspace.`,
      })
      setInviteOpen(false)
      resetInviteForm()
      reloadUsers()
    } catch (error) {
      toast({
        title: 'Invite failed',
        description: error instanceof Error ? error.message : 'Failed to invite member.',
        variant: 'destructive',
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeTarget) {
      return
    }

    setIsRemoving(true)

    try {
      const response = await fetch(`/api/v1/users/${removeTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Remove failed with status ${response.status}`)
      }

      toast({
        title: payload.data?.mode === 'deactivated' ? 'Member deactivated' : 'Member removed',
        description:
          payload.data?.mode === 'deactivated'
            ? 'Historical activity was preserved and access was revoked.'
            : 'The member was removed from the workspace.',
      })
      setRemoveTarget(null)
      reloadUsers()
    } catch (error) {
      toast({
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Failed to remove member.',
        variant: 'destructive',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const togglePermission = (permission: 'read' | 'write' | 'admin', checked: boolean) => {
    setKeyPermissions((current) => {
      if (checked) {
        return current.includes(permission) ? current : [...current, permission]
      }

      return current.filter((item) => item !== permission)
    })
  }

  const handleCreateKey = async () => {
    setIsCreatingKey(true)

    try {
      const expiresAt =
        keyExpiry === 'never'
          ? null
          : new Date(Date.now() + Number(keyExpiry) * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: keyName.trim(),
          permissions: keyPermissions,
          expires_at: expiresAt,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Key creation failed with status ${response.status}`)
      }

      setLatestPlaintextKey(payload.data.plaintext ?? null)
      toast({
        title: 'API key created',
        description: 'Store the plaintext key now. It will not be shown again.',
      })
      setCreateKeyOpen(false)
      resetKeyForm()
      reloadKeys()
    } catch (error) {
      toast({
        title: 'Key creation failed',
        description: error instanceof Error ? error.message : 'Failed to create API key.',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingKey(false)
    }
  }

  const handleRevokeKey = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Key revoke failed with status ${response.status}`)
      }

      toast({
        title: 'API key revoked',
        description: 'The selected API key has been revoked.',
      })
      reloadKeys()
    } catch (error) {
      toast({
        title: 'Key revoke failed',
        description: error instanceof Error ? error.message : 'Failed to revoke API key.',
        variant: 'destructive',
      })
    }
  }

  const handleCheckout = async () => {
    setIsBillingActionPending(true)

    try {
      const response = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          plan: selectedPlan,
          billing_interval: selectedBillingInterval,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Checkout failed with status ${response.status}`)
      }

      window.location.href = payload.data.url
    } catch (error) {
      toast({
        title: 'Unable to open Stripe Checkout',
        description: error instanceof Error ? error.message : 'Billing session creation failed.',
        variant: 'destructive',
      })
    } finally {
      setIsBillingActionPending(false)
    }
  }

  const handlePortal = async () => {
    setIsBillingActionPending(true)

    try {
      const response = await fetch('/api/v1/billing/portal', {
        method: 'POST',
        credentials: 'include',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Portal failed with status ${response.status}`)
      }

      window.location.href = payload.data.url
    } catch (error) {
      toast({
        title: 'Unable to open Stripe portal',
        description: error instanceof Error ? error.message : 'Billing portal session creation failed.',
        variant: 'destructive',
      })
    } finally {
      setIsBillingActionPending(false)
    }
  }

  return (
    <div className="space-y-6">
      {loadError && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Settings data unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Organization Settings</h1>
          <p className="mt-1 text-sm text-text-muted">
            Security controls, access governance, keys, and integration endpoints.
          </p>
        </div>
        <Badge className="bg-cyan-dim text-cyan">{teamCoverage}</Badge>
      </div>

      <Tabs defaultValue="security" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-transparent p-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-10 rounded-xl border border-border bg-card px-4 data-[state=active]:border-cyan/30 data-[state=active]:text-cyan"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="general">
          <Card className="border-border bg-card/90">
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Business identity, operating contacts, and tenant defaults.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Organization</p>
                <Input value={activeOrganization?.name ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Legal name</p>
                <Input value={activeOrganization?.legal_name ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Plan</p>
                <Input
                  value={activeOrganization?.plan ? activeOrganization.plan.toUpperCase() : ''}
                  className="bg-background"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Subscription status</p>
                <Input
                  value={activeOrganization?.subscription_status ? activeOrganization.subscription_status.replace('_', ' ') : ''}
                  className="bg-background capitalize"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Billing email</p>
                <Input value={activeOrganization?.billing_email ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Operations email</p>
                <Input value={activeOrganization?.operations_email ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Compliance email</p>
                <Input value={activeOrganization?.compliance_email ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Business type</p>
                <Input value={activeOrganization?.business_type ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Registration country</p>
                <Input value={activeOrganization?.registration_country ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Registration number</p>
                <Input value={activeOrganization?.registration_number ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Workspace slug</p>
                <Input value={activeOrganization?.slug ?? ''} className="bg-background" readOnly />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Onboarding state</p>
                <Input
                  value={activeOrganization?.onboarding_status ? activeOrganization.onboarding_status.replace('_', ' ') : ''}
                  className="bg-background capitalize"
                  readOnly
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border bg-card/90">
              <CardHeader>
                <CardTitle>Security Controls</CardTitle>
                <CardDescription>Live node posture, sign-in protection, and approval policy hardening.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  {systems.map((node) => (
                    <div
                      key={node.component}
                      className="flex items-center justify-between rounded-xl border border-border bg-background/70 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-text-primary">{node.component}</p>
                        <p className="text-xs text-text-muted">
                          Last heartbeat {formatRelativeTime(node.lastChecked)}
                        </p>
                      </div>
                      <Badge className={node.status === 'online' ? 'bg-emerald-dim text-emerald' : 'bg-amber-dim text-amber'}>
                        {node.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-text-primary">IP allowlist</p>
                  <Input value={allowlist} onChange={(event) => setAllowlist(event.target.value)} className="bg-background" />
                  <p className="text-xs text-text-muted">Comma-separated CIDR blocks for operator access.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-text-primary">Session timeout</p>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 rounded-xl border border-border bg-background/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-text-primary">Enforce 2FA</p>
                        <p className="text-xs text-text-muted">Require MFA across the organization.</p>
                      </div>
                      <Switch checked={enforce2fa} onCheckedChange={setEnforce2fa} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-text-primary">Re-auth for &gt; $500K approvals</p>
                        <p className="text-xs text-text-muted">Typed confirmation and fresh session required.</p>
                      </div>
                      <Switch checked={reauth} onCheckedChange={setReauth} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/90">
              <CardHeader>
                <CardTitle>Risk Posture</CardTitle>
                <CardDescription>Current controls mapped to operational risk.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className={
                    degradedSystems.length
                      ? 'rounded-xl border border-amber/30 bg-amber-dim px-4 py-4'
                      : 'rounded-xl border border-emerald/25 bg-emerald-dim px-4 py-4'
                  }
                >
                  <p className={degradedSystems.length ? 'text-sm font-medium text-amber' : 'text-sm font-medium text-emerald'}>
                    Threat level: {degradedSystems.length ? 'ELEVATED' : 'LOW'}
                  </p>
                  <p className="mt-1 text-sm text-text-primary">
                    {degradedSystems.length
                      ? `${degradedSystems.length} health signal${degradedSystems.length === 1 ? '' : 's'} need review.`
                      : 'No critical alerts. Live node telemetry is within baseline.'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 px-4 py-4">
                  <p className="text-sm font-medium text-text-primary">Protected approval paths</p>
                  <p className="mt-1 text-sm text-text-muted">High-value approval workflows require re-auth, MFA, and role-qualified signers.</p>
                </div>
                <div className="rounded-xl border border-amber/30 bg-amber-dim px-4 py-4">
                  <p className="text-sm font-medium text-amber">Review recommendation</p>
                  <p className="mt-1 text-sm text-text-primary">
                    {degradedSystems.length
                      ? `${degradedSystems.map((system) => system.component).join(', ')} ${degradedSystems.length === 1 ? 'is' : 'are'} reporting non-healthy status.`
                      : 'All monitored components are healthy. Review IP allowlists and MFA coverage before expanding operator access.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api-keys">
          <Card className="border-border bg-card/90">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Keys are shown once on creation and should be stored in your secure secret manager.</CardDescription>
              </div>
              <Button
                className="bg-cyan text-obsidian hover:bg-cyan/90"
                onClick={() => setCreateKeyOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create Key
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestPlaintextKey && (
                <div className="rounded-xl border border-amber/30 bg-amber-dim px-4 py-3 text-sm text-amber">
                  New key: <span className="font-mono text-text-primary">{latestPlaintextKey}</span>
                </div>
              )}
              {apiKeys[0] && (
                <div className="rounded-xl border border-cyan/20 bg-cyan-dim/20 px-4 py-3 text-sm text-cyan">
                  Most recent key prefix: {apiKeys[0].prefix}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Perms</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.prefix} className="border-border">
                      <TableCell className="font-medium text-text-primary">{key.name}</TableCell>
                      <TableCell className="font-mono text-xs text-text-primary">{key.prefix}</TableCell>
                      <TableCell className="text-text-muted">{key.permissions.join(', ')}</TableCell>
                      <TableCell className="text-text-muted">
                        {key.last_used_at ? formatRelativeTime(key.last_used_at) : 'Never used'}
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {key.expires_at ? new Date(key.expires_at).toLocaleDateString('en-US') : 'No expiry'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-crimson hover:bg-crimson-dim hover:text-crimson"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="border-border bg-card/90">
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Outbound events for ledgers, monitoring, and downstream settlement systems.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {webhooks.map((endpoint) => (
                <div key={endpoint.id} className="rounded-xl border border-border bg-background/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-text-primary">{endpoint.name}</p>
                    <Badge className={endpoint.status === 'active' ? 'bg-emerald-dim text-emerald' : 'bg-amber-dim text-amber'}>
                      {endpoint.status}
                    </Badge>
                  </div>
                  <p className="mt-2 font-mono text-xs text-text-muted">{endpoint.url}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    Events: {endpoint.events.join(', ')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="border-border bg-card/90">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Team Access</CardTitle>
                <CardDescription>Manage approvers, analysts, viewers, and administrative operators.</CardDescription>
              </div>
              <Button
                className="bg-cyan text-obsidian hover:bg-cyan/90"
                onClick={() => setInviteOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>2FA</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-border">
                      <TableCell className="font-medium text-text-primary">{user.name}</TableCell>
                      <TableCell className="text-text-muted">{user.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-text-primary capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.two_fa_enabled ? 'bg-emerald-dim text-emerald' : 'bg-crimson-dim text-crimson'}>
                          {user.two_fa_enabled ? 'Enabled' : 'Missing'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-muted">
                        {user.last_login ? formatRelativeTime(user.last_login) : 'Pending invite'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-muted"
                          disabled={currentUser?.userId === user.id}
                          onClick={() => setRemoveTarget(user)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6">
            <Card className="border-border bg-card/90">
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>
                    Hosted Stripe billing, live subscription status, and plan-based feature access.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={handlePortal}
                    disabled={isBillingActionPending || !activeOrganization?.stripe_customer_id}
                  >
                    Manage in Stripe
                  </Button>
                  <Button
                    className="bg-cyan text-obsidian hover:bg-cyan/90"
                    onClick={handleCheckout}
                    disabled={isBillingActionPending}
                  >
                    {isBillingActionPending ? 'Opening Stripe...' : 'Upgrade Plan'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-sm text-text-muted">Current plan</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">
                    {activeOrganization?.plan ? activeOrganization.plan.toUpperCase() : 'N/A'}
                  </p>
                  <p className="mt-1 text-xs text-text-muted capitalize">
                    {activeOrganization?.billing_interval ?? 'monthly'} billing
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-sm text-text-muted">Subscription status</p>
                  <p className="mt-2 text-xl font-semibold capitalize text-text-primary">
                    {subscription?.status ?? activeOrganization?.subscription_status ?? 'pending'}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {subscription?.current_period_end
                      ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString('en-US')}`
                      : 'Stripe-hosted billing state'}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-sm text-text-muted">AUC in plan</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">
                    {formatCurrency(activeUsage?.limits.auc_limit_usd ?? activePlan?.limits.auc_limit_usd ?? 0, true)}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Using {formatCurrency(activeUsage?.total_auc ?? activeOrganization?.total_auc ?? 0, true)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background/70 p-4">
                  <p className="text-sm text-text-muted">Monthly transactions</p>
                  <p className="mt-2 text-xl font-semibold text-text-primary">
                    {(activeUsage?.monthly_transactions ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Limit {(activeUsage?.limits.monthly_tx_limit ?? activePlan?.limits.monthly_tx_limit ?? 0).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border-border bg-card/90">
                <CardHeader>
                  <CardTitle>Plan catalog</CardTitle>
                  <CardDescription>
                    Billing stays on Stripe Checkout. Choose a plan here, then continue to Stripe to update payment and subscription details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex rounded-xl border border-border bg-background/70 p-1">
                      <button
                        type="button"
                        onClick={() => setSelectedBillingInterval('monthly')}
                        className={
                          selectedBillingInterval === 'monthly'
                            ? 'rounded-lg bg-cyan px-3 py-1.5 text-sm font-medium text-obsidian'
                            : 'rounded-lg px-3 py-1.5 text-sm text-text-muted'
                        }
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBillingInterval('annual')}
                        className={
                          selectedBillingInterval === 'annual'
                            ? 'rounded-lg bg-cyan px-3 py-1.5 text-sm font-medium text-obsidian'
                            : 'rounded-lg px-3 py-1.5 text-sm text-text-muted'
                        }
                      >
                        Annual
                      </button>
                    </div>
                    <p className="text-xs text-text-muted">
                      Payment details are collected only inside Stripe-hosted Checkout.
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    {plans.map((plan) => {
                      const isSelected = selectedPlan === plan.code
                      const price =
                        selectedBillingInterval === 'annual'
                          ? plan.annual_price_usd
                          : plan.monthly_price_usd

                      return (
                        <button
                          key={plan.code}
                          type="button"
                          onClick={() => setSelectedPlan(plan.code)}
                          className={
                            isSelected
                              ? 'rounded-2xl border border-cyan bg-cyan-dim/15 p-4 text-left'
                              : 'rounded-2xl border border-border bg-background/70 p-4 text-left'
                          }
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-lg font-semibold text-text-primary">{plan.name}</p>
                            {activeOrganization?.plan === plan.code ? (
                              <Badge className="bg-emerald-dim text-emerald">Current</Badge>
                            ) : null}
                          </div>
                          <p className="mt-3 text-3xl font-semibold text-text-primary">
                            ${price.toLocaleString()}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                            per {selectedBillingInterval === 'annual' ? 'year' : 'month'}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-text-muted">{plan.description}</p>
                          <p className="mt-4 text-xs text-text-muted">
                            {formatCurrency(plan.limits.auc_limit_usd ?? 0, true)} AUC cap,{' '}
                            {(plan.limits.monthly_tx_limit ?? 0).toLocaleString()} tx/month,{' '}
                            {(plan.limits.api_rate_limit_per_minute ?? 0).toLocaleString()} req/min
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/90">
                <CardHeader>
                  <CardTitle>Entitlements and usage</CardTitle>
                  <CardDescription>Access is restricted by both role and active subscription plan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <p className="text-sm font-medium text-text-primary">Included features</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(activeOrganization?.entitlements?.features ?? activePlan?.features ?? []).map((feature) => (
                        <Badge key={feature} className="bg-cyan-dim/20 text-cyan">
                          {feature.replaceAll('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-primary">AUC consumption</p>
                        <span className="text-xs text-text-muted">
                          {formatCurrency(activeUsage?.total_auc ?? 0, true)} /{' '}
                          {formatCurrency(activeUsage?.limits.auc_limit_usd ?? 0, true)}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-primary">Transaction volume</p>
                        <span className="text-xs text-text-muted">
                          {(activeUsage?.monthly_transactions ?? 0).toLocaleString()} /{' '}
                          {(activeUsage?.limits.monthly_tx_limit ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-text-primary">API throughput</p>
                        <span className="text-xs text-text-muted">
                          {(activeUsage?.api_calls_this_month ?? 0).toLocaleString()} monthly calls tracked
                        </span>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-cyan/20 bg-cyan-dim/10 text-text-primary">
                    <AlertTitle>Hosted payment flow</AlertTitle>
                    <AlertDescription>
                      Card details are never collected in this app. Billing updates redirect to Stripe Checkout or the Stripe customer portal and only synced subscription identifiers are stored here.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send a workspace invite and pre-provision the member in this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input
                id="invite-name"
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                className="bg-background"
                placeholder="Priya Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="bg-background"
                placeholder="priya@institution.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as User['role'])}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-cyan text-obsidian hover:bg-cyan/90"
              disabled={!canSubmitInvite || isInviting}
              onClick={handleInviteMember}
            >
              {isInviting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createKeyOpen} onOpenChange={setCreateKeyOpen}>
        <DialogContent className="border-border bg-card">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for backend or integration use. The plaintext key is shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                className="bg-background"
                placeholder="Treasury Ops"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiry</Label>
              <Select value={keyExpiry} onValueChange={setKeyExpiry}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="never">No expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid gap-3 rounded-xl border border-border bg-background/70 p-4">
                {(['read', 'write', 'admin'] as const).map((permission) => (
                  <label key={permission} className="flex items-center gap-3 text-sm text-text-primary">
                    <Checkbox
                      checked={keyPermissions.includes(permission)}
                      onCheckedChange={(checked) => togglePermission(permission, checked === true)}
                    />
                    <span className="capitalize">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateKeyOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-cyan text-obsidian hover:bg-cyan/90"
              disabled={!canCreateKey || isCreatingKey}
              onClick={handleCreateKey}
            >
              {isCreatingKey ? 'Creating...' : 'Create Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent className="border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `Remove ${removeTarget.name} from this workspace. Members with historical activity will be deactivated instead of fully deleted.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-crimson text-text-primary hover:bg-crimson/90"
            >
              {isRemoving ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
