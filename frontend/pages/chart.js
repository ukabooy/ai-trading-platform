import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Chart() {
  const [token, setToken] = useState('')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('1h')
  const [candles, setCandles] = useState([])
  const [ticker, setTicker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) setToken(savedToken)
    loadChart()
  }, [symbol, timeframe])

  const loadChart = async () => {
    setLoading(true)
    try {
      const [candlesRes, tickerRes] = await Promise.all([
        axios.get(`${API_URL}/market/candles/${symbol}`, {
          params: { timeframe, limit: 50 }
        }),
        axios.get(`${API_URL}/market/ticker/${symbol}`)
      ])
      setCandles(candlesRes.data)
      setTicker(tickerRes.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT']
  const TIMEFRAMES = ['15m', '1h', '4h', '1d']

  const chartWidth = 340
  const chartHeight = 200
  const padding = 30

  const renderChart = () => {
    if (!candles.length) return null

    const closes = candles.map(c => c.close)
    const minPrice = Math.min(...closes)
    const maxPrice = Math.max(...closes)
    const priceRange = maxPrice - minPrice || 1

    const points = candles.map((c, i) => {
      const x = padding + (i / (candles.length - 1)) * (chartWidth - padding * 2)
      const y = padding + ((maxPrice - c.close) / priceRange) * (chartHeight - padding * 2)
      return `${x},${y}`
    }).join(' ')

    const firstClose = closes[0]
    const lastClose = closes[closes.length - 1]
    const isPositive = lastClose >= firstClose
    const color = isPositive ? '#10b981' : '#ef4444'

    // Fill area under line
    const firstX = padding
    const lastX = padding + (chartWidth - padding * 2)
    const bottomY = padding + (chartHeight - padding * 2)
    const fillPoints = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`

    return (
      <svg width={chartWidth} height={chartHeight} style={{ width: '100%' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding + pct * (chartHeight - padding * 2)
          const price = maxPrice - pct * priceRange
          return (
            <g key={i}>
              <line
                x1={padding} y1={y}
                x2={chartWidth - padding} y2={y}
                stroke="#2a2a3a" strokeWidth="1"
              />
              <text x={2} y={y + 3} fill="#4b5563" fontSize="8">
                ${price > 1 ? price.toFixed(0) : price.toFixed(4)}
              </text>
            </g>
          )
        })}

        {/* Fill area */}
        <polygon points={fillPoints} fill="url(#chartGrad)" />

        {/* Price line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Current price dot */}
        {(() => {
          const lastIdx = candles.length - 1
          const x = padding + (lastIdx / (candles.length - 1)) * (chartWidth - padding * 2)
          const y = padding + ((maxPrice - lastClose) / priceRange) * (chartHeight - padding * 2)
          return (
            <circle cx={x} cy={y} r="4" fill={color} />
          )
        })()}
      </svg>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📊 Price Chart</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        <div style={styles.controls}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={styles.select}
          >
            {SYMBOLS.map(s => (
              <option key={s} value={s}>{s.replace('USDT', '/USDT')}</option>
            ))}
          </select>
          <div style={styles.tfRow}>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  ...styles.tfBtn,
                  background: timeframe === tf ? '#6366f1' : '#1a1a24',
                  color: timeframe === tf ? 'white' : '#6b7280',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {ticker && (
          <div style={styles.tickerRow}>
            <span style={styles.price}>
              ${ticker.price?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: ticker.price > 100 ? 2 : 6
              })}
            </span>
            <span style={{
              ...styles.change,
              color: ticker.change_percent_24h >= 0 ? '#10b981' : '#ef4444'
            }}>
              {ticker.change_percent_24h >= 0 ? '+' : ''}
              {ticker.change_percent_24h?.toFixed(2)}%
            </span>
          </div>
        )}

        <div style={styles.chartBox}>
          {loading ? (
            <p style={styles.empty}>Loading chart...</p>
          ) : candles.length > 0 ? (
            renderChart()
          ) : (
            <p style={styles.empty}>No chart data available</p>
          )}
        </div>

        {candles.length > 0 && (
          <div style={styles.statsRow}>
            <div style={styles.statItem}>
              <p style={styles.statLabel}>High</p>
              <p style={{ ...styles.statValue, color: '#10b981' }}>
                ${Math.max(...candles.map(c => c.high)).toLocaleString()}
              </p>
            </div>
            <div style={styles.statItem}>
              <p style={styles.statLabel}>Low</p>
              <p style={{ ...styles.statValue, color: '#ef4444' }}>
                ${Math.min(...candles.map(c => c.low)).toLocaleString()}
              </p>
            </div>
            <div style={styles.statItem}>
              <p style={styles.statLabel}>Volume</p>
              <p style={styles.statValue}>
                {(candles[candles.length - 1]?.volume || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {token && (
          <a
            href={`/signals?symbol=${symbol}`}
            style={styles.signalBtn}
          >
            ⚡ Generate Signal for {symbol.replace('USDT', '')}
          </a>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', background: '#0a0a0f', display: 'flex',
    justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '20px',
  },
  card: {
    background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px',
    padding: '24px', width: '100%', maxWidth: '480px', height: 'fit-content',
  },
  title: { color: '#f1f5f9', fontSize: '22px', margin: '0 0 8px 0' },
  backLink: {
    color: '#6366f1', fontSize: '13px', textDecoration: 'none',
    display: 'block', marginBottom: '16px',
  },
  controls: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
  select: {
    padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  },
  tfRow: { display: 'flex', gap: '6px' },
  tfBtn: {
    flex: 1, padding: '8px', border: '1px solid #2a2a3a',
    borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  tickerRow: {
    display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
  },
  price: { color: '#f1f5f9', fontSize: '24px', fontWeight: '800', fontFamily: 'monospace' },
  change: { fontSize: '14px', fontWeight: '600' },
  chartBox: {
    background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: '10px',
    padding: '10px', marginBottom: '12px', minHeight: '220px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  empty: { color: '#6b7280', textAlign: 'center' },
  statsRow: {
    display: 'flex', gap: '8px', marginBottom: '16px',
  },
  statItem: {
    flex: 1, background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', padding: '10px', textAlign: 'center',
  },
  statLabel: { color: '#6b7280', fontSize: '11px', margin: '0 0 4px 0' },
  statValue: { color: '#f1f5f9', fontSize: '13px', fontWeight: '600', margin: 0, fontFamily: 'monospace' },
  signalBtn: {
    display: 'block', width: '100%', padding: '12px', background: '#6366f1',
    color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
    boxSizing: 'border-box',
  },
}
