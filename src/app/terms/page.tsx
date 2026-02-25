import { Header } from '@/components/Header'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <main className="pt-20 pb-10">
        <div className="page-container">
          <h1 className="section-title mb-6">Terms of Service</h1>
          <div className="bg-white rounded-2xl border border-[var(--card-border)] p-8 space-y-4 text-sm text-[#0E0F0F]/80 leading-relaxed">
            <p>
              By accessing and using the Hearst platform, you agree to be bound by these Terms of
              Service. The platform provides access to tokenized real-world asset (RWA) investment
              vaults on the Base network.
            </p>
            <p>
              All investments carry risk. Past performance does not guarantee future results. Users
              are responsible for their own investment decisions and should conduct their own due
              diligence.
            </p>
            <p className="text-xs text-[#9EB3A8]">Last updated: February 2026</p>
          </div>
        </div>
      </main>
    </div>
  )
}
