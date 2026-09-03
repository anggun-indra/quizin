import React from 'react';
import { Question, ParticipantAnswer } from '@/types';
import { Bookmark, Check } from 'lucide-react';

interface QuestionNavGridProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, ParticipantAnswer>;
  onSelectIndex: (index: number) => void;
}

export const QuestionNavGrid: React.FC<QuestionNavGridProps> = ({
  questions,
  currentIndex,
  answers,
  onSelectIndex,
}) => {
  // Counters
  let answeredCount = 0;
  let flaggedCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    const isAnswered =
      (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      (ans?.textAnswer && ans.textAnswer.trim().length > 0);
    const isFlagged = ans?.isFlagged;

    if (isFlagged) {
      flaggedCount++;
    } else if (isAnswered) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-800">
          Nomor Soal
        </span>
        <span className="text-xs font-bold text-indigo-700">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Grid of numbers */}
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isAnswered =
            (ans?.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
            (ans?.textAnswer && ans.textAnswer.trim().length > 0);
          const isFlagged = ans?.isFlagged;
          const isCurrent = idx === currentIndex;

          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          if (isFlagged) {
            badgeClass = 'bg-amber-500 text-white border-amber-600 shadow-sm';
          } else if (isAnswered) {
            badgeClass = 'bg-emerald-600 text-white border-emerald-700 shadow-sm';
          }

          const currentRing = isCurrent
            ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105 font-black'
            : 'hover:border-slate-400';

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`h-10 rounded-xl border text-xs font-bold transition-all relative flex items-center justify-center ${badgeClass} ${currentRing}`}
            >
              <span>{idx + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend / Status Info */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px] text-center font-bold">
        <div className="flex items-center justify-center space-x-1 text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>{answeredCount} Terjawab</span>
        </div>
        <div className="flex items-center justify-center space-x-1 text-amber-700">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>{flaggedCount} Ragu</span>
        </div>
        <div className="flex items-center justify-center space-x-1 text-slate-500">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <span>{unansweredCount} Kosong</span>
        </div>
      </div>
    </div>
  );
};
