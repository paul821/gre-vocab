import { cookies }           from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Dashboard  from '@/components/Dashboard'
import AuthScreen from '@/components/AuthScreen'

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return <AuthScreen />
  return <Dashboard userEmail={session.user.email} />
}
