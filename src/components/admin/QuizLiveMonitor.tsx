import React, { useState } from 'react';
import { Quiz, QuizParticipant, QuizStatus } from '@/types';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Check, 
  Share2, 
  Clock, 
  Award, 
  HelpCircle,
  FileEdit,
  UserX,
  ExternalLink,
  ChevronRight,
  Search,
  Sparkles
} from 'lucide-react';
import { Button, Tag, Popconfirm, message, Tooltip, Input } from 'antd';
import { ShareQuizModal } from '@/components/modals/ShareQuizModal';

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
  const [copiedCode, setCopiedCode] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.code);
    setCopiedCode(true);
    message.success(`Kode kuis [${quiz.code}] disalin!`);
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

  const participants = quiz.participants || [];
  const waitingCount = participants.filter((p) => p.status === 'JOINED').length;
  const inProgressCount = participants.filter((p) => p.status === 'IN_PROGRESS').length;
  const submittedCount = participants.filter((p) => p.status === 'SUBMITTED').length;

  const filteredParticipants = participants.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.identifier && p.identifier.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Banner Control */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quiz Details */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                className="font-bold text-[10px] m-0"
              >
                {quiz.status === 'ACTIVE' && 'SEDANG BERLANGSUNG'}
                {quiz.status === 'WAITING' && 'MENUNGGU PESERTA (LOBBY)'}
                {quiz.status === 'ENDED' && 'KUIS SELESAI / DITUTUP'}
                {quiz.status === 'DRAFT' && 'DRAFT'}
              </Tag>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {quiz.title}
            </h1>

            <p className="text-xs text-slate-500 max-w-xl">
              {quiz.description || 'Kuis interaktif dengan sistem penilaian realtime.'}
            </p>
          </div>

          {/* Room Code Card (Mobile Full Width, Desktop Compact) */}
          <div className="flex items-center justify-between sm:justify-start space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full sm:w-auto">
            <div className="text-left sm:text-center px-1">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Kode Akses
              </div>
              <div className="text-2xl font-mono font-black text-indigo-700 tracking-wider">
                {quiz.code}
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <Button
                size="middle"
                onClick={handleCopyCode}
                className="rounded-xl font-bold text-xs flex items-center h-9"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
              </Button>
              <Button
                size="middle"
                onClick={() => setIsShareOpen(true)}
                className="rounded-xl font-bold text-xs bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center h-9"
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                <span>Bagikan</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons & Status Controllers */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Main Status Toggle Buttons */}
          <div className="flex items-center space-x-2">
            {quiz.status !== 'ACTIVE' ? (
              <Button
                type="primary"
                size="large"
                loading={statusLoading}
                onClick={() => handleStatusChange('ACTIVE')}
                className="w-full sm:w-auto h-11 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center justify-center space-x-2 shadow-sm"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Mulai Kuis Sekarang (Buka Lembar Soal)</span>
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                loading={statusLoading}
                onClick={() => handleStatusChange('ENDED')}
                className="w-full sm:w-auto h-11 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white border-0 flex items-center justify-center space-x-2 shadow-sm"
              >
                <Pause className="w-4 h-4" />
                <span>Selesaikan & Kunci Kuis</span>
              </Button>
            )}

            {quiz.status === 'ENDED' && (
              <Button
                size="large"
                onClick={() => handleStatusChange('WAITING')}
                className="h-11 rounded-xl font-bold text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Buka Kembali</span>
              </Button>
            )}
          </div>

          {/* Quick Nav Buttons */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <Button
              size="middle"
              onClick={onEditQuestions}
              className="h-10 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
              <span>Kelola Soal ({quiz.questions.length})</span>
            </Button>

            <Button
              type="primary"
              size="middle"
              onClick={onViewLeaderboard}
              className="h-10 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white border-0 flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Papan Nilai</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Participant Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black flex-shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
              Total Hadir
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900">
              {participants.length}
            </div>
          </div>
        </div>

        {/* Waiting */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
              Di Lobby
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-600">
              {waitingCount}
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black flex-shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
              Mengerjakan
            </div>
            <div className="text-lg sm:text-2xl font-black text-blue-600">
              {inProgressCount}
            </div>
          </div>
        </div>

        {/* Submitted */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-2.5 sm:space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black flex-shrink-0">
            <Check className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">
              Selesai
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600">
              {submittedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
              Daftar Peserta Masuk ({filteredParticipants.length})
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              prefix={<Search className="w-3.5 h-3.5 text-slate-400 mr-1" />}
              placeholder="Cari nama atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl text-xs w-full sm:w-56"
              size="middle"
              allowClear
            />

            {participants.length > 0 && (
              <Popconfirm
                title="Reset semua peserta?"
                description="Peserta yang sudah bergabung akan dikeluarkan."
                onConfirm={() => resetQuizParticipants(quiz.id)}
                okText="Reset"
                cancelText="Batal"
                okButtonProps={{ danger: true }}
              >
                <Button size="middle" danger className="rounded-xl text-xs font-bold">
                  Reset
                </Button>
              </Popconfirm>
            )}
          </div>
        </div>

        {/* Participants Cards Grid */}
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">
              Belum ada peserta yang bergabung.
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Bagikan kode kuis <span className="font-mono font-bold text-indigo-600">[{quiz.code}]</span> kepada peserta untuk mulai bergabung.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {filteredParticipants.map((p) => {
              return (
                <div
                  key={p.uid}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-400 transition-all flex items-center justify-between space-x-2.5 group"
                >
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <img
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-slate-200 bg-white flex-shrink-0"
                    />
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {p.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ID: {p.identifier}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {p.status === 'SUBMITTED' ? (
                      <Tag color="green" className="font-black text-[10px] m-0">
                        {p.percentage}/100
                      </Tag>
                    ) : p.status === 'IN_PROGRESS' ? (
                      <Tag color="blue" className="font-bold text-[9px] m-0">
                        Mengerjakan
                      </Tag>
                    ) : (
                      <Tag color="orange" className="font-bold text-[9px] m-0">
                        Lobby
                      </Tag>
                    )}

                    <Popconfirm
                      title="Keluarkan peserta?"
                      onConfirm={() => kickParticipant(quiz.id, p.uid)}
                      okText="Ya"
                      cancelText="Batal"
                    >
                      <button
                        type="button"
                        className="text-slate-300 hover:text-red-500 p-1 rounded transition-colors"
                        title="Keluarkan"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ShareQuizModal
        quiz={quiz}
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
