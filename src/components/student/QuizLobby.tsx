import React, { useEffect } from 'react';
import { Quiz } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Clock, 
  BookOpen, 
  HelpCircle, 
  Users, 
  Award, 
  LogOut, 
  Sparkles,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { Button, Tag } from 'antd';

interface QuizLobbyProps {
  quiz: Quiz;
  onStart: () => void;
}

export const QuizLobby: React.FC<QuizLobbyProps> = ({ quiz, onStart }) => {
  const { user } = useAuth();
  const { leaveQuiz } = useQuiz();

  // If the host starts the quiz (status becomes ACTIVE), auto trigger start
  useEffect(() => {
    if (quiz.status === 'ACTIVE') {
      onStart();
    }
  }, [quiz.status, onStart]);

  if (!user) return null;

  const participants = quiz.participants || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4 sm:py-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {quiz.subject || 'Kuis Kuliah'}
            </span>
            <Tag color="warning" className="font-bold text-[10px]">
              RUANG TUNGGU (LOBBY)
            </Tag>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {quiz.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {quiz.description || 'Harap tetap berada di halaman ini. Kuis akan dimulai secara otomatis begitu pengampu memulai kuis.'}
          </p>
        </div>

        {/* Quiz Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Soal</div>
            <div className="text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>{quiz.questions.length} Butir</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Durasi</div>
            <div className="text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>
                {quiz.settings.durationMinutes > 0 ? `${quiz.settings.durationMinutes} Menit` : 'Bebas'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Nilai KKM</div>
            <div className="text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{quiz.settings.passingScore} / 100</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Pengampu</div>
            <div className="text-xs font-bold text-slate-800 truncate px-1">
              {quiz.creatorName}
            </div>
          </div>
        </div>

        {/* Waiting Animation Indicator */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-center space-x-3 text-indigo-900 text-xs font-bold">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
          </span>
          <span>Menunggu pengampu memulai kuis... Halaman akan otomatis berpindah.</span>
        </div>

        {/* Leave button */}
        <div>
          <Button
            size="middle"
            onClick={() => leaveQuiz(quiz.id, user)}
            className="rounded-xl font-bold text-xs text-slate-500 hover:text-red-600 border-slate-200"
          >
            <LogOut className="w-3.5 h-3.5 mr-1" />
            Keluar dari Kuis
          </Button>
        </div>
      </div>

      {/* Participants Live Presence in Lobby */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Teman Sekelas yang Sudah Masuk ({participants.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Kode Room: <strong className="font-mono text-indigo-700">{quiz.code}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {participants.map((p) => {
            const isMe = p.uid === user.uid;
            return (
              <div
                key={p.uid}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs ${
                  isMe
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                <img
                  src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                  alt=""
                  className="w-7 h-7 rounded-full border border-slate-200 bg-white flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <div className="truncate font-semibold text-xs leading-tight">
                    {p.fullName} {isMe && '(Anda)'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {p.identifier}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
