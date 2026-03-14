'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { ExternalLink, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  cn,
  formatAddress,
  formatCurrency,
  formatRelativeTime,
  getTxStatusStyle,
} from '@/lib/utils'
import type { Transaction } from '@/types'

const columnHelper = createColumnHelper<Transaction>()

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

interface TxTablePreviewProps {
  data: Transaction[]
  vaultNameById: Record<string, string>
}

export function TxTablePreview({ data, vaultNameById }: TxTablePreviewProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Tx ID',
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help font-mono text-xs text-text-muted">
                  {formatAddress(info.getValue(), 6, 4)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="font-mono text-xs">{info.getValue()}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      }),
      columnHelper.accessor('asset_symbol', {
        header: 'Asset',
        cell: (info) => (
          <span className="font-mono text-sm font-medium text-text-primary">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('amount_usd', {
        header: 'Amount',
        cell: (info) => (
          <span className="font-mono text-sm text-text-primary">
            {formatCurrency(info.getValue(), true)}
          </span>
        ),
      }),
      columnHelper.accessor('from_vault', {
        header: 'Vault',
        cell: (info) => (
          <span className="text-sm text-text-muted">
            {vaultNameById[info.getValue()] ?? 'Unknown Vault'}
          </span>
        ),
      }),
      columnHelper.accessor('to_institution', {
        header: 'To',
        cell: (info) => (
          <span className="max-w-32 truncate text-sm text-text-muted">
            {info.getValue() ?? 'External'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          const style = getTxStatusStyle(status)
          return (
            <Badge
              variant="secondary"
              className={cn(
                'gap-1.5 font-mono text-[10px] font-medium uppercase',
                style.bg,
                style.text,
              )}
            >
              {status === 'processing' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
              )}
              {status}
            </Badge>
          )
        },
      }),
      columnHelper.accessor('created_at', {
        header: 'Age',
        cell: (info) => (
          <span className="text-xs text-text-muted">{formatRelativeTime(info.getValue())}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => {
          const txHash = info.row.original.tx_hash
          if (!txHash) return null
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-text-muted hover:text-cyan"
                    asChild
                  >
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View on explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View on explorer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        },
      }),
    ],
    [vaultNameById],
  )

  const previewRows = useMemo(() => data.slice(0, 8), [data])

  const table = useReactTable({
    data: previewRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card className="border-navy-border bg-navy">
      <div className="flex items-center justify-between border-b border-navy-border px-5 py-4">
        <h3 className="text-sm font-medium text-text-muted">Recent Transactions</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-cyan hover:bg-navy-mid hover:text-cyan"
          asChild
        >
          <Link href="/transactions">
            View All
            <ExternalLink className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-navy-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-4 text-xs font-medium uppercase tracking-wider text-text-muted"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <motion.tbody
              variants={container}
              initial="hidden"
              animate="visible"
              className="contents"
            >
              {table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  variants={item}
                  className="border-navy-border transition-colors hover:bg-navy-mid/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
