import React from "react";
import { CustomButton } from "../../components/miniComponents";

export default function CrossSellProductsPopup({
  categoryId,
  selected,
  onClose,
  onUpdate,
}: {
  categoryId: string;
  selected: string[];
  onClose: () => void;
  onUpdate: (ids: string[]) => void;
}) {
  const [products, setProducts] = React.useState<
    { _id: string; name: string }[]
  >([]);
  const [checked, setChecked] = React.useState<string[]>(selected);
  const [loading, setLoading] = React.useState(true);
  // Get current medicineId from selected (first one is always the current medicine)
  const currentMedicineId =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").pop()
      : "";


  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/medicines/by-category/${categoryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search }),
    })
      .then((res) => res.json())
      .then((data) => {
        // Exclude current medicine from list
        const filtered = (data.data || []).filter(
          (prod: any) => prod._id !== currentMedicineId
        );
        setProducts(filtered);
        setLoading(false);
      });
  }, [categoryId, currentMedicineId, search]);

  const handleCheck = (id: string) => {
    if (checked.includes(id)) {
      setChecked((prev) => prev.filter((x) => x !== id));
    } else {
      if (checked.length < 5) {
        setChecked((prev) => [...prev, id]);
      }
    }
  };

  const handleUpdate = () => {
    onUpdate(checked);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.4)" }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg transform transition-all duration-300 ease-out">
        <h2 className="text-2xl font-bold text-gray-800 mb-5 border-b pb-3">
          Select Cross-Sell Products
          <div className="text-right text-xs text-gray-500 mt-2">
            Selected: {checked.length} / 5
          </div>
          {checked.length >= 5 && (
            <div className="text-red-600 text-sm mt-2 text-center font-medium">
              ⚠️ Maximum 5 products can be selected.
            </div>
          )}
        </h2>
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
          />
        </div>
        {loading ? (
          <div className="p-4 text-center text-gray-600">Loading products...</div>
        ) : (
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto pr-2">
            {products.map((prod) => (
              <label
                key={prod._id}
                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors duration-150 ease-in-out ${checked.includes(prod._id)
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-100"
                  } ${checked.length >= 5 && !checked.includes(prod._id)
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={checked.includes(prod._id)}
                  onChange={() => handleCheck(prod._id)}
                  className="accent-blue-600 w-5 h-5 rounded"
                  disabled={checked.length >= 5 && !checked.includes(prod._id)}
                />
                <span className="font-medium text-gray-800 text-base flex-1">
                  {prod.name}
                </span>
              </label>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-gray-500 p-4 text-center">
                No other products found in this category.
              </div>
            )}

          </div>
        )}
        <div className="flex gap-4 mt-6 justify-end pt-4 border-t">
          <button
            className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition duration-150"
            onClick={onClose}
          >
            Cancel
          </button>
          <CustomButton width="200px" onClick={handleUpdate}>
            Save Changes
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
