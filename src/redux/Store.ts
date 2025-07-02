// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import billingReducer from "../redux/slices/BillingSlice";
import salesReducer from "../redux/slices/SalesSlice";

export const store = configureStore({
  reducer: {
    billing: billingReducer,
    sales: salesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
