import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { Quiz } from '@/types';
import { Share2, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface ShareQuizModalProps {
  quiz: Quiz | null;
  open: boolean;
  onClose: () => void;
}

export const ShareQuizModal: React.FC<ShareQuizModalProps> = ({ quiz, open, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!quiz) return null;

  const joinUrl = `${window.location.origin}?code=${quiz.code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(quiz.code);
    setCopiedCode(true);
    message.success(`Kode kuis [${quiz.code}] disalin!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    message.success('Tautan kuis berhasil disalin!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Halo teman-teman! Silakan bergabung ke kuis *${quiz.title}* di QuizIn:\n\n` +
      `🌐 Link: ${joinUrl}\n` +
      `🔑 Kode Kuis: *${quiz.code}*\n\n` +
      `Pastikan sudah login dengan akun Google dan mengisi NIM Anda.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      centered
      width={460}
      className="share-quiz-modal"
    >
      <div className="pt-2 pb-1 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 mx-auto flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Bagikan Kuis
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {quiz.title}
          </p>
        </div>

        {/* Big Code Card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Kode Akses Mahasiswa
          </span>
          <div className="text-3xl font-mono font-black text-indigo-700 tracking-widest">
            {quiz.code}
          </div>
          <Button
            size="middle"
            onClick={handleCopyCode}
            className="rounded-xl font-bold text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button
            size="large"
            onClick={handleWhatsAppShare}
            className="w-full h-11 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex items-center justify-center space-x-2 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Bagikan ke Grup WhatsApp</span>
          </Button>

          <Button
            size="large"
            onClick={handleCopyLink}
            className="w-full h-11 rounded-xl font-bold text-xs bg-white border border-slate-300 hover:border-indigo-600 text-slate-700 flex items-center justify-center space-x-2"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4" />}
            <span>{copiedLink ? 'Tautan Tersalin!' : 'Salin Tautan Langsung'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
