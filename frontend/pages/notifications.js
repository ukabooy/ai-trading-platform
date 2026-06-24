import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://ai-trading-platform-1-c39c.onrender.com/api'

export default function Notifications() {
  const [token, setToken] = useState('')
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      loadNotifications(savedToken)
    }
  }, [])

  const loadNotifications = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setNotifications(res.data)
    } catch (err) {
      console.log(err)
    }
    setLoading(false)
  }

  const markAllRead = async () => {
    setMarking(true)
    try {
      await axios.post(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadNotifications(token)
    } catch (err) {
      console.log(err)
    }
    setMarking(false)
  }

  const createTest = async () => {
    try {
      await axios.post(`${API_URL}/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      loadNotifications(token)
    } catch (err) {
      console.log(err)
    }
  }

  const typeColors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10b981', icon: '✅' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b', icon: '⚠️' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', icon: '❌' },
    info: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#6366f1', icon: 'ℹ️' },
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

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
        <div style={styles.header}>
          <h1 style={styles.title}>
            🔔 Notifications
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </h1>
          <a href="/" style={styles.backLink}>← Dashboard</a>
        </div>

        <div style={styles.actions}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={marking}
              style={styles.markReadBtn}
            >
              {marking ? 'Marking...' : 'Mark all read'}
            </button>
          )}
          <button onClick={createTest} style={styles.testBtn}>
            + Test notification
          </button>
        </div>

        {loading ? (
          <p style={styles.empty}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={styles.emptyIcon}>🔔</p>
            <p style={styles.empty}>No notifications yet.</p>
            <button onClick={createTest} style={styles.markReadBtn}>
              Create your first one
            </button>
          </div>
        ) : (
          <div style={styles.list}>
            {notifications.map((notif) => {
              const colors = typeColors[notif.type] || typeColors.info
              return (
                <div
                  key={notif.id}
                  style={{
                    ...styles.notifCard,
                    background: notif.is_read ? '#1a1a24' : colors.bg,
                    borderColor: notif.is_read ? '#2a2a3a' : colors.border,
                    opacity: notif.is_read ? 0.7 : 1,
                  }}
                >
                  <div style={styles.notifIcon}>{colors.icon}</div>
                  <div style={styles.notifContent}>
                    <p style={styles.notifTitle}>{notif.title}</p>
                    <p style={styles.notifMessage}>{notif.message}</p>
                    <p style={styles.notifTime}>
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div style={{...styles.unreadDot, background: colors.color}} />
                  )}
                </div>
              )
            })}
          </div>
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
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: '16px',
  },
  title: {
    color: '#f1f5f9', fontSize: '22px', margin: 0,
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  badge: {
    background: '#ef4444', color: 'white', fontSize: '11px',
    fontWeight: '700', padding: '2px 7px', borderRadius: '20px',
  },
  backLink: { color: '#6366f1', fontSize: '13px', textDecoration: 'none' },
  actions: { display: 'flex', gap: '8px', marginBottom: '16px' },
  markReadBtn: {
    padding: '8px 12px', background: 'rgba(99,102,241,0.1)', color: '#6366f1',
    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  testBtn: {
    padding: '8px 12px', background: 'transparent', color: '#6b7280',
    border: '1px solid #2a2a3a', borderRadius: '8px',
    fontSize: '12px', cursor: 'pointer',
  },
  emptyBox: { textAlign: 'center', padding: '20px' },
  emptyIcon: { fontSize: '40px', margin: '0 0 8px 0' },
  empty: { color: '#6b7280', textAlign: 'center', margin: '0 0 12px 0' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  notifCard: {
    display: 'flex', alignItems: 'flex-start', gap: '12px',
    border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px',
    position: 'relative',
  },
  notifIcon: { fontSize: '18px', flexShrink: 0 },
  notifContent: { flex: 1 },
  notifTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: '13px', margin: '0 0 4px 0' },
  notifMessage: { color: '#94a3b8', fontSize: '12px', margin: '0 0 4px 0', lineHeight: '1.5' },
  notifTime: { color: '#4b5563', fontSize: '11px', margin: 0 },
  unreadDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    flexShrink: 0, marginTop: '4px',
  },
}
