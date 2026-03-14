import { Metadata } from 'next'
import { ComplianceContent } from './compliance-content'

export const metadata: Metadata = {
  title: 'Compliance - Fireblocks',
  description: 'Compliance management and risk monitoring',
}

export default function CompliancePage() {
  return <ComplianceContent />
}
