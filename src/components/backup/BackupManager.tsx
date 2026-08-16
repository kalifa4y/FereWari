import React, { useState, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { exportBackupToFile, restoreBackupFromFile, isBackupReminderDue } from '../../services/backupService';
import { connectGoogleDrive, disconnectGoogleDrive, syncToGoogleDrive } from '../../services/driveService';
import { AppSettings } from '../../db/db';
import { Download, Upload, Cloud, HardDrive, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupManagerProps {
  settings?: AppSettings;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ settings }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastBackup = settings?.lastBackupDate ? new Date(settings.lastBackupDate) : undefined;
  const isDue = isBackupReminderDue(lastBackup);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = await exportBackupToFile();
      setStatusMessage({
        text: `Sauvegarde générée avec succès (${filename}) ! Conservez ce fichier en lieu sûr.`,
        type: 'success'
      });
      confetti({ particleCount: 40, spread: 50 });
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors de l\'exportation de la sauvegarde.', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("⚠️ Attention : La restauration d'une sauvegarde remplacera vos données actuelles. Confirmez-vous ?")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const result = await restoreBackupFromFile(file);
      if (result.success) {
        setStatusMessage({
          text: `${result.message} (${result.counts?.products} recettes, ${result.counts?.rawMaterials} intrants, ${result.counts?.customers} clients, ${result.counts?.sales} ventes restaurés).`,
          type: 'success'
        });
        confetti({ particleCount: 70, spread: 60 });
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ text: 'Erreur lors de la restauration.', type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleToggleDrive = async () => {
    if (settings?.googleDriveConnected) {
      await disconnectGoogleDrive();
      setStatusMessage({ text: 'Google Drive déconnecté.', type: 'info' });
    } else {
      setIsConnectingDrive(true);
      try {
        const res = await connectGoogleDrive();
        setStatusMessage({ text: `Compte Google Drive associé (${res.email}) avec succès !`, type: 'success' });
      } catch (err) {
        setStatusMessage({ text: 'Erreur lors de la connexion à Google Drive.', type: 'error' });
      } finally {
        setIsConnectingDrive(false);
      }
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const res = await syncToGoogleDrive();
      setStatusMessage({
        text: `Sauvegarde synchronisée sur votre Google Drive (${res.filename}) !`,
        type: 'success'
      });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      setStatusMessage({ text: 'Erreur lors de la synchronisation Drive.', type: 'error' });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 7-Day Backup Reminder Alert */}
      {isDue && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold uppercase tracking-wider">Rappel de Sécurité : Sauvegarde Recommandée</h4>
            <p>
              {lastBackup
                ? `Votre dernière sauvegarde date de plus de 7 jours (${lastBackup.toLocaleDateString('fr-FR')}).`
                : 'Vous n\'avez pas encore effectué de sauvegarde de vos données.'}{' '}
              Effectuez un export JSON ou synchronisez avec Google Drive pour protéger votre historique.
            </p>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' :
          statusMessage.type === 'error' ? 'bg-red-50 text-brand-alert border border-red-300' :
          'bg-slate-100 text-slate-800'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* 1. Local JSON Backup Card */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-pale text-brand-primary">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-brand-navy leading-tight">
                Sauvegarde Locale & Fichiers JSON
              </h3>
              <p className="text-xs text-slate-500">
                Stockage principal hors-ligne géré par Dexie.js (IndexedDB)
              </p>
            </div>
          </div>
          <Badge variant="cyan" size="sm">100% Hors-ligne</Badge>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Générez un fichier de sauvegarde <code>ferewari-backup-*.json</code> complet contenant toutes vos recettes, coûts, stocks, clients et ventes. Vous pouvez le transférer sur votre ordinateur ou l'envoyer sur WhatsApp.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            icon={<Download className="w-4 h-4" />}
            isLoading={isExporting}
            onClick={handleExport}
          >
            Exporter la sauvegarde (JSON)
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
            accept=".json,application/json"
            className="hidden"
          />

          <Button
            variant="outline"
            size="md"
            className="flex-1"
            icon={<Upload className="w-4 h-4" />}
            isLoading={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            Restaurer un fichier JSON
          </Button>
        </div>
      </Card>

      {/* 2. Google Drive Cloud Sync Card */}
      <Card variant="default" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-brand-vibrant">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-brand-navy leading-tight">
                Synchronisation Google Drive
              </h3>
              <p className="text-xs text-slate-500">
                Sauvegarde automatique dans votre espace Cloud personnel (Optionnel)
              </p>
            </div>
          </div>

          <Badge variant={settings?.googleDriveConnected ? 'success' : 'neutral'} size="sm">
            {settings?.googleDriveConnected ? 'Connecté' : 'Non connecté'}
          </Badge>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Associez votre compte Google pour envoyer une copie chiffrée de votre base de données sur votre Google Drive en 1 clic.
        </p>

        {settings?.googleDriveConnected ? (
          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Compte Google Drive lié
              </span>
              <span className="text-[11px] text-emerald-700">
                Dernière synchro : {lastBackup ? lastBackup.toLocaleDateString('fr-FR') : 'Jamais'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="vibrant"
                size="md"
                className="flex-1"
                icon={<RefreshCw className="w-4 h-4" />}
                isLoading={isSyncingDrive}
                onClick={handleSyncDrive}
              >
                Sauvegarder maintenant sur Drive
              </Button>

              <Button
                variant="ghost"
                size="md"
                className="text-brand-alert hover:bg-red-50"
                onClick={handleToggleDrive}
              >
                Déconnecter Google Drive
              </Button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <Button
              variant="outline"
              size="md"
              className="w-full"
              icon={<Cloud className="w-4 h-4 text-brand-vibrant" />}
              isLoading={isConnectingDrive}
              onClick={handleToggleDrive}
            >
              Connecter mon compte Google Drive
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
