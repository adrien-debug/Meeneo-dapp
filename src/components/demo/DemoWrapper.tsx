'use client'

import { DemoProvider } from '@/context/demo-context'
import type { ReactNode } from 'react'
import { DemoPanel } from './DemoPanel'

export function DemoWrapper({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      {children}
      <DemoPanel />
    </DemoProvider>
  )
}
