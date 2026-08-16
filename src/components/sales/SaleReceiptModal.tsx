import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Sale, Product } from '../../db/db';
import { formatFCFA } from '../../services/calculationService';
import { MessageCircle } from 'lucide-react';

interface SaleReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  product?: Product;
}

export const SaleReceiptModal: React.FC<SaleReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  product
}) => {
  if (!sale) return null;

  const handleShareWhatsApp = () => {
    const text = `*Reçu de Vente — FereWari*\n` +
      `--------------------------------\n` +
      `*Client:* ${sale.customerName || 'Client de passage'}\n` +
      `*Produit:* ${product?.name || 'Produit'}\n` +
      `*Quantité:* ${sale.quantity}\n` +
      `*Total:* ${formatFCFA(sale.totalAmount)}\n` +
      `*Date:* ${new Date(sale.saleDate).toLocaleDateString('fr-FR')}\n` +
      `--------------------------------\n` +
      `Merci pour votre achat !`;

    const encoded = encodeURIComponent(text);
    const phone = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reçu de Vente Validé"
      subtitle="La transaction a été enregistrée avec succès"
      maxWidth="sm"
    >
      <div className="space-y-4 text-center">
        {/* Receipt Container */}
        <div className="p-5 rounded-2xl bg-brand-bg border border-brand-subtle/60 text-left space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="font-display font-black text-lg text-brand-navy">FereWari</span>
              <p className="text-[10px] text-slate-500">Reçu N° #{sale.id || '001'}</p>
            </div>
            <div className="text-right text-[10px] text-slate-500 font-medium">
              {new Date(sale.saleDate).toLocaleDateString('fr-FR')} {new Date(sale.saleDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Customer */}
          <div className="text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Client</span>
            <p className="font-bold text-slate-800">{sale.customerName || 'Client de Passage'}</p>
            {sale.customerPhone && <p className="text-slate-500 text-[11px]">{sale.customerPhone}</p>}
          </div>

          {/* Product details */}
          <div className="border-t border-b border-slate-200 py-2 text-xs space-y-1">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>{product?.name || 'Produit'}</span>
              <span>{formatFCFA(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Quantité : {sale.quantity} unité(s)</span>
              <span>{product ? `${formatFCFA(product.sellingPrice)} / u` : ''}</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase">Total Réglé :</span>
            <span className="text-xl font-display font-black text-brand-navy">
              {formatFCFA(sale.totalAmount)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          <Button
            variant="vibrant"
            size="md"
            className="w-full"
            icon={<MessageCircle className="w-4 h-4 text-emerald-300" />}
            onClick={handleShareWhatsApp}
          >
            Partager le reçu sur WhatsApp
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
