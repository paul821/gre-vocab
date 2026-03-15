'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter }    from 'next/navigation'
import { WORDS, Word }  from '@/data/words'
import { useProgress }  from '@/lib/useProgress'
import { Rating }       from '@/lib/sm2'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Props = { bookmarksOnly?: boolean; tierFilter?: number; shuffle?: boolean }

export default function Flashcard({ bookmarksOnly, tierFilter, shuffle: initialShuffle }: Props) {
  const router = useRouter()
  const { getCard, updateCard, setImgUrl, toggleBookmark, counts, loading } = useProgress()

  const [idx,            setIdx]            = useState(0)
  const [screen,         setScreen]         = useState<'front' | 'back'>('front')
  const [imgSrc,         setImgSrc]         = useState<string | null>(null)
  const [imgLoading,     setImgLoading]     = useState(false)
  const [credit,         setCredit]         = useState<string | null>(null)
  const [anim,           setAnim]           = useState('entering')
  const [shuffleOn,      setShuffleOn]      = useState(initialShuffle ?? false)
  const [strugglingOnly, setStrugglingOnly] = useState(false)
  const [seedKey,        setSeedKey]        = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deck: Word[] = useMemo(() => {
    if (loading) return []
    let words = [...WORDS]
    if (tierFilter) words = words.filter(w => w.tier === tierFilter)
    if (bookmarksOnly) words = words.filter(w => getCard(w.word).bookmarked)
    if (strugglingOnly) words = words.filter(w => {
      const c = getCard(w.word)
      return c.ease < 2.5 || c.status === 'learning'
    })
    if (shuffleOn) words = shuffleArray(words)
    return words
  }, [loading, tierFilter, bookmarksOnly, shuffleOn, strugglingOnly, seedKey])

  const card  = deck[idx] ?? null
  const state = card ? getCard(card.word) : null
  const pct   = Math.round((counts.mastered / WORDS.length) * 100)

  const fetchImg = useCallback(async (w: Word) => {
    const s = getCard(w.word)
    if (s.img_url) { setImgSrc(s.img_url); return }
    setImgLoading(true)
    try {
      const res  = await fetch(`/api/unsplash?query=${encodeURIComponent(w.query)}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (data.url) {
        setImgSrc(data.url)
        setCredit(data.credit ?? null)
        setImgUrl(w.word, data.url) // fire-and-forget, no await needed
      }
    } catch {
      // silently fail — card still usable without image
    } finally {
      // Bug fix 2: always reset loading, even on error
      setImgLoading(false)
    }
  }, [getCard, setImgUrl])

  // Bug fix 3: clamp idx when deck shrinks (e.g. after bookmark removal)
  const safeIdx = Math.min(idx, Math.max(0, deck.length - 1))

  function navigate(dir: 1 | -1) {
    const next = safeIdx + dir
    if (next < 0 || next >= deck.length) { router.push('/'); return }
    setAnim(dir > 0 ? 'entering' : 'entering-back')
    setIdx(next)
    setScreen('front')
    setImgSrc(null)
    setCredit(null)
  }

  function reveal() {
    setScreen('back')
    if (card) fetchImg(card)
  }

  async function rate(r: Rating) {
    if (!card) return
    await updateCard(card.word, r, imgSrc)
    // Bug fix 4: advance after updateCard resolves so SM-2 state is saved
    const next = safeIdx + 1
    if (next >= deck.length) { router.push('/'); return }
    setAnim('entering')
    setIdx(next)
    setScreen('front')
    setImgSrc(null)
    setCredit(null)
  }

  function handleToggleShuffle() {
    setShuffleOn(prev => {
      if (!prev) setSeedKey(k => k + 1)
      return !prev
    })
    setIdx(0); setScreen('front'); setImgSrc(null); setCredit(null)
  }

  function handleToggleStruggling() {
    setStrugglingOnly(prev => !prev)
    setIdx(0); setScreen('front'); setImgSrc(null); setCredit(null)
  }

  // Loading state
  if (loading) return (
    <div className="app"><div className="loading-screen"><div className="spinner"/></div></div>
  )

  // Empty deck
  if (deck.length === 0) return (
    <div className="app">
      <div className="empty-state">
        <div className="empty-icon">{bookmarksOnly ? '🔖' : '✓'}</div>
        <h2>{bookmarksOnly ? 'No bookmarks yet' : 'All done!'}</h2>
        <p>{bookmarksOnly
          ? 'Bookmark cards while studying to review them here.'
          : 'Come back tomorrow for your next session.'
        }</p>
        <button className="reveal-btn" onClick={() => router.push('/')}>Back to dashboard</button>
      </div>
    </div>
  )

  // Bug fix 5: use safeIdx for rendering so stale idx never causes undefined card
  const activeCard  = deck[safeIdx]
  const activeState = getCard(activeCard.word)
  const badgeClass  = activeState.status === 'new' ? 'badge-new'
    : activeState.status === 'mastered' ? 'badge-mastered' : 'badge-learning'

  if (screen === 'front') return (
    <div className="app">
      <div className={`front-screen ${anim}`}>
        <div className="top-bar">
          <button className="top-back-btn" onClick={() => router.push('/')}>‹ Home</button>
          <span className="deck-label">
            {bookmarksOnly ? '🔖 Bookmarks' : tierFilter ? `Tier ${tierFilter}` : 'All words'}
          </span>
          <div className="streak-pill">🔥 streak</div>
        </div>
        <div className="toggle-bar">
          <button className={`toggle-btn ${shuffleOn ? 'toggle-active' : ''}`} onClick={handleToggleShuffle}>
            Shuffle {shuffleOn ? 'on' : 'off'}
          </button>
          <button className={`toggle-btn ${strugglingOnly ? 'toggle-active' : ''}`} onClick={handleToggleStruggling}>
            Struggling only
          </button>
        </div>
        <div className="stats-row">
          <div className="stat-chip"><div className="stat-num new">{counts.new}</div><div className="stat-lbl">New</div></div>
          <div className="stat-chip"><div className="stat-num learning">{counts.learning}</div><div className="stat-lbl">Learning</div></div>
          <div className="stat-chip"><div className="stat-num mastered">{counts.mastered}</div><div className="stat-lbl">Mastered</div></div>
        </div>
        <div className="progress-wrap"><div className="progress-fill" style={{ width:`${pct}%` }}/></div>
        <div className="front-card" onClick={reveal}>
          <span className="card-counter">{safeIdx + 1} / {deck.length}</span>
          <span className={`status-badge ${badgeClass}`}>{activeState.status}</span>
          <div className="front-word">{activeCard.word}</div>
          <div className="front-pos">{activeCard.pos}</div>
          <div className="tap-hint">tap to reveal</div>
        </div>
        <button className="reveal-btn" onClick={reveal}>Reveal definition</button>
      </div>
    </div>
  )

  return (
    <div className="app">
      <div className="back-screen entering">
        <div className="img-area">
          {imgLoading && (
            <div className="img-loader"><div className="spinner"/><span>fetching photo…</span></div>
          )}
          {imgSrc && (
            <>
              <img
                src={imgSrc}
                alt={activeCard.word}
                className="card-photo"
                onLoad={e => (e.target as HTMLImageElement).classList.add('loaded')}
              />
              {credit && <div className="photo-credit">📷 {credit}</div>}
              {activeState.img_url && <div className="cached-badge">cached</div>}
            </>
          )}
        </div>
        <div className="back-card">
          <div className="pos-tag">{activeCard.pos}</div>
          <div className="back-word">{activeCard.word}</div>
          <div className="definition">{activeCard.def}</div>
          <div className="example" dangerouslySetInnerHTML={{ __html:
            // Bug fix 6: escape the word before using in RegExp to avoid
            // crash on words with special regex chars (e.g. "Caprize")
            activeCard.example.replace(
              new RegExp(`\\b${activeCard.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
              m => `<b>${m}</b>`
            )
          }}/>
        </div>
        <div className="rating-row">
          <button className="r-btn r-again" onClick={() => rate(0)}>
            <div className="r-label">Again</div><div className="r-sub">forgot</div>
          </button>
          <button className="r-btn r-hard" onClick={() => rate(1)}>
            <div className="r-label">Hard</div><div className="r-sub">struggled</div>
          </button>
          <button className="r-btn r-good" onClick={() => rate(2)}>
            <div className="r-label">Good</div><div className="r-sub">knew it</div>
          </button>
        </div>
        <div className="back-nav">
          <button className="nav-circle nav-light" onClick={() => navigate(-1)}>‹</button>
          <div className="center-btns">
            <button
              className={`icon-btn ${activeState.bookmarked ? 'bookmarked' : ''}`}
              onClick={() => toggleBookmark(activeCard.word)}
            >
              {activeState.bookmarked ? '🔖' : '🏷'}
            </button>
          </div>
          <button className="nav-circle" onClick={() => navigate(1)}>›</button>
        </div>
      </div>
    </div>
  )
}
