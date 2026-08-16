import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { formatFCFA } from '../../services/calculationService';
import { Heart, Copy, Check, MessageCircle, Sparkles, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DONATION_PHONE_NUMBER = '73 38 67 43';
export const DONATION_PHONE_FULL = '+221 73 38 67 43';

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(5000);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const predefinedAmounts = [5000, 10000, 20000, 50000];

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('73386743');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmDonation = () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });
    setHasConfirmed(true);
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour ! Je viens d'effectuer un don de ${selectedAmount ? formatFCFA(selectedAmount) : 'soutien'} pour encourager le développement de FereWari.`
  );
  const whatsappUrl = `https://wa.me/22173386743?text=${whatsappMessage}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Soutenir le Projet FereWari"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Header Hero Banner */}
        <div className="p-4 rounded-2xl bg-ocean-gradient text-white text-center space-y-2 relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white">
            <Heart className="w-6 h-6 fill-white text-white animate-pulse" />
          </div>
          <h3 className="text-xl sm:text-2xl font-display font-black tracking-tight">
            FereWari est libre & gratuit !
          </h3>
          <p className="text-xs text-brand-pale max-w-sm mx-auto leading-relaxed">
            Votre soutien financier volontaire permet de maintenir l'application, d'ajouter de nouvelles fonctionnalités et d'aider les artisans locaux.
          </p>
        </div>

        {/* Suggested Donation Amounts */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Choisissez un montant de soutien suggéré :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {predefinedAmounts.map((amount) => {
              const isSelected = selectedAmount === amount;
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setSelectedAmount(amount); setHasConfirmed(false); }}
                  className={`py-2.5 px-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary text-white font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-vibrant/40 font-medium'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-display font-black block">
                    {formatFCFA(amount)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Deposit Box */}
        <Card variant="pale" className="p-4 space-y-3 border-brand-subtle">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-brand-primary shrink-0" />
            <span className="text-xs uppercase font-bold text-brand-navy tracking-wider">
              Numéro de Dépôt Orange Money & Wave
            </span>
          </div>

          {/* Number Display & Copy Button */}
          <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-brand-subtle/80 shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">
                Orange Money / Wave
              </span>
              <span className="text-xl sm:text-2xl font-display font-black text-brand-navy tracking-wider">
                73 38 67 43
              </span>
            </div>

            <Button
              variant={copied ? 'vibrant' : 'outline'}
              size="sm"
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyPhone}
            >
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Orange Money</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span className="font-semibold text-slate-700">Wave</span>
            </div>
            <span className="text-[11px] text-slate-500">
              Dépôt direct sans frais
            </span>
          </div>
        </Card>

        {/* Action Confirmation & WhatsApp Link */}
        {hasConfirmed ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Merci infiniment pour votre soutien à FereWari !
            </div>
            <p className="text-xs text-emerald-700">
              Vous pouvez nous envoyer un message sur WhatsApp pour confirmer votre don.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Notifier sur WhatsApp (+221 73 38 67 43)
            </a>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="vibrant"
              size="md"
              icon={<Heart className="w-4 h-4" />}
              onClick={handleConfirmDonation}
              className="flex-1 shadow-md"
            >
              J'ai effectué mon don
            </Button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};
