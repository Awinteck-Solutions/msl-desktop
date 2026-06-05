const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://backend.mslelearning.com";

const bucketUrl =
  import.meta.env.VITE_BUCKET_URL || "https://mslbucketmain.s3.amazonaws.com";

const cdnUrl = import.meta.env.VITE_CDN_URL || bucketUrl;

const v2 = `${baseUrl}/v2`;

/** Strip legacy public/res prefix and build a media URL. */
export function mediaUrl(path) {
  if (!path) return "";
  const key = String(path).replace(/^\/?public\/res\//, "");
  const base = cdnUrl.endsWith("/") ? cdnUrl.slice(0, -1) : cdnUrl;
  return `${base}/${key}`;
}

const apiEndpoints = {
  baseUrl,
  bucketUrl,
  cdnUrl,
  v2Base: v2,

  // Windows (desktop QR)
  generateQRCode: `${v2}/windows/generate-code`,
  windowLogin: `${v2}/windows/login-with-code`,

  // User
  verify: `${v2}/user/verify/device`,
  refreshToken: `${v2}/user/refresh-token`,
  profile: `${v2}/user/profile`,
  uploadImage: `${v2}/user/upload_image`,
  notificationSettings: `${v2}/user/notification-settings`,

  // Courses
  courseList: `${v2}/course/?page=1&limit=10000`,
  userCourses: `${v2}/course/user-courses?page=1&limit=10000`,
  userCoursesWithQuizzes: `${v2}/course/user-with-quizzes`,
  singleCourse: `${v2}/course`,

  // Quiz
  quizByCourse: `${v2}/quiz/by-course`,
  quizSingle: `${v2}/quiz`,
  quizResponseAdd: `${v2}/quiz/quiz-response/add`,
  quizResponseUpdate: `${v2}/quiz/quiz-response/update`,
  quizResponseByQuizId: `${v2}/quiz/quiz-response/by-quiz-id`,

  // Flashcard
  flashcardUserCourses: `${v2}/flashcard/user-with-flashcards`,
  flashcardByCourse: `${v2}/flashcard/by-course`,
  flashcardSingle: `${v2}/flashcard`,

  // Gamification
  gamificationMe: `${v2}/gamification/me`,
  gamificationLeaderboard: `${v2}/gamification/leaderboard`,

  // Feedback
  sendFeedback: `${v2}/feedback/`,

  // Request
  sendRequest: `${v2}/request/add`,

  // System
  updateAvailable: `${v2}/system/update-available`,

  // Gemini AI
  geminiBase: `${v2}/gemini-ai`,
  geminiHistory: `${v2}/gemini-ai/history`,
  geminiRecentActivity: `${v2}/gemini-ai/recent-activity`,
  geminiSummaries: `${v2}/gemini-ai/summaries`,
  geminiFlashcardHistory: `${v2}/gemini-ai/flashcards`,
  geminiQuizHistory: `${v2}/gemini-ai/quizzes`,
  geminiContextStream: `${v2}/gemini-ai/query-general-context-stream`,
  geminiContextAudioStream: `${v2}/gemini-ai/query-general-context-audio-text-stream`,
  geminiQueryImage: `${v2}/gemini-ai/query-image`,
  geminiVoiceToText: `${v2}/gemini-ai/voice-to-text`,
  geminiSummarize: `${v2}/gemini-ai/summarize`,
  geminiGenerateFlashcards: `${v2}/gemini-ai/generate-flashcards`,
  geminiGenerateQuiz: `${v2}/gemini-ai/generate-quiz`,
};

export default apiEndpoints;
