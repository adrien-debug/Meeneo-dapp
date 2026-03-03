'use client'

import { motion } from 'framer-motion'

export function HeroFiligree() {
  const CX = 720
  const CY = 340

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.4 }}
        viewBox="0 0 1440 900"
        fill="none"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] max-w-none"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Concentric circles — subtle green ── */}
        <g stroke="#96EA7A" fill="none">
          {[110, 165, 230, 305, 390, 480, 570].map((r, i) => (
            <circle
              key={r}
              cx={CX}
              cy={CY}
              r={r}
              strokeWidth={i < 3 ? 0.5 : 0.35}
              opacity={0.07 - i * 0.006}
            />
          ))}
        </g>

        {/* ── Radial spokes ── */}
        <g stroke="#96EA7A" strokeWidth="0.35" fill="none">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            return (
              <line
                key={`s-${i}`}
                x1={CX + 110 * Math.cos(angle)}
                y1={CY + 110 * Math.sin(angle)}
                x2={CX + 570 * Math.cos(angle)}
                y2={CY + 570 * Math.sin(angle)}
                opacity={i % 2 === 0 ? 0.06 : 0.04}
              />
            )
          })}
        </g>

        {/* ── Hexagonal rings ── */}
        <g stroke="#96EA7A" strokeWidth="0.4" fill="none" opacity="0.06">
          {[190, 310, 440].map((r) =>
            Array.from({ length: 6 }).map((_, i) => {
              const a1 = (i * 60 * Math.PI) / 180
              const a2 = (((i + 1) % 6) * 60 * Math.PI) / 180
              return (
                <line
                  key={`h-${r}-${i}`}
                  x1={CX + r * Math.cos(a1)}
                  y1={CY + r * Math.sin(a1)}
                  x2={CX + r * Math.cos(a2)}
                  y2={CY + r * Math.sin(a2)}
                />
              )
            }),
          )}
        </g>

        {/* ── Star patterns ── */}
        <g stroke="#96EA7A" strokeWidth="0.4" fill="none" opacity="0.07">
          {Array.from({ length: 6 }).map((_, i) => {
            const a1 = (i * 60 * Math.PI) / 180
            const a2 = (((i + 2) % 6) * 60 * Math.PI) / 180
            return (
              <line
                key={`st-${i}`}
                x1={CX + 165 * Math.cos(a1)}
                y1={CY + 165 * Math.sin(a1)}
                x2={CX + 165 * Math.cos(a2)}
                y2={CY + 165 * Math.sin(a2)}
              />
            )
          })}
        </g>

        {/* ── Flower of life ── */}
        <g stroke="#96EA7A" strokeWidth="0.3" fill="none" opacity="0.04">
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i * 60 * Math.PI) / 180
            return (
              <circle
                key={`f-${i}`}
                cx={CX + 110 * Math.cos(a)}
                cy={CY + 110 * Math.sin(a)}
                r="110"
              />
            )
          })}
        </g>

        {/* ── Junction dots ── */}
        <g fill="#96EA7A">
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i * 60 * Math.PI) / 180
            return (
              <g key={`jd-${i}`}>
                <circle
                  cx={CX + 165 * Math.cos(a)}
                  cy={CY + 165 * Math.sin(a)}
                  r="2"
                  opacity="0.12"
                />
                <circle
                  cx={CX + 305 * Math.cos(a)}
                  cy={CY + 305 * Math.sin(a)}
                  r="1.8"
                  opacity="0.09"
                />
                <circle
                  cx={CX + 440 * Math.cos(a)}
                  cy={CY + 440 * Math.sin(a)}
                  r="1.5"
                  opacity="0.07"
                />
              </g>
            )
          })}
        </g>

        {/* ── PCB circuit cluster right ── */}
        <g stroke="#96EA7A" strokeWidth="0.6" fill="none">
          <g opacity="0.07">
            <path d="M980 155 h100 v25 h50 v-12 h70" />
            <path d="M960 185 h35 v40 h60 v-18 h45 v25 h35" />
            <path d="M995 230 h25 v-22 h75 v35 h-25 v18 h50" />
            <path d="M970 270 h45 v18 h35 v-25 h70 v12 h25" />
            <path d="M985 305 h55 v-12 h35 v30 h45" />
            <path d="M1015 340 h-25 v22 h60 v-8 h40" />
            <path d="M955 365 h35 v-18 h45 v35 h25 v-12 h35" />
          </g>
          <g opacity="0.05">
            <path d="M1045 125 v35 h22 v50 h-12 v28" />
            <path d="M1115 140 v28 h-18 v42 h25 v22" />
            <path d="M1175 152 v42 h-22 v35" />
            <path d="M1075 375 h28 v-22 h35 v35" />
            <path d="M995 395 h45 v18 h55" />
            <path d="M1055 425 h-25 v-12 h-35 v25" />
          </g>
        </g>

        {/* PCB pads right */}
        <g fill="#96EA7A">
          {[
            [980, 155],
            [1080, 155],
            [1130, 180],
            [1200, 168],
            [995, 230],
            [1095, 243],
            [1140, 270],
            [1045, 305],
            [1120, 323],
            [1045, 340],
            [1090, 340],
            [1045, 125],
            [1115, 140],
            [1175, 152],
            [1075, 375],
            [1103, 388],
            [1055, 425],
            [955, 365],
            [995, 395],
          ].map(([cx, cy], i) => (
            <circle key={`rp-${i}`} cx={cx} cy={cy} r={i % 3 === 0 ? 3 : 2.2} opacity="0.08" />
          ))}
        </g>

        {/* ── Left circuit traces ── */}
        <g stroke="#96EA7A" strokeWidth="0.5" fill="none" opacity="0.05">
          <path d="M115 195 h60 v35 h45 v-18 h52 v25" />
          <path d="M95 245 h42 v28 h70 v-12 h35" />
          <path d="M135 292 h35 v-18 h52 v35 h28" />
          <path d="M155 335 h-25 v22 h45 v-8 h35" />
          <path d="M105 362 h52 v18 h35 v-25 h42" />
          <path d="M195 155 v35 h-22 v42 h25" />
          <path d="M255 172 v28 h18 v35" />
        </g>
        <g fill="#96EA7A">
          {[
            [115, 195],
            [220, 230],
            [287, 212],
            [342, 240],
            [95, 245],
            [207, 273],
            [250, 310],
            [155, 335],
            [240, 362],
            [195, 155],
          ].map(([cx, cy], i) => (
            <circle key={`lp-${i}`} cx={cx} cy={cy} r={i % 3 === 0 ? 2.5 : 2} opacity="0.06" />
          ))}
        </g>

        {/* ── Bottom contour arcs ── */}
        <g stroke="#96EA7A" strokeWidth="0.5" fill="none">
          <path d="M200 680 Q450 652 720 668 Q990 685 1240 658" opacity="0.05" />
          <path d="M180 708 Q430 682 720 698 Q1010 715 1260 688" opacity="0.04" />
          <path d="M220 735 Q470 710 720 725 Q970 742 1220 718" opacity="0.03" />
        </g>

        {/* ── Dot grid ── */}
        <g fill="#96EA7A" opacity="0.04">
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: 16 }).map((_, col) => {
              const x = 120 + col * 80
              const y = 100 + row * 70
              const dist = Math.sqrt((x - CX) ** 2 + (y - CY) ** 2)
              if (dist < 240 || dist > 500) return null
              return <circle key={`d-${row}-${col}`} cx={x} cy={y} r="0.7" />
            }),
          )}
        </g>

        {/* ── Data fragments — green on dark ── */}
        <g fill="#96EA7A" opacity="0.06" fontSize="6.5" fontFamily="monospace">
          <text x="135" y="172">
            0xA3F7
          </text>
          <text x="1195" y="180">
            0x7B2E
          </text>
          <text x="175" y="415">
            0xE9D1
          </text>
          <text x="1135" y="435">
            #4A2F8C
          </text>
          <text x="425" y="88">
            BLOCK
          </text>
          <text x="935" y="85">
            HASH
          </text>
          <text x="275" y="715">
            TX
          </text>
          <text x="1075" y="705">
            BASE
          </text>
        </g>

        {/* ── Green accent ring — slightly brighter ── */}
        <g stroke="#96EA7A" strokeWidth="0.4" fill="none" opacity="0.12">
          <circle cx={CX} cy={CY} r="140" />
        </g>
      </motion.svg>
    </div>
  )
}
