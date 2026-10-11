import React, { useState, useMemo } from 'react';
import { Customer } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { Trophy, Search, Phone, ChevronRight, Award, Medal } from 'lucide-react';

interface CustomerRankingTableProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerRankingTable: React.FC<CustomerRankingTableProps> = ({
  customers,
  onSelectCustomer
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'totalSpent' | 'ordersCount'>('totalSpent');

  // Filter & Sort
  const sortedCustomers = useMemo(() => {
    let list = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        c => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'totalSpent') {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      } else {
        return (b.ordersCount || 0) - (a.ordersCount || 0);
      }
    });

    return list;
  }, [customers, search, sortBy]);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-sm">
          <Trophy className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-sm">
          <Medal className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
          <Award className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
        #{index + 1}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client (nom, tél)..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-brand-vibrant focus:outline-none focus:ring-2 focus:ring-brand-vibrant/20 font-medium"
          />
        </div>

        {/* Sort Filter Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSortBy('totalSpent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              sortBy === 'totalSpent'
                ? 'bg-white text-brand-navy shadow-xs'
                : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Par montant
          </button>
          <button
            type="button"
            onClick={() => setSortBy('ordersCount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              sortBy === 'ordersCount'
                ? 'bg-white text-brand-navy shadow-xs'
                : 'text-slate-600 hover:text-brand-navy'
            }`}
          >
            Par commandes
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards & Empty States */}
      {customers.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-2 shadow-xs">
          <h3 className="text-base font-display font-black text-brand-navy">
            Aucun client enregistré
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Les clients sont enregistrés automatiquement lorsque vous renseignez leur nom lors d'une vente.
          </p>
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <h3 className="text-sm font-display font-black text-brand-navy">
            Aucun client ne correspond à votre recherche
          </h3>
          <p className="text-xs text-slate-500">
            Vérifiez le nom ou le numéro de téléphone saisi.
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden divide-y divide-slate-100">
          {sortedCustomers.map((cust, idx) => (
            <div
              key={cust.id || idx}
              role="button"
              tabIndex={0}
              onClick={() => onSelectCustomer && onSelectCustomer(cust)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelectCustomer) {
                  e.preventDefault();
                  onSelectCustomer(cust);
                }
              }}
              className="p-3.5 sm:p-4 hover:bg-brand-pale/30 transition-colors flex items-center justify-between gap-3 cursor-pointer group focus:outline-none focus:bg-brand-pale/40"
            >
              {/* Left: Rank & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">{getRankBadge(idx)}</div>

                <div className="min-w-0">
                  <h4 className="font-display font-black text-base sm:text-lg text-brand-navy truncate group-hover:text-brand-vibrant transition-colors">
                    {cust.name}
                  </h4>
                  {cust.phone ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 inline text-slate-400" />
                      <span>{cust.phone}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Sans numéro</p>
                  )}
                </div>
              </div>

              {/* Right: Metrics */}
              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                {/* Orders count */}
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Commandes</span>
                  <span className="text-sm font-bold text-slate-700">
                    {cust.ordersCount || 0}
                  </span>
                </div>

                {/* Total Volume */}
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Acheté</span>
                  <span className="text-base sm:text-lg font-display font-black text-brand-primary">
                    {formatFCFA(cust.totalSpent)}
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-vibrant transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
