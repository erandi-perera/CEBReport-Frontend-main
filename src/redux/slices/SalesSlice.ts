import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  ORDINARY_SALES_API,
  BULK_SALES_API,
} from "../../services/BackendServices";

// Types for sales data
export interface SalesFormData {
  billCycle: number;
  customerType: "ordinary" | "bulk";
}

export interface SalesRecord {
  // Add specific fields based on your API response
  // This is a placeholder - adjust according to actual API response
  id?: string;
  date?: string;
  amount?: number;
  description?: string;
  [key: string]: any; // Allow for dynamic fields
}

// API Response types
export interface OrdinarySalesResponse {
  OrdList: SalesRecord[];
}

export interface BulkSalesResponse {
  BulkList: SalesRecord[];
}

export interface SalesState {
  formData: SalesFormData;
  ordinarySalesData: SalesRecord[] | null;
  bulkSalesData: SalesRecord[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesState = {
  formData: {
    billCycle: 0,
    customerType: "ordinary",
  },
  ordinarySalesData: null,
  bulkSalesData: null,
  loading: false,
  error: null,
};

// Async thunk for fetching ordinary sales data
export const fetchOrdinarySales = createAsyncThunk(
  "sales/fetchOrdinarySales",
  async (formData: SalesFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<OrdinarySalesResponse>(
        ORDINARY_SALES_API,
        { billCycle: formData.billCycle }
      );
      return response.data.OrdList || []; // Extract OrdList from response
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch ordinary sales data"
      );
    }
  }
);

// Async thunk for fetching bulk sales data
export const fetchBulkSales = createAsyncThunk(
  "sales/fetchBulkSales",
  async (formData: SalesFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post<BulkSalesResponse>(BULK_SALES_API, {
        billCycle: formData.billCycle,
      });
      return response.data.BulkList || []; // Extract BulkList from response
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to  fetch bulk sales data"
      );
    }
  }
);

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setSalesFormData(state, action: PayloadAction<SalesFormData>) {
      state.formData = action.payload;
    },
    clearSalesData(state) {
      state.ordinarySalesData = null;
      state.bulkSalesData = null;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Ordinary Sales
    builder
      .addCase(fetchOrdinarySales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdinarySales.fulfilled, (state, action) => {
        state.loading = false;
        state.ordinarySalesData = action.payload;
        state.bulkSalesData = null; // Clear bulk data when fetching ordinary
      })
      .addCase(fetchOrdinarySales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.ordinarySalesData = null;
      });

    // Bulk Sales
    builder
      .addCase(fetchBulkSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBulkSales.fulfilled, (state, action) => {
        state.loading = false;
        state.bulkSalesData = action.payload;
        state.ordinarySalesData = null; // Clear ordinary data when fetching bulk
      })
      .addCase(fetchBulkSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.bulkSalesData = null;
      });
  },
});

export const { setSalesFormData, clearSalesData, clearError } =
  salesSlice.actions;
export default salesSlice.reducer;
