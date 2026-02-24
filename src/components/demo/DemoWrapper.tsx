'use client'

import { DemoProvider } from '@/context/demo-context'
import { DemoPanel } from './DemoPanel'
import type { ReactNode } from 'react'

export function DemoWrapper({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      {children}
      <DemoPanel />
    </DemoProvider>
  )
}
