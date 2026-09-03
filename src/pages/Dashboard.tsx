import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { QuizLiveMonitor } from '@/components/admin/QuizLiveMonitor';
import { QuizEditor } from '@/components/admin/QuizEditor';
import { QuizLeaderboard } from '@/components/admin/QuizLeaderboard';
import { QuizLobby } from '@/components/student/QuizLobby';
import { QuizTakingView } from '@/components/student/QuizTakingView';
import { QuizResultView } from '@/components/student/QuizResultView';
import { CreateQuizModal } from '@/components/modals/CreateQuizModal';
import { JoinQuizModal } from '@/components/modals/JoinQuizModal';
import { 
  Sparkles, 
  Plus, 
  LogIn, 
  BookOpen, 
  Clock, 
  Users, 
  Award, 
  Trash2, 
  ChevronRight, 
  HelpCircle,
  Share2,
  ChevronLeft
} from 'lucide-react';
import { Button, Tag, Popconfirm, message } from 'antd';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    quizzes, 
    activeQuiz, 
    selectQuiz, 
    joinQuizByCode, 
    deleteQuiz, 
    startQuizTaking 
  } = useQuiz();

  const [adminViewMode, setAdminViewMode] = useState<'monitor' | 'editor' | 'leaderboard'>('monitor');
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  // Check URL query parameters for auto join: ?code=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam && user) {
      joinQuizByCode(codeParam, user).then((res) => {
        if (res.success && res.quiz) {
          // Clear query param from address bar without reloading
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [user]);

  if (!user) return null;

  // Filter quizzes owned or joined by user
  const myQuizzes = quizzes.filter(
    (q) =>
      q.creatorUid === user.uid ||
      q.participants.some((p) => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase()))
  );

  // If in an active quiz
  if (activeQuiz) {
    const isCreator = activeQuiz.creatorUid === user.uid;
    const myParticipant = activeQuiz.participants.find((p) => p.uid === user.uid);
    const isSubmitted = myParticipant?.status === 'SUBMITTED';

    // 1. Admin / Creator View
    if (isCreator) {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Breadcrumb / Back button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  selectQuiz(null);
                  setAdminViewMode('monitor');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali ke Semua Kuis</span>
              </button>

              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAdminViewMode('monitor')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    adminViewMode === 'monitor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ruang Pantau (Live)
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('editor')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    adminViewMode === 'editor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Edit Soal ({activeQuiz.questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('leaderboard')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    adminViewMode === 'leaderboard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Papan Nilai (Rekap)
                </button>
              </div>
            </div>

            {/* Sub views */}
            {adminViewMode === 'monitor' && (
              <QuizLiveMonitor
                quiz={activeQuiz}
                onEditQuestions={() => setAdminViewMode('editor')}
                onViewLeaderboard={() => setAdminViewMode('leaderboard')}
              />
            )}

            {adminViewMode === 'editor' && (
              <QuizEditor
                quiz={activeQuiz}
                onBack={() => setAdminViewMode('monitor')}
              />
            )}

            {adminViewMode === 'leaderboard' && (
              <QuizLeaderboard quiz={activeQuiz} />
            )}
          </div>
        </div>
      );
    }

    // 2. Participant / Student View
    // If student has already submitted, show results
    if (isSubmitted || activeQuiz.status === 'ENDED') {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
          <QuizResultView
            quiz={activeQuiz}
            onBackToDashboard={() => selectQuiz(null)}
          />
        </div>
      );
    }

    // If quiz is WAITING, show Lobby
    if (activeQuiz.status === 'WAITING') {
      return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
          <QuizLobby
            quiz={activeQuiz}
            onStart={async () => {
              await startQuizTaking(activeQuiz.id, user);
              setIsTakingQuiz(true);
            }}
          />
        </div>
      );
    }

    // If quiz is ACTIVE, show Taking View
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <QuizTakingView
          quiz={activeQuiz}
          onFinished={() => {
            setIsTakingQuiz(false);
          }}
        />
      </div>
    );
  }

  // If no active quiz, show main dashboard welcome & quiz selector
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-100 py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2 py-2 sm:py-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIM: {user.identifier || 'Belum Dilengkapi'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Selamat Datang, {user.fullName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Buat sesi kuis interaktif baru untuk peserta atau masukkan kode akses kuis untuk mulai mengerjakan soal dan melihat nilai.
          </p>
        </div>

        {/* Two Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Card 1: Create Quiz */}
          <div className="bg-white rounded-3xl border border-slate-300 p-6 sm:p-8 text-center space-y-4 shadow-sm hover:border-indigo-600 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center font-bold">
                <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Buat Kuis Baru
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Untuk Pembuat Kuis / Host / Penyelenggara. Tentukan jumlah soal, durasi waktu, kunci jawaban, dan bagikan kode kuis.
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              onClick={() => setIsCreateOpen(true)}
              className="w-full h-12 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 border-0 flex items-center justify-center space-x-2 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kuis Baru Sekarang</span>
            </Button>
          </div>

          {/* Card 2: Join Quiz */}
          <div className="bg-white rounded-3xl border border-slate-300 p-6 sm:p-8 text-center space-y-4 shadow-sm hover:border-slate-600 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center font-bold">
                <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Gabung dengan Kode Kuis
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Untuk Peserta / Pengguna. Masukkan kode akses kuis yang diberikan pembuat kuis untuk mengerjakan soal dan mengetahui nilai Anda.
              </p>
            </div>
            <Button
              size="large"
              onClick={() => setIsJoinOpen(true)}
              className="w-full h-12 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border-0 flex items-center justify-center space-x-2 shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Gabung ke Kuis</span>
            </Button>
          </div>
        </div>

        {/* List of My Quizzes */}
        {myQuizzes.length > 0 && (
          <div className="max-w-4xl mx-auto pt-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Kuis Anda ({myQuizzes.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {myQuizzes.map((q) => {
                const isCreator = q.creatorUid === user.uid;
                const myParticipant = q.participants.find((p) => p.uid === user.uid);
                const isDone = myParticipant?.status === 'SUBMITTED';

                return (
                  <div
                    key={q.id}
                    onClick={() => selectQuiz(q)}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-600 cursor-pointer transition-all shadow-sm flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Tag
                          color={
                            q.status === 'ACTIVE'
                              ? 'processing'
                              : q.status === 'WAITING'
                              ? 'warning'
                              : 'default'
                          }
                          className="font-bold text-[9px] m-0"
                        >
                          {q.status === 'ACTIVE' && 'SEDANG BERLANGSUNG'}
                          {q.status === 'WAITING' && 'MENUNGGU PESERTA'}
                          {q.status === 'ENDED' && 'SELESAI'}
                          {q.status === 'DRAFT' && 'DRAFT'}
                        </Tag>

                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {q.code}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {q.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {q.subject || 'Topik Umum'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-slate-500 text-[11px]">
                        <span className="flex items-center">
                          <HelpCircle className="w-3 h-3 mr-1 text-indigo-500" />
                          {q.questions.length} Soal
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1 text-slate-400" />
                          {q.participants.length}
                        </span>
                      </div>

                      {isCreator ? (
                        <Tag color="purple" className="font-bold text-[9px] m-0">
                          ADMIN
                        </Tag>
                      ) : isDone ? (
                        <Tag color="green" className="font-black text-[10px] m-0">
                          NILAI: {myParticipant?.percentage}/100
                        </Tag>
                      ) : (
                        <span className="text-indigo-600 font-bold text-[11px] flex items-center group-hover:translate-x-0.5 transition-transform">
                          Buka →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateQuizModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(quizId) => {
          const created = quizzes.find((q) => q.id === quizId);
          if (created) selectQuiz(created);
        }}
      />

      <JoinQuizModal
        open={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={(quizId) => {
          const joined = quizzes.find((q) => q.id === quizId);
          if (joined) selectQuiz(joined);
        }}
      />
    </div>
  );
};
