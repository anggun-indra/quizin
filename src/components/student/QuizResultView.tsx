import React, { useState, useEffect } from 'react';
import { Quiz, QuizSubmission, QuizParticipant } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  Trophy, 
  BookOpen, 
  ChevronRight, 
  ArrowLeft,
  Sparkles,
  Users
} from 'lucide-react';
import { Button, Tag, Tabs } from 'antd';
import confetti from 'canvas-confetti';

interface QuizResultViewProps {
  quiz: Quiz;
  onBackToDashboard: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({
  quiz,
  onBackToDashboard,
}) => {
  const { user } = useAuth();
  const { fetchSubmission } = useQuiz();
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'review' | 'leaderboard'>('summary');

  const myParticipantRecord: QuizParticipant | undefined = quiz.participants.find(
    (p) => p.uid === user?.uid
  );

  useEffect(() => {
    if (user) {
      fetchSubmission(quiz.id, user.uid).then((sub) => {
        if (sub) setSubmission(sub);
      });
    }
  }, [quiz.id, user]);

  const percentage = myParticipantRecord?.percentage ?? submission?.percentage ?? 0;
  const isPassed = percentage >= quiz.settings.passingScore;

  const totalCorrect = myParticipantRecord?.totalCorrect ?? submission?.totalCorrect ?? 0;
  const totalIncorrect = myParticipantRecord?.totalIncorrect ?? submission?.totalIncorrect ?? 0;
  const totalUnanswered = myParticipantRecord?.totalUnanswered ?? submission?.totalUnanswered ?? 0;
  const timeSpent = myParticipantRecord?.timeSpentSeconds ?? submission?.timeSpentSeconds ?? 0;

  // Sorted leaderboard
  const leaderboard = [...quiz.participants].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.timeSpentSeconds || 999999) - (b.timeSpentSeconds || 999999);
  });

  const myRank = leaderboard.findIndex((p) => p.uid === user?.uid) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-8">
      {/* Top Banner & Score */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-5">
        <div className="flex items-center justify-between">
          <Button
            size="middle"
            onClick={onBackToDashboard}
            className="rounded-xl font-bold text-xs"
          >
            ← Dashboard Kuis
          </Button>
          <Tag color="purple" className="font-bold text-xs">
            {quiz.code}
          </Tag>
        </div>

        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Hasil Pengerjaan Kuis: {quiz.title}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Selamat! Anda telah menyelesaikan kuis ini. Berikut adalah rincian nilai akhir Anda.
          </p>
        </div>

        {/* Big Score Display */}
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 max-w-sm mx-auto space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Nilai Akhir Anda
          </div>
          <div className="text-5xl font-black text-indigo-700 tracking-tight">
            {percentage}
            <span className="text-xl font-normal text-slate-400 ml-1">/ 100</span>
          </div>
          <div className="pt-1">
            <Tag
              color={isPassed ? 'green' : 'volcano'}
              className="text-xs font-black uppercase px-3 py-1 rounded-full"
            >
              {isPassed ? 'LULUS (MEMENUHI KKM)' : 'REMIDI (DI BAWAH KKM)'}
            </Tag>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            Standar KKM: {quiz.settings.passingScore} • Peringkat #{myRank || 1} dari {quiz.participants.length} Peserta
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Benar</div>
            <div className="text-emerald-600 font-black text-xl mt-0.5">
              {totalCorrect} Soal
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Salah</div>
            <div className="text-red-500 font-black text-xl mt-0.5">
              {totalIncorrect} Soal
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Dilewati</div>
            <div className="text-amber-500 font-black text-xl mt-0.5">
              {totalUnanswered} Soal
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Durasi</div>
            <div className="text-slate-700 font-black text-lg mt-0.5">
              {timeSpent ? `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s` : '-'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center space-x-2">
          {quiz.settings.showAnswerDiscussion && (
            <Button
              type={activeTab === 'review' ? 'primary' : 'default'}
              size="middle"
              onClick={() => setActiveTab('review')}
              className={`rounded-xl font-bold text-xs flex items-center space-x-1.5 ${
                activeTab === 'review' ? 'bg-indigo-600' : ''
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lihat Pembahasan & Kunci Jawaban</span>
            </Button>
          )}

          <Button
            type={activeTab === 'leaderboard' ? 'primary' : 'default'}
            size="middle"
            onClick={() => setActiveTab('leaderboard')}
            className={`rounded-xl font-bold text-xs flex items-center space-x-1.5 ${
              activeTab === 'leaderboard' ? 'bg-indigo-600' : ''
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Papan Skor (Leaderboard)</span>
          </Button>
        </div>
      </div>

      {/* Tab: Question Review & Discussion */}
      {activeTab === 'review' && quiz.settings.showAnswerDiscussion && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">
                Review & Pembahasan Soal
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Total {quiz.questions.length} Butir Soal
            </span>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, idx) => {
              const res = submission?.questionResults[q.id];
              const isCorrect = res?.isCorrect;
              const userAnswers = res?.userAnswers || [];

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : userAnswers.length === 0
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-900 leading-snug">
                        {q.text}
                      </span>
                    </div>

                    <Tag color={isCorrect ? 'success' : 'error'} className="font-bold text-xs flex-shrink-0">
                      {isCorrect ? `+${res?.earnedPoints ?? q.points} Poin (Benar)` : '0 Poin (Salah)'}
                    </Tag>
                  </div>

                  {/* Options */}
                  {q.type !== 'SHORT_ANSWER' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = userAnswers.includes(opt.id);
                        const isRight = q.correctAnswers.includes(opt.id);

                        let optClass = 'border-slate-200 bg-white text-slate-600';
                        if (isRight) {
                          optClass = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold';
                        } else if (isChosen && !isRight) {
                          optClass = 'border-red-300 bg-red-50 text-red-800 line-through';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs flex items-center space-x-2.5 ${optClass}`}
                          >
                            <span className="w-5 h-5 rounded bg-slate-100 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate flex-1">{opt.text}</span>
                            {isChosen && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                                Jawaban Anda
                              </span>
                            )}
                            {isRight && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs mt-2">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Jawaban Anda:
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {userAnswers[0] || '(Tidak dijawab)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <span className="text-emerald-700 text-[10px] uppercase font-bold block">
                          Kunci Jawaban:
                        </span>
                        <span className="font-mono font-bold">
                          {q.correctAnswers.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-100/80 text-xs text-slate-700 border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">
                        💡 Pembahasan:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-slate-900">
                Papan Peringkat Realtime
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {quiz.participants.length} Peserta Terdaftar
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaderboard.map((p, idx) => {
              const isMe = p.uid === user?.uid;
              const isDone = p.status === 'SUBMITTED';

              return (
                <div
                  key={p.uid}
                  className={`py-3 px-3 flex items-center justify-between rounded-xl transition-colors ${
                    isMe ? 'bg-indigo-50/70 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <img
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900">
                        {p.fullName} {isMe && <Tag color="blue" className="ml-1 text-[9px]">Anda</Tag>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.identifier}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {isDone ? (
                      <div>
                        <span className="font-black text-sm text-indigo-700">
                          {p.percentage ?? 0}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Mengerjakan...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
