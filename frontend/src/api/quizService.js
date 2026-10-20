import apiClient from "./client";

export async function generateQuiz(topic) {
  const response = await apiClient.post("/quiz", { topic });
  return response.data.quiz;
}
