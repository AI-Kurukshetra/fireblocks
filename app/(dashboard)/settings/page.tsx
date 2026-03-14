import { Metadata } from 'next'
import { SettingsContent } from './settings-content'

export const metadata: Metadata = {
  title: 'Settings - Fireblocks',
  description: 'Manage organization settings, security controls, API keys, and team access',
}

export default function SettingsPage() {
  return <SettingsContent />
}
