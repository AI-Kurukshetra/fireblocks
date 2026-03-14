'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  MoreVertical,
  Check,
  X,
  Eye,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useApiList } from '@/hooks/use-api-list'
import { toast } from '@/hooks/use-toast'
import { cn, formatRelativeTime, getRiskLevelStyle } from '@/lib/utils'
import type { ComplianceRecord } from '@/types'

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export function ComplianceContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { data: records, error } = useApiList<ComplianceRecord>({
    endpoint: '/api/v1/compliance',
  })
  const institutionsMonitored = records.length
  const flaggedTransactions = records.reduce((sum, record) => sum + record.flagged_transactions, 0)
  const pendingKyc = records.filter((record) => record.kyc_status === 'pending').length
  const avgScore = records.length
    ? Math.round(records.reduce((sum, record) => sum + record.compliance_score, 0) / records.length)
    : 0
  const reports = useMemo(
    () => [
      { name: 'Compliance Summary', slug: 'compliance-summary', date: new Date().toISOString(), format: 'PDF' },
      { name: 'Risk Assessment Snapshot', slug: 'risk-assessment', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), format: 'PDF' },
      { name: 'Institution Review Export', slug: 'institution-review', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), format: 'CSV' },
      { name: 'Quarterly AML Brief', slug: 'quarterly-aml', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), format: 'PDF' },
    ],
    [],
  )
  const stats = [
    {
      title: 'Institutions Monitored',
      value: institutionsMonitored.toLocaleString(),
      icon: Shield,
      color: 'text-cyan',
      bgColor: 'bg-cyan-dim',
    },
    {
      title: 'Flagged Transactions',
      value: flaggedTransactions.toString(),
      icon: AlertTriangle,
      color: 'text-crimson',
      bgColor: 'bg-crimson-dim',
    },
    {
      title: 'Pending KYC',
      value: pendingKyc.toString(),
      icon: Clock,
      color: 'text-amber',
      bgColor: 'bg-amber-dim',
    },
    {
      title: 'Org Score',
      value: `${avgScore}/100`,
      icon: FileText,
      color: 'text-emerald',
      bgColor: 'bg-emerald-dim',
      showProgress: true,
      progress: avgScore,
    },
  ]

  const downloadReport = async (report: string, format: 'pdf' | 'csv' = 'pdf') => {
    setIsGenerating(true)
    try {
      const url = `/api/v1/reports/compliance?report=${encodeURIComponent(report)}&format=${format}`
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast({
        title: 'Report download started',
        description: `${report.replace(/-/g, ' ')} is being downloaded as ${format.toUpperCase()}.`,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {error && (
        <Alert className="border-amber/30 bg-amber-dim/20 text-amber">
          <AlertTitle>Compliance data unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Compliance</h1>
          <p className="mt-1 text-sm text-text-muted">
            AML/KYC monitoring and regulatory compliance
          </p>
        </div>
        <Button
          className="bg-cyan text-obsidian hover:bg-cyan/90"
          onClick={() => downloadReport('compliance-summary', 'pdf')}
          disabled={isGenerating}
        >
          <FileText className="mr-1.5 h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </Button>
      </div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-navy-border bg-navy p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">{stat.title}</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-text-primary">
                  {stat.value}
                </p>
              </div>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>
            {stat.showProgress && (
              <div className="mt-4">
                <Progress
                  value={stat.progress}
                  className="h-2 bg-navy-mid [&>div]:bg-emerald"
                />
              </div>
            )}
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk Table */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="border-navy-border bg-navy">
            <div className="border-b border-navy-border px-5 py-4">
              <h2 className="font-medium text-text-primary">Institution Risk Assessment</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-navy-border hover:bg-transparent">
                  <TableHead className="text-text-muted">Institution</TableHead>
                  <TableHead className="text-text-muted">Risk</TableHead>
                  <TableHead className="text-text-muted">AML Status</TableHead>
                  <TableHead className="text-text-muted">KYC Status</TableHead>
                  <TableHead className="text-text-muted">Score</TableHead>
                  <TableHead className="text-text-muted">Last Review</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const riskStyle = getRiskLevelStyle(record.risk_level)
                  return (
                    <TableRow
                      key={record.id}
                      className={cn(
                        'border-navy-border transition-colors hover:bg-navy-mid/50',
                        (record.risk_level === 'high' || record.risk_level === 'critical') &&
                          'bg-crimson-dim/10'
                      )}
                    >
                      <TableCell className="font-medium text-text-primary">
                        {record.institution_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-bold uppercase',
                            riskStyle.bg,
                            riskStyle.text
                          )}
                        >
                          {record.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {record.aml_status === 'passed' && (
                            <Check className="h-3.5 w-3.5 text-emerald" />
                          )}
                          {record.aml_status === 'under_review' && (
                            <Clock className="h-3.5 w-3.5 text-amber" />
                          )}
                          {record.aml_status === 'flagged' && (
                            <AlertTriangle className="h-3.5 w-3.5 text-crimson" />
                          )}
                          <span
                            className={cn(
                              'text-sm capitalize',
                              record.aml_status === 'passed' && 'text-emerald',
                              record.aml_status === 'under_review' && 'text-amber',
                              record.aml_status === 'flagged' && 'text-crimson'
                            )}
                          >
                            {record.aml_status.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {record.kyc_status === 'verified' && (
                            <Check className="h-3.5 w-3.5 text-emerald" />
                          )}
                          {record.kyc_status === 'pending' && (
                            <Clock className="h-3.5 w-3.5 text-amber" />
                          )}
                          {record.kyc_status === 'rejected' && (
                            <X className="h-3.5 w-3.5 text-crimson" />
                          )}
                          <span
                            className={cn(
                              'text-sm capitalize',
                              record.kyc_status === 'verified' && 'text-emerald',
                              record.kyc_status === 'pending' && 'text-amber',
                              record.kyc_status === 'rejected' && 'text-crimson'
                            )}
                          >
                            {record.kyc_status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={record.compliance_score}
                            className={cn(
                              'h-2 w-16 bg-navy-mid',
                              record.compliance_score >= 80 && '[&>div]:bg-emerald',
                              record.compliance_score >= 60 &&
                                record.compliance_score < 80 &&
                                '[&>div]:bg-amber',
                              record.compliance_score < 60 && '[&>div]:bg-crimson'
                            )}
                          />
                          <span className="font-mono text-xs text-text-muted">
                            {record.compliance_score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-muted">
                        {formatRelativeTime(record.last_review)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-navy-border bg-navy">
                            <DropdownMenuItem className="text-text-primary focus:bg-navy-mid">
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-text-primary focus:bg-navy-mid" onClick={() => downloadReport(record.institution_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'pdf')}>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </motion.div>

        {/* Reports Panel */}
        <motion.div variants={item}>
          <Card className="border-navy-border bg-navy">
            <div className="border-b border-navy-border px-5 py-4">
              <h2 className="font-medium text-text-primary">Recent Reports</h2>
            </div>
            <div className="divide-y divide-navy-border">
              {reports.map((report, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-navy-mid/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-mid">
                      <FileText className="h-4 w-4 text-text-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{report.name}</p>
                      <p className="text-xs text-text-muted">
                        {new Date(report.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-navy-mid text-[10px] font-medium text-text-muted"
                    >
                      {report.format}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-cyan"
                      onClick={() => downloadReport(report.slug, report.format.toLowerCase() as 'pdf' | 'csv')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-navy-border p-3">
              <Button
                variant="ghost"
                className="w-full text-cyan hover:bg-navy-mid hover:text-cyan"
              >
                View All Reports
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
