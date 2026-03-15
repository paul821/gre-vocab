import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnon)

export type WordProgress = {
  id?:         string
  user_id:     string
  word:        string
  status:      'new' | 'learning' | 'mastered'
  interval:    number
  ease:        number
  due:         number
  img_url:     string | null
  bookmarked:  boolean
  updated_at?: string
}
