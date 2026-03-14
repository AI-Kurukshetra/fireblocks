import type { Metadata } from 'next'
import { AboutPage } from '@/components/marketing/about-page'

export const metadata: Metadata = {
  title: 'About Fireblocks',
  description:
    'Learn how Fireblocks helps institutions govern wallets, approvals, policy enforcement, and audit-ready digital asset workflows.',
}

export default function About() {
  return <AboutPage />
}
