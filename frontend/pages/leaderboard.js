import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/leaderboard`)
        setEntries(res.data)
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    }
    loadLeaderboard()
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🏆 Leaderboard</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>
        <p style={styles.subtitle}>Top traders ranked by total P&L</p>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : entries.length === 0 ? (
          <p style={styles.empty}>
            No traders yet. Make some trades to appear here!
          </p>
        ) : (
          <div style={styles.list}>
            {entries.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  ...styles.row,
                  borderColor: entry.rank === 1
                    ? 'rgba(255,215,0,0.3)'
                    : entry.rank === 2
                    ? 'rgba(192,192,192,0.3)'
                    : entry.rank === 3
                    ? 'rgba(205,127,50,0.3)'
                    : '#2a2a3a',
                  background: entry.rank === 1
                    ? 'rgba(255,215,0,0.05)'
                    : '#1a1a24',
                }}
              >
                <div style={styles.rankSection}>
                  <span style={styles.medal}>
                    {entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}
                  </span>
                  <div>
                    <p style={styles.username}>{entry.username}</p>
                    <p style={styles.stats}>
                      {entry.total_trades} trades • {entry.win_rate.toFixed(1)}% win rate
                    </p>
                  </div>
                </div>
                <div style={styles.pnlSection}>
                  <p style={{
                    ...styles.pnl,
                    color: entry.total_pnl >= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {entry.total_pnl >= 0 ? '+' : ''}${entry.total_pnl.toFixed(2)}
                  </p>
                  <p style={styles.pnlLabel}>Total P&L</p>
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
  backLink: {
    color: '#6366f1',
    fontSize: '13px',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '13px',
    margin: '0 0 20px 0',
  },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '14px',
  },
  rankSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  medal: { fontSize: '24px', minWidth: '32px', textAlign: 'center' },
  username: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: '14px',
    margin: '0 0 2px 0',
  },
  stats: { color: '#6b7280', fontSize: '11px', margin: 0 },
  pnlSection: { textAlign: 'right' },
  pnl: { fontSize: '16px', fontWeight: '700', margin: '0 0 2px 0' },
  pnlLabel: { color: '#6b7280', fontSize: '11px', margin: 0 },
}
