'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-text-muted hover:bg-navy-mid hover:text-text-primary"
      aria-label="Sign out"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const supabase = createClient()
          await supabase.auth.signOut()
          router.push('/login')
          router.refresh()
        })
      }}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  )
}
