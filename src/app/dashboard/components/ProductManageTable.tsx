

"use client";
import React from "react";
import { Checkbox } from "@mui/material";

type Props = {
  medicines?: any[];
  medicineQuantity?: any[];
  selected: string[];
  setSelected: (s: string[]) => void;
  acceptedQuantities?: Record<string, number>;
  setAcceptedQuantities?: (s: Record<string, number>) => void;
  medidetails: (id: string) => void;
  gridCols?: string;
  tableMode?: boolean;
};

const ProductManageTable: React.FC<Props> = ({
  medicines = [],
  medicineQuantity = [],
  selected,
  setSelected,
  acceptedQuantities = {},
  setAcceptedQuantities,
  medidetails,
  gridCols = "grid-cols-1 lg:grid-cols-2",
  tableMode = false,
}) => {
  // --- LOGIC: Categorize items ---
  const getCategorizedItems = () => {
    const pending: any[] = [];
    const accepted: any[] = [];
    const rejected: any[] = [];

    medicines.forEach((med) => {
      const q = (medicineQuantity || []).find(
        (x: any) => x.medicineId === med._id || x.medicineId?.toString?.() === med._id?.toString?.()
      );
      const status = (q?.status || med.status || "pending").toLowerCase();
      const itemWithData = { ...med, q, status };

      if (status === "pending") pending.push(itemWithData);
      else if (status === "accepted" || status === "delivered") accepted.push(itemWithData);
      else if (status === "rejected" || status === "cancelled") rejected.push(itemWithData);
    });

    return { pending, accepted, rejected };
  };

  const { pending, accepted, rejected } = getCategorizedItems();

  // --- LOGIC: Select All for Pending only ---
  const pendingIds = pending.map((item) => item._id);
  const isAllPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.includes(id));
  const isIndeterminate = pendingIds.some((id) => selected.includes(id)) && !isAllPendingSelected;

  const handleSelectAllPending = (checked: boolean) => {
    if (checked) {
      setSelected(Array.from(new Set([...selected, ...pendingIds])));
    } else {
      setSelected(selected.filter((id) => !pendingIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelected(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  // --- UI: Reusable Sub-Table Component ---
  const StatusTable = ({ 
    items, 
    title, 
    theme, 
    showCheckbox = false 
  }: { 
    items: any[], 
    title: string, 
    theme: 'blue' | 'orange' | 'red',
    showCheckbox?: boolean
  }) => {
    if (items.length === 0) return null;

    const themeClasses = {
      blue: "bg-blue-50 text-blue-500 border-blue-100",
      orange: "bg-orange-50 text-orange-400 border-orange-100",
      red: "bg-red-50 text-red-500 border-red-100"
    };

    return (
      <div className="mb-8 bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <span className="px-3 py-0.5 bg-gray-100 rounded-full text-[11px] font-bold text-gray-500">
              {items.length} Items
            </span>
          </div>
          {showCheckbox && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Select All</span>
              <Checkbox 
                checked={isAllPendingSelected} 
                indeterminate={isIndeterminate}
                onChange={(e) => handleSelectAllPending(e.target.checked)}
              />
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                {showCheckbox && <th className="pl-6 py-3 w-12"></th>}
                <th className={`${!showCheckbox ? 'pl-6' : 'px-4'} py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest`}>Item Details</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Quantity</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Prescription Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const price = Number(item.price) || 0;
                const mrp = Number(item.mrp) || 0;
                const qty = Number(item.q?.quantity || item.quantity || 1);
                const total = price * qty;

                return (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    {showCheckbox && (
                      <td className="pl-6 py-4">
                        <Checkbox checked={selected.includes(item._id)} onChange={() => handleSelectOne(item._id)} />
                      </td>
                    )}
                    <td className={`${!showCheckbox ? 'pl-6' : 'px-4'} py-4 cursor-pointer`} onClick={() => medidetails(item._id)}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-[13px] uppercase tracking-tight leading-tight">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">{item.manufacturer}</span>
                        {item.q?.cancelReason && (
                          <span className="text-[9px] text-red-400 italic mt-1 font-medium bg-red-50 w-fit px-1.5 rounded">Reason: {item.q.cancelReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {theme === 'blue' && selected.includes(item._id) ? (
                        <select
                          value={acceptedQuantities[item._id] || qty}
                          onChange={(e) => {
                            if (setAcceptedQuantities) {
                              setAcceptedQuantities({
                                ...acceptedQuantities,
                                [item._id]: Number(e.target.value)
                              });
                            }
                          }}
                          className="bg-white border border-gray-300 text-gray-900 text-[11px] font-bold rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 w-full max-w-[70px] mx-auto"
                        >
                          {Array.from({ length: qty }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="inline-block px-3 py-1.5 bg-gray-50 border border-gray-100 rounded text-[11px] font-bold text-gray-600">
                          {item.status === 'accepted' || item.status === 'delivered' ? `Qty: ${item.q?.accept_qu || qty}` : `Qty: ${qty}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                          <span className={`text-[13px] font-bold ${theme === 'red' ? 'text-gray-400' : 'text-green-600'}`}>₹{price.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`text-[14px] font-bold ${theme === 'red' ? 'text-gray-300' : 'text-gray-900'}`}>₹{total.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-tighter ${themeClasses[theme]}`}>
                        {item.status === 'delivered' || item.status === 'accepted' ? 'ACCEPTED' : item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-tighter bg-blue-50 text-blue-500 border-blue-100`}>
                        {item.isPrescription === true ? 'PRESCRIPTION REQUIRED' : 'NO PRESCRIPTION'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <StatusTable items={pending} title="Pending Items" theme="blue" showCheckbox={true} />
      <StatusTable items={accepted} title="Accepted Items" theme="orange" showCheckbox={false} />
      <StatusTable items={rejected} title="Canecelled items " theme="red" showCheckbox={false} />
    </div>
  );
};

export default ProductManageTable;