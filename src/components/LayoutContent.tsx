'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const MARKETING_ROUTES = ['/']

export function LayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isMarketing = MARKETING_ROUTES.includes(pathname)

  return <div className={isMarketing ? '' : 'pb-20'}>{children}</div>
}
