import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with K/M/B suffixes for large numbers
export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`
    }
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value >= 1000 ? 0 : 2,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

// Format large numbers with K/M/B suffixes
export function formatNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

// Truncate wallet/tx hash addresses: 0x1234...5678
export function formatAddress(address: string, startChars = 8, endChars = 6): string {
  if (address.length <= startChars + endChars + 3) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

// Format relative time (e.g., "2h ago", "3d ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Format crypto amount with appropriate decimal places
export function formatCryptoAmount(amount: number, symbol: string): string {
  const decimals = symbol === 'BTC' ? 4 : symbol === 'ETH' ? 4 : 2
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

// Get blockchain icon/color based on chain name
export function getBlockchainColor(blockchain: string): string {
  const colors: Record<string, string> = {
    bitcoin: '#F7931A',
    ethereum: '#627EEA',
    solana: '#00FFA3',
    polygon: '#8247E5',
    arbitrum: '#28A0F0',
  }
  return colors[blockchain.toLowerCase()] ?? '#888888'
}

// Get vault type styling
export function getVaultTypeStyle(type: 'hot' | 'warm' | 'cold'): {
  bg: string
  text: string
  border: string
} {
  const styles = {
    hot: { bg: 'bg-crimson-dim', text: 'text-crimson', border: 'border-crimson/30' },
    warm: { bg: 'bg-amber-dim', text: 'text-amber', border: 'border-amber/30' },
    cold: { bg: 'bg-cyan-dim', text: 'text-cyan', border: 'border-cyan/30' },
  }
  return styles[type]
}

// Get transaction status styling
export function getTxStatusStyle(status: string): {
  bg: string
  text: string
  dot: string
} {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    approved: { bg: 'bg-emerald-dim', text: 'text-emerald', dot: 'bg-emerald' },
    pending: { bg: 'bg-amber-dim', text: 'text-amber', dot: 'bg-amber' },
    processing: { bg: 'bg-cyan-dim', text: 'text-cyan', dot: 'bg-cyan' },
    rejected: { bg: 'bg-crimson-dim', text: 'text-crimson', dot: 'bg-crimson' },
    failed: { bg: 'bg-crimson-dim', text: 'text-crimson', dot: 'bg-crimson' },
  }
  return styles[status] ?? styles.pending
}

// Get risk level styling
export function getRiskLevelStyle(level: string): {
  bg: string
  text: string
} {
  const styles: Record<string, { bg: string; text: string }> = {
    low: { bg: 'bg-emerald-dim', text: 'text-emerald' },
    medium: { bg: 'bg-amber-dim', text: 'text-amber' },
    high: { bg: 'bg-crimson-dim', text: 'text-crimson' },
    critical: { bg: 'bg-crimson', text: 'text-obsidian' },
  }
  return styles[level] ?? styles.medium
}
