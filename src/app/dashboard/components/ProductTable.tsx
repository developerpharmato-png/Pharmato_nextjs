import React from "react";

type Medicine = any;

type Props = {
  medicines?: Medicine[];
  title?: string;
  variant?: "default" | "rejected";
};

const ProductTable: React.FC<Props> = ({
  medicines = [],
  title = "Items",
  variant = "default",
}) => {
  const isRejected = variant === "rejected";

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden mt-8">
      {/* Header Section */}
      <div
        className={`p-4 border-b border-gray-50 flex items-center gap-2 ${isRejected ? "bg-red-50/30" : ""
          }`}
      >
        <h2
          className={`text-lg font-bold tracking-tight ${isRejected ? "text-red-600" : "text-gray-800"
            }`}
        >
          {title}
        </h2>
        <span
          className={`px-3 py-0.5 rounded-full text-[11px] font-bold uppercase border ${isRejected
            ? "bg-red-50 text-red-600 border-red-100"
            : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
        >
          {medicines?.length || 0} Items
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Item Details
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Quantity
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                Unit Price
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                Total
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Status
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Is Prescription Required</th>

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {medicines?.map((medicine: Medicine, index: number) => {
              const price = Number(medicine?.price) || 0;
              const mrp = Number(medicine?.mrp) || 0;
              const qty = Number(medicine?.quantity) || 1;
              const itemTotal = price * qty;
              const status = medicine?.status?.toLowerCase() || "pending";

              return (
                <tr
                  key={index}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 text-[13px] uppercase tracking-tight leading-tight">
                        {medicine?.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 tracking-tighter">
                        {medicine?.manufacturer}
                      </span>
                      {medicine?.cancelReason && (
                        <span className="text-[9px] text-red-400 italic mt-1 font-medium bg-red-50 w-fit px-1.5 rounded">
                          Reason: {medicine.cancelReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block px-3 py-1.5 bg-gray-50 border border-gray-100 rounded text-[11px] font-bold text-gray-600">
                      Qty: {qty}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-[13px] font-bold ${isRejected ? "text-gray-400" : "text-green-600"
                          }`}
                      >
                        ₹{price.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`text-[14px] font-bold ${isRejected ? "text-gray-300" : "text-gray-900"
                        }`}
                    >
                      ₹{itemTotal.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-tighter
                      ${isRejected
                          ? "bg-red-50 text-red-500 border-red-100"
                          : status === "delivered" || status === "accepted"
                            ? "bg-orange-50 text-orange-400 border-orange-100"
                            : "bg-blue-50 text-blue-500 border-blue-100"
                        }`}
                    >
                      {/* {isRejected
                        ? "REJECTED"
                        : status === "delivered" || status === "accepted"
                        ? "ACCEPTED"
                        : status.toUpperCase()} */}

                      {status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border tracking-tighter bg-blue-50 text-blue-500 border-blue-100`}>
                      {medicine?.isPrescription === true ? 'PRESCRIPTION REQUIRED' : 'NO PRESCRIPTION'}
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

export default ProductTable;
