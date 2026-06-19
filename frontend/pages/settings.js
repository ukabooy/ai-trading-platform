import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Settings() {
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState(null)
  const [fullName, setFullName] = useState('')
  const [autoTrade, setAutoTrade] = useState(false)
  const [maxAmount, setMaxAmount] = useState(100)
  const [riskLevel, setRiskLevel] = useState(3)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const [totpEnabled, setTotpEnabled] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [totpInput, setTotpInput] = useState('')
  const [twoFaError, setTwoFaError] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadProfile(savedToken)
    }
  }, [])

  const loadProfile = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/settings/profile`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setProfile(res.data)
      setFullName(res.data.full_name || '')
      setAutoTrade(res.data.auto_trade_enabled)
      setMaxAmount(res.data.max_trade_amount)
      setRiskLevel(res.data.risk_level)

      const meRes = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setTotpEnabled(meRes.data.totp_enabled)
    } catch (err) {
      console.log(err)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSuccess('')
    try {
      await axios.patch(
        `${API_URL}/settings/profile`,
        {
          full_name: fullName,
          auto_trade_enabled: autoTrade,
          max_trade_amount: parseFloat(maxAmount),
          risk_level: parseInt(riskLevel),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccess('Settings saved successfully!')
    } catch (err) {
      console.log(err)
    }
    setSaving(false)
  }

  const startSetup2FA = async () => {
    setTwoFaError('')
    try {
      const res = await axios.post(`${API_URL}/2fa/setup`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQrCode(res.data.qr_code)
    } catch (err) {
      setTwoFaError(err.response?.data?.detail || 'Failed to setup 2FA')
    }
  }

  const verify2FA = async () => {
    setTwoFaError('')
    try {
      await axios.post(`${API_URL}/2fa/verify`, { totp_code: totpInput }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTotpEnabled(true)
      setQrCode('')
      setTotpInput('')
    } catch (err) {
      setTwoFaError(err.response?.data?.detail || 'Invalid code')
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
        <h1 style={styles.title}>⚙️ Settings</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        {profile && (
          <>
            <div style={styles.section}>
              <label style={styles.label}>Email</label>
              <input style={{...styles.input, opacity: 0.5}} value={profile.email} disabled />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Username</label>
              <input style={{...styles.input, opacity: 0.5}} value={profile.username} disabled />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div style={styles.toggleRow}>
              <div>
                <p style={styles.toggleLabel}>Auto Trading</p>
                <p style={styles.toggleSub}>Automatically execute AI signals</p>
              </div>
              <button
                onClick={() => setAutoTrade(!autoTrade)}
                style={{
                  ...styles.toggle,
                  background: autoTrade ? '#6366f1' : '#2a2a3a'
                }}
              >
                <span style={{
                  ...styles.toggleDot,
                  left: autoTrade ? '22px' : '2px'
                }} />
              </button>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Max Trade Amount ($)</label>
              <input
                style={styles.input}
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Risk Level: {riskLevel}/5</label>
              <input
                type="range" min="1" max="5" step="1"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                style={{width: '100%'}}
              />
            </div>

            {success && <p style={styles.success}>{success}</p>}

            <button onClick={saveSettings} style={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <div style={styles.divider} />

            <h2 style={styles.subTitle}>🔐 Two-Factor Authentication</h2>

            {totpEnabled ? (
              <div style={styles.enabledBox}>
                <p style={{margin: 0, color: '#10b981', fontSize: '13px'}}>✅ 2FA is enabled on your account</p>
              </div>
            ) : (
              <>
                {!qrCode ? (
                  <button onClick={startSetup2FA} style={styles.secondaryBtn}>
                    Setup 2FA
                  </button>
                ) : (
                  <div>
                    <p style={styles.smallText}>Scan with Google Authenticator or similar app:</p>
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="2FA QR"
                      style={{width: '160px', height: '160px', display: 'block', margin: '12px auto', borderRadius: '8px'}}
                    />
                    <input
                      style={{...styles.input, textAlign: 'center', letterSpacing: '4px'}}
                      placeholder="000000"
                      maxLength={6}
                      value={totpInput}
                      onChange={(e) => setTotpInput(e.target.value)}
                    />
                    {twoFaError && <p style={styles.error}>{twoFaError}</p>}
                    <button onClick={verify2FA} style={{...styles.saveBtn, marginTop: '10px'}}>
                      Verify & Enable
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
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
  subTitle: { color: '#f1f5f9', fontSize: '16px', margin: '0 0 12px 0' },
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '20px' },
  section: { marginBottom: '16px' },
  label: { color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', boxSizing: 'border-box', marginBottom: '10px',
  },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1a24', borderRadius: '10px', padding: '12px', marginBottom: '16px',
  },
  toggleLabel: { color: '#f1f5f9', fontSize: '14px', fontWeight: '600', margin: 0 },
  toggleSub: { color: '#6b7280', fontSize: '11px', margin: '2px 0 0 0' },
  toggle: {
    width: '44px', height: '24px', borderRadius: '12px', border: 'none',
    position: 'relative', cursor: 'pointer',
  },
  toggleDot: {
    width: '20px', height: '20px', background: 'white', borderRadius: '50%',
    position: 'absolute', top: '2px', transition: 'left 0.2s',
  },
  success: { color: '#10b981', fontSize: '13px', marginBottom: '12px' },
  error: { color: '#ef4444', fontSize: '13px', margin: '8px 0' },
  smallText: { color: '#94a3b8', fontSize: '13px', textAlign: 'center' },
  saveBtn: {
    width: '100%', padding: '12px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  secondaryBtn: {
    width: '100%', padding: '12px', background: 'rgba(99,102,241,0.1)', color: '#6366f1',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  divider: { height: '1px', background: '#2a2a3a', margin: '24px 0' },
  enabledBox: {
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '8px', padding: '12px',
  },
}
