const baseUrl =
  import.meta.env.VITE_API_BASE_URL || "https://backend.mslelearning.com";

const bucketUrl =
  import.meta.env.VITE_BUCKET_URL || "https://mslbucketmain.s3.amazonaws.com";

const cdnUrl = import.meta.env.VITE_CDN_URL || bucketUrl;

const v2 = `${baseUrl}/v2`;

const CACHEABLE_IMAGE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

/** Local disk cache for raster images. PDFs, video, and audio stay on the network. */
export function cachedImageSrc(remoteUrl) {
  if (!remoteUrl) return "";
  const remote = String(remoteUrl);
  let pathname = remote.split("?")[0].split("#")[0];
  try {
    pathname = new URL(remote).pathname;
  } catch {
    // Relative keys are resolved by mediaUrl before this runs.
  }
  const cacheable = CACHEABLE_IMAGE.test(pathname);
  if (
    cacheable &&
    typeof window !== "undefined" &&
    window.electronAPI?.cachedImageUrl
  ) {
    return window.electronAPI.cachedImageUrl(remote);
  }
  return remote;
}

/** Strip legacy public/res prefix and build a media URL. */
export function mediaUrl(path) {
  if (!path) return "";
  const raw = String(path);
  if (/^https?:\/\//i.test(raw)) return cachedImageSrc(raw);
  const key = raw.replace(/^\/?public\/res\//, "").replace(/^\/+/, "");
  const base = cdnUrl.endsWith("/") ? cdnUrl.slice(0, -1) : cdnUrl;
  return cachedImageSrc(`${base}/${key}`);
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
  geminiVoices: `${v2}/gemini-ai/voices`,
  geminiGenerationStatus: `${v2}/gemini-ai/generation-status`,
  geminiSummarize: `${v2}/gemini-ai/summarize`,
  geminiGenerateFlashcards: `${v2}/gemini-ai/generate-flashcards`,
  geminiGenerateQuiz: `${v2}/gemini-ai/generate-quiz`,

  // AI subscription (no payment flows on desktop)
  subscriptionPlan: `${v2}/subscription/plan`,
  subscriptionStatus: `${v2}/subscription/status`,
  subscriptionResources: `${v2}/subscription/resources`,
  subscriptionCancel: `${v2}/subscription/cancel`,

  subscriptionAiHistory: `${v2}/subscription-ai/history`,
  subscriptionAiRecentActivity: `${v2}/subscription-ai/recent-activity`,
  subscriptionAiContextStream: `${v2}/subscription-ai/query-general-context-stream`,
  subscriptionAiContextAudioStream: `${v2}/subscription-ai/query-general-context-audio-text-stream`,
  subscriptionAiQueryImage: `${v2}/subscription-ai/query-image`,
  subscriptionAiVoiceToText: `${v2}/subscription-ai/voice-to-text`,
  subscriptionAiVoices: `${v2}/subscription-ai/voices`,
  subscriptionAiGenerationStatus: `${v2}/subscription-ai/generation-status`,
  subscriptionAiSummarize: `${v2}/subscription-ai/summarize`,
  subscriptionAiGenerateFlashcards: `${v2}/subscription-ai/generate-flashcards`,
  subscriptionAiGenerateQuiz: `${v2}/subscription-ai/generate-quiz`,

  // Past questions
  pastQuestionsTree: `${v2}/past-questions`,
  pastQuestionPaper: `${v2}/past-questions`,
  pastQuestionChat: `${v2}/past-questions/chat`,
  pastQuestionChatAudioStream: `${v2}/past-questions/chat-audio-stream`,
  pastQuestionAiQuota: `${v2}/past-questions/ai-quota`,
  pastQuestionHistory: `${v2}/past-questions/history`,
};

export default apiEndpoints;
