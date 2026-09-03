import * as XLSX from 'xlsx';
import { Quiz } from '@/types';

export const exportQuizResultsToExcel = (quiz: Quiz) => {
  // Sort participants by percentage/score descending
  const sortedParticipants = [...quiz.participants].sort((a, b) => {
    const scoreA = a.score || 0;
    const scoreB = b.score || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (a.timeSpentSeconds || 999999) - (b.timeSpentSeconds || 999999);
  });

  const rows = sortedParticipants.map((p, index) => {
    const timeSpent = p.timeSpentSeconds
      ? `${Math.floor(p.timeSpentSeconds / 60)}m ${p.timeSpentSeconds % 60}s`
      : '-';

    return {
      'Peringkat': index + 1,
      'NIM / ID': p.identifier,
      'Nama Lengkap': p.fullName,
      'Email': p.email,
      'Status': p.status === 'SUBMITTED' ? 'Selesai' : p.status === 'IN_PROGRESS' ? 'Mengerjakan' : 'Hadir',
      'Skor Diperoleh': p.score ?? 0,
      'Skor Maksimal': p.maxScore ?? 0,
      'Nilai Akhir (/100)': p.percentage ?? 0,
      'Status KKM': (p.percentage ?? 0) >= quiz.settings.passingScore ? 'LULUS' : 'REMIDI',
      'Benar': p.totalCorrect ?? 0,
      'Salah': p.totalIncorrect ?? 0,
      'Dilewati': p.totalUnanswered ?? 0,
      'Durasi': timeSpent,
      'Waktu Submit': p.submittedAt ? new Date(p.submittedAt).toLocaleString('id-ID') : '-',
    };
  });

  // Calculate statistics
  const submitted = sortedParticipants.filter(p => p.status === 'SUBMITTED');
  const avgScore = submitted.length > 0 
    ? (submitted.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / submitted.length).toFixed(1)
    : '0';
  const highestScore = submitted.length > 0 ? Math.max(...submitted.map(p => p.percentage || 0)) : 0;
  const lowestScore = submitted.length > 0 ? Math.min(...submitted.map(p => p.percentage || 0)) : 0;
  const passedCount = submitted.filter(p => (p.percentage || 0) >= quiz.settings.passingScore).length;

  const summaryRows = [
    { 'Peringkat': '', 'NIM / ID': '', 'Nama Lengkap': '' },
    { 'Peringkat': 'RINGKASAN KUIS', 'NIM / ID': quiz.title, 'Nama Lengkap': `Kode: ${quiz.code}` },
    { 'Peringkat': 'Mata Kuliah', 'NIM / ID': quiz.subject || '-', 'Nama Lengkap': `Total Soal: ${quiz.questions.length}` },
    { 'Peringkat': 'Standar KKM', 'NIM / ID': `${quiz.settings.passingScore}`, 'Nama Lengkap': `Rata-rata: ${avgScore}` },
    { 'Peringkat': 'Tertinggi / Terendah', 'NIM / ID': `${highestScore} / ${lowestScore}`, 'Nama Lengkap': `Lulus: ${passedCount}/${submitted.length}` },
    { 'Peringkat': '', 'NIM / ID': '', 'Nama Lengkap': '' },
  ];

  const worksheet = XLSX.utils.json_to_sheet([...summaryRows, ...rows]);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 }, // Peringkat
    { wch: 16 }, // NIM
    { wch: 28 }, // Nama Lengkap
    { wch: 25 }, // Email
    { wch: 14 }, // Status
    { wch: 14 }, // Skor Diperoleh
    { wch: 14 }, // Skor Maksimal
    { wch: 16 }, // Nilai Akhir
    { wch: 12 }, // Status KKM
    { wch: 8 },  // Benar
    { wch: 8 },  // Salah
    { wch: 10 }, // Dilewati
    { wch: 12 }, // Durasi
    { wch: 22 }, // Waktu Submit
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Kuis');

  const safeTitle = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
  const fileName = `Rekap_Nilai_${safeTitle}_${quiz.code}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
