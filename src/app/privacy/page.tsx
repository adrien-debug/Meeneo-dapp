import { Header } from '@/components/Header'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <main className="pt-20 pb-10">
        <div className="page-container">
          <h1 className="section-title mb-6">Privacy Policy</h1>
          <div className="bg-white rounded-2xl border border-[var(--card-border)] p-8 space-y-4 text-sm text-[#0E0F0F]/80 leading-relaxed">
            <p>
              Hearst respects your privacy. We collect minimal data necessary to provide our
              services — primarily your wallet address for on-chain interactions.
            </p>
            <p>
              We do not sell, share, or trade personal information. Analytics data is anonymized and
              used solely to improve the platform experience.
            </p>
            <p className="text-xs text-[#9EB3A8]">Last updated: February 2026</p>
          </div>
        </div>
      </main>
    </div>
  )
}
