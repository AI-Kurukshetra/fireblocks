import { Metadata } from 'next'
import { VaultsContent } from './vaults-content'

export const metadata: Metadata = {
  title: 'Vaults - Fireblocks',
  description: 'Manage your institutional digital asset vaults',
}

export default function VaultsPage() {
  return <VaultsContent />
}
