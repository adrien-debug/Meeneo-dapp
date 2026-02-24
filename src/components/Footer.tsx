'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#9EB3A8]/20">
      <div className="page-container">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Image src="/assets/tokens/hearst.svg" alt="Hearst" width={22} height={22} className="rounded-full opacity-80" />
            <span className="text-xs text-[#0E0F0F] font-medium tracking-wide">
              © {new Date().getFullYear()} Hearst
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="text-xs text-[#0E0F0F] hover:text-[#96EA7A] transition-colors font-medium">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-[#0E0F0F] hover:text-[#96EA7A] transition-colors font-medium">
              Privacy
            </Link>
            <Link href="/docs" className="text-xs text-[#0E0F0F] hover:text-[#96EA7A] transition-colors font-medium">
              Docs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
