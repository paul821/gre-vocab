import Flashcard from '@/components/Flashcard'

type Props = { searchParams: { mode?: string; tier?: string } }

export default function StudyPage({ searchParams }: Props) {
  return (
    <Flashcard
      bookmarksOnly={searchParams.mode === 'bookmarks'}
      tierFilter={searchParams.tier ? parseInt(searchParams.tier) : undefined}
    />
  )
}
