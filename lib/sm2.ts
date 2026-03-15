export type Rating = 0 | 1 | 2

export type CardState = {
  status:   'new' | 'learning' | 'mastered'
  interval: number
  ease:     number
  due:      number
}

export function sm2(card: CardState, rating: Rating): CardState {
  let { ease, interval } = card
  if (rating === 0) { interval = 1 }
  else if (rating === 1) { interval = Math.max(1, Math.round(interval * 1.2)); ease = Math.max(1.3, ease - 0.15) }
  else { interval = rating === 2 ? Math.round(interval * ease) : Math.round(interval * ease * 1.3); ease = ease + 0.1 }
  const due    = Date.now() + interval * 86_400_000
  const status = rating === 0 ? 'learning' : interval >= 21 ? 'mastered' : 'learning'
  return { status, interval, ease, due }
}

export function defaultState(): CardState {
  return { status: 'new', interval: 1, ease: 2.5, due: 0 }
}
