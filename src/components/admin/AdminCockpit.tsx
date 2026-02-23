'use client'

import { PRODUCTS } from '@/config/products'
import { useVaultInfoByAddress, useVaultsList } from '@/hooks/useMultiVault'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell, Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts'


// Sample data for charts
const tvlData = [
  { time: '00:00', tvl: 6200000 },
  { time: '02:00', tvl: 6350000 },
  { time: '04:00', tvl: 6280000 },
  { time: '06:00', tvl: 6450000 },
  { time: '08:00', tvl: 6680000 },
  { time: '10:00', tvl: 6820000 },
  { time: '12:00', tvl: 6950000 },
  { time: '14:00', tvl: 7100000 },
  { time: '16:00', tvl: 7050000 },
  { time: '18:00', tvl: 7180000 },
  { time: '20:00', tvl: 7250000 },
  { time: '22:00', tvl: 7320000 },
  { time: 'Now', tvl: 7234521 },
]

const flowData = [
  { month: 'Jan', deposits: 1200000, withdrawals: 400000 },
  { month: 'Feb', deposits: 1450000, withdrawals: 320000 },
  { month: 'Mar', deposits: 1100000, withdrawals: 280000 },
  { month: 'Apr', deposits: 1680000, withdrawals: 450000 },
  { month: 'May', deposits: 1420000, withdrawals: 380000 },
  { month: 'Jun', deposits: 1890000, withdrawals: 520000 },
]

const aprData = [
  { month: 'Jan', apr: 11.2 },
  { month: 'Feb', apr: 11.5 },
  { month: 'Mar', apr: 11.8 },
  { month: 'Apr', apr: 12.0 },
  { month: 'May', apr: 12.2 },
  { month: 'Jun', apr: 12.0 },
]

const distributionData = [
  { name: 'BTC Mining', value: 65, color: '#96EA7A' },
  { name: 'Kaspa', value: 20, color: '#9EB3A8' },
  { name: 'Alephium', value: 15, color: '#E6F1E7' },
]

function VaultRow({ vault }: { vault: { address: `0x${string}`; name: string; slug: string; token: string; icon: string; color: string; apr: number } }) {
  const info = useVaultInfoByAddress(vault.address)

  return (
    <tr className="border-b border-[#9EB3A8]/10 hover:bg-[#E6F1E7] transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">{vault.icon}</span>
          <div>
            <p className="font-medium text-[#0E0F0F]">{vault.name}</p>
            <p className="text-xs text-[#9EB3A8]">{vault.address.slice(0, 8)}...{vault.address.slice(-6)}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-[#9EB3A8]">{vault.token}</td>
      <td className="py-3 px-4 text-right font-semibold text-[#0E0F0F]">${parseFloat(info.totalDeposits).toLocaleString()}</td>
      <td className="py-3 px-4 text-right font-semibold text-[#0E0F0F]">{info.annualAPR || vault.apr}%</td>
      <td className="py-3 px-4 text-right text-[#9EB3A8]">#{info.currentEpoch}</td>
      <td className="py-3 px-4 text-right">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${info.shouldAdvanceEpoch
          ? 'bg-[#E6F1E7] text-[#9EB3A8]'
          : 'bg-[#96EA7A]/20 text-[#0E0F0F]'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${info.shouldAdvanceEpoch ? 'bg-[#9EB3A8]' : 'bg-[#96EA7A]'}`}></span>
          {info.shouldAdvanceEpoch ? 'Pending' : 'Active'}
        </span>
      </td>
    </tr>
  )
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value}`
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#9EB3A8]/20 rounded-xl p-3 shadow-lg">
        <p className="text-xs text-[#9EB3A8] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' && entry.value > 1000
              ? formatCurrency(entry.value)
              : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function AdminCockpit() {
  const { vaults } = useVaultsList()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [btcPrice] = useState(98542.30)
  const [ethPrice] = useState(3421.85)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false })
  const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="space-y-6">
      {/* Ticker Bar */}
      <div className="flex items-center justify-between bg-white border border-[#9EB3A8]/20 rounded-2xl px-6 py-4">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-[#9EB3A8] mb-1">BTC/USD</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#0E0F0F]">${btcPrice.toLocaleString()}</span>
              <span className="text-xs font-medium text-[#0E0F0F] bg-[#96EA7A]/20 px-2 py-0.5 rounded">+2.34%</span>
            </div>
          </div>
          <div className="w-px h-10 bg-[#9EB3A8]/20"></div>
          <div>
            <p className="text-xs text-[#9EB3A8] mb-1">ETH/USD</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#0E0F0F]">${ethPrice.toLocaleString()}</span>
              <span className="text-xs font-medium text-[#0E0F0F] bg-[#96EA7A]/20 px-2 py-0.5 rounded">+1.82%</span>
            </div>
          </div>
          <div className="w-px h-10 bg-[#9EB3A8]/20"></div>
          <div>
            <p className="text-xs text-[#9EB3A8] mb-1">Gas</p>
            <span className="text-lg font-bold text-[#0E0F0F]">24 gwei</span>
          </div>
          <div className="w-px h-10 bg-[#9EB3A8]/20"></div>
          <div>
            <p className="text-xs text-[#9EB3A8] mb-1">Network</p>
            <span className="text-lg font-bold text-[#0E0F0F] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#96EA7A] rounded-full"></span>
              Mainnet
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#9EB3A8]">{formatDate(currentTime)}</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">{formatTime(currentTime)}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">Total TVL</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">$7.2M</p>
          <p className="text-xs text-[#0E0F0F] mt-1">+$124K (24h)</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">Vaults Actifs</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">{vaults.length}</p>
          <p className="text-xs text-[#9EB3A8] mt-1">{PRODUCTS.filter(p => p.status === 'coming_soon').length} à venir</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">APR Moyen</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">12%</p>
          <p className="text-xs text-[#9EB3A8] mt-1">Annualisé</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">Participants</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">1,682</p>
          <p className="text-xs text-[#0E0F0F] mt-1">+23 (7j)</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">Rewards Pending</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">$45.2K</p>
          <p className="text-xs text-[#9EB3A8] mt-1">À distribuer</p>
        </div>
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
          <p className="text-xs text-[#9EB3A8] mb-2">Distribué YTD</p>
          <p className="text-2xl font-bold text-[#0E0F0F]">$892K</p>
          <p className="text-xs text-[#9EB3A8] mt-1">Depuis Jan</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* TVL Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-[#9EB3A8]/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-[#0E0F0F]">TVL Performance</h3>
              <span className="text-xs font-medium text-[#0E0F0F] bg-[#96EA7A]/20 px-2 py-1 rounded">+12.4%</span>
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 text-xs font-medium bg-[#96EA7A] text-[#0E0F0F] rounded-lg">1D</button>
              <button className="px-3 py-1.5 text-xs font-medium text-[#9EB3A8] hover:bg-[#E6F1E7] rounded-lg">1W</button>
              <button className="px-3 py-1.5 text-xs font-medium text-[#9EB3A8] hover:bg-[#E6F1E7] rounded-lg">1M</button>
              <button className="px-3 py-1.5 text-xs font-medium text-[#9EB3A8] hover:bg-[#E6F1E7] rounded-lg">1Y</button>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={tvlData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#96EA7A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#96EA7A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#9EB3A8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#9EB3A8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  name="TVL"
                  stroke="#96EA7A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#tvlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* Epoch Status */}
          <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
            <h3 className="font-bold text-[#0E0F0F] mb-4">Epoch Status</h3>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl font-bold text-[#0E0F0F]">#4</span>
              <span className="px-3 py-1.5 bg-[#96EA7A]/20 text-[#0E0F0F] text-sm font-medium rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#96EA7A] rounded-full"></span>
                Active
              </span>
            </div>
            <div className="w-full bg-[#F2F2F2] rounded-full h-3 mb-3">
              <div className="bg-gradient-to-r from-[#96EA7A] to-[#7ED066] h-3 rounded-full transition-all" style={{ width: '67%' }}></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#9EB3A8]">Progress: <span className="text-[#0E0F0F] font-medium">67%</span></span>
              <span className="text-[#9EB3A8]">Reste: <span className="text-[#9EB3A8] font-medium">8h 24m</span></span>
            </div>
          </div>

          {/* Distribution Pie */}
          <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl p-5">
            <h3 className="font-bold text-[#0E0F0F] mb-4">Allocation</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-[#9EB3A8]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Deposits vs Withdrawals */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
            <h3 className="font-bold text-[#0E0F0F]">Deposits vs Withdrawals</h3>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#96EA7A] rounded"></span>
                Deposits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#9EB3A8] rounded"></span>
                Withdrawals
              </span>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={flowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9EB3A8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#9EB3A8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="deposits" name="Deposits" fill="#96EA7A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Withdrawals" fill="#9EB3A8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#9EB3A8]/10">
              <div>
                <p className="text-xs text-[#9EB3A8]">Total Deposits</p>
                <p className="text-lg font-bold text-[#0E0F0F]">$8.7M</p>
              </div>
              <div>
                <p className="text-xs text-[#9EB3A8]">Total Withdrawals</p>
                <p className="text-lg font-bold text-[#0E0F0F]">$2.3M</p>
              </div>
              <div>
                <p className="text-xs text-[#9EB3A8]">Net Flow</p>
                <p className="text-lg font-bold text-[#0E0F0F]">+$6.4M</p>
              </div>
            </div>
          </div>
        </div>

        {/* APR Trend */}
        <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
            <h3 className="font-bold text-[#0E0F0F]">APR Evolution</h3>
            <span className="text-xs font-medium text-[#0E0F0F] bg-[#96EA7A]/20 px-2 py-1 rounded">Stable</span>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aprData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F2" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9EB3A8' }} axisLine={false} tickLine={false} />
                <YAxis
                  domain={[10, 14]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#9EB3A8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'APR']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #9EB3A8' }}
                />
                <Line
                  type="monotone"
                  dataKey="apr"
                  stroke="#96EA7A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#96EA7A', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#96EA7A', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#9EB3A8]/10">
              <div>
                <p className="text-xs text-[#9EB3A8]">Current APR</p>
                <p className="text-lg font-bold text-[#0E0F0F]">12.0%</p>
              </div>
              <div>
                <p className="text-xs text-[#9EB3A8]">6M Average</p>
                <p className="text-lg font-bold text-[#0E0F0F]">11.8%</p>
              </div>
              <div>
                <p className="text-xs text-[#9EB3A8]">YTD High</p>
                <p className="text-lg font-bold text-[#0E0F0F]">12.2%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#9EB3A8]/10">
          <h3 className="font-bold text-[#0E0F0F]">Actions Rapides</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="flex items-center gap-3 p-4 bg-[#F2F2F2] hover:bg-[#96EA7A]/10 rounded-xl transition-colors text-left group">
            <div className="w-12 h-12 bg-[#96EA7A]/20 rounded-xl flex items-center justify-center group-hover:bg-[#96EA7A]/30 transition-colors">
              <svg className="w-6 h-6 text-[#0E0F0F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0E0F0F]">Distribute Rewards</p>
              <p className="text-xs text-[#9EB3A8]">Envoyer les rewards aux users</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-[#F2F2F2] hover:bg-[#E6F1E7] rounded-xl transition-colors text-left group">
            <div className="w-12 h-12 bg-[#E6F1E7] rounded-xl flex items-center justify-center group-hover:bg-[#E6F1E7] transition-colors">
              <svg className="w-6 h-6 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0E0F0F]">Advance Epoch</p>
              <p className="text-xs text-[#9EB3A8]">Passer à l&apos;epoch suivant</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-[#F2F2F2] hover:bg-[#E6F1E7] rounded-xl transition-colors text-left group">
            <div className="w-12 h-12 bg-[#E6F1E7] rounded-xl flex items-center justify-center group-hover:bg-[#E6F1E7] transition-colors">
              <svg className="w-6 h-6 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0E0F0F]">Admin Deposit</p>
              <p className="text-xs text-[#9EB3A8]">Déposer des fonds</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 bg-[#F2F2F2] hover:bg-[#E6F1E7] rounded-xl transition-colors text-left group">
            <div className="w-12 h-12 bg-[#E6F1E7] rounded-xl flex items-center justify-center group-hover:bg-[#E6F1E7] transition-colors">
              <svg className="w-6 h-6 text-[#9EB3A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#0E0F0F]">Admin Withdraw</p>
              <p className="text-xs text-[#9EB3A8]">Retirer des fonds</p>
            </div>
          </button>
        </div>
      </div>

      {/* Vaults Table */}
      <div className="bg-white border border-[#9EB3A8]/20 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#9EB3A8]/10">
          <h3 className="font-bold text-[#0E0F0F]">Vault Monitor</h3>
          <span className="text-sm text-[#9EB3A8]">{vaults.length} actifs</span>
        </div>
        {vaults.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#9EB3A8]/10 bg-[#F2F2F2]">
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9EB3A8] uppercase">Vault</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-[#9EB3A8] uppercase">Token</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9EB3A8] uppercase">TVL</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9EB3A8] uppercase">APR</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9EB3A8] uppercase">Epoch</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-[#9EB3A8] uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {vaults.map((vault) => (
                <VaultRow key={vault.slug} vault={vault} />
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-[#9EB3A8]">
            Aucun vault actif
          </div>
        )}
      </div>
    </div>
  )
}
