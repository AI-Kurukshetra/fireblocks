import { Metadata } from 'next'
import { TransactionsContent } from './transactions-content'

export const metadata: Metadata = {
  title: 'Transactions - Fireblocks',
  description: 'View and manage all digital asset transactions',
}

export default function TransactionsPage() {
  return <TransactionsContent />
}
