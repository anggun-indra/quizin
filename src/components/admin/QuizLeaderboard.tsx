import React, { useState } from 'react';
import { Quiz, QuizParticipant } from '@/types';
import { exportQuizResultsToExcel } from '@/lib/exportExcel';
import { SubmissionDetailModal } from '@/components/admin/SubmissionDetailModal';
import { 
  Trophy, 
  Download, 
  Search, 
  Eye, 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button, Input, Tag, Tooltip } from 'antd';

interface QuizLeaderboardProps {
  quiz: Quiz;
}

export const QuizLeaderboard: React.FC<QuizLeaderboardProps> = ({ quiz }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectParticipant, setInspectParticipant] = useState<QuizParticipant | null>(null);

  const participants = quiz.participants || [];

  // Sort: Submitted first sorted by score descending, then by timeSpent ascending
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
    if (b.status === 'SUBMITTED' && a.status !== 'SUBMITTED') return 1;
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.timeSpentSeconds || 999999) - (b.timeSpentSeconds || 999999);
  });

  // Filter
  const filteredParticipants = sortedParticipants.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.identifier.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  // Metrics
  const submitted = participants.filter((p) => p.status === 'SUBMITTED');
  const inProgress = participants.filter((p) => p.status === 'IN_PROGRESS');
  const avgScore = submitted.length > 0
    ? (submitted.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / submitted.length).toFixed(1)
    : '0';
  const highestScore = submitted.length > 0 ? Math.max(...submitted.map((p) => p.percentage || 0)) : 0;
  const passedCount = submitted.filter((p) => (p.percentage || 0) >= quiz.settings.passingScore).length;
  const passRate = submitted.length > 0 ? Math.round((passedCount / submitted.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Peserta Kuis</div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {participants.length}
              <span className="text-xs font-medium text-slate-500 ml-1">
                ({submitted.length} selesai)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Rata-rata Nilai</div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {avgScore}
              <span className="text-xs font-normal text-slate-400"> / 100</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Nilai Tertinggi</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {highestScore}
              <span className="text-xs font-normal text-slate-400"> / 100</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center font-bold flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Tingkat Kelulusan</div>
            <div className="text-xl font-black text-violet-700 mt-0.5">
              {passRate}%
              <span className="text-xs font-normal text-slate-400 ml-1">
                (KKM {quiz.settings.passingScore})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Input
              prefix={<Search className="w-3.5 h-3.5 text-slate-400 mr-1" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nama atau ID..."
              className="rounded-xl text-xs h-10"
              allowClear
            />
          </div>

          <Button
            type="primary"
            onClick={() => exportQuizResultsToExcel(quiz)}
            disabled={participants.length === 0}
            className="w-full sm:w-auto h-10 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center justify-center space-x-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Rekap Nilai ke Excel (.xlsx)</span>
          </Button>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/50">
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3">Peserta</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Nilai Akhir</th>
                <th className="py-3 px-3 text-center">Status KKM</th>
                <th className="py-3 px-3 text-center">Benar / Salah</th>
                <th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {searchQuery ? 'Tidak ada peserta yang cocok dengan pencarian.' : 'Belum ada peserta yang bergabung ke kuis ini.'}
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p, idx) => {
                  const isSubmitted = p.status === 'SUBMITTED';
                  const isPassed = (p.percentage || 0) >= quiz.settings.passingScore;
                  
                  let rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center mx-auto">
                      {idx + 1}
                    </span>
                  );
                  if (idx === 0 && isSubmitted) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-white font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                        🥇
                      </span>
                    );
                  } else if (idx === 1 && isSubmitted) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                        🥈
                      </span>
                    );
                  } else if (idx === 2 && isSubmitted) {
                    rankBadge = (
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                        🥉
                      </span>
                    );
                  }

                  return (
                    <tr key={p.uid} className="hover:bg-slate-50/80 transition-colors">
                      {/* Rank */}
                      <td className="py-3 px-3 text-center">{rankBadge}</td>

                      {/* Student Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.uid}`}
                            alt=""
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white"
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {p.fullName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              {p.identifier}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {p.status === 'SUBMITTED' ? (
                          <Tag color="success" className="font-bold text-[10px]">
                            Selesai
                          </Tag>
                        ) : p.status === 'IN_PROGRESS' ? (
                          <Tag color="processing" className="font-bold text-[10px]">
                            Mengerjakan
                          </Tag>
                        ) : (
                          <Tag color="default" className="font-bold text-[10px]">
                            Hadir
                          </Tag>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3 px-3 text-center">
                        {isSubmitted ? (
                          <span className="font-black text-sm text-indigo-700">
                            {p.percentage ?? 0}
                            <span className="text-[10px] text-slate-400 font-normal"> / 100</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Pass/Fail */}
                      <td className="py-3 px-3 text-center">
                        {isSubmitted ? (
                          <Tag color={isPassed ? 'green' : 'volcano'} className="font-bold text-[10px]">
                            {isPassed ? 'LULUS' : 'REMIDI'}
                          </Tag>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Correct / Incorrect */}
                      <td className="py-3 px-3 text-center">
                        {isSubmitted ? (
                          <span className="font-medium text-slate-700">
                            <span className="text-emerald-600 font-bold">{p.totalCorrect ?? 0}</span>
                            {' / '}
                            <span className="text-red-500 font-bold">{p.totalIncorrect ?? 0}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-center text-slate-600 font-mono">
                        {p.timeSpentSeconds
                          ? `${Math.floor(p.timeSpentSeconds / 60)}m ${p.timeSpentSeconds % 60}s`
                          : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="small"
                          onClick={() => setInspectParticipant(p)}
                          disabled={!isSubmitted}
                          className="rounded-lg text-xs font-semibold flex items-center ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Lembar Jawaban</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        quiz={quiz}
        participant={inspectParticipant}
        open={Boolean(inspectParticipant)}
        onClose={() => setInspectParticipant(null)}
      />
    </div>
  );
};
