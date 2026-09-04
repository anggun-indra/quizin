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

// Default sample questions: Pertemuan 03 (Internet, Search & Literasi Digital)
const getDefaultSampleQuestions = (): Question[] => [
  {
    id: `q_${Date.now()}_1`,
    order: 1,
    text: 'Ketika pengguna mengetik kata kunci di Google, mesin pencari pada dasarnya akan mencari informasi dari ...',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'seluruh internet secara langsung pada saat tombol Enter ditekan' },
      { id: 'opt_2', text: 'indeks halaman web yang sebelumnya telah dikumpulkan oleh mesin pencari' },
      { id: 'opt_3', text: 'hanya situs yang berada di halaman pertama Google' },
      { id: 'opt_4', text: 'database milik pemerintah dan institusi pendidikan' },
    ],
    correctAnswers: ['opt_2'],
    explanation: 'Search engine bekerja menggunakan indeks yang sebelumnya telah dikumpulkan dan disusun oleh web crawler, bukan menjelajahi seluruh internet secara langsung pada saat tombol Enter ditekan.',
  },
  {
    id: `q_${Date.now()}_2`,
    order: 2,
    text: 'Seorang mahasiswa ingin mencari laporan resmi Bank Indonesia dalam format PDF tentang pembayaran digital pada periode 2024–2025. Query yang paling efektif adalah ...',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'pembayaran digital Indonesia' },
      { id: 'opt_2', text: '"pembayaran digital" 2024 2025' },
      { id: 'opt_3', text: 'site:bi.go.id filetype:pdf "pembayaran digital" 2024..2025' },
      { id: 'opt_4', text: 'pembayaran digital OR Bank Indonesia' },
    ],
    correctAnswers: ['opt_3'],
    explanation: 'Operator site:bi.go.id membatasi domain ke situs resmi Bank Indonesia, filetype:pdf membatasi format PDF, tanda kutip mencari frase persis, dan 2024..2025 menentukan rentang tahun.',
  },
  {
    id: `q_${Date.now()}_3`,
    order: 3,
    text: 'Seorang mahasiswa menemukan klaim bahwa “90% masyarakat Indonesia sudah menggunakan pembayaran digital.” Ia kemudian mencari sumber asli yang pertama kali menerbitkan angka tersebut dan memeriksa konteks sampelnya. Langkah SIFT yang sedang dilakukan adalah ...',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'Stop' },
      { id: 'opt_2', text: 'Investigate the Source' },
      { id: 'opt_3', text: 'Find Better Coverage' },
      { id: 'opt_4', text: 'Trace Claims' },
    ],
    correctAnswers: ['opt_4'],
    explanation: 'Langkah SIFT yang dilakukan adalah Trace Claims (melacak klaim, kutipan, dan media ke sumber asli serta konteks aslinya).',
  },
  {
    id: `q_${Date.now()}_4`,
    order: 4,
    text: 'Sebuah laporan industri menyebutkan bahwa penggunaan dompet digital sangat tinggi di Indonesia. Sebelum menggunakan laporan tersebut, mahasiswa memeriksa wilayah survei, periode penelitian, jumlah responden, dan karakteristik sampel. Dalam AACODS, aspek yang sedang diperiksa terutama adalah ...',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'Authority' },
      { id: 'opt_2', text: 'Coverage' },
      { id: 'opt_3', text: 'Objectivity' },
      { id: 'opt_4', text: 'Significance' },
    ],
    correctAnswers: ['opt_2'],
    explanation: 'Dalam metode evaluasi AACODS, Coverage (cakupan) menilai batasan penelitian, wilayah survei, periode waktu, jumlah responden, dan karakteristik sampel yang digunakan.',
  },
  {
    id: `q_${Date.now()}_5`,
    order: 5,
    text: 'Mahasiswa menemukan dua sumber kredibel yang memberikan angka berbeda mengenai suatu tren bisnis. Tindakan yang paling tepat sesuai materi perkuliahan adalah ...',
    type: 'SINGLE_CHOICE',
    points: 20,
    options: [
      { id: 'opt_1', text: 'memilih angka yang paling tinggi karena lebih menarik untuk laporan' },
      { id: 'opt_2', text: 'memilih sumber yang muncul paling atas di Google' },
      { id: 'opt_3', text: 'membandingkan definisi, periode, populasi, dan metode kedua sumber serta mencari sumber ketiga sebagai pembanding' },
      { id: 'opt_4', text: 'meminta AI menentukan sumber mana yang benar tanpa membuka dokumen aslinya' },
    ],
    correctAnswers: ['opt_3'],
    explanation: 'Triangulasi sumber dilakukan dengan membandingkan definisi, periode, populasi, dan metodologi dari kedua sumber, serta mencari sumber ketiga yang kredibel sebagai pembanding objektif.',
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
              placeholder="Contoh: Aplikasi Komputer — Pertemuan 03"
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
                placeholder="Contoh: Internet, Search & Literasi Digital"
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
              placeholder="Contoh: Jawablah pertanyaan pilihan ganda berikut dengan teliti. Selamat mengerjakan!"
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
                Sertakan 5 Soal Pertemuan 03 Siap Pakai (Bisa diedit kapan saja)
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
