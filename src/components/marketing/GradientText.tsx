'use client'

import { motion, useInView } from 'framer-motion'
import { type ReactNode, useRef } from 'react'

interface GradientTextProps {
  children: ReactNode
  className?: string
  from?: string
  to?: string
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p'
}

export function GradientText({
  children,
  className = '',
  from = '#96EA7A',
  to = '#7ED066',
  as: Tag = 'span',
}: GradientTextProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, backgroundSize: '0% 100%' }}
      animate={isInView ? { opacity: 1, backgroundSize: '100% 100%' } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <Tag
        className={`bg-gradient-to-r bg-clip-text text-transparent ${className}`}
        style={{ backgroundImage: `linear-gradient(to right, ${from}, ${to})` }}
      >
        {children}
      </Tag>
    </motion.span>
  )
}
