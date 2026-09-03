import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz } from '@/contexts/QuizContext';
import { 
  Sparkles, 
  LogOut, 
  ChevronDown, 
  Plus, 
  LogIn, 
  Edit3, 
  BookOpen
} from 'lucide-react';
import { Button, Dropdown, MenuProps } from 'antd';
import { CreateQuizModal } from '@/components/modals/CreateQuizModal';
import { JoinQuizModal } from '@/components/modals/JoinQuizModal';
import { CompleteProfileModal } from '@/components/modals/CompleteProfileModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { quizzes, activeQuiz, selectQuiz } = useQuiz();

  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [isJoinQuizOpen, setIsJoinQuizOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Filter quizzes the current user owns or has joined
  const myQuizzes = quizzes.filter(
    (q) =>
      (user && q.creatorUid === user.uid) ||
      (user && q.participants.some((p) => p.uid === user.uid || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())))
  );

  const quizMenuItems: MenuProps['items'] = [
    ...(myQuizzes.length > 0
      ? [
          {
            key: 'quiz-header',
            type: 'group' as const,
            label: 'Kuis Anda',
            children: myQuizzes.map((q) => {
              const isCreator = user && q.creatorUid === user.uid;
              const isSelected = activeQuiz?.id === q.id;
              return {
                key: q.id,
                label: (
                  <div className="py-1 max-w-[260px]">
                    <div className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-800'}`}>
                      {q.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Kode: {q.code} • {q.participants.length} Peserta {isCreator ? '• (Admin)' : ''}
                    </div>
                  </div>
                ),
                onClick: () => selectQuiz(q),
              };
            }),
          },
          {
            type: 'divider' as const,
          },
        ]
      : [
          {
            key: 'no-quiz',
            disabled: true,
            label: (
              <div className="py-1 text-xs text-slate-400 italic">
                Belum ada kuis yang diikuti
              </div>
            ),
          },
          {
            type: 'divider' as const,
          },
        ]),
    {
      key: 'add-quiz',
      label: (
        <div className="flex items-center text-xs font-bold text-indigo-600 py-1">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Buat Kuis Baru
        </div>
      ),
      onClick: () => setIsCreateQuizOpen(true),
    },
    {
      key: 'join-quiz',
      label: (
        <div className="flex items-center text-xs font-bold text-slate-700 py-1">
          <LogIn className="w-3.5 h-3.5 mr-1.5" />
          Gabung Kuis dengan Kode
        </div>
      ),
      onClick: () => setIsJoinQuizOpen(true),
    },
  ];

  const profileMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div className="py-1 max-w-[220px]">
          <div className="font-bold text-xs text-slate-900 truncate">
            {user?.fullName}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            ID: {user?.identifier || '(Belum diset)'}
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {user?.email}
          </div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'edit-profile',
      label: (
        <div className="flex items-center text-xs font-semibold text-slate-700 py-1">
          <Edit3 className="w-3.5 h-3.5 mr-2 text-indigo-600" />
          Edit Profil (Nama & ID)
        </div>
      ),
      onClick: () => setIsEditProfileOpen(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <div className="flex items-center text-xs font-semibold py-1">
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Keluar (Logout)
        </div>
      ),
      onClick: logout,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
              <button
                type="button"
                onClick={() => selectQuiz(null)}
                className="flex items-center space-x-2 text-left focus:outline-none group flex-shrink-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                      QuizIn
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      Pro
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium hidden md:block">
                    Platform Kuis Realtime Interaktif
                  </div>
                </div>
              </button>

              {/* Active Quiz Selector Dropdown (Desktop & Tablet) */}
              <Dropdown menu={{ items: quizMenuItems }} trigger={['click']} placement="bottomLeft">
                <button
                  type="button"
                  className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors ml-1 sm:ml-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="max-w-[120px] lg:max-w-[180px] truncate">
                    {activeQuiz ? activeQuiz.title : 'Pilih Kuis...'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </Dropdown>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              {/* Quick Actions (Mobile Icon, Desktop Text) */}
              <Button
                type="dashed"
                onClick={() => setIsJoinQuizOpen(true)}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 text-slate-700 border-slate-300 hover:border-slate-400"
                title="Gabung Kuis"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gabung</span>
              </Button>

              <Button
                type="primary"
                onClick={() => setIsCreateQuizOpen(true)}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 border-0 flex items-center justify-center space-x-1 text-white shadow-sm"
                title="Buat Kuis"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buat Kuis</span>
              </Button>

              {/* User Profile Dropdown */}
              {user && (
                <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 p-1 sm:px-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                      alt=""
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white flex-shrink-0"
                    />
                    <div className="hidden lg:block text-left">
                      <div className="text-xs font-bold text-slate-800 truncate max-w-[110px]">
                        {user.fullName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {user.identifier ? `ID: ${user.identifier}` : 'Set ID'}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </button>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <CreateQuizModal
        open={isCreateQuizOpen}
        onClose={() => setIsCreateQuizOpen(false)}
        onCreated={(quizId) => {
          const created = quizzes.find((q) => q.id === quizId);
          if (created) selectQuiz(created);
        }}
      />

      <JoinQuizModal
        open={isJoinQuizOpen}
        onClose={() => setIsJoinQuizOpen(false)}
        onJoined={(quizId) => {
          const joined = quizzes.find((q) => q.id === quizId);
          if (joined) selectQuiz(joined);
        }}
      />

      <CompleteProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        canDismiss={true}
      />
    </>
  );
};
