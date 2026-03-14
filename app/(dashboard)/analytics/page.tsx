import { Metadata } from 'next'
import { AnalyticsContent } from './analytics-content'

export const metadata: Metadata = {
  title: 'Analytics - Fireblocks',
  description: 'Portfolio analytics and performance insights',
}

export default function AnalyticsPage() {
  return <AnalyticsContent />
}
