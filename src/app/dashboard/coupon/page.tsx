"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeaderWithAction from "../components/HeaderWithAction";

import { CouponListStore, CouponDeleteStore } from "../storeAPICall/useUserStore";
import { CouponListPath, CouponDeletePath } from "../storeAPICall/API/BaseApi";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import Toast from "@/utils/Toast";
import CouponTable from "./CouponTable";

import TextField from "@mui/material/TextField";

interface CouponFormData {
  _id: string;
  code: string;
  description: string;
  type: "FIXED" | "PERCENT";
  value: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt: string;
  maxCoupons: number;
  perUserLimit: number;
  isSecret: boolean;
  isActive: boolean;
}

const CouponPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [deletingCoupon, setDeletingCoupon] = useState<any | null>(null);

  const { data, loading, fetchData } = CouponListStore();
  const { postData: deleteCoupon, loading: deleteLoading } = CouponDeleteStore();

  const couponList = (data && data.data) || [];
  const totalCount = data && data.totalCount ? data.totalCount : couponList.length;

  useEffect(() => {
    fetchData({
      url: CouponListPath,
      data: { search, limit: rowsPerPage, offset: page + 1 },
    });
  }, [fetchData, page, rowsPerPage, search]);

  const handleEdit = (coupon: any) => {
    router.push(`/dashboard/coupon/AddEdit/${coupon._id}`);
  };

  const handleDeleteCoupon = async () => {
    if (!deletingCoupon?._id) return;

    try {
      await deleteCoupon(CouponDeletePath, { _id: deletingCoupon._id });
      //   Toast.success("Coupon deleted successfully");
      setDeletingCoupon(null);
      fetchData({
        url: CouponListPath,
        data: { search, limit: rowsPerPage, offset: page + 1 },
      });
    } catch (error) {
      //   Toast.error("Failed to delete coupon");
      console.error("Error deleting coupon:", error);
    }
  };

  const handleAdd = () => {
    router.push("/dashboard/coupon/AddEdit");
  };

  return (
    <div className="containerStyle scrollbar-hide">
      <HeaderWithAction
        title="Coupons"
        subtitle="Manage coupons and discount codes"
        addLabel="Add Coupon"
        handleAdd={handleAdd}
        addShow={true}
        showBack={false}
      />

      {/* Search Field */}
      <div className="mt-6 flex justify-start">
        <TextField
          label="Search Coupons"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0); // Reset to first page on search
          }}
          style={{ minWidth: 250 }}
        />
      </div>

      <div className="mt-10">
        <CouponTable
          data={couponList}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(coupon) => setDeletingCoupon(coupon)}
          onStatusChange={() => {
            fetchData({
              url: CouponListPath,
              data: { search, limit: rowsPerPage, offset: page + 1 },
            });
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCoupon} onClose={() => setDeletingCoupon(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete the coupon "{deletingCoupon?.code}"?</p>
          <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingCoupon(null)}>Cancel</Button>
          <Button
            onClick={handleDeleteCoupon}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CouponPage;
