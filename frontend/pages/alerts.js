import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Alerts() {
  const [token, setToken] = useState('')
  const [alerts, setAlerts] = useState([])
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [targetPrice, setTargetPrice] = useState('')
  const [direction, setDirection] = useState('above')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadAlerts(savedToken)
    }
  }, [])

  const loadAlerts = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/alerts`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setAlerts(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const createAlert = async () => {
    if (!targetPrice) {
      setError('Please enter a target price')
      return
    }
    setCreating(true)
    setError('')
    try {
      await axios.post(
        `${API_URL}/alerts`,
        { symbol, target_price: parseFloat(targetPrice), direction },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setTargetPrice('')
      loadAlerts(token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create alert')
    }
    setCreating(false)
  }

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${API_URL}/alerts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadAlerts(token)
    } catch (err) {
      console.log(err)
    }
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
        <h1 style={styles.title}>🔔 Price Alerts</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        <div style={styles.form}>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={styles.select}>
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
          </select>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} style={styles.select}>
            <option value="above">Goes above</option>
            <option value="below">Goes below</option>
          </select>
          <input
            type="number"
            placeholder="Target price"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={styles.input}
          />
          <button onClick={createAlert} style={styles.button} disabled={creating}>
            {creating ? 'Creating...' : '🔔 Create Alert'}
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.list}>
          {alerts.length === 0 && (
            <p style={styles.empty}>No alerts yet. Create one above!</p>
          )}
          {alerts.map((alert) => (
            <div key={alert.id} style={styles.alertCard}>
              <div>
                <p style={styles.alertSymbol}>{alert.symbol}</p>
                <p style={styles.alertCondition}>
                  Alert when price goes <strong>{alert.direction}</strong> ${alert.target_price.toLocaleString()}
                </p>
              </div>
              <button onClick={() => deleteAlert(alert.id)} style={styles.deleteBtn}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', background: '#0a0a0f', display: 'flex', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif', padding: '20px',
  },
  card: {
    background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px',
    padding: '24px', width: '100%', maxWidth: '420px', height: 'fit-content',
  },
  title: { color: '#f1f5f9', fontSize: '22px', margin: '0 0 8px 0' },
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' },
  select: {
    padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  },
  input: {
    padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', boxSizing: 'border-box',
  },
  button: {
    padding: '12px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  error: { color: '#ef4444', fontSize: '13px', marginBottom: '12px' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  alertCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px',
  },
  alertSymbol: { color: '#f1f5f9', fontWeight: '700', fontSize: '14px', margin: '0 0 4px 0' },
  alertCondition: { color: '#94a3b8', fontSize: '12px', margin: 0 },
  deleteBtn: {
    background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontSize: '14px',
  },
}
