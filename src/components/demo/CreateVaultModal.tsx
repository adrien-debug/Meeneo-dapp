'use client'

import { useDemo } from '@/context/demo-context'
import { useState } from 'react'

interface CreateVaultModalProps {
  onClose: () => void
}

export function CreateVaultModal({ onClose }: CreateVaultModalProps) {
  const { createVault } = useDemo()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rwa, setRwa] = useState(40)
  const [usdc, setUsdc] = useState(30)
  const [btc, setBtc] = useState(30)
  const [lockMonths, setLockMonths] = useState(36)
  const [cliffMonths, setCliffMonths] = useState(12)
  const [tvlCap, setTvlCap] = useState(10_000_000)
  const [minDeposit, setMinDeposit] = useState(1000)
  const [apyMin, setApyMin] = useState(8)
  const [apyMax, setApyMax] = useState(15)

  const allocTotal = rwa + usdc + btc
  const valid = allocTotal === 100 && name.trim().length > 0

  function handleCreate() {
    if (!valid) return
    createVault({
      name,
      description,
      rwaAlloc: rwa,
      usdcAlloc: usdc,
      btcAlloc: btc,
      lockMonths,
      cliffMonths,
      tvlCap,
      minDeposit,
      apyMin,
      apyMax,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
          <h2 className="text-lg font-bold text-[#0E0F0F]">Create New Vault</h2>
          <button onClick={onClose} className="text-[#9EB3A8] hover:text-[#0E0F0F] text-xl">
            x
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label="Name" value={name} onChange={setName} placeholder="Hearst 04" />
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Custom vault strategy"
          />

          <div>
            <label className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-2 block">
              Strategy Allocation ({allocTotal}%)
            </label>
            {allocTotal !== 100 && <p className="text-xs text-red-500 mb-2">Must total 100%</p>}
            <div className="grid grid-cols-3 gap-3">
              <NumField label="RWA Mining" value={rwa} onChange={setRwa} suffix="%" />
              <NumField label="USDC Yield" value={usdc} onChange={setUsdc} suffix="%" />
              <NumField label="BTC Hedged" value={btc} onChange={setBtc} suffix="%" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="Lock Period" value={lockMonths} onChange={setLockMonths} suffix="mo" />
            <NumField
              label="Yield Cliff"
              value={cliffMonths}
              onChange={setCliffMonths}
              suffix="mo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="APY Min" value={apyMin} onChange={setApyMin} suffix="%" />
            <NumField label="APY Max" value={apyMax} onChange={setApyMax} suffix="%" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField label="TVL Cap" value={tvlCap} onChange={setTvlCap} suffix="$" />
            <NumField label="Min Deposit" value={minDeposit} onChange={setMinDeposit} suffix="$" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#9EB3A8]/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-[#9EB3A8]/20 text-sm font-semibold text-[#0E0F0F] hover:bg-[#F2F2F2] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!valid}
            className="flex-1 py-3 rounded-xl bg-[#96EA7A] text-black text-sm font-bold hover:bg-[#7ed066] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Vault
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-[#9EB3A8]/20 text-sm text-[#0E0F0F] focus:outline-none focus:border-[#96EA7A] transition-colors"
      />
    </div>
  )
}

function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix: string
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-2.5 rounded-xl border border-[#9EB3A8]/20 text-sm text-[#0E0F0F] focus:outline-none focus:border-[#96EA7A] transition-colors pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#9EB3A8]">
          {suffix}
        </span>
      </div>
    </div>
  )
}
