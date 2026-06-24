import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

const AVAILABLE_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT',
  'XRPUSDT', 'BNBUSDT', 'DOTUSDT', 'LINKUSDT'
]

export default function Watchlist() {
  const [token, setToken] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadWatchlist(savedToken)
    }
  }, [])

  const loadWatchlist = async (tok) => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/watchlist`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setItems(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const addToWatchlist = async () => {
    setAdding(true)
    setMessage('')
    try {
      await axios.post(
        `${API_URL}/watchlist`,
        { symbol },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(`${symbol} added!`)
      loadWatchlist(token)
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to add')
    }
    setAdding(false)
  }

  const removeFromWatchlist = async (sym) => {
    try {
      await axios.delete(`${API_URL}/watchlist/${sym}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadWatchlist(token)
    } catch (err) {
      console.log(err)
    }
  }

  const generateSignal = async (sym) => {
    try {
      await axios.post(
        `${API_URL}/signals/generate`,
        { symbol: sym, timeframe: '1h' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(`Signal generated for ${sym}!`)
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      console.log(err)
    }
  }

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#f1f5f9' }}>
            Please <a href="/" style={{ color: '#6366f1' }}>login first</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>⭐ Watchlist</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>
        <p style={styles.subtitle}>Track your favourite coins</p>

        {message && (
          <div style={styles.msgBox}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        <div style={styles.addRow}>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            style={styles.select}
          >
            {AVAILABLE_SYMBOLS.map(s => (
              <option key={s} value={s}>{s.replace('USDT', '/USDT')}</option>
            ))}
          </select>
          <button
            onClick={addToWatchlist}
            disabled={adding}
            style={styles.addBtn}
          >
            {adding ? '...' : '+ Add'}
          </button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>⭐</p>
            <p style={styles.empty}>Your watchlist is empty.</p>
            <p style={styles.emptySub}>Add coins above to track them!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {items.map((item) => (
              <div key={item.id} style={styles.itemCard}>
                <div style={styles.coinLeft}>
                  <div style={styles.coinAvatar}>
                    {item.symbol.replace('USDT', '').slice(0, 3)}
                  </div>
                  <div>
                    <p style={styles.coinName}>
                      {item.symbol.replace('USDT', '')}
                    </p>
                    <p style={styles.coinPair}>USDT</p>
                  </div>
                </div>
                <div style={styles.coinRight}>
                  <p style={styles.coinPrice}>
                    ${item.price > 0
                      ? item.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: item.price > 100 ? 2 : 6
                        })
                      : '—'}
                  </p>
                  <p style={{
                    ...styles.coinChange,
                    color: item.change_percent_24h >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {item.change_percent_24h >= 0 ? '+' : ''}
                    {item.change_percent_24h.toFixed(2)}%
                  </p>
                </div>
                <div style={styles.actions}>
                  <button
                    onClick={() => generateSignal(item.symbol)}
                    style={styles.signalBtn}
                    title="Generate signal"
                  >
                    ⚡
                  </button>
                  <button
                    onClick={() => removeFromWatchlist(item.symbol)}
                    style={styles.removeBtn}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
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
    display: 'block', marginBottom: '4px',
  },
  subtitle: { color: '#6b7280', fontSize: '13px', margin: '0 0 16px 0' },
  msgBox: {
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '8px', padding: '10px', color: '#10b981',
    fontSize: '13px', marginBottom: '12px', textAlign: 'center',
  },
  addRow: { display: 'flex', gap: '8px', marginBottom: '20px' },
  select: {
    flex: 1, padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  },
  addBtn: {
    padding: '10px 16px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  emptyBox: { textAlign: 'center', padding: '20px' },
  emptyIcon: { fontSize: '40px', margin: '0 0 8px 0' },
  empty: { color: '#6b7280', textAlign: 'center', margin: '0 0 4px 0' },
  emptySub: { color: '#4b5563', fontSize: '12px', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  itemCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '12px', padding: '12px',
  },
  coinLeft: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 },
  coinAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)', color: '#6366f1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: '700', flexShrink: 0,
  },
  coinName: { color: '#f1f5f9', fontWeight: '700', fontSize: '14px', margin: '0 0 2px 0' },
  coinPair: { color: '#6b7280', fontSize: '11px', margin: 0 },
  coinRight: { textAlign: 'right' },
  coinPrice: { color: '#f1f5f9', fontWeight: '600', fontSize: '14px', margin: '0 0 2px 0', fontFamily: 'monospace' },
  coinChange: { fontSize: '12px', fontWeight: '600', margin: 0 },
  actions: { display: 'flex', gap: '4px' },
  signalBtn: {
    width: '28px', height: '28px', background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px',
    cursor: 'pointer', fontSize: '14px',
  },
  removeBtn: {
    width: '28px', height: '28px', background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
    borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
  },
}
