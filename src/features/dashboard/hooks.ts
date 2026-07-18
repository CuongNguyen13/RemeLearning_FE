import { useQuery } from "@tanstack/react-query"
import { getLearnerOverview } from "@/api/learners"

export function learnerOverviewKey(userId: string) {
  return ["learner", userId, "overview"] as const
}

export function useLearnerOverview(userId: string) {
  return useQuery({
    queryKey: learnerOverviewKey(userId),
    queryFn: () => getLearnerOverview(userId),
    enabled: !!userId,
  })
}
