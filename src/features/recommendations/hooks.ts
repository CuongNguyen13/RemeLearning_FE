import { useQuery } from "@tanstack/react-query"
import { getLearnerRecommendations } from "@/api/learners"

export function useLearnerRecommendations(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "recommendations"],
    queryFn: () => getLearnerRecommendations(userId),
    enabled: !!userId,
  })
}
