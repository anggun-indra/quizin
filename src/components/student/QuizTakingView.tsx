import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Quiz, Question, ParticipantAnswer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { QuestionNavGrid } from '@/components/student/QuestionNavGrid';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  HelpCircle,
  Hash
} from 'lucide-react';
import { Button, Input, Modal, Tag, message } from 'antd';

interface QuizTakingViewProps {
  quiz: Quiz;
  onFinished: () => void;
}

export const QuizTakingView: React.FC<QuizTakingViewProps> = ({ quiz, onFinished }) => {
  const { user } = useAuth();
  const { submitQuizAnswers } = useQuiz();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Local storage key for saving answers continuously
  const storageKey = `quizin_ans_${quiz.id}_${user?.uid}`;

  const [answers, setAnswers] = useState<Record<string, ParticipantAnswer>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Timer state
  const totalDurationSeconds = (quiz.settings.durationMinutes || 0) * 60;
  const timerStorageKey = `quizin_timer_start_${quiz.id}_${user?.uid}`;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (totalDurationSeconds === 0) return 999999; // Unlimited
    const savedStart = localStorage.getItem(timerStorageKey);
    if (savedStart) {
      const startTime = parseInt(savedStart, 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, totalDurationSeconds - elapsed);
    } else {
      localStorage.setItem(timerStorageKey, Date.now().toString());
      return totalDurationSeconds;
    }
  });

  // Elapsed time counter
  const timeSpentRef = useRef<number>(0);

  // Save answers to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  // Countdown timer effect
  useEffect(() => {
    if (totalDurationSeconds === 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        timeSpentRef.current += 1;
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDurationSeconds]);

  // Auto-submit when time expires
  const handleAutoSubmit = async () => {
    if (!user) return;
    message.warning('Waktu pengerjaan habis! Kuis otomatis dikumpulkan.');
    await doSubmit();
  };

  // Perform submission
  const doSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const timeSpent = totalDurationSeconds > 0
        ? Math.max(1, totalDurationSeconds - secondsRemaining)
        : timeSpentRef.current || 60;

      const res = await submitQuizAnswers(quiz.id, user, answers, timeSpent);
      if (res.success) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(timerStorageKey);
        setIsSubmitModalOpen(false);
        onFinished();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const questions = quiz.questions || [];
  const currentQuestion: Question | undefined = questions[currentIndex];

  // Option selection logic
  const handleSelectOption = (optId: string) => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.id] || {
      questionId: currentQuestion.id,
      selectedOptionIds: [],
    };

    let nextSelected: string[] = [];
    if (currentQuestion.type === 'MULTIPLE_CHOICE') {
      const isAlready = currentAns.selectedOptionIds.includes(optId);
      nextSelected = isAlready
        ? currentAns.selectedOptionIds.filter((id) => id !== optId)
        : [...currentAns.selectedOptionIds, optId];
    } else {
      // SINGLE_CHOICE or TRUE_FALSE
      nextSelected = [optId];
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAns,
        selectedOptionIds: nextSelected,
      },
    }));
  };

  // Text answer change
  const handleTextAnswerChange = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        selectedOptionIds: [],
        textAnswer: val,
        isFlagged: prev[currentQuestion.id]?.isFlagged || false,
      },
    }));
  };

  // Toggle flag (ragu-ragu)
  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    const currentAns = answers[currentQuestion.id] || {
      questionId: currentQuestion.id,
      selectedOptionIds: [],
    };
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...currentAns,
        isFlagged: !currentAns.isFlagged,
      },
    }));
  };

  // Format timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimeLow = totalDurationSeconds > 0 && secondsRemaining < 120; // less than 2 mins
  const isCurrentFlagged = currentQuestion ? answers[currentQuestion.id]?.isFlagged : false;
  const currentSelectedOptions = currentQuestion
    ? answers[currentQuestion.id]?.selectedOptionIds || []
    : [];
  const currentTextAnswer = currentQuestion
    ? answers[currentQuestion.id]?.textAnswer || ''
    : '';

  // Summary counts for submit modal
  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const a = answers[q.id];
      return (
        (a?.selectedOptionIds && a.selectedOptionIds.length > 0) ||
        (a?.textAnswer && a.textAnswer.trim().length > 0)
      );
    }).length;
  }, [questions, answers]);

  const flaggedCount = useMemo(() => {
    return questions.filter((q) => answers[q.id]?.isFlagged).length;
  }, [questions, answers]);

  const unansweredCount = questions.length - answeredCount;

  if (!currentQuestion) {
    return (
      <div className="text-center py-16 text-slate-500 text-xs">
        Tidak ada soal yang tersedia pada kuis ini.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-3 sm:py-6">
      {/* Top Floating Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-3 sticky top-16 z-10 backdrop-blur-md bg-white/95">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
            {currentIndex + 1}
          </span>
          <div className="overflow-hidden">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              {quiz.title}
            </h2>
            <div className="text-[11px] text-slate-400">
              Soal {currentIndex + 1} dari {questions.length} • {currentQuestion.points} Poin
            </div>
          </div>
        </div>

        {/* Timer & Submit Button */}
        <div className="flex items-center space-x-3">
          {totalDurationSeconds > 0 && (
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono font-black text-xs sm:text-sm transition-all ${
                isTimeLow
                  ? 'bg-red-50 border-red-300 text-red-600 timer-warning'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeLow ? 'animate-spin' : 'text-indigo-600'}`} />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          )}

          <Button
            type="primary"
            size="middle"
            onClick={() => setIsSubmitModalOpen(true)}
            className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center space-x-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kumpulkan Kuis</span>
            <span className="sm:hidden">Selesai</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Question Area (8 cols) + Nav Grid (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Question Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Question Header & Type Tag */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Tag color="purple" className="font-bold text-[10px]">
                  {currentQuestion.type === 'SINGLE_CHOICE' && 'PILIHAN GANDA'}
                  {currentQuestion.type === 'MULTIPLE_CHOICE' && 'PILIHAN KOMPLEKS (BISA LEBIH DARI 1)'}
                  {currentQuestion.type === 'TRUE_FALSE' && 'BENAR / SALAH'}
                  {currentQuestion.type === 'SHORT_ANSWER' && 'ISIAN SINGKAT'}
                </Tag>
                <span className="text-xs font-bold text-slate-400">
                  {currentQuestion.points} Poin
                </span>
              </div>

              {/* Ragu-ragu toggle */}
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                  isCurrentFlagged
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isCurrentFlagged ? 'Ragu-ragu (Ditandai)' : 'Tandai Ragu-ragu'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
              {currentQuestion.text}
            </div>

            {/* Options List */}
            {currentQuestion.type !== 'SHORT_ANSWER' ? (
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = currentSelectedOptions.includes(opt.id);
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center space-x-3.5 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-colors flex-shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {letter}
                      </div>

                      <span className="text-xs sm:text-sm font-medium text-slate-800 flex-1 select-none">
                        {opt.text}
                      </span>

                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Short Answer input */
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Tuliskan Jawaban Anda:
                </label>
                <Input
                  size="large"
                  value={currentTextAnswer}
                  onChange={(e) => handleTextAnswerChange(e.target.value)}
                  placeholder="Ketik jawaban singkat di sini..."
                  className="rounded-2xl font-mono text-sm p-3.5 border-2 border-slate-200 focus:border-indigo-600"
                />
              </div>
            )}

            {/* Bottom Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <Button
                size="large"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="rounded-xl font-bold text-xs flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesai & Kumpulkan</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Grid (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <QuestionNavGrid
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelectIndex={setCurrentIndex}
          />
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      <Modal
        open={isSubmitModalOpen}
        footer={null}
        onCancel={() => setIsSubmitModalOpen(false)}
        centered
        width={460}
        className="confirm-submit-modal"
      >
        <div className="pt-2 pb-1 space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Kumpulkan Jawaban Kuis?
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Pastikan semua jawaban sudah Anda tinjau sebelum mengumpulkan nilai.
            </p>
          </div>

          {/* Quick Summary Box */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs">
            <div className="p-2 rounded-xl bg-white border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Terjawab</div>
              <div className="text-emerald-600 font-black text-base mt-0.5">
                {answeredCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Ragu-ragu</div>
              <div className="text-amber-500 font-black text-base mt-0.5">
                {flaggedCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-100">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Belum Diisi</div>
              <div className="text-red-500 font-black text-base mt-0.5">
                {unansweredCount}
              </div>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-amber-600 font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Masih ada {unansweredCount} soal yang belum Anda jawab!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              onClick={doSubmit}
              className="w-full h-12 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Ya, Kumpulkan Sekarang</span>
            </Button>
            <Button
              size="large"
              onClick={() => setIsSubmitModalOpen(false)}
              className="w-full h-11 rounded-xl font-bold text-xs border-slate-200 text-slate-600 hover:text-slate-900"
            >
              Lanjut Mengerjakan Soal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
