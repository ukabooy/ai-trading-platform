import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Home() {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      loadUser(savedToken)
    }
  }, [])

  const loadUser = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setUser(res.data)
      setView('dashboard')
      loadStats(tok)
    } catch (err) {
      localStorage.removeItem('token')
    }
  }

  const loadStats = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setStats(res.data)
    } catch (err) {
      console.log(err)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email, username, password, full_name: fullName
      })
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      setUser(res.data.user)
      localStorage.setItem('token', res.data.access_token)
      setView('dashboard')
      loadStats(res.data.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password })
      setUser(res.data.user)
      localStorage.setItem('token', res.data.access_token)
      setView('dashboard')
      loadStats(res.data.access_token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setUser(null)
    setStats(null)
    localStorage.removeItem('token')
    setView('login')
  }

  if (view === 'dashboard' && user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Welcome, {user.username}!</h1>
          <p style={styles.subtitle}>AI Trading Platform Dashboard</p>

          {stats && (
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Portfolio</p>
                <p style={styles.statValue}>
                  ${stats.portfolio_value.toLocaleString()}
                </p>
              </div>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Total P&L</p>
                <p style={{
                  ...styles.statValue,
                  color: stats.total_pnl >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {stats.total_pnl >= 0 ? '+' : ''}${stats.total_pnl.toFixed(2)}
                </p>
              </div>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Win Rate</p>
                <p style={styles.statValue}>{stats.win_rate.toFixed(1)}%</p>
              </div>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Open Trades</p>
                <p style={styles.statValue}>{stats.open_trades}</p>
              </div>
            </div>
          )}

          <div style={styles.infoBox}>
            <p>Account connected • {user.subscription_plan} plan</p>
            <p>{user.totp_enabled ? '2FA enabled' : '2FA not enabled'}</p>
          </div>

          <a href="/markets" style={{...styles.navBtn, marginTop: '16px'}}>
            📈 Live Markets
          </a>
          <a href="/signals" style={{...styles.navBtn, marginTop: '10px'}}>
            ⚡ AI Signals
          </a>
          <a href="/trades" style={{...styles.navBtn, marginTop: '10px'}}>
            💼 My Trades
          </a>
          <a href="/alerts" style={{...styles.navBtn, marginTop: '10px'}}>
            🔔 Price Alerts
          </a>
          <a href="/leaderboard" style={{...styles.navBtn, marginTop: '10px'}}>
            🏆 Leaderboard
          </a>
          <a href="/copy-trading" style={{...styles.navBtn, marginTop: '10px'}}>
            👥 Copy Trading
          </a>
          <a href="/referral" style={{...styles.navBtn, marginTop: '10px'}}>
            🎁 Referral Program
          </a>
          <a href="/notifications" style={{...styles.navBtn, marginTop: '10px'}}>
            🔔 Notifications
          </a>
          <a href="/watchlist" style={{...styles.navBtn, marginTop: '10px'}}>
            ⭐ Watchlist
          </a>
          <a href="/pricing" style={{...styles.navBtn, marginTop: '10px', background: 'linear-gradient(135deg, #6366f1, #f59e0b)'}}>
            💎 Upgrade Plan
          </a>
          <a href="/settings" style={{
            ...styles.navBtn,
            marginTop: '10px',
            background: 'transparent',
            border: '1px solid #2a2a3a',
            color: '#94a3b8'
          }}>
            ⚙️ Settings
          </a>
          {(user.role === 'ADMIN' || user.role === 'admin') && (
            <a href="/admin" style={{
              ...styles.navBtn,
              marginTop: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444'
            }}>
              🛡️ Admin Panel
            </a>
          )}

          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>AI Trading Platform</h1>
        <p style={styles.subtitle}>
          {view === 'login' ? 'Sign in to your account' : 'Create your account'}
        </p>

        <form onSubmit={view === 'login' ? handleLogin : handleRegister}>
          {view === 'register' && (
            <>
              <input
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </>
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Please wait...' : view === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={styles.switchText}>
          {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span
            style={styles.link}
            onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError('') }}
          >
            {view === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
  },
  card: {
    background: '#111118',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    color: '#f1f5f9',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    margin: '0 0 12px 0',
  },
  switchText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
  },
  link: {
    color: '#6366f1',
    cursor: 'pointer',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '20px',
  },
  statBox: {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '14px',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '12px',
    margin: '0 0 4px 0',
  },
  statValue: {
    color: '#f1f5f9',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  infoBox: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '10px',
    padding: '14px',
    color: '#a5b4fc',
    fontSize: '13px',
    lineHeight: '1.8',
    marginBottom: '4px',
  },
  navBtn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    boxSizing: 'border-box',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '12px',
  },
}
