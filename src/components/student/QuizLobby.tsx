import React from 'react';
import { Quiz } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Sparkles, 
  Users, 
  Clock, 
  Award, 
  HelpCircle, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { Button, Tag } from 'antd';

interface QuizLobbyProps {
  quiz: Quiz;
  onStart: () => void;
}

export const QuizLobby: React.FC<QuizLobbyProps> = ({ quiz, onStart }) => {
  const { user } = useAuth();
  const { leaveQuiz } = useQuiz();

  if (!user) return null;

  const participants = quiz.participants || [];

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6 py-2 sm:py-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm space-y-4 sm:space-y-6 text-center">
        <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {quiz.subject || 'Kuis Interaktif'}
            </span>
            <Tag color="warning" className="font-bold text-[9px] sm:text-[10px] m-0">
              RUANG TUNGGU (LOBBY)
            </Tag>
          </div>

          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {quiz.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {quiz.description || 'Harap tetap berada di halaman ini. Kuis akan dimulai secara otomatis begitu pembuat kuis (host) memulai kuis.'}
          </p>
        </div>

        {/* Quiz Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 text-center">
          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Total Soal</div>
            <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span>{quiz.questions.length} Butir</span>
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Durasi</div>
            <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
              <span>
                {quiz.settings.durationMinutes > 0 ? `${quiz.settings.durationMinutes} Menit` : 'Bebas'}
              </span>
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Nilai KKM</div>
            <div className="text-base sm:text-lg font-black text-slate-900 flex items-center justify-center space-x-1">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>{quiz.settings.passingScore} / 100</span>
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Pembuat Kuis</div>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate px-1">
              {quiz.creatorName}
            </div>
          </div>
        </div>

        {/* Waiting Animation Indicator */}
        <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-center space-x-2.5 text-indigo-900 text-xs font-bold">
          <span className="relative flex h-3 w-3 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
          </span>
          <span className="text-[11px] sm:text-xs">Menunggu pembuat kuis memulai kuis... Halaman akan otomatis berpindah.</span>
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
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
              Peserta yang Sudah Masuk ({participants.length})
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Kode: <strong className="font-mono text-indigo-700">{quiz.code}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {participants.map((p) => {
            const isMe = p.uid === user.uid;
            return (
              <div
                key={p.uid}
                className={`p-2 sm:p-2.5 rounded-xl border flex items-center space-x-2 text-xs ${
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
                <div className="overflow-hidden flex-1">
                  <div className="truncate font-semibold text-xs leading-tight">
                    {p.fullName} {isMe && '(Anda)'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    ID: {p.identifier}
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
