import React, { useState } from 'react';
import { Quiz, Question, QuestionType, QuestionOption } from '@/types';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Plus, 
  Trash2, 
  Check, 
  Save, 
  FileQuestion, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Circle,
  HelpCircle,
  Copy,
  Sparkles,
  Award
} from 'lucide-react';
import { Button, Input, InputNumber, Select, Radio, Checkbox, message, Tag } from 'antd';

interface QuizEditorProps {
  quiz: Quiz;
  onBack: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ quiz, onBack }) => {
  const { saveQuestions, updateQuiz } = useQuiz();

  const [questions, setQuestions] = useState<Question[]>(() => {
    return quiz.questions && quiz.questions.length > 0 ? [...quiz.questions] : [];
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const activeQuestion = questions[selectedQuestionIndex] || null;

  // Add new empty question
  const handleAddQuestion = (type: QuestionType = 'SINGLE_CHOICE') => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let initialOptions: QuestionOption[] = [];
    let initialCorrect: string[] = [];

    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
      initialOptions = [
        { id: 'opt_1', text: 'Pilihan A' },
        { id: 'opt_2', text: 'Pilihan B' },
        { id: 'opt_3', text: 'Pilihan C' },
        { id: 'opt_4', text: 'Pilihan D' },
      ];
      initialCorrect = ['opt_1'];
    } else if (type === 'TRUE_FALSE') {
      initialOptions = [
        { id: 'opt_t', text: 'Benar' },
        { id: 'opt_f', text: 'Salah' },
      ];
      initialCorrect = ['opt_t'];
    }

    const newQuestion: Question = {
      id: newId,
      order: questions.length + 1,
      text: '',
      type,
      options: initialOptions,
      correctAnswers: initialCorrect,
      points: 20,
      explanation: '',
    };

    const nextQuestions = [...questions, newQuestion];
    setQuestions(nextQuestions);
    setSelectedQuestionIndex(nextQuestions.length - 1);
  };

  // Duplicate question
  const handleDuplicateQuestion = (index: number) => {
    const target = questions[index];
    if (!target) return;
    const duplicated: Question = {
      ...target,
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: questions.length + 1,
      text: `${target.text} (Duplikat)`,
      options: target.options.map((opt) => ({ ...opt })),
      correctAnswers: [...target.correctAnswers],
    };
    const nextQuestions = [...questions, duplicated];
    setQuestions(nextQuestions);
    setSelectedQuestionIndex(nextQuestions.length - 1);
    message.info('Soal berhasil diduplikasi.');
  };

  // Delete question
  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      message.warning('Minimal kuis memiliki satu soal.');
      return;
    }
    const nextQuestions = questions.filter((_, idx) => idx !== index);
    // re-number order
    const reordered = nextQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
    setSelectedQuestionIndex(Math.max(0, index - 1));
    message.info('Soal dihapus.');
  };

  // Move question
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextQuestions = [...questions];
    const temp = nextQuestions[index];
    nextQuestions[index] = nextQuestions[targetIdx];
    nextQuestions[targetIdx] = temp;

    const reordered = nextQuestions.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
    setSelectedQuestionIndex(targetIdx);
  };

  // Update active question fields
  const updateActiveQuestion = (patch: Partial<Question>) => {
    if (!activeQuestion) return;
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === selectedQuestionIndex ? { ...q, ...patch } : q))
    );
  };

  // Option modifications
  const handleAddOption = () => {
    if (!activeQuestion) return;
    const newOptId = `opt_${Date.now()}`;
    const newOption: QuestionOption = {
      id: newOptId,
      text: `Pilihan Baru`,
    };
    updateActiveQuestion({
      options: [...activeQuestion.options, newOption],
    });
  };

  const handleUpdateOptionText = (optId: string, text: string) => {
    if (!activeQuestion) return;
    updateActiveQuestion({
      options: activeQuestion.options.map((opt) =>
        opt.id === optId ? { ...opt, text } : opt
      ),
    });
  };

  const handleDeleteOption = (optId: string) => {
    if (!activeQuestion) return;
    if (activeQuestion.options.length <= 2) {
      message.warning('Minimal harus ada 2 opsi pilihan.');
      return;
    }
    updateActiveQuestion({
      options: activeQuestion.options.filter((opt) => opt.id !== optId),
      correctAnswers: activeQuestion.correctAnswers.filter((id) => id !== optId),
    });
  };

  const handleToggleCorrectOption = (optId: string) => {
    if (!activeQuestion) return;
    if (activeQuestion.type === 'MULTIPLE_CHOICE') {
      const isSelected = activeQuestion.correctAnswers.includes(optId);
      const nextCorrect = isSelected
        ? activeQuestion.correctAnswers.filter((id) => id !== optId)
        : [...activeQuestion.correctAnswers, optId];
      updateActiveQuestion({ correctAnswers: nextCorrect });
    } else {
      // SINGLE_CHOICE or TRUE_FALSE
      updateActiveQuestion({ correctAnswers: [optId] });
    }
  };

  // Save all questions to Firestore
  const handleSave = async () => {
    // Validate empty question texts
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        message.error(`Soal nomor ${i + 1} belum memiliki teks pertanyaan.`);
        setSelectedQuestionIndex(i);
        return;
      }
      if (
        questions[i].type !== 'SHORT_ANSWER' &&
        questions[i].correctAnswers.length === 0
      ) {
        message.error(`Soal nomor ${i + 1} belum memiliki kunci jawaban yang benar.`);
        setSelectedQuestionIndex(i);
        return;
      }
    }

    setIsSaving(true);
    try {
      const ok = await saveQuestions(quiz.id, questions);
      if (ok) {
        message.success('Semua soal berhasil disimpan!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Button
            size="middle"
            onClick={onBack}
            className="rounded-xl font-bold text-xs"
          >
            ← Kembali
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Edit Soal Kuis: {quiz.title}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
              <span>{questions.length} Soal</span>
              <span>•</span>
              <span className="font-bold text-indigo-700">Total {totalPoints} Poin</span>
              <span>•</span>
              <Tag color="blue">{quiz.code}</Tag>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="primary"
            size="middle"
            loading={isSaving}
            onClick={handleSave}
            className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan Soal</span>
          </Button>
        </div>
      </div>

      {/* Main Split View: Left list / Right editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Questions List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3 h-fit max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Daftar Soal ({questions.length})
            </span>
            <Button
              type="dashed"
              size="small"
              onClick={() => handleAddQuestion('SINGLE_CHOICE')}
              className="rounded-lg text-xs font-bold text-indigo-600 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Tambah Soal
            </Button>
          </div>

          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex;
              return (
                <div
                  key={q.id || idx}
                  onClick={() => setSelectedQuestionIndex(idx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between space-x-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 overflow-hidden">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {q.text.trim() || '(Pertanyaan belum diisi)'}
                      </p>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1">
                        <span>
                          {q.type === 'SINGLE_CHOICE'
                            ? 'Pilihan Ganda'
                            : q.type === 'MULTIPLE_CHOICE'
                            ? 'Pilihan Kompleks'
                            : q.type === 'TRUE_FALSE'
                            ? 'Benar/Salah'
                            : 'Isian'}
                        </span>
                        <span>•</span>
                        <span>{q.points || 10} poin</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveQuestion(idx, 'up');
                      }}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveQuestion(idx, 'down');
                      }}
                      disabled={idx === questions.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuestion(idx);
                      }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Question Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          {activeQuestion ? (
            <div className="space-y-5">
              {/* Question Header Form */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-900">
                    Soal Nomor #{selectedQuestionIndex + 1}
                  </span>
                  <Tag color="purple">
                    {activeQuestion.type === 'SINGLE_CHOICE' && 'Pilihan Ganda'}
                    {activeQuestion.type === 'MULTIPLE_CHOICE' && 'Pilihan Kompleks (Multi)'}
                    {activeQuestion.type === 'TRUE_FALSE' && 'Benar / Salah'}
                    {activeQuestion.type === 'SHORT_ANSWER' && 'Isian Singkat'}
                  </Tag>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-600">Bobot Poin:</span>
                    <InputNumber
                      min={1}
                      max={100}
                      value={activeQuestion.points}
                      onChange={(val) => updateActiveQuestion({ points: val || 10 })}
                      size="middle"
                      className="w-20 rounded-xl font-bold text-xs"
                    />
                  </div>

                  <Select
                    value={activeQuestion.type}
                    onChange={(val: QuestionType) => {
                      let nextOptions = activeQuestion.options;
                      let nextCorrect = activeQuestion.correctAnswers;
                      if (val === 'TRUE_FALSE') {
                        nextOptions = [
                          { id: 'opt_t', text: 'Benar' },
                          { id: 'opt_f', text: 'Salah' },
                        ];
                        nextCorrect = ['opt_t'];
                      } else if (val === 'SHORT_ANSWER') {
                        nextOptions = [];
                        nextCorrect = [''];
                      }
                      updateActiveQuestion({
                        type: val,
                        options: nextOptions,
                        correctAnswers: nextCorrect,
                      });
                    }}
                    className="w-40"
                    options={[
                      { value: 'SINGLE_CHOICE', label: 'Pilihan Ganda' },
                      { value: 'MULTIPLE_CHOICE', label: 'Pilihan Kompleks' },
                      { value: 'TRUE_FALSE', label: 'Benar / Salah' },
                      { value: 'SHORT_ANSWER', label: 'Isian Singkat' },
                    ]}
                  />

                  <Button
                    size="small"
                    onClick={() => handleDuplicateQuestion(selectedQuestionIndex)}
                    className="rounded-lg text-xs font-semibold flex items-center"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplikat
                  </Button>
                </div>
              </div>

              {/* Question Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                  <FileQuestion className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Pertanyaan / Soal <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input.TextArea
                  rows={3}
                  value={activeQuestion.text}
                  onChange={(e) => updateActiveQuestion({ text: e.target.value })}
                  placeholder="Tuliskan butir pertanyaan kuis di sini..."
                  className="rounded-xl text-sm font-medium p-3"
                />
              </div>

              {/* Options Section */}
              {activeQuestion.type !== 'SHORT_ANSWER' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      Pilihan Jawaban (Klik lingkaran/centang untuk menandai KUNCI JAWABAN)
                    </label>
                    {activeQuestion.type !== 'TRUE_FALSE' && (
                      <Button
                        size="small"
                        type="dashed"
                        onClick={handleAddOption}
                        className="rounded-lg text-xs font-bold text-indigo-600"
                      >
                        + Tambah Opsi
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {activeQuestion.options.map((opt, optIdx) => {
                      const isCorrect = activeQuestion.correctAnswers.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/50'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleCorrectOption(opt.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title={isCorrect ? 'Kunci Jawaban Benar' : 'Klik untuk jadikan kunci'}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </button>

                          <Input
                            value={opt.text}
                            onChange={(e) => handleUpdateOptionText(opt.id, e.target.value)}
                            placeholder={`Teks pilihan ${String.fromCharCode(65 + optIdx)}`}
                            className="rounded-lg font-medium text-xs flex-1"
                            disabled={activeQuestion.type === 'TRUE_FALSE'}
                          />

                          {isCorrect && (
                            <Tag color="green" className="font-bold text-[10px] m-0">
                              KUNCI
                            </Tag>
                          )}

                          {activeQuestion.type !== 'TRUE_FALSE' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(opt.id)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Short Answer acceptable answers */
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700">
                    Kunci Jawaban Teks (Jawaban Benar yang Diterima, pisahkan dengan koma):
                  </label>
                  <Input
                    value={activeQuestion.correctAnswers.join(', ')}
                    onChange={(e) =>
                      updateActiveQuestion({
                        correctAnswers: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Contoh: extends, inherits, pewarisan"
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-400">
                    *Pengecekan tidak sensitif huruf besar/kecil (case-insensitive).
                  </p>
                </div>
              )}

              {/* Explanation Textarea */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Pembahasan / Penjelasan Soal (Tampil saat mahasiswa melihat review nilai)
                </label>
                <Input.TextArea
                  rows={2}
                  value={activeQuestion.explanation || ''}
                  onChange={(e) => updateActiveQuestion({ explanation: e.target.value })}
                  placeholder="Contoh: Mengapa jawaban ini benar..."
                  className="rounded-xl text-xs text-slate-600"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Pilih soal di sebelah kiri atau tambah soal baru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
