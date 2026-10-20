import apiClient from "./client";

export async function generateStudyPlan(subject, examDate, hoursPerDay) {
  const response = await apiClient.post("/study-plan", {
    subject,
    examDate,
    hoursPerDay,
  });
  return response.data.plan;
}
