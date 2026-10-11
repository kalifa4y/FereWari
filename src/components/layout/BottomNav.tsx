import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { Home, Package, Zap, MoreHorizontal, Layers, Users, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const isHomeActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isProductsActive = location.pathname.startsWith('/recipes');
  const isSalesActive = location.pathname.startsWith('/sales');
  const isMoreActive =
    location.pathname.startsWith('/materials') ||
    location.pathname.startsWith('/customers') ||
    location.pathname.startsWith('/settings');

  // Close plus menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlusOpen(false);
      }
    };
    if (isPlusOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlusOpen]);

  // Close plus menu on route change
  useEffect(() => {
    setIsPlusOpen(false);
  }, [location.pathname]);

  // Close plus menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setIsPlusOpen(false);
      }
    };
    if (isPlusOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusOpen]);

  const moreItems = [
    { to: '/materials', label: 'Ingrédients', icon: Layers },
    { to: '/customers', label: 'Clients', icon: Users },
    { to: '/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* Semi-transparent backdrop when Plus menu is open */}
      {isPlusOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] transition-opacity"
          onClick={() => setIsPlusOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-brand-subtle/40 shadow-lg px-2 py-1 sm:py-1.5"
        aria-label="Navigation principale"
      >
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around relative">
          {/* 1. Accueil */}
          <NavLink
            to="/"
            exact
            className={clsx(
              'flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 relative',
              isHomeActive ? 'text-brand-navy font-bold' : 'text-slate-500 hover:text-brand-primary'
            )}
          >
            <div
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                isHomeActive && 'bg-brand-pale/70 text-brand-primary'
              )}
            >
              <Home className={clsx('w-5 h-5', isHomeActive ? 'text-brand-primary stroke-[2.5]' : 'stroke-[1.8]')} />
            </div>
            <span
              className={clsx(
                'text-[11px] tracking-tight mt-0.5',
                isHomeActive ? 'text-brand-navy font-black' : 'text-slate-500 font-medium'
              )}
            >
              Accueil
            </span>
            {isHomeActive && (
              <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-brand-vibrant" />
            )}
          </NavLink>

          {/* 2. Produits */}
          <NavLink
            to="/recipes"
            className={clsx(
              'flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 relative',
              isProductsActive ? 'text-brand-navy font-bold' : 'text-slate-500 hover:text-brand-primary'
            )}
          >
            <div
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                isProductsActive && 'bg-brand-pale/70 text-brand-primary'
              )}
            >
              <Package className={clsx('w-5 h-5', isProductsActive ? 'text-brand-primary stroke-[2.5]' : 'stroke-[1.8]')} />
            </div>
            <span
              className={clsx(
                'text-[11px] tracking-tight mt-0.5',
                isProductsActive ? 'text-brand-navy font-black' : 'text-slate-500 font-medium'
              )}
            >
              Produits
            </span>
            {isProductsActive && (
              <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-brand-vibrant" />
            )}
          </NavLink>

          {/* 3. Vendre (Action mise en avant) */}
          <NavLink
            to="/sales"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 relative text-brand-primary"
          >
            <div
              className={clsx(
                'p-2 rounded-xl transition-all duration-200 shadow-sm',
                isSalesActive
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30 scale-105'
                  : 'bg-brand-pale text-brand-primary hover:bg-brand-primary/10'
              )}
            >
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span
              className={clsx(
                'text-[11px] tracking-tight mt-0.5',
                isSalesActive ? 'text-brand-navy font-black' : 'text-brand-primary font-bold'
              )}
            >
              Vendre
            </span>
          </NavLink>

          {/* 4. Plus (Menu déroulant pour les 3 destinations secondaires) */}
          <div ref={plusMenuRef} className="relative">
            {/* Popover Menu */}
            {isPlusOpen && (
              <div
                role="menu"
                aria-label="Options supplémentaires"
                className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 px-1 animate-in fade-in slide-in-from-bottom-2 duration-150 z-50 divide-y divide-slate-100"
              >
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      onClick={() => setIsPlusOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isItemActive
                          ? 'bg-brand-pale text-brand-primary font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-brand-navy'
                      )}
                    >
                      <Icon className={clsx('w-4 h-4 shrink-0', isItemActive ? 'text-brand-primary' : 'text-slate-400')} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPlusOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={isPlusOpen}
              aria-label="Plus d'options"
              className={clsx(
                'flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all duration-150 relative',
                isMoreActive ? 'text-brand-navy font-bold' : 'text-slate-500 hover:text-brand-primary',
                isPlusOpen && 'bg-slate-100/60'
              )}
            >
              <div
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  (isMoreActive || isPlusOpen) && 'bg-brand-pale/70 text-brand-primary'
                )}
              >
                <MoreHorizontal
                  className={clsx(
                    'w-5 h-5',
                    isMoreActive || isPlusOpen ? 'text-brand-primary stroke-[2.5]' : 'stroke-[1.8]'
                  )}
                />
              </div>
              <span
                className={clsx(
                  'text-[11px] tracking-tight mt-0.5',
                  isMoreActive ? 'text-brand-navy font-black' : 'text-slate-500 font-medium'
                )}
              >
                Plus
              </span>
              {isMoreActive && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-brand-vibrant" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
