import { Header } from '@/components/Header'

export default function Docs() {
  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      <Header />
      <main className="pt-20 pb-10">
        <div className="page-container">
          <h1 className="section-title mb-6">Documentation</h1>
          <div className="bg-white rounded-2xl border border-[var(--card-border)] p-8 space-y-4 text-sm text-[#0E0F0F]/80 leading-relaxed">
            <p>
              Hearst provides institutional-grade RWA investment vaults on the Base network.
              Documentation is being prepared and will be available soon.
            </p>
            <p>For questions, reach out to the team via our official channels.</p>
            <p className="text-xs text-[#9EB3A8]">Coming soon</p>
          </div>
        </div>
      </main>
    </div>
  )
}
