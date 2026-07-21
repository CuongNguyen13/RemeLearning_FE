// Quint ease-out (cubic-bezier(0.22, 1, 0.36, 1)): fast start, gentle settle.
// The one easing curve shared across the practice flow, dictation runner, and card
// reveals — no bounce/elastic per the design system's motion rules. Defined once
// here instead of redeclared in every motion-using component so the curve stays
// consistent if it ever needs tuning. `motion`'s transition/easing accepts a
// [number, number, number, number] cubic-bezier tuple at runtime.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

// Duration (in seconds) the correct/incorrect confirmation holds before advancing
// to the next practice card — long enough to register, short enough not to stall.
export const FEEDBACK_PAUSE_S = 0.55
