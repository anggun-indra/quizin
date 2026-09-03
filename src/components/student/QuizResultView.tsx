import React, { useState } from 'react';
import { Quiz, QuizSubmission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Trophy, 
  Award, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  ArrowLeft, 
  BookOpen, 
  RotateCcw,
  Sparkles,
  Users
} from 'lucide-react';
import { Button, Tag } from 'antd';

interface QuizResultViewProps {
  quiz: Quiz;
  onBackToDashboard: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({ quiz, onBackToDashboard }) => {
  const { user } = useAuth();
  const { activeSubmission } = useQuiz();

  const [activeTab, setActiveTab] = useState<'review' | 'leaderboard'>('review');

  if (!user) return null;

  // Find participant info
  const myParticipant = quiz.participants.find((p) => p.uid === user.uid);
  const percentage = myParticipant?.percentage ?? activeSubmission?.percentage ?? 0;
  const isPassed = percentage >= quiz.settings.passingScore;

  // Format time spent
  const formatTime = (secs?: number) => {
    if (!secs) return '-';
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  // Sort participants for leaderboard
  const sortedParticipants = [...quiz.participants]
    .filter((p) => p.status === 'SUBMITTED')
    .sort((a, b) => {
      const scoreDiff = (b.score || 0) - (a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.timeSpentSeconds || 0) - (b.timeSpentSeconds || 0);
    });

  const myRank = sortedParticipants.findIndex((p) => p.uid === user.uid) + 1;
  const submission = activeSubmission;

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 py-2 sm:py-6">
      {/* Top Main Result Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6 text-center">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <Button
            size="middle"
            onClick={onBackToDashboard}
            className="rounded-xl font-bold text-xs flex items-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Ke Beranda</span>
          </Button>

          <Tag color="purple" className="font-bold text-[10px] m-0">
            {quiz.code}
          </Tag>
        </div>

        {/* Score & Badge */}
        <div className="space-y-2">
          <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
            {isPassed ? (
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
            ) : (
              <Award className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {quiz.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500">
            Hasil Pengerjaan Anda Telah Berhasil Dikumpulkan
          </p>
        </div>

        {/* Big Score Box */}
        <div className="max-w-xs sm:max-w-sm mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Skor Akhir
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-indigo-600">
            {percentage}
            <span className="text-xl sm:text-2xl text-slate-400 font-sans font-bold"> / 100</span>
          </div>

          <div>
            {isPassed ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                LULUS (Target: {quiz.settings.passingScore})
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-xs">
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                BELUM LULUS (Target: {quiz.settings.passingScore})
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Peringkat</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {myRank > 0 ? `#${myRank}` : '-'}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Waktu Pengerjaan</div>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {formatTime(myParticipant?.timeSpentSeconds)}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Jawaban Benar</div>
            <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">
              {myParticipant?.totalCorrect ?? submission?.totalCorrect ?? 0}
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Jawaban Salah</div>
            <div className="text-base sm:text-lg font-black text-red-500 mt-0.5">
              {myParticipant?.totalIncorrect ?? submission?.totalIncorrect ?? 0}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
          {quiz.settings.showAnswerDiscussion && (
            <Button
              type={activeTab === 'review' ? 'primary' : 'default'}
              size="middle"
              onClick={() => setActiveTab('review')}
              className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 ${
                activeTab === 'review' ? 'bg-indigo-600' : ''
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Pembahasan & Kunci Jawaban</span>
            </Button>
          )}

          <Button
            type={activeTab === 'leaderboard' ? 'primary' : 'default'}
            size="middle"
            onClick={() => setActiveTab('leaderboard')}
            className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 ${
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Review & Pembahasan Soal
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Total {quiz.questions.length} Butir Soal
            </span>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {quiz.questions.map((q, idx) => {
              const res = submission?.questionResults[q.id];
              const isCorrect = res?.isCorrect;
              const userAnswers = res?.userAnswers || [];

              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : userAnswers.length === 0
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-800 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {q.text}
                      </span>
                    </div>

                    <Tag color={isCorrect ? 'success' : 'error'} className="font-bold text-[10px] sm:text-xs flex-shrink-0 m-0">
                      {isCorrect ? `+${res?.earnedPoints ?? q.points} Poin` : '0 Poin'}
                    </Tag>
                  </div>

                  {/* Options List with Visual Feedback */}
                  {q.type !== 'SHORT_ANSWER' ? (
                    <div className="space-y-1.5 pl-0 sm:pl-8">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = userAnswers.includes(opt.id);
                        const isKey = q.correctAnswers.includes(opt.id);
                        const letter = String.fromCharCode(65 + optIdx);

                        let optClass = 'border-slate-200 bg-white text-slate-700';
                        if (isKey) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isChosen && !isKey) {
                          optClass = 'border-red-400 bg-red-50 text-red-900 line-through';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-center justify-between space-x-2 ${optClass}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-md font-mono font-bold flex items-center justify-center bg-slate-100 text-slate-600 text-[11px] flex-shrink-0">
                                {letter}
                              </span>
                              <span className="leading-snug">{opt.text}</span>
                            </div>

                            <div className="flex items-center space-x-1 flex-shrink-0">
                              {isChosen && (
                                <Tag color="blue" className="text-[9px] font-bold m-0">
                                  Pilihan Anda
                                </Tag>
                              )}
                              {isKey && (
                                <Tag color="green" className="text-[9px] font-bold m-0">
                                  Kunci Benar
                                </Tag>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Short Answer feedback */
                    <div className="pl-0 sm:pl-8 space-y-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-slate-400 font-bold mr-2">Jawaban Anda:</span>
                        <strong className="font-mono text-slate-800">
                          {userAnswers[0] || '(Kosong)'}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                        <span className="text-emerald-700 font-bold mr-2">Kunci Benar:</span>
                        <strong className="font-mono">{q.correctAnswers.join(' / ')}</strong>
                      </div>
                    </div>
                  )}

                  {/* Explanation Note */}
                  {q.explanation && (
                    <div className="mt-3 ml-0 sm:ml-8 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start space-x-2">
                      <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-indigo-900 block mb-0.5">Pembahasan:</strong>
                        {q.explanation}
                      </div>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Papan Peringkat Realtime
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {sortedParticipants.length} Peserta Telah Submit
            </span>
          </div>

          <div className="space-y-2">
            {sortedParticipants.map((p, idx) => {
              const rank = idx + 1;
              const isMe = p.uid === user.uid;

              return (
                <div
                  key={p.uid}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border flex items-center justify-between space-x-3 transition-all ${
                    isMe
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold shadow-sm'
                      : rank === 1
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 ${
                        rank === 1
                          ? 'bg-amber-400 text-amber-950 shadow-sm'
                          : rank === 2
                          ? 'bg-slate-300 text-slate-800'
                          : rank === 3
                          ? 'bg-amber-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {rank}
                    </span>

                    <img
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                      alt=""
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white flex-shrink-0"
                    />

                    <div className="overflow-hidden">
                      <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                        {p.fullName} {isMe && '(Anda)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {p.identifier}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm sm:text-base font-mono font-black text-indigo-700">
                      {p.score ?? 0} Poin
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatTime(p.timeSpentSeconds)}
                    </div>
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
