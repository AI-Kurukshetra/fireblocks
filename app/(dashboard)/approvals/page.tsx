import { Metadata } from 'next'
import { ApprovalsContent } from './approvals-content'

export const metadata: Metadata = {
  title: 'Approvals - Fireblocks',
  description: 'Review and approve pending transaction requests',
}

export default function ApprovalsPage() {
  return <ApprovalsContent />
}
