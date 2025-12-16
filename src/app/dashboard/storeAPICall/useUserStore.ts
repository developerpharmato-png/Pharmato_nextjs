// src/store/useUserStore.ts
import { createApiStore } from "./createApiStore";

// Using `any` here to keep flexible API response shapes
// You can replace with proper types later
export const OrderListStore = createApiStore<any>();
export const OrderDetailsStore = createApiStore<any>();
export const ApprovePrescriptionStore = createApiStore<any>();
export const RejectPrescriptionStore = createApiStore<any>();

export const CategoriesStore = createApiStore<any>();
export const SubcategoriesStore = createApiStore<any>();

// Store Management - Separate stores for each operation
export const StoreManagersStore = createApiStore<any>();
export const StoreListStore = createApiStore<any>();
export const StoreDetailStore = createApiStore<any>();
export const StoreCreateStore = createApiStore<any>();
export const StoreUpdateStore = createApiStore<any>();
 