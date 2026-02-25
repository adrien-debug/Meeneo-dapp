import { formatUSD } from '@/lib/sim-utils'
import { Tooltip } from './Tooltip'
import type { ExtraYieldStrikeEntry } from './types'

interface HoldingBucketFormProps {
  holdingAllocated: number
  miningAllocated: number
  buyingPrice: number
  onBuyingPriceChange: (v: number) => void
  liveBtcPrice: number | null
  btcPriceLoading: boolean
  btcPriceUpdatedAt: Date | null
  onFetchLiveBtcPrice: (setAsDefault: boolean) => void
  onUseLivePrice: () => void
  btcQuantity: number
  capitalReconPct: number
  onCapitalReconPctChange: (v: number) => void
  capitalReconBtc: number
  extraYieldBtc: number
  targetSellPrice: number
  extraYieldStrikes: ExtraYieldStrikeEntry[]
  onExtraYieldStrikesChange: (strikes: ExtraYieldStrikeEntry[]) => void
}

export function HoldingBucketForm({
  holdingAllocated,
  miningAllocated,
  buyingPrice,
  onBuyingPriceChange,
  liveBtcPrice,
  btcPriceLoading,
  btcPriceUpdatedAt,
  onFetchLiveBtcPrice,
  onUseLivePrice,
  btcQuantity,
  capitalReconPct,
  onCapitalReconPctChange,
  capitalReconBtc,
  extraYieldBtc,
  targetSellPrice,
  extraYieldStrikes,
  onExtraYieldStrikesChange,
}: HoldingBucketFormProps) {
  return (
    <div className="border border-cyan-500/20 rounded-xl p-4 space-y-3 bg-cyan-50/50">
      <h4 className="text-xs font-semibold text-cyan-600 uppercase">b. BTC Holding</h4>
      <div className="px-3 py-2 rounded-xl bg-[#F2F2F2] text-sm text-[#0E0F0F] tabular-nums">
        {formatUSD(holdingAllocated)}
      </div>

      {/* Buying Price with live BTC price fetch */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
            Buying Price (USD)
          </label>
          <div className="flex items-center gap-2">
            {liveBtcPrice !== null && (
              <button
                onClick={onUseLivePrice}
                className="text-[10px] text-[#96EA7A] hover:text-[#7ED066] transition-colors"
                title="Set to current BTC price"
              >
                Use live: {formatUSD(liveBtcPrice)}
              </button>
            )}
            <button
              onClick={() => onFetchLiveBtcPrice(false)}
              disabled={btcPriceLoading}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] transition-all ${
                btcPriceLoading
                  ? 'text-[#9EB3A8] cursor-wait'
                  : 'text-[#96EA7A] hover:bg-[#96EA7A]/10 hover:text-[#7ED066]'
              }`}
              title="Refresh live BTC price"
            >
              <svg
                className={`w-3 h-3 ${btcPriceLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <input
          type="number"
          value={buyingPrice}
          onChange={(e) => onBuyingPriceChange(Number(e.target.value))}
          className="w-full h-9 px-3 rounded-xl border border-[#9EB3A8]/20 bg-[#F2F2F2] text-[#0E0F0F] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#96EA7A] focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-[#9EB3A8]">
            BTC qty: {btcQuantity > 0 ? btcQuantity.toFixed(4) : '—'}
          </p>
          {btcPriceUpdatedAt && (
            <p className="text-[10px] text-[#9EB3A8] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#96EA7A] animate-pulse" />
              Live {btcPriceUpdatedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* BTC Allocation Split */}
      <div className="space-y-2 pt-2 border-t border-cyan-500/20">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
            BTC Allocation Strategy
          </label>
          <Tooltip text="Split the BTC between capital reconstitution (sell at target to recover investment) and extra yield (sell at strike prices for additional returns)." />
        </div>

        {/* Visual Split Bar */}
        <div className="h-4 rounded-full overflow-hidden flex bg-[#F2F2F2]">
          <div
            className="bg-cyan-500 transition-all duration-150"
            style={{ width: `${capitalReconPct}%` }}
          />
          <div
            className="bg-amber-500 transition-all duration-150"
            style={{ width: `${100 - capitalReconPct}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded bg-cyan-500" />
            <span className="text-cyan-600">Capital Recon: {capitalReconPct.toFixed(0)}%</span>
            <span className="text-[#9EB3A8]">({capitalReconBtc.toFixed(4)} BTC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded bg-amber-500" />
            <span className="text-amber-600">
              Extra Yield: {(100 - capitalReconPct).toFixed(0)}%
            </span>
            <span className="text-[#9EB3A8]">({extraYieldBtc.toFixed(4)} BTC)</span>
          </div>
        </div>

        {/* Slider */}
        <div className="slider-holding">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={capitalReconPct}
            onChange={(e) => onCapitalReconPctChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #06b6d4 ${capitalReconPct}%, #f59e0b ${capitalReconPct}%)`,
            }}
          />
        </div>
      </div>

      {/* Capital Reconstitution Section */}
      {capitalReconPct > 0 && (
        <div className="space-y-2 p-3 rounded-xl border border-cyan-200 bg-cyan-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-cyan-600 uppercase">
              Capital Reconstitution
            </span>
            <span className="text-[10px] text-[#9EB3A8]">{capitalReconBtc.toFixed(4)} BTC</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center">
              <label className="text-[11px] font-semibold text-[#9EB3A8] uppercase tracking-wider">
                Target Sell Price (USD)
              </label>
              <Tooltip text="Auto-computed: the BTC price at which selling the capital reconstitution BTC covers both the Holding and Mining initial investments." />
            </div>
            <div className="w-full px-3 py-[7px] rounded-xl bg-[#F2F2F2] border border-cyan-200 text-sm text-cyan-600 tabular-nums font-semibold">
              {formatUSD(targetSellPrice)}
            </div>
            <p className="text-[10px] text-[#9EB3A8]">
              Covers: {formatUSD(holdingAllocated)} (holding) + {formatUSD(miningAllocated)}{' '}
              (mining) = {formatUSD(holdingAllocated + miningAllocated)}
            </p>
          </div>
          {buyingPrice > 0 && targetSellPrice > buyingPrice && (
            <div className="text-[10px] text-[#9EB3A8]">
              Required BTC appreciation:{' '}
              {(((targetSellPrice - buyingPrice) / buyingPrice) * 100).toFixed(1)}% from buying
              price
            </div>
          )}
        </div>
      )}

      {/* Extra Yield Strike Ladder Section */}
      {capitalReconPct < 100 && (
        <div className="space-y-2 p-3 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase">
              Extra Yield Strikes
            </span>
            <span className="text-[10px] text-[#9EB3A8]">{extraYieldBtc.toFixed(4)} BTC total</span>
          </div>
          <p className="text-[10px] text-[#9EB3A8]">
            Sell BTC at strike prices to generate additional yield
          </p>

          <div className="space-y-2">
            {extraYieldStrikes.map((strike, idx) => {
              const strikeBtcAmount = extraYieldBtc * (strike.btc_share_pct / 100)
              const strikeUsdValue = strikeBtcAmount * strike.strike_price
              return (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="text-amber-600 font-medium w-4">{idx + 1}.</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[#9EB3A8] w-16">Strike $</span>
                      <input
                        type="number"
                        value={strike.strike_price}
                        onChange={(e) => {
                          const updated = [...extraYieldStrikes]
                          updated[idx] = {
                            ...updated[idx],
                            strike_price: Number(e.target.value),
                          }
                          onExtraYieldStrikesChange(updated)
                        }}
                        className="flex-1 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-white text-[#0E0F0F] text-xs"
                        step={1000}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#9EB3A8] w-16">Share %</span>
                      <input
                        type="number"
                        value={strike.btc_share_pct}
                        onChange={(e) => {
                          const updated = [...extraYieldStrikes]
                          updated[idx] = {
                            ...updated[idx],
                            btc_share_pct: Number(e.target.value),
                          }
                          onExtraYieldStrikesChange(updated)
                        }}
                        className="w-20 h-7 px-2 rounded-lg border border-[#9EB3A8]/20 bg-white text-[#0E0F0F] text-xs"
                        step={1}
                        min={0}
                        max={100}
                      />
                      <span className="text-[#9EB3A8] text-[10px]">
                        = {strikeBtcAmount.toFixed(4)} BTC → {formatUSD(strikeUsdValue)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {(() => {
            const totalShare = extraYieldStrikes.reduce((sum, s) => sum + s.btc_share_pct, 0)
            const isValid = Math.abs(totalShare - 100) < 0.1
            return (
              <div className={`text-[10px] ${isValid ? 'text-green-600' : 'text-amber-600'}`}>
                Total share: {totalShare.toFixed(1)}% {!isValid && '(should equal 100%)'}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
