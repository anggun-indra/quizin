import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { LogIn, KeyRound, User } from 'lucide-react';

interface JoinQuizModalProps {
  open: boolean;
  onClose: () => void;
  onJoined?: (quizId: string) => void;
}

export const JoinQuizModal: React.FC<JoinQuizModalProps> = ({ open, onClose, onJoined }) => {
  const { user } = useAuth();
  const { joinQuizByCode } = useQuiz();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      message.warning('Harap masukkan kode akses kuis.');
      return;
    }

    setLoading(true);
    try {
      const res = await joinQuizByCode(cleanCode, user);
      if (res.success && res.quiz) {
        setCode('');
        onClose();
        if (onJoined) onJoined(res.quiz.id);
      } else {
        message.error(res.error || 'Gagal bergabung ke kuis.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={440}
      className="join-quiz-modal"
    >
      <div className="pt-2 pb-1 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center shadow-md">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Gabung ke Kuis
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Masukkan kode akses kuis yang diberikan oleh pembuat kuis (host) untuk mulai mengerjakan.
          </p>
        </div>

        {/* User Identity Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-700 truncate max-w-[160px]">
              {user?.fullName}
            </span>
          </div>
          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
            ID: {user?.identifier || '-'}
          </span>
        </div>

        {/* Input Code */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center">
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Kode Akses Kuis
          </label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onPressEnter={handleJoin}
            placeholder="Contoh: QZ-8492"
            size="large"
            className="rounded-xl text-center font-mono font-black text-lg text-indigo-700 tracking-widest uppercase h-13"
            autoFocus
          />
        </div>

        {/* Submit */}
        <div>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleJoin}
            className="w-full h-12 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white border-0 flex items-center justify-center space-x-2 shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Ruang Kuis</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
