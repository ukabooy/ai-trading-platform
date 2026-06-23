import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Pricing() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadPlans(savedToken)
    }
  }, [])

  const loadPlans = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/subscription/plans`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setPlans(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const upgrade = async (planId) => {
    setUpgrading(planId)
    setMessage('')
    try {
      const res = await axios.post(
        `${API_URL}/subscription/upgrade`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMessage(res.data.message)
      loadPlans(token)
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to upgrade')
    }
    setUpgrading(null)
  }

  const planColors = {
    free: { border: '#2a2a3a', badge: '#6b7280' },
    basic: { border: 'rgba(99,102,241,0.4)', badge: '#6366f1' },
    pro: { border: 'rgba(245,158,11,0.4)', badge: '#f59e0b' },
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
      <div style={styles.wrapper}>
        <h1 style={styles.title}>💎 Pricing Plans</h1>
        <a href="/" style={styles.backLink}>← Back to Dashboard</a>
        <p style={styles.subtitle}>Choose the plan that fits your trading style</p>

        {message && (
          <div style={styles.messageBox}>
            <p style={{ margin: 0 }}>{message}</p>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>Loading...</p>
        ) : (
          <div style={styles.plansGrid}>
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  ...styles.planCard,
                  borderColor: planColors[plan.id]?.border || '#2a2a3a',
                  position: 'relative',
                }}
              >
                {plan.id === 'pro' && (
                  <div style={styles.popularBadge}>MOST POPULAR</div>
                )}

                <div style={styles.planHeader}>
                  <h2 style={styles.planName}>{plan.name}</h2>
                  <div style={styles.priceRow}>
                    <span style={styles.price}>
                      ${plan.price}
                    </span>
                    <span style={styles.period}>/month</span>
                  </div>
                </div>

                <ul style={styles.featureList}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={styles.featureItem}>
                      <span style={{ color: '#10b981' }}>✓</span>
                      <span style={styles.featureText}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.is_current ? (
                  <div style={styles.currentBadge}>
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => upgrade(plan.id)}
                    disabled={upgrading === plan.id}
                    style={{
                      ...styles.upgradeBtn,
                      background: plan.id === 'pro'
                        ? '#f59e0b'
                        : plan.id === 'basic'
                        ? '#6366f1'
                        : '#2a2a3a',
                    }}
                  >
                    {upgrading === plan.id
                      ? 'Upgrading...'
                      : plan.price === 0
                      ? 'Downgrade'
                      : 'Upgrade Now'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={styles.note}>
          Note: This is a demo platform. No real payments are processed.
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
    justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif',
    padding: '20px',
  },
  wrapper: {
    width: '100%',
    maxWidth: '600px',
    height: 'fit-content',
  },
  title: {
    color: '#f1f5f9',
    fontSize: '24px',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  backLink: {
    color: '#6366f1',
    fontSize: '13px',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    margin: '0 0 24px 0',
  },
  messageBox: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '8px',
    padding: '12px',
    color: '#10b981',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  plansGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  planCard: {
    background: '#111118',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '24px',
  },
  popularBadge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#f59e0b',
    color: '#000',
    fontSize: '10px',
    fontWeight: '800',
    padding: '4px 12px',
    borderRadius: '20px',
    letterSpacing: '1px',
  },
  planHeader: {
    marginBottom: '16px',
  },
  planName: {
    color: '#f1f5f9',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  price: {
    color: '#f1f5f9',
    fontSize: '32px',
    fontWeight: '800',
  },
  period: {
    color: '#6b7280',
    fontSize: '14px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  featureText: {
    color: '#94a3b8',
    fontSize: '13px',
  },
  currentBadge: {
    width: '100%',
    padding: '12px',
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '8px',
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
  },
  upgradeBtn: {
    width: '100%',
    padding: '12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  note: {
    color: '#4b5563',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '24px',
  },
}
