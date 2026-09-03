export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  identifier?: string; // Nomor Identitas / ID Peserta / NIM
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  imageUrl?: string;
  type: QuestionType;
  options: QuestionOption[];
  correctAnswers: string[]; // List of option IDs or text answers
  points: number;
  explanation?: string;
}

export interface QuizSettings {
  durationMinutes: number; // 0 = tanpa batas waktu
  timePerQuestionSeconds?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showLiveScore: boolean;
  showAnswerDiscussion: boolean;
  passingScore: number; // Target Skor Minimum, e.g. 70
}

export type QuizStatus = 'DRAFT' | 'WAITING' | 'ACTIVE' | 'ENDED';

export type ParticipantStatus = 'JOINED' | 'IN_PROGRESS' | 'SUBMITTED';

export interface QuizParticipant {
  uid: string;
  identifier: string; // ID Peserta / NIM
  fullName: string;
  email: string;
  avatarUrl?: string;
  joinedAt: string;
  status: ParticipantStatus;
  startedAt?: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  totalCorrect?: number;
  totalIncorrect?: number;
  totalUnanswered?: number;
  timeSpentSeconds?: number;
}

export interface Quiz {
  id: string;
  code: string; // e.g. "QZ-8821" or "TEST-01"
  title: string;
  description?: string;
  subject?: string; // Topik / Kategori Kuis
  creatorUid: string;
  creatorEmail: string;
  creatorName: string;
  status: QuizStatus;
  settings: QuizSettings;
  questions: Question[];
  participants: QuizParticipant[];
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
  isFlagged?: boolean; // Ragu-ragu
}

export interface QuestionGradingResult {
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  userAnswers: string[];
  correctAnswers: string[];
  explanation?: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  participantUid: string;
  participantName: string;
  participantIdentifier: string;
  participantEmail: string;
  answers: Record<string, ParticipantAnswer>;
  questionResults: Record<string, QuestionGradingResult>;
  score: number;
  maxScore: number;
  percentage: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  startedAt: string;
  submittedAt: string;
  timeSpentSeconds: number;
}
