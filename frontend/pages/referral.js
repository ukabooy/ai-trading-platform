import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Referral() {
  const [token, setToken] = useState('')
  const [referralData, setReferralData] = useState(null)
  const [applyCode, setApplyCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadReferral(savedToken)
    }
  }, [])

  const loadReferral = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/referral/my-code`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setReferralData(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const copyLink = () => {
    if (referralData?.referral_link) {
      navigator.clipboard.writeText(referralData.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const applyReferral = async () => {
    if (!applyCode) return
    setApplying(true)
    setMessage('')
    setError('')
    try {
      const res = await axios.post(
        `${API_URL}/referral/apply/${applyCode}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      setApplyCode('')
      loadReferral(token)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to apply code')
    }
    setApplying(false)
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
        <h1 style={styles.title}>🎁 Referral Program</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : (
          <>
            <div style={styles.rewardBox}>
              <p style={styles.rewardTitle}>How it works</p>
              <p style={styles.rewardText}>
                Share your referral link. When a friend signs up and uses your code,
                both of you get upgraded to <strong>Basic plan free!</strong>
              </p>
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Total Referrals</p>
                <p style={styles.statValue}>{referralData?.total_referrals || 0}</p>
              </div>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>Successful</p>
                <p style={{...styles.statValue, color: '#10b981'}}>
                  {referralData?.successful_referrals || 0}
                </p>
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Your Referral Code</label>
              <div style={styles.codeBox}>
                <span style={styles.code}>{referralData?.code}</span>
              </div>
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Your Referral Link</label>
              <div style={styles.linkBox}>
                <p style={styles.linkText}>{referralData?.referral_link}</p>
              </div>
              <button onClick={copyLink} style={styles.copyBtn}>
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            <div style={styles.divider} />

            <div style={styles.section}>
              <label style={styles.label}>Have a referral code? Enter it here:</label>
              <div style={styles.applyRow}>
                <input
                  value={applyCode}
                  onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  style={styles.input}
                  maxLength={10}
                />
                <button
                  onClick={applyReferral}
                  disabled={applying || !applyCode}
                  style={styles.applyBtn}
                >
                  {applying ? '...' : 'Apply'}
                </button>
              </div>
              {message && <p style={styles.success}>{message}</p>}
              {error && <p style={styles.error}>{error}</p>}
            </div>
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
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none', display: 'block', marginBottom: '20px' },
  rewardBox: {
    background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '10px', padding: '14px', marginBottom: '20px',
  },
  rewardTitle: { color: '#a5b4fc', fontWeight: '700', fontSize: '13px', margin: '0 0 6px 0' },
  rewardText: { color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: '1.6' },
  statsRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  statBox: {
    flex: 1, background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '10px', padding: '14px', textAlign: 'center',
  },
  statLabel: { color: '#6b7280', fontSize: '12px', margin: '0 0 4px 0' },
  statValue: { color: '#f1f5f9', fontSize: '24px', fontWeight: '700', margin: 0 },
  section: { marginBottom: '16px' },
  label: { color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '8px' },
  codeBox: {
    background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '12px', textAlign: 'center',
  },
  code: {
    color: '#6366f1', fontFamily: 'monospace', fontSize: '20px',
    fontWeight: '800', letterSpacing: '3px',
  },
  linkBox: {
    background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px',
    padding: '10px', marginBottom: '8px',
  },
  linkText: {
    color: '#6b7280', fontSize: '11px', margin: 0, wordBreak: 'break-all',
  },
  copyBtn: {
    width: '100%', padding: '10px', background: '#6366f1', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  divider: { height: '1px', background: '#2a2a3a', margin: '20px 0' },
  applyRow: { display: 'flex', gap: '8px' },
  input: {
    flex: 1, padding: '10px', background: '#1a1a24', border: '1px solid #2a2a3a',
    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
    fontFamily: 'monospace', letterSpacing: '2px',
  },
  applyBtn: {
    padding: '10px 16px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  success: { color: '#10b981', fontSize: '12px', marginTop: '8px' },
  error: { color: '#ef4444', fontSize: '12px', marginTop: '8px' },
  empty: { color: '#6b7280', textAlign: 'center', padding: '20px' },
}
