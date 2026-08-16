import React, { useState } from 'react';
import { db } from '../../db/db';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Lock, Store, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError("Veuillez saisir le nom de votre entreprise ou atelier.");
      return;
    }

    if (!pinCode || pinCode.length < 4) {
      setError("Le code PIN doit comporter au moins 4 chiffres.");
      return;
    }

    if (pinCode !== confirmPin) {
      setError("Les deux codes PIN ne correspondent pas. Veuillez vérifier.");
      return;
    }

    setIsLoading(true);
    try {
      await db.settings.put({
        id: 'current_user_profile',
        userName: trimmedName,
        pinCode: pinCode,
        isConfigured: true,
        trialStartDate: new Date(),
        subscriptionStatus: 'active',
        googleDriveConnected: false
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onComplete();
      }, 600);
    } catch (err) {
      console.error('Error saving initial settings:', err);
      setError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-brand-subtle/40 overflow-hidden">
        {/* Top Ocean Gradient Header */}
        <div className="bg-ocean-gradient text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto text-white shadow-lg mb-3">
            <span className="font-display font-black text-3xl tracking-tight text-white">
              F<span className="text-brand-cyan">W</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-brand-cyan mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Configuration Initiale de votre Atelier</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">
            Bienvenue sur FereWari
          </h2>
          <p className="text-xs sm:text-sm text-brand-pale max-w-sm mx-auto mt-1 font-medium">
            Définissez l'identité de votre entreprise et sécurisez l'accès à vos recettes & marges.
          </p>

          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-brand-cyan/15 blur-xl pointer-events-none" />
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="shrink-0 font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 1. Nom d'entreprise */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
              <Store className="w-4 h-4 text-brand-primary" />
              <span>Nom de votre entreprise ou atelier</span>
              <span className="text-rose-500">*</span>
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Savonnerie Teranga, Atelier Kumba..."
              required
              autoFocus
            />
            <p className="text-[11px] text-slate-400">
              Ce nom apparaîtra sur vos reçus, vos exports et votre tableau de bord.
            </p>
          </div>

          {/* 2. Code PIN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-brand-primary" />
                <span>Code PIN (4 chiffres)</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
                <span>Confirmer le PIN</span>
                <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
              />
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-brand-pale/60 border border-brand-subtle/50 flex items-start gap-2.5 text-xs text-brand-navy">
            <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Vos données restent 100% stockées sur votre appareil. Le code PIN verrouille l'accès pour protéger le secret de vos recettes et de vos marges.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="vibrant"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              isLoading={isLoading}
              className="w-full justify-center shadow-lg"
            >
              Accéder à mon Atelier FereWari
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
