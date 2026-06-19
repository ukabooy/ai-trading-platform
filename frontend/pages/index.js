import { useState } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Home() {
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    setView('login')
  }

  if (view === 'dashboard' && user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>🚀 Welcome, {user.username}!</h1>
          <p style={styles.subtitle}>AI Trading Platform Dashboard</p>

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Email</p>
              <p style={styles.statValue}>{user.email}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Plan</p>
              <p style={styles.statValue}>{user.subscription_plan}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Max Trade</p>
              <p style={styles.statValue}>${user.max_trade_amount}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Risk Level</p>
              <p style={styles.statValue}>{user.risk_level}/5</p>
            </div>
          </div>

          <div style={styles.infoBox}>
            <p>✅ Your account is live and connected to the database!</p>
            <p>🔐 You're authenticated with a secure JWT token</p>
          </div>

          <a href="/signals" style={styles.signalsBtn}>
            ⚡ View AI Signals
          </a>

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
        <h1 style={styles.title}>🤖 AI Trading Platform</h1>
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
  },
  signalsBtn: {
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
    marginTop: '16px',
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
