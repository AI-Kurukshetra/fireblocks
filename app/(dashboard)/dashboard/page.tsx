import { Metadata } from 'next'
import { DashboardContent } from './dashboard-content'

export const metadata: Metadata = {
  title: 'Dashboard - Fireblocks',
  description: 'Overview of your institutional digital asset custody operations',
}

export default function DashboardPage() {
  return <DashboardContent />
}
