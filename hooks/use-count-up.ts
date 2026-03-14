'use client'

import { useEffect, useState } from 'react'
import { useSpring, useTransform, MotionValue } from 'framer-motion'

interface UseCountUpOptions {
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
}

export function useCountUp(
  value: number,
  options: UseCountUpOptions = {}
): string {
  const { duration = 1500, decimals = 0, prefix = '', suffix = '' } = options
  const [displayed, setDisplayed] = useState(0)

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
    duration: duration / 1000,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayed(latest)
    })
    return () => unsubscribe()
  }, [spring])

  const formatted = displayed.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return `${prefix}${formatted}${suffix}`
}

export function useCountUpMotion(
  value: number,
  options: UseCountUpOptions = {}
): MotionValue<string> {
  const { decimals = 0, prefix = '', suffix = '' } = options

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return useTransform(spring, (latest) => {
    const formatted = latest.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return `${prefix}${formatted}${suffix}`
  })
}
