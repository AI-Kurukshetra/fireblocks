'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
}

export function Reveal({
  children,
  className,
  delay = 0,
  transition,
  ...props
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay, ...transition }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
