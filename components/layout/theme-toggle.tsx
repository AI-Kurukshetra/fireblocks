'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-9 w-9 border-border bg-muted/70 hover:bg-muted"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      disabled={!mounted}
    >
      {isDark ? <Sun className="h-4 w-4 text-amber" /> : <Moon className="h-4 w-4 text-cyan" />}
    </Button>
  )
}
