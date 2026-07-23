import { useSearchParams } from "react-router-dom"

export interface FocusItem {
  focusItemId?: string
  focusLabel?: string
}

/** Reads the optional `focusItemId`/`focusLabel` query params a recommendation deep-link
 * carries (see RecommendationCard's "Practice now" button) so a skill's practice page can
 * highlight/prioritize the specific item the learner arrived to work on. Both are
 * undefined when the page is opened without a focus target (e.g. from the sidebar). */
export function useFocusItem(): FocusItem {
  const [searchParams] = useSearchParams()
  const focusItemId = searchParams.get("focusItemId") ?? undefined
  const focusLabel = searchParams.get("focusLabel") ?? undefined
  return { focusItemId, focusLabel }
}
