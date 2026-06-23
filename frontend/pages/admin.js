import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Admin() {
  const [token, setToken] = useState('')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('stats')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadData(savedToken)
    }
  }, [])

  const loadData = async (tok) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${tok}` }
        }),
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${tok}` }
        })
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Access denied')
    }
    setLoading(false)
  }

  const toggleUser = async (userId) => {
    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      loadData(token)
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

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Admin Panel</h1>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <a href="/" style={{ color: '#6366f1' }}>Back to Dashboard</a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Panel</h1>
        <a href="/" style={styles.backLink}>Back to Dashboard</a>

        <div style={styles.tabs}>
          <button
            onClick={() => setTab('stats')}
            style={{
              ...styles.tab,
              background: tab === 'stats' ? '#6366f1' : 'transparent',
              color: tab === 'stats' ? 'white' : '#6b7280',
            }}
          >
            Stats
          </button>
          <button
            onClick={() => setTab('users')}
            style={{
              ...styles.tab,
              background: tab === 'users' ? '#6366f1' : 'transparent',
              color: tab === 'users' ? 'white' : '#6b7280',
            }}
          >
            Users
          </button>
        </div>

        {tab === 'stats' && stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Total Users</p>
              <p style={styles.statValue}>{stats.total_users}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Active Users</p>
              <p style={styles.statValue}>{stats.active_users}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Total Trades</p>
              <p style={styles.statValue}>{stats.total_trades}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Total Signals</p>
              <p style={styles.statValue}>{stats.total_signals}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Pro Users</p>
              <p style={{ ...styles.statValue, color: '#f59e0b' }}>
                {stats.pro_users}
              </p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Basic Users</p>
              <p style={{ ...styles.statValue, color: '#6366f1' }}>
                {stats.basic_users}
              </p>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div style={styles.userList}>
            {users.map((user) => (
              <div key={user.id} style={styles.userCard}>
                <div>
                  <div style={styles.userHeader}>
                    <p style={styles.username}>{user.username}</p>
                    <span style={{
                      ...styles.planBadge,
                      background: user.subscription_plan === 'pro'
                        ? 'rgba(245,158,11,0.15)'
                        : user.subscription_plan === 'basic'
                        ? 'rgba(99,102,241,0.15)'
                        : 'rgba(107,114,128,0.15)',
                      color: user.subscription_plan === 'pro'
                        ? '#f59e0b'
                        : user.subscription_plan === 'basic'
                        ? '#6366f1'
                        : '#6b7280',
                    }}>
                      {user.subscription_plan}
                    </span>
                  </div>
                  <p style={styles.userEmail}>{user.email}</p>
                  <p style={styles.userStats}>
                    {user.total_trades} trades •{' '}
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => toggleUser(user.id)}
                  style={{
                    ...styles.toggleBtn,
                    background: user.is_active
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(16,185,129,0.1)',
                    color: user.is_active ? '#ef4444' : '#10b981',
                    border: user.is_active
                      ? '1px solid rgba(239,68,68,0.3)'
                      : '1px solid rgba(16,185,129,0.3)',
                  }}
                >
                  {user.is_active ? 'Disable' : 'Enable'}
                </button>
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
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  statBox: {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '14px',
  },
  statLabel: { color: '#6b7280', fontSize: '12px', margin: '0 0 4px 0' },
  statValue: {
    color: '#f1f5f9',
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
  },
  userList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  userCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '12px',
  },
  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  username: {
    color: '#f1f5f9',
    fontWeight: '700',
    fontSize: '14px',
    margin: 0,
  },
  planBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  userEmail: { color: '#6b7280', fontSize: '11px', margin: '0 0 2px 0' },
  userStats: { color: '#4b5563', fontSize: '11px', margin: 0 },
  toggleBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
}
