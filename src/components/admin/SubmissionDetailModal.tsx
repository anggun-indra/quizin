import React, { useEffect, useState } from 'react';
import { Modal, Tag, Spin } from 'antd';
import { Quiz, QuizParticipant, QuizSubmission } from '@/types';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  HelpCircle,
  FileQuestion,
  User
} from 'lucide-react';

interface SubmissionDetailModalProps {
  quiz: Quiz;
  participant: QuizParticipant | null;
  open: boolean;
  onClose: () => void;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  quiz,
  participant,
  open,
  onClose,
}) => {
  const { fetchSubmission } = useQuiz();
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (participant && open) {
      setLoading(true);
      fetchSubmission(quiz.id, participant.uid)
        .then((data) => setSubmission(data))
        .finally(() => setLoading(false));
    } else {
      setSubmission(null);
    }
  }, [participant, open, quiz.id]);

  if (!participant) return null;

  const isPassed = (participant.percentage || 0) >= quiz.settings.passingScore;

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={720}
      className="submission-detail-modal"
    >
      <div className="pt-2 pb-1 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Detail Lembar Jawaban Peserta
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{participant.fullName}</span>
              <Tag color={isPassed ? 'green' : 'volcano'}>
                {isPassed ? 'LULUS' : 'REMIDI'}
              </Tag>
            </h2>
            <div className="text-xs text-slate-500 font-mono mt-0.5">
              NIM: {participant.identifier} • {participant.email}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black text-indigo-700">
              {participant.percentage ?? 0}
              <span className="text-xs font-semibold text-slate-400"> / 100</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Skor: {participant.score}/{participant.maxScore}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Benar</div>
            <div className="text-emerald-600 font-black text-base mt-0.5">
              {participant.totalCorrect ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Salah</div>
            <div className="text-red-500 font-black text-base mt-0.5">
              {participant.totalIncorrect ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Dilewati</div>
            <div className="text-amber-500 font-black text-base mt-0.5">
              {participant.totalUnanswered ?? 0}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Durasi</div>
            <div className="text-slate-700 font-black text-sm mt-0.5">
              {participant.timeSpentSeconds
                ? `${Math.floor(participant.timeSpentSeconds / 60)}m ${participant.timeSpentSeconds % 60}s`
                : '-'}
            </div>
          </div>
        </div>

        {/* Body: Questions Breakdown */}
        {loading ? (
          <div className="py-12 text-center">
            <Spin />
            <p className="text-xs text-slate-500 mt-2">Memuat lembar jawaban...</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {quiz.questions.map((q, idx) => {
              const res = submission?.questionResults[q.id];
              const isCorrect = res?.isCorrect;
              const userAnswers = res?.userAnswers || [];

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : userAnswers.length === 0
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-red-200 bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[11px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {q.text}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {isCorrect ? (
                        <Tag color="success" className="font-bold text-[10px] flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                          +{res?.earnedPoints ?? q.points} Poin
                        </Tag>
                      ) : (
                        <Tag color="error" className="font-bold text-[10px] flex items-center">
                          <XCircle className="w-3 h-3 mr-1 inline" />
                          0 Poin
                        </Tag>
                      )}
                    </div>
                  </div>

                  {/* Options Review */}
                  {q.type !== 'SHORT_ANSWER' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 text-xs">
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
                            className={`p-2 rounded-lg border text-xs flex items-center space-x-2 ${optClass}`}
                          >
                            <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="truncate flex-1">{opt.text}</span>
                            {isChosen && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                                Dijawab
                              </span>
                            )}
                            {isRight && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                                Kunci
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Short Answer inspection */
                    <div className="text-xs space-y-1 mt-2">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Jawaban Mahasiswa:
                        </span>
                        <span className="font-mono font-bold text-slate-800">
                          {userAnswers[0] || '(Tidak dijawab)'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
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
                    <div className="mt-2.5 p-2 rounded-lg bg-slate-100/70 text-[11px] text-slate-600 border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-0.5">
                        💡 Pembahasan:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
