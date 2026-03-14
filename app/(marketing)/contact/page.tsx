import type { Metadata } from 'next'
import { ContactPage } from '@/components/marketing/contact-page'

export const metadata: Metadata = {
  title: 'Contact Fireblocks',
  description:
    'Talk to Fireblocks about institutional custody operations, onboarding, security architecture, and enterprise support.',
}

export default function Contact() {
  return <ContactPage />
}
