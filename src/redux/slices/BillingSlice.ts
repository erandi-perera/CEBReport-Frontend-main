// src/redux/slices/billingSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type BillingState = {
  acctNo: string;
  FbillCycle: number;
  TbillCycle: number;
};

const initialState: BillingState = {
  acctNo: "",
  FbillCycle: 0,
  TbillCycle: 0,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {
    setBillingData(state, action: PayloadAction<BillingState>) {
      return { ...state, ...action.payload };
    },
    clearBillingData() {
      return initialState;
    },
  },
});

export const { setBillingData, clearBillingData } = billingSlice.actions;
export default billingSlice.reducer;
