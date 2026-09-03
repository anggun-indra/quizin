import React, { useState } from 'react';
import { Modal, Input, InputNumber, Switch, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { Question } from '@/types';
import { 
  Sparkles, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  FileText, 
  Shuffle, 
  Eye, 
  CheckSquare, 
  Hash,
  Award
} from 'lucide-react';

interface CreateQuizModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (quizId: string) => void;
}

const generateRandomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'QZ-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Default sample questions for quick testing (General / Technology)
const getDefaultSampleQuestions = (): Question[] => [
  {
    id: `q_${Date.now()}_1`,
    order: 1,
    text: 'Protokol internet manakah yang digunakan untuk mengamankan komunikasi data melalui enkripsi TLS/SSL?',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'HTTP' },
      { id: 'opt_2', text: 'HTTPS' },
      { id: 'opt_3', text: 'FTP' },
      { id: 'opt_4', text: 'SMTP' },
    ],
    correctAnswers: ['opt_2'],
    explanation: 'HTTPS (Hypertext Transfer Protocol Secure) menggunakan enkripsi TLS/SSL untuk mengamankan pertukaran data di internet.',
  },
  {
    id: `q_${Date.now()}_2`,
    order: 2,
    text: 'Dalam komputasi awan (Cloud Computing), SaaS merupakan singkatan dari "Software as a Service".',
    type: 'TRUE_FALSE',
    points: 20,
    options: [
      { id: 'opt_t', text: 'Benar' },
      { id: 'opt_f', text: 'Salah' },
    ],
    correctAnswers: ['opt_t'],
    explanation: 'Benar. SaaS adalah model layanan cloud di mana perangkat lunak diakses melalui internet tanpa instalasi lokal.',
  },
  {
    id: `q_${Date.now()}_3`,
    order: 3,
    text: 'Format data pertukaran teks terbuka yang paling populer dan ringan berbasis pasangan key-value adalah...',
    type: 'SHORT_ANSWER',
    points: 20,
    options: [],
    correctAnswers: ['json', 'javascript object notation'],
    explanation: 'JSON (JavaScript Object Notation) adalah format pertukaran data standar yang ringkas dan mudah dibaca manusia serta mesin.',
  },
];

export const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const { createQuiz } = useQuiz();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState(generateRandomCode());
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [passingScore, setPassingScore] = useState<number>(70);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [showLiveScore, setShowLiveScore] = useState<boolean>(true);
  const [showAnswerDiscussion, setShowAnswerDiscussion] = useState<boolean>(true);
  const [includeSamples, setIncludeSamples] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim()) {
      message.warning('Harap masukkan judul kuis.');
      return;
    }
    if (!code.trim()) {
      message.warning('Harap tentukan kode kuis.');
      return;
    }

    setLoading(true);
    try {
      const questions = includeSamples ? getDefaultSampleQuestions() : [];
      const res = await createQuiz(
        title,
        code,
        description,
        subject,
        {
          durationMinutes: durationMinutes || 0,
          passingScore: passingScore || 70,
          shuffleQuestions,
          shuffleOptions,
          showLiveScore,
          showAnswerDiscussion,
        },
        questions,
        user
      );

      if (res.success && res.quiz) {
        onClose();
        if (onCreated) onCreated(res.quiz.id);
        // Reset form
        setTitle('');
        setSubject('');
        setDescription('');
        setCode(generateRandomCode());
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
      width={560}
      className="create-quiz-modal"
    >
      <div className="pt-2 pb-1 space-y-5">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Buat Kuis Baru
            </h2>
            <p className="text-xs text-slate-500">
              Atur informasi kuis, durasi waktu, dan bagikan kode akses ke peserta.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Judul Kuis <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kuis Pengetahuan Umum / Workshop & Pelatihan"
              size="large"
              className="rounded-xl font-semibold text-sm"
            />
          </div>

          {/* Subject & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Kategori / Topik Kuis
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Contoh: Teknologi / Pengetahuan Umum"
                size="large"
                className="rounded-xl font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center">
                  <Hash className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Kode Akses Kuis <span className="text-red-500 ml-0.5">*</span>
                </span>
                <button
                  type="button"
                  onClick={() => setCode(generateRandomCode())}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Acak Kode
                </button>
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="QZ-1234"
                size="large"
                className="rounded-xl font-mono font-bold text-slate-900 tracking-wider text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Petunjuk / Deskripsi Kuis (Opsional)
            </label>
            <Input.TextArea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Jawablah pertanyaan berikut dengan teliti. Selamat mengerjakan!"
              className="rounded-xl text-xs"
            />
          </div>

          {/* Quiz Settings */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Pengaturan Waktu & Skor
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Durasi Pengerjaan (Menit)
                </label>
                <InputNumber
                  min={0}
                  max={180}
                  value={durationMinutes}
                  onChange={(val) => setDurationMinutes(val || 0)}
                  className="w-full rounded-xl font-bold"
                  size="middle"
                  addonAfter="Menit (0=bebas)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center">
                  <Award className="w-3 h-3 mr-1 text-amber-500" />
                  Target Skor Minimum (KKM)
                </label>
                <InputNumber
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(val) => setPassingScore(val || 70)}
                  className="w-full rounded-xl font-bold"
                  size="middle"
                  addonAfter="/ 100"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                <span className="font-semibold text-slate-700 flex items-center">
                  <Shuffle className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Acak Urutan Soal
                </span>
                <Switch checked={shuffleQuestions} onChange={setShuffleQuestions} size="small" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                <span className="font-semibold text-slate-700 flex items-center">
                  <Shuffle className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Acak Pilihan Opsi
                </span>
                <Switch checked={shuffleOptions} onChange={setShuffleOptions} size="small" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                <span className="font-semibold text-slate-700 flex items-center">
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Tampilkan Nilai Langsung
                </span>
                <Switch checked={showLiveScore} onChange={setShowLiveScore} size="small" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100">
                <span className="font-semibold text-slate-700 flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  Tampilkan Pembahasan
                </span>
                <Switch checked={showAnswerDiscussion} onChange={setShowAnswerDiscussion} size="small" />
              </div>
            </div>

            {/* Include Samples checkbox */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">
                Sertakan 3 Contoh Soal Siap Pakai (Bisa diedit kapan saja)
              </span>
              <Switch checked={includeSamples} onChange={setIncludeSamples} size="small" />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleCreate}
            className="w-full h-12 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 border-0 flex items-center justify-center space-x-2 text-white shadow-md shadow-indigo-600/20"
          >
            <CheckSquare className="w-4 h-4 mr-1" />
            <span>Buat Kuis & Buka Ruang Kuis</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
