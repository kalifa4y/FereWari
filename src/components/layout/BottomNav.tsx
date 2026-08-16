import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, FlaskConical, Zap, Users, Settings } from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Aperçu', icon: LayoutDashboard, exact: true },
    { to: '/materials', label: 'Intrants', icon: Layers, exact: false },
    { to: '/recipes', label: 'Recettes', icon: FlaskConical, exact: false },
    { to: '/sales', label: 'Vente', icon: Zap, exact: false, highlight: true },
    { to: '/customers', label: 'Clients', icon: Users, exact: false },
    { to: '/settings', label: 'Réglages', icon: Settings, exact: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-brand-subtle/40 shadow-lg px-2 py-1.5 sm:py-2">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              exact={item.exact}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 relative',
                item.highlight
                  ? 'text-brand-primary'
                  : isActive
                  ? 'text-brand-navy font-bold'
                  : 'text-slate-500 hover:text-brand-primary'
              )}
            >
              {item.highlight ? (
                <div
                  className={clsx(
                    'p-2 rounded-xl transition-all duration-200 shadow-sm',
                    isActive
                      ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30 scale-105'
                      : 'bg-brand-pale text-brand-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div
                  className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    isActive && 'bg-brand-pale/70 text-brand-primary'
                  )}
                >
                  <Icon className={clsx('w-5 h-5', isActive ? 'text-brand-primary stroke-[2.5]' : 'stroke-[1.8]')} />
                </div>
              )}
              <span
                className={clsx(
                  'text-[10px] tracking-tight mt-0.5',
                  isActive ? 'text-brand-navy font-black' : 'text-slate-500 font-medium'
                )}
              >
                {item.label}
              </span>
              {isActive && !item.highlight && (
                <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-brand-vibrant" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
