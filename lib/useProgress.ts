'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, WordProgress }           from './supabase'
import { CardState, defaultState, sm2, Rating } from './sm2'
import { WORDS } from '@/data/words'

const LS_KEY = 'gre_progress_v1'

type ProgressEntry = CardState & { img_url: string | null; bookmarked: boolean }

function loadLocal(): Record<string, ProgressEntry> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveLocal(data: Record<string, ProgressEntry>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

async function fetchFromSupabase(userId: string): Promise<Record<string, ProgressEntry> | null> {
  const { data, error } = await supabase
    .from('word_progress')
    .select('*')
    .eq('user_id', userId)
  if (error || !data) return null
  const map: Record<string, ProgressEntry> = {}
  data.forEach((row: WordProgress) => {
    map[row.word] = {
      status:     row.status,
      interval:   row.interval,
      ease:       row.ease,
      due:        row.due,
      img_url:    row.img_url,
      bookmarked: row.bookmarked,
    }
  })
  return map
}

export function useProgress() {
  const [userId,   setUserId]   = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, ProgressEntry>>({})
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrate(uid: string | null) {
      if (uid) {
        const data = await fetchFromSupabase(uid)
        if (!cancelled) setProgress(data ?? loadLocal())
      } else {
        if (!cancelled) setProgress(loadLocal())
      }
      if (!cancelled) setLoading(false)
    }

    // Initial hydration
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      hydrate(uid)
    })

    // Auth state changes (sign in / sign out)
    // Bug fix: init was previously called inside onAuthStateChange but was
    // defined in a parent closure — would throw ReferenceError. Now using
    // the extracted hydrate() function which is in scope.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      setLoading(true)
      hydrate(uid)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const getCard = useCallback((word: string): ProgressEntry => {
    return progress[word] ?? { ...defaultState(), img_url: null, bookmarked: false }
  }, [progress])

  const updateCard = useCallback(async (
    word: string,
    rating: Rating,
    imgUrl?: string | null
  ) => {
    const current = getCard(word)
    const next    = sm2(current, rating)
    const img_url = imgUrl !== undefined ? imgUrl : current.img_url
    const updated: ProgressEntry = { ...next, img_url, bookmarked: current.bookmarked }

    setProgress(prev => {
      const n = { ...prev, [word]: updated }
      if (!userId) saveLocal(n)
      return n
    })

    if (userId) {
      await supabase.from('word_progress').upsert(
        {
          user_id:    userId,
          word,
          status:     updated.status,
          interval:   updated.interval,
          ease:       updated.ease,
          due:        updated.due,
          img_url:    updated.img_url,
          bookmarked: updated.bookmarked,
        },
        { onConflict: 'user_id,word' }
      )
    }
  }, [userId, getCard])

  const setImgUrl = useCallback(async (word: string, img_url: string) => {
    setProgress(prev => {
      const existing = prev[word] ?? { ...defaultState(), bookmarked: false }
      const n = { ...prev, [word]: { ...existing, img_url } }
      if (!userId) saveLocal(n)
      return n
    })
    if (userId) {
      await supabase.from('word_progress').upsert(
        { user_id: userId, word, img_url },
        { onConflict: 'user_id,word' }
      )
    }
  }, [userId])

  const toggleBookmark = useCallback(async (word: string) => {
    const current    = getCard(word)
    const bookmarked = !current.bookmarked
    const updated: ProgressEntry = { ...current, bookmarked }

    setProgress(prev => {
      const n = { ...prev, [word]: updated }
      if (!userId) saveLocal(n)
      return n
    })

    if (userId) {
      await supabase.from('word_progress').upsert(
        { user_id: userId, word, bookmarked },
        { onConflict: 'user_id,word' }
      )
    }
  }, [userId, getCard])

  const counts = {
    new:      WORDS.filter(w => (progress[w.word]?.status ?? 'new') === 'new').length,
    learning: WORDS.filter(w => progress[w.word]?.status === 'learning').length,
    mastered: WORDS.filter(w => progress[w.word]?.status === 'mastered').length,
  }

  return { progress, loading, userId, getCard, updateCard, setImgUrl, toggleBookmark, counts }
}
