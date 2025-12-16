"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import HeaderWithAction from "../../../components/HeaderWithAction";
import { CustomImage } from "../../../components/miniComponents";
import Swal from "sweetalert2";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/order/detail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (data.success) {
        setOrder(data.data);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to fetch order details",
        });
        router.push("/dashboard/orders");
      }
    } catch (error) {
      console.error("Error fetching order detail:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch order details",
      });
      router.push("/dashboard/orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="containerStyle">
        <HeaderWithAction
          title="Order Details"
          subtitle="Loading order information..."
          showBack={true}
          onBack={() => router.push("/dashboard/orders")}
          showSearch={false}
          addShow={false}
        />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Order Details"
        subtitle={`Order ID: ${order.order_id}`}
        showBack={true}
        onBack={() => router.push("/dashboard/orders")}
        showSearch={false}
        addShow={false}
      />

      <div className="space-y-6">
        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Order Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium text-gray-900">{order.order_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium text-gray-900">{order.payment_id || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Mode</p>
              <p className="font-medium text-gray-900 capitalize">
                {order.payment_mode || "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.payment_status
                )}`}
              >
                {order.payment_status || "Pending"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.order_status
                )}`}
              >
                {order.order_status || "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {order.userId && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {order.userId.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">
                  {order.userId.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">
                  {order.userId.phone || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Order Items
          </h2>
          <div className="space-y-4">
            {order.medicineId && order.medicineId.length > 0 ? (
              order.medicineId.map((medicine: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    {medicine.coverImage || (medicine.images && medicine.images[0]) ? (
                      <CustomImage
                        coverImage={medicine.coverImage || medicine.images[0]}
                        images={medicine.images || []}
                        alt={medicine.name}
                        style={{
                          height: 64,
                          width: 64,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{medicine.name}</h3>
                    <p className="text-sm text-gray-500">
                      {medicine.manufacturer || "-"}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: <span className="font-medium">{medicine.quantity || 1}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 line-through">
                      ₹{medicine.mrp?.toFixed(2) || "0.00"}
                    </p>
                    <p className="font-medium text-gray-900">
                      ₹{medicine.price?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {medicine.discount}% off
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items found</p>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Payment Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Amount</span>
              <span className="font-medium">
                ₹{order.actual_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-medium">
                -₹{order.discount?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee</span>
              <span className="font-medium">
                ₹{order.platform_fee?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax Charged (User)</span>
              <span className="font-medium">
                ₹{order.user_total_tax_charged?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">RazorPay Tax</span>
              <span className="font-medium">
                ₹{order.razorPay_total_tax_charged?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-semibold">
              <span>Total Amount</span>
              <span className="text-green-600">
                ₹{order.total_order_amount?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
