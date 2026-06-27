import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Markets() {
  const [tickers, setTickers] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadTickers = async () => {
    try {
      const res = await axios.get(`${API_URL}/market/tickers`)
      setTickers(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTickers()
    const interval = setInterval(loadTickers, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📈 Live Markets</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        {loading ? (
          <p style={styles.empty}>Loading prices...</p>
        ) : (
          <div style={styles.list}>
            {tickers.map((t) => (
              <div key={t.symbol} style={styles.row}>
                <div style={styles.coinInfo}>
                  <div style={styles.coinIcon}>
                    {t.symbol.replace('USDT', '').slice(0, 3)}
                  </div>
                  <span style={styles.symbol}>
                    {t.symbol.replace('USDT', '')}
                  </span>
                </div>
                <div style={styles.priceInfo}>
                  <span style={styles.price}>
                    ${t.price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: t.price > 100 ? 2 : 6
                    })}
                  </span>
                  <span style={{
                    ...styles.change,
                    color: t.change_percent_24h >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {t.change_percent_24h >= 0 ? '+' : ''}
                    {t.change_percent_24h.toFixed(2)}%
                  </span>
                </div>
                <a
                  href={`/chart?symbol=${t.symbol}`}
                  style={styles.chartBtn}
                >
                  📊
                </a>
              </div>
            ))}
          </div>
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
    display: 'block', marginBottom: '20px',
  },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '10px', padding: '12px 14px',
  },
  coinInfo: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  coinIcon: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)', color: '#6366f1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: '700',
  },
  symbol: { color: '#f1f5f9', fontWeight: '600', fontSize: '14px' },
  priceInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '10px' },
  price: { color: '#f1f5f9', fontWeight: '600', fontSize: '14px', fontFamily: 'monospace' },
  change: { fontSize: '12px', fontWeight: '600' },
  chartBtn: {
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '6px', padding: '4px 8px', fontSize: '16px',
    textDecoration: 'none', cursor: 'pointer',
  },
}
