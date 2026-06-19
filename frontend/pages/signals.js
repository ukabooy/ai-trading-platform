import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Signals() {
  const [token, setToken] = useState('')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadSignals(savedToken)
    }
  }, [])

  const loadSignals = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/signals`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setSignals(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const generateSignal = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(
        `${API_URL}/signals/generate`,
        { symbol, timeframe: '1h' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSignals([res.data, ...signals])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate signal')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#f1f5f9' }}>Please <a href="/" style={{ color: '#6366f1' }}>login first</a></p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⚡ AI Trading Signals</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        <div style={styles.form}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={styles.select}
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
          </select>
          <button onClick={generateSignal} style={styles.button} disabled={loading}>
            {loading ? 'Analyzing...' : '⚡ Generate Signal'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.signalsList}>
          {signals.length === 0 && (
            <p style={styles.empty}>No signals yet. Generate your first one above!</p>
          )}
          {signals.map((sig) => (
            <div key={sig.id} style={styles.signalCard}>
              <div style={styles.signalHeader}>
                <span style={styles.symbol}>{sig.symbol}</span>
                <span style={{
                  ...styles.badge,
                  background: sig.action === 'buy' ? 'rgba(16,185,129,0.15)' : sig.action === 'sell' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: sig.action === 'buy' ? '#10b981' : sig.action === 'sell' ? '#ef4444' : '#f59e0b',
                }}>
                  {sig.action.toUpperCase()}
                </span>
              </div>
              <div style={styles.signalGrid}>
                <div>
                  <p style={styles.label}>Entry</p>
                  <p style={styles.value}>${sig.entry_price?.toLocaleString()}</p>
                </div>
                <div>
                  <p style={styles.label}>Confidence</p>
                  <p style={styles.value}>{sig.confidence?.toFixed(0)}%</p>
                </div>
              </div>
              {sig.reasoning && <p style={styles.reasoning}>{sig.reasoning}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
  },
  card: {
    background: '#111118',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '480px',
    height: 'fit-content',
  },
  title: { color: '#f1f5f9', fontSize: '22px', margin: '0 0 8px 0' },
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '20px' },
  form: { display: 'flex', gap: '8px', marginBottom: '16px' },
  select: {
    flex: 1, padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  },
  button: {
    padding: '10px 16px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  error: { color: '#ef4444', fontSize: '13px' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
  signalsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  signalCard: {
    background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px',
  },
  signalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  symbol: { color: '#f1f5f9', fontWeight: '700', fontSize: '15px' },
  badge: { fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' },
  signalGrid: { display: 'flex', gap: '20px', marginBottom: '10px' },
  label: { color: '#6b7280', fontSize: '11px', margin: '0 0 2px 0' },
  value: { color: '#f1f5f9', fontSize: '14px', fontWeight: '600', margin: 0 },
  reasoning: { color: '#94a3b8', fontSize: '12px', lineHeight: '1.5', margin: 0 },
}
