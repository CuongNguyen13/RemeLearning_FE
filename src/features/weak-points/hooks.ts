import { useQuery } from "@tanstack/react-query"
import { getLearnerWeakPoints } from "@/api/learners"

export function useLearnerWeakPoints(userId: string) {
  return useQuery({
    queryKey: ["learner", userId, "weak-points"],
    queryFn: () => getLearnerWeakPoints(userId),
    enabled: !!userId,
  })
}
