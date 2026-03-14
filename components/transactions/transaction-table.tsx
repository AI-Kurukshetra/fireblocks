'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  cn,
  formatAddress,
  formatCurrency,
  formatRelativeTime,
  formatCryptoAmount,
  getTxStatusStyle,
} from '@/lib/utils'
import type { Transaction } from '@/types'

const columnHelper = createColumnHelper<Transaction>()

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-text-muted hover:text-cyan"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 text-emerald" /> : <Copy className="h-3 w-3" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface TransactionTableProps {
  data: Transaction[]
  vaultNameById: Record<string, string>
}

export function TransactionTable({ data, vaultNameById }: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) {
        next.delete(rowId)
      } else {
        next.add(rowId)
      }
      return next
    })
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="border-navy-border data-[state=checked]:border-cyan data-[state=checked]:bg-cyan"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-navy-border data-[state=checked]:border-cyan data-[state=checked]:bg-cyan"
          />
        ),
      }),
      columnHelper.accessor('id', {
        header: 'Tx ID',
        cell: (info) => (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help font-mono text-xs text-text-muted">
                  {formatAddress(info.getValue(), 8, 6)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="flex items-center gap-2">
                <span className="font-mono text-xs">{info.getValue()}</span>
                <CopyButton text={info.getValue()} />
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
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => {
          const row = info.row.original
          return (
            <div className="text-right">
              <span className="font-mono text-sm text-text-primary">
                {formatCryptoAmount(info.getValue(), row.asset_symbol)} {row.asset_symbol}
              </span>
              <span className="block font-mono text-xs text-text-muted">
                {formatCurrency(row.amount_usd, true)}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('from_vault', {
        header: 'From Vault',
        cell: (info) => (
          <span className="text-sm text-text-muted">
            {vaultNameById[info.getValue()] ?? 'Unknown Vault'}
          </span>
        ),
      }),
      columnHelper.accessor('to_institution', {
        header: 'To',
        cell: (info) => (
          <span className="max-w-40 truncate text-sm text-text-muted">
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
                style.text
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
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium text-text-muted hover:bg-transparent hover:text-text-primary"
          >
            Date
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : null}
          </Button>
        ),
        cell: (info) => (
          <span className="text-xs text-text-muted">{formatRelativeTime(info.getValue())}</span>
        ),
      }),
      columnHelper.display({
        id: 'expand',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-text-muted hover:text-text-primary"
            onClick={() => toggleRowExpanded(row.id)}
            aria-label={expandedRows.has(row.id) ? 'Collapse row' : 'Expand row'}
          >
            <motion.div
              animate={{ rotate: expandedRows.has(row.id) ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </Button>
        ),
      }),
    ],
    [expandedRows, vaultNameById]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  const selectedCount = Object.keys(rowSelection).length

  return (
    <Card className="border-navy-border bg-navy">
      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-between border-b border-navy-border bg-cyan-dim/20 px-5 py-3"
          >
            <span className="text-sm text-text-primary">
              <span className="font-mono font-medium text-cyan">{selectedCount}</span> transaction
              {selectedCount !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-navy-border bg-navy text-text-primary hover:bg-navy-mid"
              >
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-navy-border bg-navy text-text-primary hover:bg-navy-mid"
              >
                Flag for Review
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-text-muted hover:text-text-primary"
                onClick={() => setRowSelection({})}
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-navy-border hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 text-xs font-medium uppercase tracking-wider text-text-muted"
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
            {table.getRowModel().rows.map((row) => (
              <>
                <TableRow
                  key={row.id}
                  className={cn(
                    'border-navy-border transition-colors hover:bg-navy-mid/50',
                    row.getIsSelected() && 'bg-cyan-dim/10'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Expanded Row Content */}
                <AnimatePresence>
                  {expandedRows.has(row.id) && (
                    <motion.tr
                      key={`${row.id}-expanded`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-navy-border"
                    >
                      <td colSpan={columns.length} className="bg-navy-mid/30 px-8 py-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <span className="text-xs text-text-muted">Transaction Hash</span>
                            {row.original.tx_hash ? (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="font-mono text-sm text-text-primary">
                                  {formatAddress(row.original.tx_hash, 10, 8)}
                                </span>
                                <CopyButton text={row.original.tx_hash} />
                                <a
                                  href={`https://etherscan.io/tx/${row.original.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                            ) : (
                              <span className="mt-1 block text-sm text-text-muted">Pending</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs text-text-muted">Gas Fee</span>
                            <span className="mt-1 block font-mono text-sm text-text-primary">
                              ${row.original.gas_fee_usd.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-text-muted">Approvals</span>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-border">
                                <div
                                  className="h-full rounded-full bg-cyan transition-all"
                                  style={{
                                    width: `${(row.original.approvals_received / row.original.approvals_required) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="font-mono text-xs text-text-muted">
                                {row.original.approvals_received}/{row.original.approvals_required}
                              </span>
                            </div>
                          </div>
                        </div>
                        {row.original.rejection_reason && (
                          <div className="mt-4 rounded-lg bg-crimson-dim/30 p-3">
                            <span className="text-xs font-medium text-crimson">Rejection Reason</span>
                            <p className="mt-1 text-sm text-text-primary">
                              {row.original.rejection_reason}
                            </p>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-navy-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Rows per page</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-20 border-navy-border bg-navy-mid text-text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-navy-border bg-navy">
              {[10, 25, 50, 100].map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                  className="text-text-primary focus:bg-navy-mid"
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-xs text-text-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
