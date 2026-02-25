'use client'

import type { HostingSite, Miner, SavedCurve } from '@/types/simulation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AprScheduleEntry,
  CurveFamily,
  ExtraYieldStrikeEntry,
  TakeProfitEntry,
} from './product-config'
import {
  CapitalAllocationSection,
  CommercialForm,
  HoldingBucketForm,
  MiningBucketForm,
  ProductStructureSection,
  ScenarioCurveSelectors,
  YieldBucketForm,
} from './product-config'

const API = '/api/simulation'
async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail || res.statusText)
  }
  return res.json()
}

interface StepProductConfigProps {
  btcCurveId: string
  networkCurveId: string
  minerIds: string[]
  siteIds: string[]
  onComplete: (runId: string) => void
}

export default function StepProductConfig({
  btcCurveId,
  networkCurveId,
  minerIds,
  siteIds,
  onComplete,
}: StepProductConfigProps) {
  // ── Dependencies ──
  const [btcCurves, setBtcCurves] = useState<SavedCurve[]>([])
  const [netCurves, setNetCurves] = useState<SavedCurve[]>([])
  const [miners, setMiners] = useState<Miner[]>([])
  const [sites, setSites] = useState<HostingSite[]>([])

  // ── Product Structure ──
  const [capitalRaised, setCapitalRaised] = useState(1_000_000)
  const [exitFreq, setExitFreq] = useState('quarterly')

  // ── Allocation percentages (source of truth) ──
  const [yieldPct, setYieldPct] = useState(30)
  const [holdingPct, setHoldingPct] = useState(30)
  const [miningPct, setMiningPct] = useState(40)

  // ── Lock state ──
  const [yieldLocked, setYieldLocked] = useState(false)
  const [holdingLocked, setHoldingLocked] = useState(false)
  const [miningLocked, setMiningLocked] = useState(false)

  // ── Derived USD amounts ──
  const yieldAllocated = Math.round((capitalRaised * yieldPct) / 100)
  const holdingAllocated = Math.round((capitalRaised * holdingPct) / 100)
  const miningAllocated = Math.round((capitalRaised * miningPct) / 100)

  // ── Bucket A: Yield Liquidity ──
  const [yieldBaseApr, setYieldBaseApr] = useState(0.04)
  const [useAprSchedule, setUseAprSchedule] = useState(false)
  const [aprSchedule, setAprSchedule] = useState<AprScheduleEntry[]>([
    { from_month: 0, to_month: 11, apr: 0.05 },
    { from_month: 12, to_month: 23, apr: 0.04 },
    { from_month: 24, to_month: 35, apr: 0.03 },
  ])

  // ── Bucket B: BTC Holding ──
  const [buyingPrice, setBuyingPrice] = useState(97000)
  const [liveBtcPrice, setLiveBtcPrice] = useState<number | null>(null)
  const [btcPriceLoading, setBtcPriceLoading] = useState(false)
  const [btcPriceUpdatedAt, setBtcPriceUpdatedAt] = useState<Date | null>(null)

  // ── BTC Holding Split ──
  const [capitalReconPct, setCapitalReconPct] = useState(100)
  const [extraYieldStrikes, setExtraYieldStrikes] = useState<ExtraYieldStrikeEntry[]>([
    { strike_price: 120000, btc_share_pct: 33.33 },
    { strike_price: 150000, btc_share_pct: 33.33 },
    { strike_price: 200000, btc_share_pct: 33.34 },
  ])

  // ── Derived target sell price ──
  const btcQuantity = buyingPrice > 0 ? holdingAllocated / buyingPrice : 0
  const capitalReconBtc = btcQuantity * (capitalReconPct / 100)
  const extraYieldBtc = btcQuantity * ((100 - capitalReconPct) / 100)
  const targetSellPrice =
    capitalReconBtc > 0 ? Math.round((holdingAllocated + miningAllocated) / capitalReconBtc) : 0

  // ── Bucket C: BTC Mining ──
  const [selectedMiner, setSelectedMiner] = useState(minerIds.length > 0 ? minerIds[0] : '')
  const [selectedSite, setSelectedSite] = useState(siteIds.length > 0 ? siteIds[0] : '')
  const [minerCount, setMinerCount] = useState(500)
  const [miningBaseYield, setMiningBaseYield] = useState(0.08)
  const [miningBonusYield, setMiningBonusYield] = useState(0.04)
  const [takeProfitLadder, setTakeProfitLadder] = useState<TakeProfitEntry[]>([])

  // ── Tenor ──
  const selectedMinerObj = miners.find((m) => m.id === selectedMiner)
  const tenor = selectedMinerObj?.lifetime_months ?? 36
  const tenorYears = (tenor / 12).toFixed(tenor % 12 === 0 ? 0 : 1)

  // ── Scenario Curve Selectors ──
  const [selectedBtcFamily, setSelectedBtcFamily] = useState('')
  const [selectedNetFamily, setSelectedNetFamily] = useState('')

  // ── Commercial Fees ──
  const [upfrontCommercialPct, setUpfrontCommercialPct] = useState(6)
  const [managementFeesPct, setManagementFeesPct] = useState(3)
  const [performanceFeesPct, setPerformanceFeesPct] = useState(3)

  // ── State ──
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [runId, setRunId] = useState('')

  const groupCurvesByFamily = useCallback((curves: any[]) => {
    const families: Record<string, CurveFamily> = {}
    for (const c of curves) {
      const familyName =
        c.name
          .replace(/\s*\(?(bear|base|bull)\)?/gi, '')
          .replace(/\s*-\s*$/, '')
          .trim() || c.name
      const key = familyName.toLowerCase()
      if (!families[key]) families[key] = { name: familyName }
      families[key][c.scenario as 'bear' | 'base' | 'bull'] = c
    }
    return families
  }, [])

  const btcFamilies = useMemo(
    () => groupCurvesByFamily(btcCurves),
    [btcCurves, groupCurvesByFamily],
  )
  const netFamilies = useMemo(
    () => groupCurvesByFamily(netCurves),
    [netCurves, groupCurvesByFamily],
  )

  const resolveCurveIds = useCallback((families: Record<string, any>, familyKey: string) => {
    const family = families[familyKey]
    if (!family) return { bear: '', base: '', bull: '' }
    return {
      bear: family.bear?.id || family.base?.id || '',
      base: family.base?.id || family.bear?.id || '',
      bull: family.bull?.id || family.base?.id || '',
    }
  }, [])

  const btcCurveIds = useMemo(
    () => resolveCurveIds(btcFamilies, selectedBtcFamily),
    [btcFamilies, selectedBtcFamily, resolveCurveIds],
  )
  const netCurveIds = useMemo(
    () => resolveCurveIds(netFamilies, selectedNetFamily),
    [netFamilies, selectedNetFamily, resolveCurveIds],
  )

  const fetchLiveBtcPrice = useCallback(async (setAsDefault = false) => {
    setBtcPriceLoading(true)
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      )
      if (!res.ok) throw new Error('Failed to fetch BTC price')
      const data = await res.json()
      const price = Math.round(data.bitcoin.usd)
      setLiveBtcPrice(price)
      setBtcPriceUpdatedAt(new Date())
      if (setAsDefault) setBuyingPrice(price)
    } catch {
      // Silently fail — keep the manual default
    }
    setBtcPriceLoading(false)
  }, [])

  const findFamilyKeyForCurveId = useCallback(
    (families: Record<string, CurveFamily>, curveId: string): string => {
      for (const [key, family] of Object.entries(families)) {
        if (
          family.bear?.id === curveId ||
          family.base?.id === curveId ||
          family.bull?.id === curveId
        ) {
          return key
        }
      }
      return ''
    },
    [],
  )

  useEffect(() => {
    fetchLiveBtcPrice(true)
    loadDependencies()
  }, [])

  const loadDependencies = async () => {
    try {
      const [btc, net, m, s]: any[] = await Promise.all([
        api<any[]>('/btc-price-curve/list'),
        api<any[]>('/network-curve/list'),
        api<any[]>('/miners/'),
        api<any[]>('/hosting/'),
      ])
      setBtcCurves(btc)
      setNetCurves(net)
      setMiners(m)
      setSites(s)

      const btcFams = groupCurvesByFamily(btc)
      const netFams = groupCurvesByFamily(net)

      if (btcCurveId) {
        const matchedKey = findFamilyKeyForCurveId(btcFams, btcCurveId)
        if (matchedKey) {
          setSelectedBtcFamily(matchedKey)
        } else if (btc.length > 0) {
          const familyName =
            btc[0].name
              .replace(/\s*\(?(bear|base|bull)\)?/gi, '')
              .replace(/\s*-\s*$/, '')
              .trim() || btc[0].name
          setSelectedBtcFamily(familyName.toLowerCase())
        }
      } else if (btc.length > 0) {
        const familyName =
          btc[0].name
            .replace(/\s*\(?(bear|base|bull)\)?/gi, '')
            .replace(/\s*-\s*$/, '')
            .trim() || btc[0].name
        setSelectedBtcFamily(familyName.toLowerCase())
      }

      if (networkCurveId) {
        const matchedKey = findFamilyKeyForCurveId(netFams, networkCurveId)
        if (matchedKey) {
          setSelectedNetFamily(matchedKey)
        } else if (net.length > 0) {
          const familyName =
            net[0].name
              .replace(/\s*\(?(bear|base|bull)\)?/gi, '')
              .replace(/\s*-\s*$/, '')
              .trim() || net[0].name
          setSelectedNetFamily(familyName.toLowerCase())
        }
      } else if (net.length > 0) {
        const familyName =
          net[0].name
            .replace(/\s*\(?(bear|base|bull)\)?/gi, '')
            .replace(/\s*-\s*$/, '')
            .trim() || net[0].name
        setSelectedNetFamily(familyName.toLowerCase())
      }

      if (minerIds.length > 0) {
        const minerExists = m.some((miner: any) => miner.id === minerIds[0])
        if (minerExists) setSelectedMiner(minerIds[0])
        else if (m.length > 0) setSelectedMiner(m[0].id)
      } else if (m.length > 0) {
        setSelectedMiner(m[0].id)
      }

      if (siteIds.length > 0) {
        const siteExists = s.some((site: any) => site.id === siteIds[0])
        if (siteExists) setSelectedSite(siteIds[0])
        else if (s.length > 0) setSelectedSite(s[0].id)
      } else if (s.length > 0) {
        setSelectedSite(s[0].id)
      }
    } catch {
      /* API not available yet */
    }
  }

  useEffect(() => {
    const miner = miners.find((m) => m.id === selectedMiner)
    if (miner && miner.price_usd > 0) {
      setMinerCount(Math.floor(miningAllocated / miner.price_usd))
    }
  }, [miningAllocated, selectedMiner, miners])

  const handleSliderChange = useCallback(
    (bucket: 'yield' | 'holding' | 'mining', newPct: number) => {
      newPct = Math.max(0, Math.min(100, newPct))

      type BucketInfo = { get: () => number; set: (v: number) => void; locked: boolean }
      let others: BucketInfo[]

      if (bucket === 'yield') {
        others = [
          { get: () => holdingPct, set: setHoldingPct, locked: holdingLocked },
          { get: () => miningPct, set: setMiningPct, locked: miningLocked },
        ]
      } else if (bucket === 'holding') {
        others = [
          { get: () => yieldPct, set: setYieldPct, locked: yieldLocked },
          { get: () => miningPct, set: setMiningPct, locked: miningLocked },
        ]
      } else {
        others = [
          { get: () => yieldPct, set: setYieldPct, locked: yieldLocked },
          { get: () => holdingPct, set: setHoldingPct, locked: holdingLocked },
        ]
      }

      const lockedOthers = others.filter((o) => o.locked)
      const unlockedOthers = others.filter((o) => !o.locked)

      if (lockedOthers.length === 2) {
        const maxAllowed = 100 - lockedOthers[0].get() - lockedOthers[1].get()
        newPct = Math.min(newPct, Math.max(0, maxAllowed))
      }

      const remaining = 100 - newPct

      if (lockedOthers.length === 1) {
        const lockedVal = lockedOthers[0].get()
        const unlockedVal = Math.max(0, Math.round((remaining - lockedVal) * 10) / 10)
        if (remaining < lockedVal) {
          const cappedNew = Math.round((100 - lockedVal) * 10) / 10
          newPct = cappedNew
          unlockedOthers[0].set(0)
        } else {
          unlockedOthers[0].set(unlockedVal)
        }
      } else if (lockedOthers.length === 0) {
        const otherTotal = others[0].get() + others[1].get()
        if (otherTotal > 0) {
          const ratio0 = others[0].get() / otherTotal
          const val0 = Math.round(remaining * ratio0 * 10) / 10
          others[0].set(val0)
          others[1].set(Math.round((remaining - val0) * 10) / 10)
        } else {
          const half = Math.round((remaining / 2) * 10) / 10
          others[0].set(half)
          others[1].set(Math.round((remaining - half) * 10) / 10)
        }
      }

      if (bucket === 'yield') setYieldPct(newPct)
      else if (bucket === 'holding') setHoldingPct(newPct)
      else setMiningPct(newPct)
    },
    [yieldPct, holdingPct, miningPct, yieldLocked, holdingLocked, miningLocked],
  )

  const totalPct = yieldPct + holdingPct + miningPct
  const allocationValid = Math.abs(totalPct - 100) < 0.5

  const runSimulation = async () => {
    if (!allocationValid) {
      setError(`Bucket allocations must equal 100%. Currently: ${totalPct.toFixed(1)}%`)
      return
    }
    if (
      !btcCurveIds.bear ||
      !btcCurveIds.base ||
      !btcCurveIds.bull ||
      !netCurveIds.bear ||
      !netCurveIds.base ||
      !netCurveIds.bull
    ) {
      setError('Select BTC Price and Network curve sets. Each needs bear/base/bull variants.')
      return
    }
    if (!selectedMiner || !selectedSite) {
      setError('Select a miner and hosting site for the mining bucket.')
      return
    }

    setRunning(true)
    setError('')
    try {
      const payload = {
        capital_raised_usd: capitalRaised,
        product_tenor_months: tenor,
        exit_window_frequency: exitFreq,
        yield_bucket: {
          allocated_usd: yieldAllocated,
          base_apr: yieldBaseApr,
          apr_schedule: useAprSchedule ? aprSchedule : null,
        },
        btc_holding_bucket: {
          allocated_usd: holdingAllocated,
          buying_price_usd: buyingPrice,
          capital_recon_pct: capitalReconPct,
          extra_yield_strikes: capitalReconPct < 100 ? extraYieldStrikes : [],
        },
        mining_bucket: {
          allocated_usd: miningAllocated,
          miner_id: selectedMiner,
          hosting_site_id: selectedSite,
          miner_count: minerCount,
          base_yield_apr: miningBaseYield,
          bonus_yield_apr: miningBonusYield,
          take_profit_ladder: takeProfitLadder,
        },
        commercial:
          upfrontCommercialPct > 0 || managementFeesPct > 0 || performanceFeesPct > 0
            ? {
                upfront_commercial_pct: upfrontCommercialPct,
                management_fees_pct: managementFeesPct,
                performance_fees_pct: performanceFeesPct,
              }
            : null,
        btc_price_curve_ids: btcCurveIds,
        network_curve_ids: netCurveIds,
      }

      console.log('[ProductConfig] Submitting simulation with curve IDs:', {
        btc: btcCurveIds,
        net: netCurveIds,
        btcAllSame: btcCurveIds.bear === btcCurveIds.base && btcCurveIds.base === btcCurveIds.bull,
        netAllSame: netCurveIds.bear === netCurveIds.base && netCurveIds.base === netCurveIds.bull,
      })

      const res: any = await api('/product/simulate', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setRunId(res.id)
      onComplete(res.id)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    }
    setRunning(false)
  }

  const updateAprEntry = (idx: number, field: keyof AprScheduleEntry, value: number) => {
    const updated = [...aprSchedule]
    updated[idx] = { ...updated[idx], [field]: value }
    setAprSchedule(updated)
  }
  const addAprEntry = () => {
    const lastEnd = aprSchedule.length > 0 ? aprSchedule[aprSchedule.length - 1].to_month + 1 : 0
    setAprSchedule([...aprSchedule, { from_month: lastEnd, to_month: lastEnd + 11, apr: 0.08 }])
  }
  const removeAprEntry = (idx: number) => setAprSchedule(aprSchedule.filter((_, i) => i !== idx))

  const addTakeProfitEntry = () =>
    setTakeProfitLadder([...takeProfitLadder, { price_trigger: 150000, sell_pct: 0.25 }])
  const updateTakeProfitEntry = (idx: number, field: keyof TakeProfitEntry, value: number) => {
    const updated = [...takeProfitLadder]
    updated[idx] = { ...updated[idx], [field]: value }
    setTakeProfitLadder(updated)
  }
  const removeTakeProfitEntry = (idx: number) =>
    setTakeProfitLadder(takeProfitLadder.filter((_, i) => i !== idx))

  const btcFamily = btcFamilies[selectedBtcFamily]
  const netFamily = netFamilies[selectedNetFamily]

  const btcFallback = btcFamily && (!btcFamily.bear || !btcFamily.bull)
  const netFallback = netFamily && (!netFamily.bear || !netFamily.bull)
  const hasFallback = btcFallback || netFallback

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#0E0F0F]">Step 4 — Product Config</h2>
          <p className="text-xs text-[#9EB3A8]">
            Configure 3-bucket capital allocation and run multi-scenario simulation
          </p>
        </div>
        <button
          onClick={runSimulation}
          disabled={running}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            running
              ? 'bg-[#F2F2F2] text-[#9EB3A8]'
              : 'bg-[#96EA7A] text-[#0E0F0F] hover:bg-[#7ED066] active:scale-[0.98] animate-pulse'
          }`}
        >
          {running ? (
            'Running...'
          ) : (
            <>
              <span>▶</span> Run Simulation
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {error}
        </div>
      )}

      {hasFallback && (
        <div className="p-3 rounded-xl text-xs border bg-emerald-50 border-emerald-200 text-emerald-700">
          <span className="font-semibold">Scenario Fallback Active:</span>{' '}
          {btcFallback && (
            <>
              BTC curve set is missing{' '}
              {!btcFamily.bear && !btcFamily.bull
                ? 'bear & bull'
                : !btcFamily.bear
                  ? 'bear'
                  : 'bull'}{' '}
              variants.
            </>
          )}
          {btcFallback && netFallback && ' '}
          {netFallback && (
            <>
              Network curve set is missing{' '}
              {!netFamily.bear && !netFamily.bull
                ? 'bear & bull'
                : !netFamily.bear
                  ? 'bear'
                  : 'bull'}{' '}
              variants.
            </>
          )}{' '}
          If the curve was created with a confidence band, bear/bull will be derived automatically.
          Otherwise, all three scenarios will produce identical results. For best results, create
          dedicated bear/base/bull curve sets.
        </div>
      )}

      <style jsx>{`
        input[type='range'] {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 9999px;
          outline: none;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid currentColor;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
          transition: transform 0.1s;
        }
        input[type='range']::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.15);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid currentColor;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
        .slider-yield {
          color: #16a34a;
          --slider-fill: #16a34a;
        }
        .slider-holding {
          color: #0891b2;
          --slider-fill: #0891b2;
        }
        .slider-mining {
          color: #65a30d;
          --slider-fill: #65a30d;
        }
      `}</style>

      <div className="space-y-6">
        {/* Product Structure */}
        <ProductStructureSection
          capitalRaised={capitalRaised}
          onCapitalRaisedChange={setCapitalRaised}
          tenor={tenor}
          tenorYears={tenorYears}
          selectedMinerName={selectedMinerObj?.name}
          exitFreq={exitFreq}
          onExitFreqChange={setExitFreq}
          miningBaseYield={miningBaseYield}
          onMiningBaseYieldChange={setMiningBaseYield}
          miningBonusYield={miningBonusYield}
          onMiningBonusYieldChange={setMiningBonusYield}
        />

        {/* Capital Allocation + Bucket Forms */}
        <CapitalAllocationSection
          yieldPct={yieldPct}
          holdingPct={holdingPct}
          miningPct={miningPct}
          yieldAllocated={yieldAllocated}
          holdingAllocated={holdingAllocated}
          miningAllocated={miningAllocated}
          yieldLocked={yieldLocked}
          holdingLocked={holdingLocked}
          miningLocked={miningLocked}
          allocationValid={allocationValid}
          totalPct={totalPct}
          onSliderChange={handleSliderChange}
          onToggleYieldLock={() => setYieldLocked((v) => !v)}
          onToggleHoldingLock={() => setHoldingLocked((v) => !v)}
          onToggleMiningLock={() => setMiningLocked((v) => !v)}
        >
          <YieldBucketForm
            yieldAllocated={yieldAllocated}
            yieldBaseApr={yieldBaseApr}
            onYieldBaseAprChange={setYieldBaseApr}
            useAprSchedule={useAprSchedule}
            onUseAprScheduleChange={setUseAprSchedule}
            aprSchedule={aprSchedule}
            onUpdateAprEntry={updateAprEntry}
            onAddAprEntry={addAprEntry}
            onRemoveAprEntry={removeAprEntry}
          />

          <HoldingBucketForm
            holdingAllocated={holdingAllocated}
            miningAllocated={miningAllocated}
            buyingPrice={buyingPrice}
            onBuyingPriceChange={setBuyingPrice}
            liveBtcPrice={liveBtcPrice}
            btcPriceLoading={btcPriceLoading}
            btcPriceUpdatedAt={btcPriceUpdatedAt}
            onFetchLiveBtcPrice={fetchLiveBtcPrice}
            onUseLivePrice={() => liveBtcPrice !== null && setBuyingPrice(liveBtcPrice)}
            btcQuantity={btcQuantity}
            capitalReconPct={capitalReconPct}
            onCapitalReconPctChange={setCapitalReconPct}
            capitalReconBtc={capitalReconBtc}
            extraYieldBtc={extraYieldBtc}
            targetSellPrice={targetSellPrice}
            extraYieldStrikes={extraYieldStrikes}
            onExtraYieldStrikesChange={setExtraYieldStrikes}
          />

          <MiningBucketForm
            miningAllocated={miningAllocated}
            selectedMiner={selectedMiner}
            onSelectedMinerChange={setSelectedMiner}
            miners={miners}
            selectedSite={selectedSite}
            onSelectedSiteChange={setSelectedSite}
            sites={sites}
            minerCount={minerCount}
            onMinerCountChange={setMinerCount}
            takeProfitLadder={takeProfitLadder}
            onAddTakeProfitEntry={addTakeProfitEntry}
            onUpdateTakeProfitEntry={updateTakeProfitEntry}
            onRemoveTakeProfitEntry={removeTakeProfitEntry}
          />
        </CapitalAllocationSection>

        {/* Commercial Fees */}
        <CommercialForm
          capitalRaised={capitalRaised}
          miningAllocated={miningAllocated}
          upfrontCommercialPct={upfrontCommercialPct}
          onUpfrontCommercialPctChange={setUpfrontCommercialPct}
          managementFeesPct={managementFeesPct}
          onManagementFeesPctChange={setManagementFeesPct}
          performanceFeesPct={performanceFeesPct}
          onPerformanceFeesPctChange={setPerformanceFeesPct}
        />

        {/* Scenario Curves */}
        <ScenarioCurveSelectors
          btcFamilies={btcFamilies}
          netFamilies={netFamilies}
          selectedBtcFamily={selectedBtcFamily}
          onSelectedBtcFamilyChange={setSelectedBtcFamily}
          selectedNetFamily={selectedNetFamily}
          onSelectedNetFamilyChange={setSelectedNetFamily}
          btcFamily={btcFamily}
          netFamily={netFamily}
        />
      </div>
    </div>
  )
}
