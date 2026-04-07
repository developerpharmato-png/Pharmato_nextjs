export const WalletListStore = createApiStore<any>();
export const WalletAddAmountStore = createApiStore<any>();
import api from "./API/api";
// src/store/useUserStore.ts
import { createApiStore } from "./createApiStore";


export const OrderListStore = createApiStore<any>();
export const OrderDetailsStore = createApiStore<any>();
export const ApprovePrescriptionStore = createApiStore<any>();
export const RejectPrescriptionStore = createApiStore<any>();

export const CategoriesStore = createApiStore<any>();
export const SubcategoriesStore = createApiStore<any>();

export const MedicinesExportStore = createApiStore<any>();

// Dedicated store for order export (returns blobs)
export const OrderExportStore = createApiStore<any>();

export const StoreManagersStore = createApiStore<any>();
export const StoreListStore = createApiStore<any>();
export const StoreDetailStore = createApiStore<any>();
export const StoreCreateStore = createApiStore<any>();
export const StoreUpdateStore = createApiStore<any>();

export const BulkUploadPincodeStore = createApiStore<any>();

// Dashboard stores
export const DashboardOrdersStore = createApiStore<any>();
export const DashboardInventoryStore = createApiStore<any>();
export const DashboardRevenueStore = createApiStore<any>();

export const ProductDAshboardStore = createApiStore<any>();
export const OrderDAshboardStore = createApiStore<any>();
 

export const unreadNotificationStore = createApiStore<any>();
export const NotificationsListStore = createApiStore<any>();
export const markreadNotificationsStore = createApiStore<any>();
export const markReadAllNotificationsStore = createApiStore<any>();

// Customer Notifications
export const CustomerDropdownStore = createApiStore<any>();
export const SendCustomerNotificationsStore = createApiStore<any>();
export const CustomerNotificationsListStore = createApiStore<any>();
export const CustomerNotificationsDetailStore = createApiStore<any>();

// Settings & Policies
export const PaymentSettingsStore = createApiStore<any>();
export const PolicySettingsStore = createApiStore<any>();


// Marg
export const MargStore = createApiStore<any>();

export const fetchMargList = createApiStore<any>();

export const importMargData = createApiStore<any>();

// Coupon
export const CouponListStore = createApiStore<any>();
export const CouponCreateStore = createApiStore<any>();
export const CouponUpdateStore = createApiStore<any>();
export const CouponDeleteStore = createApiStore<any>();
export const CouponStatusStore = createApiStore<any>();
export const CouponSGEtBYIDsStore = createApiStore<any>();
export const CouponOrderUsedListStore = createApiStore<any>();
export const PincodeDetailStore = createApiStore<any>();
