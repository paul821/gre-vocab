'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthScreen() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function sendMagicLink() {
    if (!email) return
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">GRE</div>
        <h1 className="auth-title">Vocab</h1>
        <p className="auth-sub">Spaced repetition flashcards. Progress syncs across all your devices.</p>

        {sent ? (
          <div className="auth-sent">
            <div className="sent-icon">✉️</div>
            <p>Check your email for a magic sign-in link.<br/>You can close this tab.</p>
          </div>
        ) : (
          <>
            <div className="auth-field">
              <input
                type="email"
                className="auth-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
              />
              <button className="auth-btn-primary" onClick={sendMagicLink} disabled={loading || !email}>
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}
            <button className="auth-skip" onClick={() => window.location.href = '/study'}>Continue without account →</button>
          </>
        )}
      </div>
    </div>
  )
}
