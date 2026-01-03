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
    mobile?: string;
  };
  prescription_status?: string;
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
    const s = (status || "").toLowerCase();
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

    const getPrescriptionColor = (status: string) => {
      const s = (status || "").toLowerCase();
      switch (s) {
        case "pending":
          return "status-pending";
        case "approved":
          return "status-success";
        case "rejected":
          return "status-danger";
        case "not required":
          return "status-default";
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
            className="ID-List customTooltip"
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
        <div
          onClick={() =>
            router.push(`/dashboard/admin/customers/${row.userId?._id}`)
          }
          className="cursor-pointer "
        >
          <CustomTooltip title={row.userId?.mobile || row.userId?.phone || "-"}>
            <div className="font-medium text-gray-900 customTooltip">
            +91 {row.userId?.mobile || "-"}
            </div>
          </CustomTooltip>
          <CustomTooltip title={row.userId?.email || "-"}>
            <div className="text-xs text-gray-500 customTooltip">
              {row.userId?.email || "-"}
            </div>
          </CustomTooltip>
        </div>
      ),
    },
    {
      id: "items",
      label: "Items",
      minWidth: 70,
      selector: (row: Order) => (
        <CustomTooltip title={(row.medicineId?.length || 0).toString()}>
          <span className="text-gray-700 customTooltip">
            {row.medicineId?.length || 0}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "payment_id",
      label: "Payment ID",
      minWidth: 100,
      selector: (row: Order) => (
        <CustomTooltip title={row.payment_id || "Not Available"}>
          <span className="customTooltip">{row.payment_id || "-"}</span>
        </CustomTooltip>
      ),
    },
    {
      id: "total_amount",
      label: "Amount",
      minWidth: 100,
      selector: (row: Order) => (
        <CustomTooltip title={row.total_order_amount?.toFixed(2) || "0.00"}>
          <span className="customTooltip">
            ₹{row.total_order_amount?.toFixed(2) || "0.00"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "discount",
      label: "Discount",
      minWidth: 90,
      selector: (row: Order) => (
        <CustomTooltip
          title={row.discount > 0 ? `₹${row.discount.toFixed(2)}` : "-"}
        >
          <span className="font-medium text-green-600 customTooltip">
            {row.discount > 0 ? `₹${row.discount.toFixed(2)}` : "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "payment_mode",
      label: "Payment Mode",
      minWidth: 110,
      selector: (row: Order) => (
        <CustomTooltip title={row.payment_mode || "-"}>
          <span className="capitalize text-gray-700 text-xs customTooltip">
            {row.payment_mode || "-"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "payment_status",
      label: "Payment Status",
      minWidth: 120,
      selector: (row: Order) => (
        <CustomTooltip title={row.payment_status || "Pending"}>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-center inline-flex justify-center items-center customTooltip ${getStatusColor(
              row.payment_status
            )}`}
            style={{ minWidth: 110, letterSpacing: 0.4 }}
          >
            {row.payment_status || "Pending"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "order_status",
      label: "Order Status",
      minWidth: 120,
      selector: (row: Order) => (
        <CustomTooltip title={row.order_status || "Pending"}>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-center inline-flex justify-center items-center customTooltip ${getStatusColor(
              row.order_status
            )}`}
            style={{ minWidth: 110, letterSpacing: 0.4 }}
          >
            {row.order_status || "Pending"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "prescription_status",
      label: "Prescription",
      minWidth: 140,
      selector: (row: Order) => (
        <CustomTooltip title={row.prescription_status || "Not Required"}>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase text-center inline-flex justify-center items-center customTooltip ${getPrescriptionColor(
              row.prescription_status || ""
            )}`}
            style={{ minWidth: 120, letterSpacing: 0.4 }}
          >
            {row.prescription_status || "Not Required"}
          </span>
        </CustomTooltip>
      ),
    },
    {
      id: "createdAt",
      label: "Date",
      minWidth: 120,
      selector: (row: Order) => {
        const dateText = new Date(row.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return (
          <CustomTooltip title={dateText}>
            <span className="text-gray-700 customTooltip">{dateText}</span>
          </CustomTooltip>
        );
      },
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
