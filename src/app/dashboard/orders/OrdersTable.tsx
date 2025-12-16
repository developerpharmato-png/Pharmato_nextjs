import { CustomTable, Column } from "../components/CustomTable";
import { CustomTooltip } from "../components/miniComponents";
import { useRouter } from "next/navigation";

interface Order {
  _id: string;
  order_id: string;
  payment_id: string;
  discount: number;
  userId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  total_order_amount: number;
  payment_status: string;
  order_status: string;
  payment_mode: string;
  createdAt: string;
  medicineId?: any[];
}

interface OrdersTableProps {
  data: Order[];
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  loading?: boolean;
}

const OrdersTable: React.FC<OrdersTableProps> = (props) => {
  const {
    data,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
    loading = false,
  } = props;
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case "pending":
      case "placed":
        return "status-pending";
      case "completed":
      case "success":
      case "delivered":
      case "paid":
        return "status-success";
      case "failed":
      case "cancelled":
      case "returned":
        return "status-danger";
      case "processing":
      case "confirmed":
      case "packed":
        return "status-info";
      case "dispatched":
        return "status-purple";
      case "refunded":
        return "status-warning";
      default:
        return "status-default";
    }
  };

  const columns: Column<Order>[] = [
    {
      id: "order_id",
      label: "Order ID",
      minWidth: 150,
      selector: (row: Order) => (
        <CustomTooltip title={row.order_id || "-"}>
          <span
            className="ID-List"
            onClick={() => router.push(`/dashboard/orders/detail/${row._id}`)}
          >
            {row.order_id || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "customer",
      label: "Customer",
      minWidth: 150,
      selector: (row: Order) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.userId?.name || "-"}
          </div>
          <div className="text-xs text-gray-500">{row.userId?.email || "-"}</div>
        </div>
      ),
    },
    {
      id: "items",
      label: "Items",
      minWidth: 70,
      selector: (row: Order) => (
        <span className="text-gray-700">
          {row.medicineId?.length || 0}
        </span>
      ),
    },
    {
      id: "payment_id",
      label: "Payment ID",
      minWidth: 140,
      selector: (row: Order) => (
        <CustomTooltip title={row.payment_id || "Not Available"}>
          <span className="text-xs text-gray-600 font-mono">
            {row.payment_id ? (
              row.payment_id.length > 15
                ? `${row.payment_id.substring(0, 15)}...`
                : row.payment_id
            ) : (
              "-"
            )}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "total_amount",
      label: "Amount",
      minWidth: 100,
      selector: (row: Order) => (
        <span className="font-medium text-gray-900">
          ₹{row.total_order_amount?.toFixed(2) || "0.00"}
        </span>
      ),
    },
    {
      id: "discount",
      label: "Discount",
      minWidth: 90,
      selector: (row: Order) => (
        <span className="font-medium text-green-600">
          {row.discount > 0 ? `₹${row.discount.toFixed(2)}` : "-"}
        </span>
      ),
    },
    {
      id: "payment_mode",
      label: "Payment Mode",
      minWidth: 110,
      selector: (row: Order) => (
        <span className="capitalize text-gray-700 text-xs">
          {row.payment_mode || "-"}
        </span>
      ),
    },
    {
      id: "payment_status",
      label: "Payment Status",
      minWidth: 120,
      selector: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            row.payment_status
          )}`}
        >
          {row.payment_status || "Pending"}
        </span>
      ),
    },
    {
      id: "order_status",
      label: "Order Status",
      minWidth: 120,
      selector: (row: Order) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            row.order_status
          )}`}
        >
          {row.order_status || "Pending"}
        </span>
      ),
    },
    {
      id: "createdAt",
      label: "Date",
      minWidth: 120,
      selector: (row: Order) => (
        <span className="text-gray-700">
          {new Date(row.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <CustomTable
      columns={columns}
      data={data}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      loading={loading}
    />
  );
};

export default OrdersTable;
