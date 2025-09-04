// Interfaces for Age Analysis components
export interface Area {
  AreaCode: string;
  AreaName: string;
  ErrorMessage?: string | null;
}

export interface BillCycleOption {
  display: string;
  code: string;
}

export interface CustomerTypeOption {
  display: string;
  value: string;
}

export interface Debtor {
  AreaName: string;
  AccountNumber: string;
  TariffCode: string;
  OutstandingBalance: number;
  FirstName: string;
  LastName: string;
  Address1: string;
  Address2: string;
  Address3: string;
  Month0: number;
  Month1: number;
  Month2: number;
  Month3: number;
  Month4: number;
  Month5: number;
  Month6: number;
  Months7_9: number;
  Months10_12: number;
  Months13_24: number;
  Months25_36: number;
  Months37_48: number;
  Months49_60: number;
  Months61Plus: number;
  ErrorMessage: string | null;
}

export interface ApiResponse<T> {
  data: T;
  errorMessage: string | null;
}

export interface FormData {
  custType: string;
  billCycle: string;
  areaCode: string;
  timePeriod: string;
}

export interface TimePeriod {
  value: string;
  label: string;
} 