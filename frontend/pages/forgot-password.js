import { useState } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [demoCode, setDemoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const requestCode = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/password/forgot`, { email })
      setDemoCode(res.data.reset_code)
      setStep(2)
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code')
    }
    setLoading(false)
  }

  const resetPassword = async () => {
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_URL}/password/reset`, {
        token: `${email}:${resetCode}`,
        new_password: newPassword
      })
      setStep(3)
      setMessage('Password reset successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password')
    }
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔑 Reset Password</h1>
        <a href="/" style={styles.backLink}>← Back to Login</a>

        {step === 1 && (
          <div>
            <p style={styles.subtitle}>
              Enter your email address and we'll send you a reset code.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button
              onClick={requestCode}
              disabled={loading || !email}
              style={styles.button}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={styles.subtitle}>{message}</p>
            {demoCode && (
              <div style={styles.demoBox}>
                <p style={styles.demoLabel}>Demo Mode — Your reset code:</p>
                <p style={styles.demoCode}>{demoCode}</p>
                <p style={styles.demoNote}>
                  In production this would be sent to your email.
                </p>
              </div>
            )}
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter 6-digit code"
              style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px' }}
              maxLength={6}
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (8+ characters)"
              style={styles.input}
            />
            {error && <p style={styles.error}>{error}</p>}
            <button
              onClick={resetPassword}
              disabled={loading || !resetCode || !newPassword}
              style={styles.button}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={styles.successBox}>
            <p style={styles.successIcon}>✅</p>
            <p style={styles.successText}>{message}</p>
            <a href="/" style={styles.button}>
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh', background: '#0a0a0f', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif', padding: '20px',
  },
  card: {
    background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px',
    padding: '32px', width: '100%', maxWidth: '420px',
  },
  title: { color: '#f1f5f9', fontSize: '22px', margin: '0 0 8px 0' },
  backLink: {
    color: '#6366f1', fontSize: '13px', textDecoration: 'none',
    display: 'block', marginBottom: '20px',
  },
  subtitle: { color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.6' },
  input: {
    width: '100%', padding: '12px', marginBottom: '12px',
    background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    display: 'block', width: '100%', padding: '12px', background: '#6366f1',
    color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
    boxSizing: 'border-box',
  },
  error: { color: '#ef4444', fontSize: '13px', margin: '0 0 12px 0' },
  demoBox: {
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'center',
  },
  demoLabel: { color: '#f59e0b', fontSize: '12px', margin: '0 0 8px 0' },
  demoCode: {
    color: '#f1f5f9', fontSize: '28px', fontWeight: '800',
    fontFamily: 'monospace', letterSpacing: '6px', margin: '0 0 6px 0',
  },
  demoNote: { color: '#6b7280', fontSize: '11px', margin: 0 },
  successBox: { textAlign: 'center', padding: '20px 0' },
  successIcon: { fontSize: '48px', margin: '0 0 12px 0' },
  successText: { color: '#10b981', fontSize: '16px', fontWeight: '600', margin: '0 0 20px 0' },
}
