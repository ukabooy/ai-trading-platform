import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Trades() {
  const [token, setToken] = useState('')
  const [trades, setTrades] = useState([])
  const [error, setError] = useState('')
  const [closing, setClosing] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadTrades(savedToken)
    }
  }, [])

  const loadTrades = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/trades`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setTrades(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const closeTrade = async (tradeId, currentPrice) => {
    setClosing(tradeId)
    try {
      await axios.post(
        `${API_URL}/trades/${tradeId}/close`,
        { exit_price: currentPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      loadTrades(token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to close trade')
    }
    setClosing(null)
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

  const totalPnl = trades.filter(t => t.status === 'closed').reduce((sum, t) => sum + t.pnl, 0)
  const openCount = trades.filter(t => t.status === 'open').length

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💼 My Trades</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Open Trades</p>
            <p style={styles.statValue}>{openCount}</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Total P&L</p>
            <p style={{...styles.statValue, color: totalPnl >= 0 ? '#10b981' : '#ef4444'}}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </p>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.tradesList}>
          {trades.length === 0 && (
            <p style={styles.empty}>No trades yet. Go to <a href="/signals" style={{color:'#6366f1'}}>Signals</a> to execute one!</p>
          )}
          {trades.map((trade) => (
            <div key={trade.id} style={styles.tradeCard}>
              <div style={styles.tradeHeader}>
                <span style={styles.symbol}>{trade.symbol}</span>
                <span style={{
                  ...styles.badge,
                  background: trade.direction === 'long' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: trade.direction === 'long' ? '#10b981' : '#ef4444',
                }}>
                  {trade.direction === 'long' ? '↑ LONG' : '↓ SHORT'}
                </span>
                <span style={{
                  ...styles.statusBadge,
                  background: trade.status === 'open' ? 'rgba(99,102,241,0.15)' : 'rgba(107,114,128,0.15)',
                  color: trade.status === 'open' ? '#6366f1' : '#9ca3af',
                }}>
                  {trade.status}
                </span>
              </div>
              <div style={styles.tradeGrid}>
                <div>
                  <p style={styles.label}>Entry</p>
                  <p style={styles.value}>${trade.entry_price?.toLocaleString()}</p>
                </div>
                <div>
                  <p style={styles.label}>Qty</p>
                  <p style={styles.value}>{trade.quantity}</p>
                </div>
                <div>
                  <p style={styles.label}>P&L</p>
                  <p style={{...styles.value, color: trade.pnl >= 0 ? '#10b981' : '#ef4444'}}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                  </p>
                </div>
              </div>
              {trade.status === 'open' && (
                <button
                  onClick={() => closeTrade(trade.id, trade.entry_price * 1.02)}
                  disabled={closing === trade.id}
                  style={styles.closeBtn}
                >
                  {closing === trade.id ? 'Closing...' : 'Close Trade'}
                </button>
              )}
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
    padding: '24px', width: '100%', maxWidth: '480px', height: 'fit-content',
  },
  title: { color: '#f1f5f9', fontSize: '22px', margin: '0 0 8px 0' },
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '20px' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  statBox: { flex: 1, background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px' },
  statLabel: { color: '#6b7280', fontSize: '12px', margin: '0 0 4px 0' },
  statValue: { color: '#f1f5f9', fontSize: '18px', fontWeight: '700', margin: 0 },
  error: { color: '#ef4444', fontSize: '13px' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px', fontSize: '14px' },
  tradesList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  tradeCard: { background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '14px' },
  tradeHeader: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' },
  symbol: { color: '#f1f5f9', fontWeight: '700', fontSize: '14px', flex: 1 },
  badge: { fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '20px' },
  statusBadge: { fontSize: '10px', fontWeight: '600', padding: '4px 8px', borderRadius: '20px' },
  tradeGrid: { display: 'flex', gap: '20px', marginBottom: '10px' },
  label: { color: '#6b7280', fontSize: '11px', margin: '0 0 2px 0' },
  value: { color: '#f1f5f9', fontSize: '14px', fontWeight: '600', margin: 0 },
  closeBtn: {
    width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
  },
}
