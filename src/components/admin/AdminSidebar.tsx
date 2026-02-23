'use client'

import { useVaultsList } from '@/hooks/useMultiVault'

interface AdminSidebarProps {
  activeView: 'cockpit' | 'vault'
  selectedVaultSlug: string | null
  onSelectCockpit: () => void
  onSelectVault: (slug: string) => void
}

export function AdminSidebar({
  activeView,
  selectedVaultSlug,
  onSelectCockpit,
  onSelectVault
}: AdminSidebarProps) {
  const { vaults } = useVaultsList()

  return (
    <aside className="w-56 bg-white border-r border-[#9EB3A8]/20 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#9EB3A8]/20">
        <p className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">Navigation</p>
      </div>

      {/* Menu */}
      <div className="flex-1 py-2">
        {/* Cockpit */}
        <button
          onClick={onSelectCockpit}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${activeView === 'cockpit'
            ? 'bg-[#96EA7A]/10 border-l-[3px] border-[#96EA7A] text-[#0E0F0F]'
            : 'hover:bg-[#E6F1E7] text-[#9EB3A8] border-l-[3px] border-transparent'
            }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="font-medium">Terminal</span>
        </button>

        {/* Vaults Section */}
        <div className="mt-4 px-4 py-2">
          <p className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
            Vaults ({vaults.length})
          </p>
        </div>

        {vaults.map((vault) => (
          <button
            key={vault.slug}
            onClick={() => onSelectVault(vault.slug)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${activeView === 'vault' && selectedVaultSlug === vault.slug
              ? 'bg-[#96EA7A]/10 border-l-[3px] border-[#96EA7A] text-[#0E0F0F]'
              : 'hover:bg-[#E6F1E7] text-[#9EB3A8] border-l-[3px] border-transparent'
              }`}
          >
            <span className="text-lg">{vault.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{vault.name}</p>
              <p className="text-xs text-[#9EB3A8]">{vault.token}</p>
            </div>
          </button>
        ))}

        {vaults.length === 0 && (
          <p className="px-4 py-3 text-sm text-[#9EB3A8]">Aucun vault actif</p>
        )}
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-[#9EB3A8]/20">
        <button
          onClick={() => onSelectVault('create')}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${selectedVaultSlug === 'create'
            ? 'bg-[#96EA7A] text-[#0E0F0F]'
            : 'bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7]'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau Vault
        </button>
      </div>
    </aside>
  )
}
