export type Customer = {
  customerMasDetail: any;
  customerReadDetail: ReadDetails[];
};
export type ReadDetails = {
  billCycle: string;
  days: string;
  kwh: string;
  readDate: string;
  readMet1: string;
  readMet2: string;
  readMet3: string;
  units: string;
  year: string;
};

export type BulkCustomer = {
  customerMasDetail: any;
  customerTransDetail: BulkCustomerTransDetails[];
};

export type BulkCustomerTransDetails = {
  billCycle: string;
  year: string;
  transDate: string | null;
  transType: string;
  reading: string | null;
  units: string | null;
  rate: number;
  amount: number;
  monthlyChg: number;
  payments: number;
  debits: number;
  credits: number;
  dueAmount: number;
  dueAmtDrCr: null;
  balance: string | null;
  balanceDrCr: string | null;
};

export interface Transaction {
  billCycle: string;
  transactionDate: string;
  description: string;
  transactionAmount: string;
  balance: string;
  yrMnth: string;
  Days: string;
  Units: string;
}

export interface CustomerTransactionHistory {
  accountNumber: string;
  name: string;
  address: string;
  tariff: string;
  wlkOdr: string;
  met1: string;
  met2: string;
  met3: string;
  area: string;
  province: string;
  netType: string;
  balance: string;
  date: string;
  transactions: Transaction[];
}

export interface TransactionHistoryProps {
  initialAccountNumber: string;
  FbillCycle: number;
  TbillCycle: number;
}

export type RawTransaction = {
  billCycle: string;
  yrMnth?: string;
  days?: string;
  units?: string;
  acctNumber?: string;
  transDate?: string;
  transType?: string;
  transAmt?: number;
  balance?: number;
  transDrCr?: string;
  balDrCr?: string;
};

export type OrdinaryCusTransaction = {
  customerMasDetail: any;
  customerTransDetail: customerTransDetail[];
};

export type customerTransDetail = {
  billCycle: string;
  yrMnth: string;
  days: string;
  units: string;
  metRead1: null | string;
  metRead2: null | string;
  metRead3: null | string;
  transDate: string;
  transAmt: number;
  transDrCr: string;
  transCode: null | string;
  transType: string;
  prvBalance: number;
  balance: number;
  balDrCr: string;
};
