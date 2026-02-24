'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import SimInput from '@/components/simulation/SimInput'
import SimSelect from '@/components/simulation/SimSelect'
import SimTable from '@/components/simulation/SimTable'
import SimMetric from '@/components/simulation/SimMetric'
import { formatUSD, formatBTC, formatPercent } from '@/lib/sim-utils'
import { CARD } from '@/components/ui/constants'

interface StepMinersHostingProps {
  onComplete: (data: { minerIds: string[]; siteIds: string[] }) => void
}

type TabKey = 'miners' | 'hosting'

export default function StepMinersHosting({ onComplete }: StepMinersHostingProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('miners')

  // ── Shared State ──
  const [miners, setMiners] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [error, setError] = useState('')

  // ── Miner Tab State ──
  const [selectedMiner, setSelectedMiner] = useState<string>('')
  const [showMinerForm, setShowMinerForm] = useState(false)
  const [editingMinerId, setEditingMinerId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formHashrate, setFormHashrate] = useState(200)
  const [formPower, setFormPower] = useState(3500)
  const [formPrice, setFormPrice] = useState(5800)
  const [formLifetime, setFormLifetime] = useState(36)
  const [formMaintenance, setFormMaintenance] = useState(0.02)

  // Miner simulation
  const [curves, setCurves] = useState<any[]>([])
  const [networkCurves, setNetworkCurves] = useState<any[]>([])
  const [selectedBTCCurve, setSelectedBTCCurve] = useState('')
  const [selectedNetCurve, setSelectedNetCurve] = useState('')
  const [elecRate, setElecRate] = useState(0.065)
  const [uptime, setUptime] = useState(0.95)
  const [simMonths, setSimMonths] = useState(36)
  const [simResult, setSimResult] = useState<any>(null)
  const [minerRunning, setMinerRunning] = useState(false)

  // ── Hosting Tab State ──
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [siteFormName, setSiteFormName] = useState('')
  const [siteFormElecRate, setSiteFormElecRate] = useState(0.05)
  const [siteFormHostingFee, setSiteFormHostingFee] = useState(5.0)
  const [siteFormUptime, setSiteFormUptime] = useState(0.95)
  const [siteFormCurtailment, setSiteFormCurtailment] = useState(0.0)
  const [siteFormCapacity, setSiteFormCapacity] = useState(50)
  const [siteFormLockup, setSiteFormLockup] = useState(12)
  const [siteFormNotice, setSiteFormNotice] = useState(30)

   
  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (miners.length > 0 && sites.length > 0) {
      onComplete({ minerIds: miners.map((m: any) => m.id), siteIds: sites.map((s: any) => s.id) })
    }
  }, [miners, sites, onComplete])

  const loadAll = async () => {
    try {
      const [m, s, btc, net]: any[] = await Promise.all([
        fetch('/api/simulation/miners/').then((r) => r.json()),
        fetch('/api/simulation/hosting/').then((r) => r.json()),
        fetch('/api/simulation/btc-price-curves/').then((r) => r.json()),
        fetch('/api/simulation/network-curves/').then((r) => r.json()),
      ])
      setMiners(m)
      setSites(s)
      setCurves(btc)
      setNetworkCurves(net)
      if (m.length > 0 && !selectedMiner) setSelectedMiner(m[0].id)
      if (btc.length > 0 && !selectedBTCCurve) setSelectedBTCCurve(btc[0].id)
      if (net.length > 0 && !selectedNetCurve) setSelectedNetCurve(net[0].id)
    } catch {
      /* API not available yet */
    }
  }

  // ── Miner CRUD ──
  const resetMinerForm = () => {
    setFormName('')
    setFormHashrate(200)
    setFormPower(3500)
    setFormPrice(5800)
    setFormLifetime(36)
    setFormMaintenance(0.02)
    setEditingMinerId(null)
  }

  const openEditMinerForm = (miner: any) => {
    setEditingMinerId(miner.id)
    setFormName(miner.name)
    setFormHashrate(miner.hashrate_th)
    setFormPower(miner.power_w)
    setFormPrice(miner.price_usd)
    setFormLifetime(miner.lifetime_months)
    setFormMaintenance(miner.maintenance_pct)
    setShowMinerForm(true)
  }

  const saveMiner = async () => {
    try {
      const payload = {
        name: formName,
        hashrate_th: formHashrate,
        power_w: formPower,
        price_usd: formPrice,
        lifetime_months: formLifetime,
        maintenance_pct: formMaintenance,
      }
      if (editingMinerId) {
        await fetch(`/api/simulation/miners/${editingMinerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/simulation/miners/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setShowMinerForm(false)
      resetMinerForm()
      loadAll()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const deleteMiner = async (id: string) => {
    try {
      await fetch(`/api/simulation/miners/${id}`, { method: 'DELETE' })
      loadAll()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const runMinerSim = async () => {
    if (!selectedMiner || !selectedBTCCurve || !selectedNetCurve) {
      setError('Select a miner, BTC price curve, and network curve first.')
      return
    }
    setMinerRunning(true)
    setError('')
    try {
      const res = await fetch('/api/simulation/miners/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          miner_id: selectedMiner,
          btc_price_curve_id: selectedBTCCurve,
          network_curve_id: selectedNetCurve,
          electricity_rate: elecRate,
          uptime,
          months: simMonths,
        }),
      }).then((r) => r.json())
      setSimResult(res)
    } catch (e: any) {
      setError(e.message)
    }
    setMinerRunning(false)
  }

  // ── Hosting CRUD ──
  const createSite = async () => {
    try {
      await fetch('/api/simulation/hosting/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: siteFormName,
          electricity_price_usd_per_kwh: siteFormElecRate,
          hosting_fee_usd_per_kw_month: siteFormHostingFee,
          uptime_expectation: siteFormUptime,
          curtailment_pct: siteFormCurtailment,
          capacity_mw_available: siteFormCapacity,
          lockup_months: siteFormLockup,
          notice_period_days: siteFormNotice,
        }),
      })
      setShowSiteForm(false)
      setSiteFormName('')
      loadAll()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const deleteSite = async (id: string) => {
    try {
      await fetch(`/api/simulation/hosting/${id}`, { method: 'DELETE' })
      loadAll()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (simResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [simResult])

  const currentMiner = miners.find((m) => m.id === selectedMiner)

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'miners', label: 'Miner Catalog' },
    { key: 'hosting', label: 'Hosting Sites' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-black text-[#0E0F0F]">Step 3 — Miners & Hosting</h2>
          <p className="text-xs text-[#9EB3A8]">Manage miner SKUs and hosting sites</p>
        </div>
      </div>

      {error && (
        <div className={`${CARD} p-3 bg-red-50 border-red-200 text-xs text-red-600`}>{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-[#9EB3A8]/20">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-xs font-medium transition-all duration-200 border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[#96EA7A] text-[#96EA7A]'
                : 'border-transparent text-[#9EB3A8] hover:text-[#0E0F0F]'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Run Simulation Button */}
      {activeTab === 'miners' && (
        <div className="flex justify-end mb-4">
          <button
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
              minerRunning
                ? 'bg-[#F2F2F2] text-[#9EB3A8]'
                : 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.98] animate-pulse'
            }`}
            onClick={runMinerSim}
            disabled={minerRunning}
          >
            {minerRunning ? (
              'Running...'
            ) : (
              <>
                <span>▶</span> Run Simulation
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════ TAB 1: MINER CATALOG ═══════════ */}
      {activeTab === 'miners' && (
        <div className="space-y-6">
          {/* Settings (horizontal) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            <div className={`${CARD} p-4 space-y-2.5`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
                  Miners
                </h3>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7]"
                  onClick={() => {
                    if (showMinerForm) {
                      setShowMinerForm(false)
                      resetMinerForm()
                    } else {
                      resetMinerForm()
                      setShowMinerForm(true)
                    }
                  }}
                >
                  {showMinerForm ? 'Cancel' : '+ Add'}
                </button>
              </div>
              <div className="space-y-1 max-h-[200px] overflow-auto">
                {miners.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer text-xs ${selectedMiner === m.id ? 'bg-[#96EA7A]/20 text-[#96EA7A]' : 'text-[#9EB3A8] hover:bg-white'}`}
                    onClick={() => setSelectedMiner(m.id)}
                  >
                    <div>
                      <span className="font-medium text-[#0E0F0F]">{m.name}</span>
                      <span className="text-[#9EB3A8] ml-1 text-[10px]">{m.hashrate_th} TH/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-[#96EA7A]/60 hover:text-[#96EA7A] text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditMinerForm(m)
                        }}
                      >
                        EDIT
                      </button>
                      <button
                        className="text-red-500/60 hover:text-red-600 text-[10px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMiner(m.id)
                        }}
                      >
                        DEL
                      </button>
                    </div>
                  </div>
                ))}
                {miners.length === 0 && (
                  <p className="text-[10px] text-[#9EB3A8]">No miners yet.</p>
                )}
              </div>
              {currentMiner && (
                <div className="pt-2 border-t border-[#9EB3A8]/10 space-y-1 text-[10px]">
                  <p className="font-semibold text-[#0E0F0F] text-xs">{currentMiner.name}</p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className="text-[#9EB3A8]">Hashrate</span>
                    <span className="font-mono text-[#0E0F0F]">
                      {currentMiner.hashrate_th} TH/s
                    </span>
                    <span className="text-[#9EB3A8]">Power</span>
                    <span className="font-mono text-[#0E0F0F]">{currentMiner.power_w} W</span>
                    <span className="text-[#9EB3A8]">Price</span>
                    <span className="font-mono text-[#0E0F0F]">
                      {formatUSD(currentMiner.price_usd)}
                    </span>
                    <span className="text-[#9EB3A8]">Efficiency</span>
                    <span className="font-mono text-[#0E0F0F]">
                      {currentMiner.efficiency_j_th?.toFixed(1)} J/TH
                    </span>
                  </div>
                </div>
              )}
            </div>

            {showMinerForm && (
              <div className={`${CARD} p-4 space-y-2`}>
                <p className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                  {editingMinerId ? 'Edit Miner' : 'New Miner'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <SimInput label="Name" value={formName} onChange={setFormName} />
                  <SimInput
                    label="Hashrate (TH/s)"
                    value={formHashrate}
                    onChange={(v) => setFormHashrate(Number(v))}
                    type="number"
                  />
                  <SimInput
                    label="Power (W)"
                    value={formPower}
                    onChange={(v) => setFormPower(Number(v))}
                    type="number"
                  />
                  <SimInput
                    label="Price (USD)"
                    value={formPrice}
                    onChange={(v) => setFormPrice(Number(v))}
                    type="number"
                  />
                  <SimInput
                    label="Lifetime (mo)"
                    value={formLifetime}
                    onChange={(v) => setFormLifetime(Number(v))}
                    type="number"
                  />
                  <SimInput
                    label="Maint. %"
                    value={formMaintenance}
                    onChange={(v) => setFormMaintenance(Number(v))}
                    type="number"
                    step={0.01}
                  />
                </div>
                <button
                  className="w-full px-4 py-2 rounded-xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors"
                  onClick={saveMiner}
                >
                  {editingMinerId ? 'Save Changes' : 'Create Miner'}
                </button>
              </div>
            )}

            <div className={`${CARD} p-4 space-y-2.5 ${showMinerForm ? '' : 'lg:col-span-2'}`}>
              <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider mb-3">
                Simulation Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <SimSelect
                  label="BTC Price Curve"
                  value={selectedBTCCurve}
                  onChange={setSelectedBTCCurve}
                  options={curves.map((c: any) => ({
                    value: c.id,
                    label: `${c.name} (${c.scenario})`,
                  }))}
                />
                <SimSelect
                  label="Network Curve"
                  value={selectedNetCurve}
                  onChange={setSelectedNetCurve}
                  options={networkCurves.map((c: any) => ({
                    value: c.id,
                    label: `${c.name} (${c.scenario})`,
                  }))}
                />
                <SimInput
                  label="Elec Rate ($/kWh)"
                  value={elecRate}
                  onChange={(v) => setElecRate(Number(v))}
                  type="number"
                  step={0.005}
                />
                <SimInput
                  label="Uptime (0-1)"
                  value={uptime}
                  onChange={(v) => setUptime(Number(v))}
                  type="number"
                  step={0.01}
                  min={0}
                  max={1}
                />
              </div>
              <SimInput
                label="Simulation Months"
                value={simMonths}
                onChange={(v) => setSimMonths(Number(v))}
                type="number"
                min={1}
                max={120}
              />
            </div>
          </div>

          {/* Results (full width) */}
          <div ref={resultsRef} className="space-y-4 min-w-0">
            {simResult && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch">
                  <SimMetric label="Total BTC Mined" value={formatBTC(simResult.total_btc_mined)} />
                  <SimMetric
                    label="Total Revenue"
                    value={formatUSD(simResult.total_revenue_usd)}
                    status="green"
                  />
                  <SimMetric
                    label="Total Net (OpEx)"
                    value={formatUSD(simResult.total_net_usd)}
                    status={simResult.total_net_usd >= 0 ? 'green' : 'red'}
                  />
                  <SimMetric
                    label="Total EBIT"
                    value={formatUSD(simResult.total_ebit_usd)}
                    status={simResult.total_ebit_usd >= 0 ? 'green' : 'red'}
                  />
                </div>

                <div className={`${CARD} p-4`}>
                  <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase mb-3">
                    Cumulative Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={simResult.monthly_cashflows}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#9EB3A8" strokeOpacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9EB3A8' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#9EB3A8' }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#fff',
                          border: '1px solid #9EB3A8/20',
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative_net_usd"
                        stroke="#96EA7A"
                        strokeWidth={1.5}
                        dot={false}
                        name="Cumulative Net (OpEx)"
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative_ebit_usd"
                        stroke="#E8A838"
                        strokeWidth={1.5}
                        dot={false}
                        name="Cumulative EBIT"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <SimTable
                  title="Monthly Cashflows"
                  columns={[
                    { key: 'month', label: 'Month' },
                    { key: 'btc_mined', label: 'BTC Mined' },
                    {
                      key: 'btc_price_usd',
                      label: 'BTC Price',
                      format: (v: number) => formatUSD(v),
                    },
                    {
                      key: 'gross_revenue_usd',
                      label: 'Revenue',
                      format: (v: number) => formatUSD(v),
                    },
                    {
                      key: 'elec_cost_usd',
                      label: 'Elec Cost',
                      format: (v: number) => formatUSD(v),
                    },
                    {
                      key: 'maintenance_usd',
                      label: 'Maint.',
                      format: (v: number) => formatUSD(v),
                    },
                    { key: 'net_usd', label: 'Net USD', format: (v: number) => formatUSD(v) },
                    {
                      key: 'depreciation_usd',
                      label: 'Depr.',
                      format: (v: number) => formatUSD(v),
                    },
                    { key: 'ebit_usd', label: 'EBIT', format: (v: number) => formatUSD(v) },
                  ]}
                  rows={simResult.monthly_cashflows}
                  exportName={`miner-sim-${simResult.id}`}
                  maxHeight="300px"
                />
              </>
            )}

            {!simResult && !minerRunning && (
              <div
                className={`${CARD} flex flex-col items-center justify-center h-48 text-sm text-[#9EB3A8] gap-3`}
              >
                <svg
                  className="w-10 h-10 text-[#9EB3A8]/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
                Select a miner and curves, then click &quot;Run Simulation&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB 2: HOSTING SITES ═══════════ */}
      {activeTab === 'hosting' && (
        <div className="space-y-4">
          <div className={`${CARD} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Hosting Sites
              </h3>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#F2F2F2] text-[#9EB3A8] hover:bg-[#E6F1E7]"
                onClick={() => setShowSiteForm(!showSiteForm)}
              >
                {showSiteForm ? 'Cancel' : '+ Add Site'}
              </button>
            </div>

            {showSiteForm && (
              <div className={`${CARD} p-3 bg-[#F2F2F2] max-w-lg space-y-2`}>
                <SimInput label="Name" value={siteFormName} onChange={setSiteFormName} />
                <SimInput
                  label="Electricity ($/kWh)"
                  value={siteFormElecRate}
                  onChange={(v) => setSiteFormElecRate(Number(v))}
                  type="number"
                  step={0.005}
                />
                <SimInput
                  label="Hosting Fee ($/kW/mo)"
                  value={siteFormHostingFee}
                  onChange={(v) => setSiteFormHostingFee(Number(v))}
                  type="number"
                  step={0.5}
                />
                <SimInput
                  label="Uptime (0-1)"
                  value={siteFormUptime}
                  onChange={(v) => setSiteFormUptime(Number(v))}
                  type="number"
                  step={0.01}
                />
                <SimInput
                  label="Curtailment %"
                  value={siteFormCurtailment}
                  onChange={(v) => setSiteFormCurtailment(Number(v))}
                  type="number"
                  step={0.01}
                />
                <SimInput
                  label="Capacity (MW)"
                  value={siteFormCapacity}
                  onChange={(v) => setSiteFormCapacity(Number(v))}
                  type="number"
                />
                <SimInput
                  label="Lockup (months)"
                  value={siteFormLockup}
                  onChange={(v) => setSiteFormLockup(Number(v))}
                  type="number"
                />
                <SimInput
                  label="Notice Period (days)"
                  value={siteFormNotice}
                  onChange={(v) => setSiteFormNotice(Number(v))}
                  type="number"
                />
                <button
                  className="w-full px-4 py-2 rounded-xl text-sm font-bold bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] transition-colors"
                  onClick={createSite}
                >
                  Create Site
                </button>
              </div>
            )}

            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F2F2F2]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      $/kWh
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Hosting Fee
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Uptime
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Curtailment
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                      Lockup
                    </th>
                    <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#9EB3A8] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#9EB3A8]/5">
                  {sites.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F2F2F2]/50 transition-colors">
                      <td className="px-3 py-1.5 text-[#0E0F0F] font-medium">{s.name}</td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">
                        ${s.electricity_price_usd_per_kwh}
                      </td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">
                        ${s.hosting_fee_usd_per_kw_month}/kW/mo
                      </td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">
                        {formatPercent(s.uptime_expectation)}
                      </td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">
                        {formatPercent(s.curtailment_pct)}
                      </td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">{s.capacity_mw_available} MW</td>
                      <td className="px-3 py-1.5 text-[#0E0F0F]">{s.lockup_months} mo</td>
                      <td className="px-3 py-1.5">
                        <button
                          className="text-red-500/60 hover:text-red-600 text-[10px]"
                          onClick={() => deleteSite(s.id)}
                        >
                          DEL
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sites.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-[#9EB3A8] py-4">
                        No hosting sites. Add one above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
