import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Portfolio() {
  const [token, setToken] = useState('')
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadPortfolio(savedToken)
    }
  }, [])

  const loadPortfolio = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/portfolio/summary`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setPortfolio(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
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
        <h1 style={styles.title}>💼 Portfolio</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        {loading ? (
          <p style={styles.empty}>Loading portfolio...</p>
        ) : !portfolio || portfolio.positions.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>💼</p>
            <p style={styles.empty}>No open positions yet.</p>
            <p style={styles.emptySub}>
              Go to <a href="/signals" style={{ color: '#6366f1' }}>AI Signals</a> and
              execute a trade to see your portfolio!
            </p>
          </div>
        ) : (
          <>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryBox}>
                <p style={styles.summaryLabel}>Total Value</p>
                <p style={styles.summaryValue}>
                  ${portfolio.total_value.toLocaleString(undefined, {
                    minimumFractionDigits: 2
                  })}
                </p>
              </div>
              <div style={styles.summaryBox}>
                <p style={styles.summaryLabel}>Total P&L</p>
                <p style={{
                  ...styles.summaryValue,
                  color: portfolio.total_pnl >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {portfolio.total_pnl >= 0 ? '+' : ''}
                  ${portfolio.total_pnl.toFixed(2)}
                </p>
              </div>
              <div style={styles.summaryBox}>
                <p style={styles.summaryLabel}>Best Performer</p>
                <p style={{ ...styles.summaryValue, color: '#10b981', fontSize: '14px' }}>
                  {portfolio.best_performer}
                </p>
              </div>
              <div style={styles.summaryBox}>
                <p style={styles.summaryLabel}>Worst Performer</p>
                <p style={{ ...styles.summaryValue, color: '#ef4444', fontSize: '14px' }}>
                  {portfolio.worst_performer}
                </p>
              </div>
            </div>

            <h2 style={styles.sectionTitle}>Open Positions</h2>
            <div style={styles.list}>
              {portfolio.positions.map((pos) => (
                <div key={pos.symbol} style={styles.posCard}>
                  <div style={styles.posHeader}>
                    <div style={styles.coinAvatar}>
                      {pos.symbol.replace('USDT', '').slice(0, 3)}
                    </div>
                    <div style={styles.posInfo}>
                      <p style={styles.posSymbol}>{pos.symbol}</p>
                      <p style={styles.posQty}>Qty: {pos.quantity}</p>
                    </div>
                    <div style={styles.posPnl}>
                      <p style={{
                        ...styles.pnlValue,
                        color: pos.pnl >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                      </p>
                      <p style={{
                        ...styles.pnlPct,
                        color: pos.pnl_percent >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {pos.pnl_percent >= 0 ? '+' : ''}
                        {pos.pnl_percent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div style={styles.posDetails}>
                    <div style={styles.detailItem}>
                      <p style={styles.detailLabel}>Entry</p>
                      <p style={styles.detailValue}>
                        ${pos.avg_entry_price.toLocaleString()}
                      </p>
                    </div>
                    <div style={styles.detailItem}>
                      <p style={styles.detailLabel}>Current</p>
                      <p style={styles.detailValue}>
                        ${pos.current_price.toLocaleString()}
                      </p>
                    </div>
                    <div style={styles.detailItem}>
                      <p style={styles.detailLabel}>Value</p>
                      <p style={styles.detailValue}>
                        ${pos.total_value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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
  emptyBox: { textAlign: 'center', padding: '20px' },
  emptyIcon: { fontSize: '40px', margin: '0 0 8px 0' },
  empty: { color: '#6b7280', textAlign: 'center', margin: '0 0 4px 0' },
  emptySub: { color: '#4b5563', fontSize: '12px', margin: 0, lineHeight: '1.6' },
  summaryGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px',
  },
  summaryBox: {
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '10px', padding: '14px',
  },
  summaryLabel: { color: '#6b7280', fontSize: '12px', margin: '0 0 4px 0' },
  summaryValue: {
    color: '#f1f5f9', fontSize: '16px', fontWeight: '700', margin: 0,
  },
  sectionTitle: {
    color: '#f1f5f9', fontSize: '15px', fontWeight: '600',
    margin: '0 0 12px 0',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  posCard: {
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '12px', padding: '14px',
  },
  posHeader: {
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px',
  },
  coinAvatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)', color: '#6366f1',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: '700', flexShrink: 0,
  },
  posInfo: { flex: 1 },
  posSymbol: {
    color: '#f1f5f9', fontWeight: '700', fontSize: '14px', margin: '0 0 2px 0',
  },
  posQty: { color: '#6b7280', fontSize: '11px', margin: 0 },
  posPnl: { textAlign: 'right' },
  pnlValue: { fontSize: '14px', fontWeight: '700', margin: '0 0 2px 0' },
  pnlPct: { fontSize: '12px', fontWeight: '600', margin: 0 },
  posDetails: {
    display: 'flex', justifyContent: 'space-between',
    background: '#111118', borderRadius: '8px', padding: '10px',
  },
  detailItem: { textAlign: 'center' },
  detailLabel: { color: '#6b7280', fontSize: '10px', margin: '0 0 2px 0' },
  detailValue: {
    color: '#f1f5f9', fontSize: '12px', fontWeight: '600',
    margin: 0, fontFamily: 'monospace',
  },
}
