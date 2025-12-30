import React from 'react';
import { Checkbox, Button } from '@mui/material';

interface ProductTableProps {
  title: string;
  items: any[];
  type: 'active' | 'rejected';
  selected?: string[];
  pendingMedicineIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: (checked: boolean) => void;
  onDetails?: (id: string) => void;
  onAcceptClick?: () => void;
  isProcessing?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({
  title,
  items,
  type,
  selected = [],
  pendingMedicineIds = [],
  onSelect,
  onSelectAll,
  onDetails,
  onAcceptClick,
}) => {
  if (!items || items.length === 0) return null;

  const isRejectedType = type === 'rejected';
  const showCheckboxes = !isRejectedType && pendingMedicineIds.length > 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 ${isRejectedType ? 'mt-8' : 'mt-6'}`}>
      {/* Header Section */}
      <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isRejectedType ? 'bg-red-50/10' : ''}`}>
        <div className="flex items-center gap-4">
          <h2 className={`text-lg font-bold tracking-tight ${isRejectedType ? 'text-red-600' : 'text-gray-800'}`}>
            {title}
          </h2>
          
          {/* Select All Feature */}
          {showCheckboxes && onSelectAll && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
              <Checkbox
                size="small"
                checked={pendingMedicineIds.length > 0 && pendingMedicineIds.every((id) => selected.includes(id))}
                indeterminate={pendingMedicineIds.some((id) => selected.includes(id)) && !pendingMedicineIds.every((id) => selected.includes(id))}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
              <span className="text-[10px] font-bold text-blue-600 uppercase">Select All Pending</span>
            </div>
          )}
        </div>
        <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
           {items.length} Items
        </span>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              {showCheckboxes && <th className="px-6 py-4 w-10"></th>}
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item Details</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Quantity</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Unit Price</th>
              {!isRejectedType && <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>}
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((med) => {
              const status = med.status || "pending";
              const isPending = status === "pending";
              const itemTotal = (med.price || 0) * (med.quantity || 1);

              return (
                <tr key={med._id} className={`transition-colors hover:bg-gray-50/50 ${isRejectedType ? 'opacity-75' : ''}`}>
                  {showCheckboxes && (
                    <td className="px-6 py-5">
                      <Checkbox 
                        size="small"
                        checked={selected.includes(med._id)} 
                        onChange={() => onSelect?.(med._id)} 
                        disabled={!isPending} 
                      />
                    </td>
                  )}
                  <td className="px-6 py-5" onClick={() => onDetails?.(med._id)}>
                    <div className="flex flex-col cursor-pointer">
                      <span className={`font-bold text-sm uppercase ${isRejectedType ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {med.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{med.manufacturer}</span>
                      {isRejectedType && (
                         <span className="text-[10px] text-red-400 italic mt-1">Reason: {med.cancelReason || "Stock unavailable"}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600">
                      {med.quantity || 1}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-sm font-bold ${isRejectedType ? 'text-gray-400' : 'text-green-600'}`}>
                      ₹{med.price?.toFixed(2)}
                    </span>
                  </td>
                  {!isRejectedType && (
                    <td className="px-6 py-5 text-right">
                      <span className="text-sm font-black text-gray-900">₹{itemTotal.toFixed(2)}</span>
                    </td>
                  )}
                  <td className="px-6 py-5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border tracking-tighter ${
                      isPending ? "bg-yellow-50 text-yellow-600 border-yellow-200" : 
                      isRejectedType ? "bg-red-50 text-red-600 border-red-200" :
                      "bg-orange-50 text-orange-600 border-orange-200"
                    }`}>
                      {status === "delivered" ? "ACCEPTED" : status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Button Footer */}
      {showCheckboxes && onAcceptClick && (
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <Button
            variant="contained"
            color="success"
            disabled={selected.length === 0}
            onClick={onAcceptClick}
            className="!rounded-lg !px-8 !font-bold !shadow-none !capitalize"
          >
            Accept Selected ({selected.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductTable;