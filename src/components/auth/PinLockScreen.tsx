import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, ShieldAlert } from 'lucide-react';

interface PinLockScreenProps {
  companyName: string;
  expectedPin: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  companyName,
  expectedPin,
  onUnlock
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  const targetLength = expectedPin.length || 4;

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < targetLength) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === targetLength) {
        // Auto-check PIN
        if (nextPin === expectedPin) {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setTimeout(() => {
            setError(true);
            setShake(prev => prev + 1);
            setPin('');
          }, 200);
        }
      }
    }
  }, [pin, targetLength, expectedPin, onUnlock]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  // Keyboard support for desktop / physical keypad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete]);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-brand-subtle/40 p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
        {/* Brand Icon & Enterprise Name */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-ocean-gradient text-white flex items-center justify-center shadow-lg shadow-brand-navy/20">
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h1 className="font-display font-black text-2xl text-brand-navy tracking-tight">
            FereWari
          </h1>

          <div className="px-3 py-1 rounded-full bg-brand-pale border border-brand-subtle text-brand-primary text-xs font-bold max-w-[240px] truncate">
            {companyName || 'Atelier Artisanal'}
          </div>
        </div>

        {/* Lock Instructions & Error Notice */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-700">
            Entrez votre Code PIN
          </h3>
          <p className="text-xs text-slate-400">
            Accès sécurisé à vos recettes & ventes
          </p>
        </div>

        {/* PIN Dots Indicator */}
        <motion.div
          key={shake}
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center gap-3.5 py-1"
        >
          {Array.from({ length: targetLength }).map((_, idx) => {
            const filled = idx < pin.length;
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  scale: filled ? [1, 1.25, 1] : 1,
                  backgroundColor: error
                    ? '#E63946'
                    : filled
                    ? '#023E8A'
                    : '#E2E8F0'
                }}
                transition={{ duration: 0.15 }}
                className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
              />
            );
          })}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Code PIN incorrect
            </motion.p>
          )}
        </AnimatePresence>

        {/* Tactile Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-brand-pale active:bg-brand-vibrant active:text-white border border-slate-200 text-xl font-display font-black text-brand-navy transition-all flex items-center justify-center shadow-xs cursor-pointer"
            >
              {num}
            </button>
          ))}

          {/* Empty placeholder */}
          <div className="h-14" />

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-brand-pale active:bg-brand-vibrant active:text-white border border-slate-200 text-xl font-display font-black text-brand-navy transition-all flex items-center justify-center shadow-xs cursor-pointer"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-rose-50 active:bg-rose-500 active:text-white border border-slate-200 text-slate-600 hover:text-rose-600 transition-all flex items-center justify-center shadow-xs cursor-pointer"
            aria-label="Effacer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
