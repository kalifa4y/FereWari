import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Customer, Product } from '../db/db';
import { CustomerRankingTable } from '../components/customers/CustomerRankingTable';
import { CustomerDetailModal } from '../components/customers/CustomerDetailModal';
import { Trophy } from 'lucide-react';
import { formatFCFA } from '../services/calculationService';

export const CustomersPage: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  const productsMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach(p => { if (p.id) map.set(p.id, p); });
    return map;
  }, [products]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const totalCustomersSpend = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  }, [customers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-brand-navy leading-tight">
            Clients
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivez les commandes et les montants achetés par vos clients.
          </p>
        </div>

        <div className="p-3 px-4 rounded-2xl bg-brand-pale/60 border border-brand-subtle flex items-center gap-3 self-start sm:self-auto">
          <div className="p-2 rounded-xl bg-brand-primary text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total clients ({customers.length})</span>
            <span className="text-base font-display font-black text-brand-navy">
              {formatFCFA(totalCustomersSpend)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Ranking Table */}
      <CustomerRankingTable
        customers={customers}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customer={selectedCustomer}
        productsMap={productsMap}
      />
    </div>
  );
};
