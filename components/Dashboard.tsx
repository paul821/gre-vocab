'use client'
import { useRouter }   from 'next/navigation'
import { supabase }    from '@/lib/supabase'
import { useProgress } from '@/lib/useProgress'
import { WORDS }       from '@/data/words'

export default function Dashboard({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter()
  const { counts, progress, loading } = useProgress()

  const total      = WORDS.length
  const pct        = total > 0 ? Math.round((counts.mastered / total) * 100) : 0
  const due        = WORDS.filter(w => { const p = progress[w.word]; return !p || p.due <= Date.now() }).length
  const bookmarked = WORDS.filter(w => progress[w.word]?.bookmarked).length
  const tier1Total = WORDS.filter(w => w.tier === 1).length
  const tier1Done  = WORDS.filter(w => w.tier === 1 && progress[w.word]?.status === 'mastered').length
  // Bug fix: guard against division by zero
  const tier1Pct   = tier1Total > 0 ? Math.round(tier1Done / tier1Total * 100) : 0
  const circ       = 2 * Math.PI * 58

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
    // Bug fix: use router.push('/') instead of router.refresh()
    // refresh() doesn't re-run server component auth check on some Next.js versions
  }

  if (loading) return (
    <div className="dash-screen" style={{ alignItems:'center', justifyContent:'center' }}>
      <div className="spinner"/>
    </div>
  )

  return (
    <div className="dash-screen">
      <div className="dash-header">
        <div>
          <div className="dash-title">GRE Vocab</div>
          {userEmail && <div className="dash-user">{userEmail}</div>}
        </div>
        {userEmail && <button className="dash-signout" onClick={signOut}>Sign out</button>}
      </div>

      <div className="dash-ring-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke="#e0ddd8" strokeWidth="10"/>
          <circle
            cx="70" cy="70" r="58" fill="none" stroke="#3B6D11" strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${circ * (1 - pct / 100)}`}
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
          />
          <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="700" fill="#111">{pct}%</text>
          <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#aaa">mastered</text>
        </svg>
      </div>

      <div className="dash-stats">
        <div className="dash-stat"><div className="ds-num" style={{color:'#185FA5'}}>{counts.new}</div><div className="ds-lbl">New</div></div>
        <div className="dash-stat"><div className="ds-num" style={{color:'#854F0B'}}>{counts.learning}</div><div className="ds-lbl">Learning</div></div>
        <div className="dash-stat"><div className="ds-num" style={{color:'#3B6D11'}}>{counts.mastered}</div><div className="ds-lbl">Mastered</div></div>
        <div className="dash-stat"><div className="ds-num">{due}</div><div className="ds-lbl">Due</div></div>
      </div>

      <div className="dash-tier">
        <div className="dash-tier-label">
          <span>Tier 1 — highest frequency</span>
          <span>{tier1Done} / {tier1Total}</span>
        </div>
        <div className="dash-tier-bar">
          <div className="dash-tier-fill" style={{ width:`${tier1Pct}%` }}/>
        </div>
      </div>

      <div className="dash-actions">
        <button className="dash-btn-primary" onClick={() => router.push('/study')}>
          {due > 0 ? `Study ${due} due cards` : 'Study all cards'}
        </button>
        {bookmarked > 0 && (
          <button className="dash-btn-secondary" onClick={() => router.push('/study?mode=bookmarks')}>
            🔖 Review {bookmarked} bookmarked
          </button>
        )}
        <button className="dash-btn-secondary" onClick={() => router.push('/study?tier=1')}>
          Tier 1 only — {tier1Total} highest-frequency words
        </button>
      </div>
    </div>
  )
}
