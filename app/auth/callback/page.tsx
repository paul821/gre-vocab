'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase }  from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // Handle the hash fragment from magic link / OAuth redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/')
        return
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh' }}>
      <div className="spinner"/>
    </div>
  )
}
