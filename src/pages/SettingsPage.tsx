import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { BackupManager } from '../components/backup/BackupManager';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { clearAllUserData } from '../db/seed';
import { formatFCFA } from '../services/calculationService';
import { Heart, Smartphone, Copy, Check, Store, Trash2, Lock, ShieldCheck } from 'lucide-react';

interface SettingsPageProps {
  onOpenDonation: () => void;
  onLockApp?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenDonation,
  onLockApp
}) => {
  const settings = useLiveQuery(() => db.settings.get('current_user_profile'), []);
  const [workshopName, setWorkshopName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // PIN Change State
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  React.useEffect(() => {
    if (settings?.userName) {
      setWorkshopName(settings.userName);
    }
  }, [settings]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshopName.trim()) return;
    setIsSavingName(true);
    try {
      await db.settings.update('current_user_profile', {
        userName: workshopName.trim()
      });
      setProfileMsg('Nom de l\'atelier mis à jour avec succès !');
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMsg(null);

    if (settings?.pinCode && oldPin !== settings.pinCode) {
      setPinMsg({ text: 'L\'ancien code PIN est incorrect.', isError: true });
      return;
    }

    if (!newPin || newPin.length < 4) {
      setPinMsg({ text: 'Le nouveau code PIN doit comporter au moins 4 chiffres.', isError: true });
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinMsg({ text: 'Les nouveaux codes PIN ne correspondent pas.', isError: true });
      return;
    }

    setIsSavingPin(true);
    try {
      await db.settings.update('current_user_profile', {
        pinCode: newPin,
        isConfigured: true
      });
      setPinMsg({ text: 'Code PIN modifié avec succès !', isError: false });
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => setPinMsg(null), 3500);
    } catch (err) {
      console.error(err);
      setPinMsg({ text: 'Erreur lors de la mise à jour du code PIN.', isError: true });
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('73386743');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ ATTENTION : Voulez-vous vraiment effacer toutes vos données (matières premières, recettes, ventes et clients) ? Cette action est irréversible.')) {
      setIsClearing(true);
      try {
        await clearAllUserData();
        alert('Toutes les données ont été effacées avec succès. Votre base est maintenant vide et prête pour une nouvelle saisie.');
      } catch (err) {
        console.error(err);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy leading-tight">
          Paramètres & Sauvegardes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Gérez votre profil artisan, soutenez le projet et sécurisez vos données
        </p>
      </div>

      {/* 1. Support / Donation Card */}
      <Card variant="ocean" className="p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-brand-cyan flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-brand-cyan text-brand-cyan" />
                Soutien Volontaire au Projet
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-black text-white leading-snug">
              FereWari est 100% gratuit & libre d'abonnement
            </h3>

            <p className="text-xs text-brand-pale leading-relaxed">
              L'application est mise à disposition pour aider tous les artisans. Pour soutenir notre travail et encourager l'ajout de nouvelles fonctionnalités, vous pouvez faire un don volontaire (dès {formatFCFA(5000)} ou plus).
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="cyan"
              size="md"
              icon={<Heart className="w-4 h-4 text-brand-navy" />}
              onClick={onOpenDonation}
            >
              Faire un don
            </Button>
          </div>
        </div>

        {/* Direct Mobile Money Number Quick-Box */}
        <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-pale block">
                Dépôt Orange Money & Wave
              </span>
              <span className="text-lg sm:text-xl font-display font-black text-white tracking-wider">
                73 38 67 43
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              onClick={handleCopyPhone}
              className="border-white/30 text-white hover:bg-white/20"
            >
              {copied ? 'Numéro copié !' : 'Copier le numéro'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Business Profile Card */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-pale text-brand-primary">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-display font-black text-brand-navy leading-tight">
              Profil de l'Atelier / Unité de Production
            </h3>
            <p className="text-xs text-slate-500">
              Identifiant qui apparaît sur vos reçus et exports
            </p>
          </div>
        </div>

        {profileMsg && (
          <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            {profileMsg}
          </p>
        )}

        <form onSubmit={handleSaveProfile} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Input
              label="Nom de l'atelier ou entreprise"
              value={workshopName}
              onChange={e => setWorkshopName(e.target.value)}
              placeholder="Ex: Savonnerie Teranga, Atelier Kumba..."
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSavingName}
          >
            Enregistrer
          </Button>
        </form>
      </Card>

      {/* 3. Security & PIN Code Management Card */}
      <Card variant="default" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-pale text-brand-primary">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-brand-navy leading-tight">
                Sécurité & Code PIN d'Accès
              </h3>
              <p className="text-xs text-slate-500">
                Protège vos recettes et marges contre les regards indiscrets
              </p>
            </div>
          </div>

          {onLockApp && (
            <Button
              variant="outline"
              size="sm"
              icon={<Lock className="w-3.5 h-3.5 text-brand-primary" />}
              onClick={onLockApp}
            >
              Verrouiller maintenant
            </Button>
          )}
        </div>

        {pinMsg && (
          <p className={`text-xs font-bold p-2.5 rounded-xl border ${
            pinMsg.isError
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
          }`}>
            {pinMsg.text}
          </p>
        )}

        <form onSubmit={handleSavePin} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {settings?.pinCode ? (
              <Input
                label="Ancien Code PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
              />
            ) : null}

            <Input
              label="Nouveau Code PIN (4 chiffres)"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              required
            />

            <Input
              label="Confirmer le Nouveau PIN"
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmNewPin}
              onChange={e => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              required
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="vibrant"
              size="md"
              icon={<ShieldCheck className="w-4 h-4" />}
              isLoading={isSavingPin}
            >
              Mettre à jour le Code PIN
            </Button>
          </div>
        </form>
      </Card>

      {/* 4. Backup Manager (JSON & Google Drive) */}
      <BackupManager settings={settings} />

      {/* 5. Clear / Reset Data Card */}
      <Card variant="default" className="p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-slate-500" />
            Remise à zéro des données locales
          </h4>
          <p className="text-xs text-slate-500">
            Efface toutes les matières premières, recettes, ventes et clients de votre appareil pour repartir d'une feuille blanche.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Trash2 className="w-4 h-4 text-rose-500" />}
          isLoading={isClearing}
          onClick={handleClearAllData}
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          Effacer toutes les données
        </Button>
      </Card>
    </div>
  );
};
