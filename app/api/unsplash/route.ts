import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  if (!query) return NextResponse.json({ error: 'missing query' }, { status: 400 })
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key)  return NextResponse.json({ error: 'no key' }, { status: 500 })
  try {
    const res  = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${key}`, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`Unsplash ${res.status}`)
    const data = await res.json()
    return NextResponse.json({ url: data.urls.regular, credit: data.user?.name ?? null, link: data.links?.html ?? null })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
