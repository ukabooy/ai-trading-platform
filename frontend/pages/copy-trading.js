import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function CopyTrading() {
  const [token, setToken] = useState('')
  const [traders, setTraders] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('traders')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadData(savedToken)
    }
  }, [])

  const loadData = async (tok) => {
    try {
      const [tradersRes, followingRes] = await Promise.all([
        axios.get(`${API_URL}/copy-trading/traders`, {
          headers: { Authorization: `Bearer ${tok}` }
        }),
        axios.get(`${API_URL}/copy-trading/following`, {
          headers: { Authorization: `Bearer ${tok}` }
        })
      ])
      setTraders(tradersRes.data)
      setFollowing(followingRes.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const toggleFollow = async (traderId) => {
    try {
      await axios.post(
        `${API_URL}/copy-trading/follow`,
        { trader_id: traderId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setActionMsg('Updated!')
      loadData(token)
      setTimeout(() => setActionMsg(''), 2000)
    } catch (err) {
      setActionMsg(err.response?.data?.detail || 'Failed')
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
        <h1 style={styles.title}>👥 Copy Trading</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>
        <p style={styles.subtitle}>Follow top traders and copy their moves</p>

        {actionMsg && (
          <div style={styles.msgBox}>
            <p style={{ margin: 0 }}>{actionMsg}</p>
          </div>
        )}

        <div style={styles.tabs}>
          <button
            onClick={() => setTab('traders')}
            style={{
              ...styles.tab,
              background: tab === 'traders' ? '#6366f1' : 'transparent',
              color: tab === 'traders' ? 'white' : '#6b7280',
            }}
          >
            Top Traders
          </button>
          <button
            onClick={() => setTab('following')}
            style={{
              ...styles.tab,
              background: tab === 'following' ? '#6366f1' : 'transparent',
              color: tab === 'following' ? 'white' : '#6b7280',
            }}
          >
            Following ({following.length})
          </button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : tab === 'traders' ? (
          <div style={styles.list}>
            {traders.length === 0 ? (
              <p style={styles.empty}>
                No other traders yet. Invite friends to join!
              </p>
            ) : (
              traders.map((trader) => (
                <div key={trader.id} style={styles.traderCard}>
                  <div style={styles.traderAvatar}>
                    {trader.username[0].toUpperCase()}
                  </div>
                  <div style={styles.traderInfo}>
                    <p style={styles.traderName}>{trader.username}</p>
                    <p style={styles.traderStats}>
                      {trader.total_trades} trades •{' '}
                      {trader.win_rate.toFixed(1)}% win rate
                    </p>
                    <p style={{
                      ...styles.traderPnl,
                      color: trader.total_pnl >= 0 ? '#10b981' : '#ef4444'
                    }}>
                      {trader.total_pnl >= 0 ? '+' : ''}
                      ${trader.total_pnl.toFixed(2)} P&L
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(trader.id)}
                    style={{
                      ...styles.followBtn,
                      background: trader.is_following
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(99,102,241,0.1)',
                      color: trader.is_following ? '#ef4444' : '#6366f1',
                      border: trader.is_following
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    {trader.is_following ? 'Unfollow' : 'Follow'}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={styles.list}>
            {following.length === 0 ? (
              <p style={styles.empty}>
                Not following anyone yet. Go to Top Traders to follow!
              </p>
            ) : (
              following.map((f) => (
                <div key={f.trader_id} style={styles.followingCard}>
                  <div style={styles.traderAvatar}>
                    {f.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={styles.traderName}>{f.username}</p>
                    <p style={styles.traderStats}>
                      Following since{' '}
                      {new Date(f.since).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(f.trader_id)}
                    style={{
                      ...styles.followBtn,
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    Unfollow
                  </button>
                </div>
              ))
            )}
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
    margin: '0 0 16px 0',
  },
  msgBox: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '8px',
    padding: '10px',
    color: '#10b981',
    fontSize: '13px',
    marginBottom: '12px',
    textAlign: 'center',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    background: '#1a1a24',
    padding: '4px',
    borderRadius: '10px',
  },
  tab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  traderCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '14px',
  },
  followingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#1a1a24',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '12px',
    padding: '14px',
  },
  traderAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(99,102,241,0.15)',
    color: '#6366f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
    flexShrink: 0,
  },
  traderInfo: { flex: 1 },
  traderName: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: '14px',
    margin: '0 0 2px 0',
  },
  traderStats: { color: '#6b7280', fontSize: '11px', margin: '0 0 2px 0' },
  traderPnl: { fontSize: '12px', fontWeight: '600', margin: 0 },
  followBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
}
