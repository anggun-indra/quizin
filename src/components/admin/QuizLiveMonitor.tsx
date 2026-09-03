import React, { useState } from 'react';
import { Quiz, QuizStatus } from '@/types';
import { useQuiz } from '@/contexts/QuizContext';
import { ShareQuizModal } from '@/components/modals/ShareQuizModal';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Users, 
  Share2, 
  Settings, 
  Trophy, 
  FileEdit, 
  RotateCcw, 
  Copy, 
  Check, 
  UserMinus,
  Sparkles,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Button, Tag, Popconfirm, message } from 'antd';

interface QuizLiveMonitorProps {
  quiz: Quiz;
  onEditQuestions: () => void;
  onViewLeaderboard: () => void;
}

export const QuizLiveMonitor: React.FC<QuizLiveMonitorProps> = ({
  quiz,
  onEditQuestions,
  onViewLeaderboard,
}) => {
  const { updateQuizStatus, kickParticipant, resetQuizParticipants } = useQuiz();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const participants = quiz.participants || [];
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED').length;
  const inProgressCount = participants.filter((p) => p.status === 'IN_PROGRESS').length;
  const waitingCount = participants.filter((p) => p.status === 'JOINED').length;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.code);
    setCopiedCode(true);
    message.success(`Kode kuis [${quiz.code}] berhasil disalin!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleStatusChange = async (newStatus: QuizStatus) => {
    setStatusLoading(true);
    try {
      await updateQuizStatus(quiz.id, newStatus);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quiz Details */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {quiz.subject || 'Kuis Interaktif'}
              </span>
              <span>•</span>
              <Tag
                color={
                  quiz.status === 'ACTIVE'
                    ? 'processing'
                    : quiz.status === 'WAITING'
                    ? 'warning'
                    : quiz.status === 'ENDED'
                    ? 'default'
                    : 'purple'
                }
                className="font-bold text-[10px]"
              >
                {quiz.status === 'ACTIVE' && 'SEDANG BERLANGSUNG'}
                {quiz.status === 'WAITING' && 'MENUNGGU PESERTA (LOBBY)'}
                {quiz.status === 'ENDED' && 'KUIS SELESAI / DITUTUP'}
                {quiz.status === 'DRAFT' && 'DRAFT'}
              </Tag>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {quiz.title}
            </h1>

            <p className="text-xs text-slate-500 max-w-xl">
              {quiz.description || 'Kuis interaktif dengan sistem penilaian realtime.'}
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex items-center space-x-3 self-start md:self-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-center px-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Kode Akses
              </div>
              <div className="text-2xl font-mono font-black text-indigo-700 tracking-wider">
                {quiz.code}
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <Button
                size="small"
                onClick={handleCopyCode}
                className="rounded-lg font-bold text-xs flex items-center"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
              </Button>
              <Button
                size="small"
                onClick={() => setIsShareOpen(true)}
                className="rounded-lg font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center"
              >
                <Share2 className="w-3 h-3 mr-1" />
                <span>Bagikan</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons & Status Controllers */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Main Status Toggle Buttons */}
          <div className="flex items-center space-x-2">
            {quiz.status !== 'ACTIVE' ? (
              <Button
                type="primary"
                size="large"
                loading={statusLoading}
                onClick={() => handleStatusChange('ACTIVE')}
                className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center space-x-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Kuis Sekarang (Buka Lembar Soal)</span>
              </Button>
            ) : (
              <Button
                size="large"
                loading={statusLoading}
                onClick={() => handleStatusChange('ENDED')}
                className="rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white border-0 flex items-center space-x-2 shadow-sm"
              >
                <Pause className="w-4 h-4" />
                <span>Selesaikan & Kunci Kuis</span>
              </Button>
            )}

            {quiz.status === 'ENDED' && (
              <Button
                size="large"
                onClick={() => handleStatusChange('WAITING')}
                className="rounded-xl font-bold text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Buka Kembali ke Ruang Tunggu</span>
              </Button>
            )}
          </div>

          {/* Quick Nav Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              size="middle"
              onClick={onEditQuestions}
              className="rounded-xl font-bold text-xs flex items-center space-x-1.5"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kelola Soal ({quiz.questions.length})</span>
            </Button>

            <Button
              size="middle"
              onClick={onViewLeaderboard}
              className="rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center space-x-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Lihat Leaderboard</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Participants Live Grid & Presence */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Peserta Bergabung Realtime ({participants.length})
            </h2>
          </div>

          {/* Quick status counters */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
              {submittedCount} Selesai
            </span>
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
              {inProgressCount} Mengerjakan
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {waitingCount} Menunggu
            </span>
          </div>
        </div>

        {/* Participants Cards Grid */}
        {participants.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              Menunggu Peserta Bergabung...
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bagikan kode kuis <span className="font-mono font-black text-indigo-700">{quiz.code}</span> kepada peserta untuk mulai bergabung ke ruangan kuis ini.
            </p>
            <Button
              type="primary"
              size="middle"
              onClick={() => setIsShareOpen(true)}
              className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Bagikan Kode Kuis
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {participants.map((p) => {
              const isSubmitted = p.status === 'SUBMITTED';
              const isInProgress = p.status === 'IN_PROGRESS';

              return (
                <div
                  key={p.uid}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    isSubmitted
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : isInProgress
                      ? 'border-blue-300 bg-blue-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <img
                        src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                        alt=""
                        className="w-9 h-9 rounded-full border border-slate-200 bg-white flex-shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {p.fullName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 truncate">
                          ID: {p.identifier}
                        </div>
                      </div>
                    </div>

                    <Popconfirm
                      title="Keluarkan Peserta?"
                      description="Peserta ini akan dikeluarkan dari kuis."
                      onConfirm={() => kickParticipant(quiz.id, p.uid)}
                      okText="Ya"
                      cancelText="Batal"
                    >
                      <button
                        type="button"
                        className="text-slate-300 hover:text-red-500 p-0.5"
                        title="Keluarkan Peserta"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    </Popconfirm>
                  </div>

                  {/* Status & Score */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      {isSubmitted ? (
                        <span className="font-black text-indigo-700 text-sm">
                          {p.percentage ?? 0}
                          <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                        </span>
                      ) : isInProgress ? (
                        <span className="text-[11px] font-bold text-blue-600 animate-pulse">
                          Sedang Mengerjakan...
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Menunggu Mulai
                        </span>
                      )}
                    </div>

                    <Tag
                      color={isSubmitted ? 'green' : isInProgress ? 'blue' : 'default'}
                      className="font-bold text-[9px] m-0"
                    >
                      {isSubmitted ? 'SELESAI' : isInProgress ? 'AKTIF' : 'HADIR'}
                    </Tag>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareQuizModal
        quiz={quiz}
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
