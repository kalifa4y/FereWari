import React from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, Lock } from 'lucide-react';
import { Button } from '../common/Button';

interface AppHeaderProps {
  onOpenDonation?: () => void;
  onLock?: () => void;
  companyName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenDonation,
  onLock,
  companyName
}) => {
  const location = useLocation();

  // Page title resolution
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return 'Aperçu & Pilotage';
      case '/materials':
        return 'Matières Premières';
      case '/recipes':
        return 'Recettes & Coûts (CRU)';
      case '/sales':
        return 'Ventes Express (POS)';
      case '/customers':
        return 'Clients & Fidélité';
      case '/settings':
        return 'Sauvegarde & Paramètres';
      default:
        return 'FereWari';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-brand-subtle/30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Logo & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ocean-gradient flex items-center justify-center text-white shadow-md shadow-brand-navy/15">
            <span className="font-display font-black text-xl tracking-tight text-white">
              F<span className="text-brand-cyan">W</span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-2xl sm:text-3xl text-brand-navy tracking-tight leading-none">
                FereWari
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-brand-pale text-brand-primary border border-brand-subtle/50 max-w-[140px] truncate">
                {companyName || 'Artisan'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              {getPageTitle()}
            </p>
          </div>
        </div>

        {/* Actions (Lock & Donation) */}
        <div className="flex items-center gap-2">
          {onLock && (
            <button
              onClick={onLock}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-brand-navy hover:bg-slate-50 transition-colors"
              title="Verrouiller l'application"
              aria-label="Verrouiller"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {onOpenDonation && (
            <Button
              variant="outline"
              size="sm"
              icon={<Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />}
              onClick={onOpenDonation}
              className="border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-slate-700"
            >
              <span className="hidden xs:inline">Faire un</span> don
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
