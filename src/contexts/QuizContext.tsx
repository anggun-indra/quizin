import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Quiz, 
  Question, 
  QuizParticipant, 
  QuizStatus, 
  UserProfile, 
  ParticipantAnswer, 
  QuizSubmission, 
  QuestionGradingResult 
} from '@/types';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc,
  getDocs,
  query,
  where,
  runTransaction
} from '@/lib/firebase';
import { message } from 'antd';
import confetti from 'canvas-confetti';

interface QuizContextType {
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  activeSubmission: QuizSubmission | null;
  isLoading: boolean;
  selectQuiz: (quiz: Quiz | null) => void;

  // Admin Actions
  createQuiz: (
    title: string,
    code: string,
    description: string,
    subject: string,
    settings: Quiz['settings'],
    questions: Question[],
    creatorUser: UserProfile
  ) => Promise<{ success: boolean; quiz?: Quiz; error?: string }>;
  updateQuiz: (quizId: string, updates: Partial<Quiz>) => Promise<boolean>;
  deleteQuiz: (quizId: string) => Promise<boolean>;
  updateQuizStatus: (quizId: string, status: QuizStatus) => Promise<boolean>;
  saveQuestions: (quizId: string, questions: Question[]) => Promise<boolean>;
  kickParticipant: (quizId: string, participantUid: string) => Promise<boolean>;
  resetQuizParticipants: (quizId: string) => Promise<boolean>;
  fetchSubmission: (quizId: string, participantUid: string) => Promise<QuizSubmission | null>;

  // Participant Actions
  joinQuizByCode: (code: string, user: UserProfile) => Promise<{ success: boolean; quiz?: Quiz; error?: string }>;
  leaveQuiz: (quizId: string, user: UserProfile) => Promise<boolean>;
  startQuizTaking: (quizId: string, user: UserProfile) => Promise<boolean>;
  submitQuizAnswers: (
    quizId: string,
    user: UserProfile,
    answers: Record<string, ParticipantAnswer>,
    timeSpentSeconds: number
  ) => Promise<{ success: boolean; submission?: QuizSubmission; error?: string }>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    try {
      const saved = localStorage.getItem('quizin_cached_quizzes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(() => {
    return localStorage.getItem('quizin_active_quiz_id') || null;
  });

  const [activeSubmission, setActiveSubmission] = useState<QuizSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync caches
  useEffect(() => {
    if (quizzes.length > 0) {
      localStorage.setItem('quizin_cached_quizzes', JSON.stringify(quizzes));
    }
  }, [quizzes]);

  useEffect(() => {
    if (activeQuizId) {
      localStorage.setItem('quizin_active_quiz_id', activeQuizId);
    } else {
      localStorage.removeItem('quizin_active_quiz_id');
      setActiveSubmission(null);
    }
  }, [activeQuizId]);

  // Realtime Firestore Listener for Quizzes with direct backup fetch
  useEffect(() => {
    if (!db || !db.app) return;

    let unsubQuizzes: (() => void) | undefined;

    const fetchDirect = async () => {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        const list: Quiz[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as Quiz);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (list.length > 0) {
          setQuizzes(list);
        }
      } catch (err) {
        console.warn('Initial direct quiz fetch note:', err);
      }
    };

    // 1. Initial direct fetch immediately
    fetchDirect();

    // 2. Realtime onSnapshot listener
    try {
      const quizzesCol = collection(db, 'quizzes');
      unsubQuizzes = onSnapshot(
        quizzesCol,
        (snap) => {
          const list: Quiz[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as Quiz);
          });
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setQuizzes(list);
        },
        (err) => {
          console.warn('Quizzes listener note:', err);
          // Fallback direct getDocs if snapshot encounters any transient error
          fetchDirect();
        }
      );
    } catch (e) {
      console.warn('Firebase snapshot init warning:', e);
    }

    return () => {
      if (unsubQuizzes) unsubQuizzes();
    };
  }, []);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || null;

  const selectQuiz = (quiz: Quiz | null) => {
    setActiveQuizId(quiz ? quiz.id : null);
  };

  // 1. CREATE QUIZ
  const createQuiz = async (
    title: string,
    code: string,
    description: string,
    subject: string,
    settings: Quiz['settings'],
    questions: Question[],
    creatorUser: UserProfile
  ): Promise<{ success: boolean; quiz?: Quiz; error?: string }> => {
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return { success: false, error: 'Kode kuis tidak boleh kosong.' };
    if (!title.trim()) return { success: false, error: 'Judul kuis tidak boleh kosong.' };

    const existing = quizzes.find((q) => q.code.toUpperCase() === cleanCode);
    if (existing) {
      return { success: false, error: `Kode kuis [${cleanCode}] sudah digunakan. Pilih kode lain.` };
    }

    const newQuizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newQuiz: Quiz = {
      id: newQuizId,
      code: cleanCode,
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      creatorUid: creatorUser.uid,
      creatorEmail: creatorUser.email,
      creatorName: creatorUser.fullName,
      status: 'WAITING',
      settings,
      questions,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsLoading(true);
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', newQuizId), newQuiz);
      }
      setQuizzes((prev) => [newQuiz, ...prev]);
      setActiveQuizId(newQuizId);
      message.success(`Kuis [${title}] berhasil dibuat dengan kode [${cleanCode}]!`);
      return { success: true, quiz: newQuiz };
    } catch (err: any) {
      console.error('Create quiz error:', err);
      message.error('Gagal membuat kuis.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // 2. UPDATE QUIZ METADATA / SETTINGS
  const updateQuiz = async (quizId: string, updates: Partial<Quiz>): Promise<boolean> => {
    try {
      const updatedTime = new Date().toISOString();
      const updatedPayload = { ...updates, updatedAt: updatedTime };

      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), updatedPayload, { merge: true });
      }

      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, ...updatedPayload } : q))
      );
      message.success('Kuis berhasil diperbarui!');
      return true;
    } catch (err) {
      console.error('Update quiz error:', err);
      message.error('Gagal memperbarui kuis.');
      return false;
    }
  };

  // 3. DELETE QUIZ
  const deleteQuiz = async (quizId: string): Promise<boolean> => {
    try {
      if (db && db.app) {
        await deleteDoc(doc(db, 'quizzes', quizId));
      }
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      if (activeQuizId === quizId) {
        setActiveQuizId(null);
      }
      message.success('Kuis berhasil dihapus.');
      return true;
    } catch (err) {
      console.error('Delete quiz error:', err);
      message.error('Gagal menghapus kuis.');
      return false;
    }
  };

  // 4. UPDATE STATUS (WAITING / ACTIVE / ENDED)
  const updateQuizStatus = async (quizId: string, status: QuizStatus): Promise<boolean> => {
    try {
      const updatedTime = new Date().toISOString();
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { status, updatedAt: updatedTime }, { merge: true });
      }

      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, status, updatedAt: updatedTime } : q))
      );

      const statusLabels: Record<QuizStatus, string> = {
        DRAFT: 'Draft',
        WAITING: 'Menunggu Peserta (Lobby Buka)',
        ACTIVE: 'Kuis Dimulai (Sedang Berlangsung)',
        ENDED: 'Kuis Selesai / Ditutup',
      };
      message.info(`Status kuis diubah: ${statusLabels[status]}`);
      return true;
    } catch (err) {
      console.error('Update quiz status error:', err);
      message.error('Gagal mengubah status kuis.');
      return false;
    }
  };

  // 5. SAVE QUESTIONS LIST
  const saveQuestions = async (quizId: string, questions: Question[]): Promise<boolean> => {
    try {
      const updatedTime = new Date().toISOString();
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { questions, updatedAt: updatedTime }, { merge: true });
      }
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, questions, updatedAt: updatedTime } : q))
      );
      message.success('Daftar soal kuis berhasil disimpan!');
      return true;
    } catch (err) {
      console.error('Save questions error:', err);
      message.error('Gagal menyimpan soal kuis.');
      return false;
    }
  };

  // 6. KICK PARTICIPANT
  const kickParticipant = async (quizId: string, participantUid: string): Promise<boolean> => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) return false;

    const filtered = targetQuiz.participants.filter((p) => p.uid !== participantUid);
    try {
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { participants: filtered }, { merge: true });
      }
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, participants: filtered } : q))
      );
      message.info('Peserta berhasil dikeluarkan dari kuis.');
      return true;
    } catch (err) {
      console.error('Kick participant error:', err);
      return false;
    }
  };

  // 7. RESET PARTICIPANTS
  const resetQuizParticipants = async (quizId: string): Promise<boolean> => {
    try {
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { participants: [] }, { merge: true });
      }
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, participants: [] } : q))
      );
      message.success('Daftar peserta berhasil direset.');
      return true;
    } catch (err) {
      console.error('Reset participants error:', err);
      return false;
    }
  };

  // 8. FETCH SUBMISSION DETAIL
  const fetchSubmission = async (quizId: string, participantUid: string): Promise<QuizSubmission | null> => {
    const submissionId = `${quizId}_${participantUid}`;
    try {
      if (db && db.app) {
        const snap = await getDoc(doc(db, 'quiz_submissions', submissionId));
        if (snap.exists()) {
          return snap.data() as QuizSubmission;
        }
      }
      // Check local cache
      const cached = localStorage.getItem(`quizin_sub_${submissionId}`);
      if (cached) return JSON.parse(cached);
      return null;
    } catch (e) {
      console.warn('Fetch submission note:', e);
      return null;
    }
  };

  // 9. JOIN QUIZ BY CODE (Robust: Memory Check + Direct Firestore Query with auto formatting)
  const joinQuizByCode = async (
    code: string,
    user: UserProfile
  ): Promise<{ success: boolean; quiz?: Quiz; error?: string }> => {
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode) return { success: false, error: 'Masukkan kode kuis.' };

    // 1. Try finding in-memory first
    let targetQuiz = quizzes.find((q) => {
      const qCode = q.code.toUpperCase().replace(/\s+/g, '');
      return qCode === cleanCode || qCode.replace(/-/g, '') === cleanCode.replace(/-/g, '');
    });

    // 2. If not found in memory, query Firestore directly!
    if (!targetQuiz && db && db.app) {
      try {
        const qCol = collection(db, 'quizzes');
        
        // Exact query
        let qQuery = query(qCol, where('code', '==', cleanCode));
        let snap = await getDocs(qQuery);

        // Try with hyphen e.g. QZ-BJRJ if user typed QZBJRJ
        if (snap.empty && !cleanCode.includes('-')) {
          const formatted = cleanCode.startsWith('QZ')
            ? `QZ-${cleanCode.slice(2)}`
            : `QZ-${cleanCode}`;
          const qQuery2 = query(qCol, where('code', '==', formatted));
          snap = await getDocs(qQuery2);
        }

        // Try without hyphen if user typed QZ-BJRJ
        if (snap.empty && cleanCode.includes('-')) {
          const stripped = cleanCode.replace(/-/g, '');
          const qQuery3 = query(qCol, where('code', '==', stripped));
          snap = await getDocs(qQuery3);
        }

        if (!snap.empty) {
          targetQuiz = snap.docs[0].data() as Quiz;
          // Synchronize into state immediately
          setQuizzes((prev) => {
            const exists = prev.some((q) => q.id === targetQuiz!.id);
            return exists
              ? prev.map((q) => (q.id === targetQuiz!.id ? targetQuiz! : q))
              : [targetQuiz!, ...prev];
          });
        }
      } catch (err) {
        console.warn('Direct Firestore query error:', err);
      }
    }

    if (!targetQuiz) {
      return { success: false, error: `Kuis dengan kode [${cleanCode}] tidak ditemukan.` };
    }

    if (targetQuiz.status === 'ENDED') {
      return { success: false, error: 'Kuis ini sudah selesai dan ditutup oleh pembuat kuis.' };
    }

    // Check if already in participants list
    const existingIndex = targetQuiz.participants.findIndex(
      (p) => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
    );

    const now = new Date().toISOString();
    let updatedParticipants: QuizParticipant[];

    if (existingIndex >= 0) {
      // Already joined, keep existing status
      updatedParticipants = [...targetQuiz.participants];
      updatedParticipants[existingIndex] = {
        ...updatedParticipants[existingIndex],
        fullName: user.fullName,
        identifier: user.identifier || updatedParticipants[existingIndex].identifier,
        avatarUrl: user.avatarUrl || updatedParticipants[existingIndex].avatarUrl,
      };
    } else {
      // New participant
      const newParticipant: QuizParticipant = {
        uid: user.uid,
        identifier: user.identifier || 'N/A',
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        joinedAt: now,
        status: 'JOINED',
      };
      updatedParticipants = [...targetQuiz.participants, newParticipant];
    }

    try {
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', targetQuiz.id), { participants: updatedParticipants }, { merge: true });
      }

      setQuizzes((prev) =>
        prev.map((q) => (q.id === targetQuiz.id ? { ...q, participants: updatedParticipants } : q))
      );
      setActiveQuizId(targetQuiz.id);
      message.success(`Berhasil bergabung ke kuis: ${targetQuiz.title}!`);
      return { success: true, quiz: { ...targetQuiz, participants: updatedParticipants } };
    } catch (err: any) {
      console.error('Join quiz error:', err);
      return { success: false, error: err.message };
    }
  };

  // 10. LEAVE QUIZ
  const leaveQuiz = async (quizId: string, user: UserProfile): Promise<boolean> => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) return false;

    const filtered = targetQuiz.participants.filter(
      (p) => p.uid !== user.uid && (!p.email || !user.email || p.email.toLowerCase() !== user.email.toLowerCase())
    );

    try {
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { participants: filtered }, { merge: true });
      }
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, participants: filtered } : q))
      );
      if (activeQuizId === quizId) {
        setActiveQuizId(null);
      }
      message.info('Anda telah keluar dari kuis.');
      return true;
    } catch (err) {
      console.error('Leave quiz error:', err);
      return false;
    }
  };

  // 11. START TAKING QUIZ (Change participant status to IN_PROGRESS)
  const startQuizTaking = async (quizId: string, user: UserProfile): Promise<boolean> => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) return false;

    const existing = targetQuiz.participants.find((p) => p.uid === user.uid);
    if (existing && existing.status === 'SUBMITTED') {
      message.info('Anda sudah mengumpulkan kuis ini.');
      return true;
    }

    const now = new Date().toISOString();
    const updatedParticipants = targetQuiz.participants.map((p) => {
      if (p.uid === user.uid) {
        return {
          ...p,
          status: 'IN_PROGRESS' as const,
          startedAt: p.startedAt || now,
        };
      }
      return p;
    });

    try {
      if (db && db.app) {
        await setDoc(doc(db, 'quizzes', quizId), { participants: updatedParticipants }, { merge: true });
      }
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, participants: updatedParticipants } : q))
      );
      return true;
    } catch (err) {
      console.error('Start quiz taking error:', err);
      return false;
    }
  };

  // 12. SUBMIT QUIZ & AUTO-GRADE
  const submitQuizAnswers = async (
    quizId: string,
    user: UserProfile,
    answers: Record<string, ParticipantAnswer>,
    timeSpentSeconds: number
  ): Promise<{ success: boolean; submission?: QuizSubmission; error?: string }> => {
    const targetQuiz = quizzes.find((q) => q.id === quizId);
    if (!targetQuiz) return { success: false, error: 'Kuis tidak ditemukan.' };

    const questions = targetQuiz.questions;
    let earnedTotalScore = 0;
    let maxTotalScore = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnanswered = 0;

    const questionResults: Record<string, QuestionGradingResult> = {};

    questions.forEach((q) => {
      const qPoints = q.points || 10;
      maxTotalScore += qPoints;

      const userAns = answers[q.id];
      const userSelected = userAns?.selectedOptionIds || [];
      const userText = (userAns?.textAnswer || '').trim().toLowerCase();

      let isCorrect = false;

      if (q.type === 'SHORT_ANSWER') {
        // Match text with acceptable correct answers (case-insensitive)
        const acceptable = q.correctAnswers.map((a) => a.trim().toLowerCase());
        if (!userText) {
          totalUnanswered++;
        } else if (acceptable.includes(userText)) {
          isCorrect = true;
          totalCorrect++;
        } else {
          totalIncorrect++;
        }
      } else if (q.type === 'MULTIPLE_CHOICE') {
        // Multiple response: all selected must match correct answers
        const correctSet = new Set(q.correctAnswers);
        const userSet = new Set(userSelected);
        if (userSelected.length === 0) {
          totalUnanswered++;
        } else if (
          correctSet.size === userSet.size &&
          [...correctSet].every((val) => userSet.has(val))
        ) {
          isCorrect = true;
          totalCorrect++;
        } else {
          totalIncorrect++;
        }
      } else {
        // SINGLE_CHOICE and TRUE_FALSE
        if (userSelected.length === 0) {
          totalUnanswered++;
        } else if (q.correctAnswers.includes(userSelected[0])) {
          isCorrect = true;
          totalCorrect++;
        } else {
          totalIncorrect++;
        }
      }

      const pointsEarned = isCorrect ? qPoints : 0;
      earnedTotalScore += pointsEarned;

      questionResults[q.id] = {
        isCorrect,
        earnedPoints: pointsEarned,
        maxPoints: qPoints,
        userAnswers: q.type === 'SHORT_ANSWER' ? [userAns?.textAnswer || ''] : userSelected,
        correctAnswers: q.correctAnswers,
        explanation: q.explanation,
      };
    });

    const percentage = maxTotalScore > 0 ? Math.round((earnedTotalScore / maxTotalScore) * 100) : 0;
    const now = new Date().toISOString();
    const submissionId = `${quizId}_${user.uid}`;

    const submission: QuizSubmission = {
      id: submissionId,
      quizId,
      participantUid: user.uid,
      participantName: user.fullName,
      participantIdentifier: user.identifier || '',
      participantEmail: user.email,
      answers,
      questionResults,
      score: earnedTotalScore,
      maxScore: maxTotalScore,
      percentage,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      startedAt: now,
      submittedAt: now,
      timeSpentSeconds,
    };

    // Update participant record inside Quiz
    const updatedParticipants = targetQuiz.participants.map((p) => {
      if (p.uid === user.uid) {
        return {
          ...p,
          status: 'SUBMITTED' as const,
          submittedAt: now,
          score: earnedTotalScore,
          maxScore: maxTotalScore,
          percentage,
          totalCorrect,
          totalIncorrect,
          totalUnanswered,
          timeSpentSeconds,
        };
      }
      return p;
    });

    try {
      if (db && db.app) {
        // Save submission doc
        await setDoc(doc(db, 'quiz_submissions', submissionId), submission);
        // Update quiz participant array
        await setDoc(doc(db, 'quizzes', quizId), { participants: updatedParticipants }, { merge: true });
      }

      // Save locally
      localStorage.setItem(`quizin_sub_${submissionId}`, JSON.stringify(submission));
      setActiveSubmission(submission);

      setQuizzes((prev) =>
        prev.map((q) => (q.id === quizId ? { ...q, participants: updatedParticipants } : q))
      );

      // Confetti celebration if passed
      if (percentage >= targetQuiz.settings.passingScore) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      message.success(`Kuis selesai! Skor Anda: ${percentage}/100`);
      return { success: true, submission };
    } catch (err: any) {
      console.error('Submit quiz error:', err);
      // Fallback save to local state
      setActiveSubmission(submission);
      return { success: true, submission };
    }
  };

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        activeQuiz,
        activeSubmission,
        isLoading,
        selectQuiz,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        updateQuizStatus,
        saveQuestions,
        kickParticipant,
        resetQuizParticipants,
        fetchSubmission,
        joinQuizByCode,
        leaveQuiz,
        startQuizTaking,
        submitQuizAnswers,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
