import { BillCycleOption, Debtor } from './types';

// Helper functions for Age Analysis components

export const generateBillCycleOptions = (billCycles: string[], maxCycle: string): BillCycleOption[] => {
  const maxCycleNum = parseInt(maxCycle);
  return billCycles.map((cycle, index) => ({
    display: cycle,
    code: (maxCycleNum - index).toString()
  }));
};

export const fetchWithErrorHandling = async (url: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.errorMessage) {
          errorMsg = errorData.errorMessage;
        }
      } catch (e) {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

export const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return value < 0 ? `(${formatted})` : formatted;
};

export const getFullName = (debtor: Debtor): string => {
  return `${debtor.FirstName} ${debtor.LastName}`.trim();
};

export const getFullAddress = (debtor: Debtor): string => {
  return [debtor.Address1, debtor.Address2, debtor.Address3]
    .filter(part => part && part.trim() !== '')
    .join(', ');
};

export const getAgeRangeFromTimePeriod = (timePeriod: string): string => {
  switch (timePeriod) {
    case "0-6": return "Months0_6";
    case "7-12": return "Months7_12";
    case "1-2": return "Years1_2";
    case "2-3": return "Years2_3";
    case "3-4": return "Years3_4";
    case "4-5": return "Years4_5";
    case ">5": return "Years5Plus";
    case "All": return "All";
    default: return "All";
  }
};

// Constants
export const TIME_PERIODS = [
  { value: "0-6", label: "0 - 6 Months" },
  { value: "7-12", label: "7 - 12 Months" },
  { value: "1-2", label: "1 - 2 Years" },
  { value: "2-3", label: "2 - 3 Years" },
  { value: "3-4", label: "3 - 4 Years" },
  { value: "4-5", label: "4 - 5 Years" },
  { value: ">5", label: "above 5 Years" },
  { value: "All", label: "All" },
];

export const CUSTOMER_TYPE_OPTIONS = [
  { display: "Active", value: "A" },
  { display: "Government", value: "G" },
  { display: "Finalized", value: "F" },
];

export const CHART_COLORS = [
  '#1E3A8A', '#10B981', '#F59E0B', '#6366F1', 
  '#3B82F6', '#6B7280', '#9CA3AF', '#D97706'
];

export const MAROON_COLOR = "text-[#7A0000]";
export const MAROON_GRADIENT = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]"; 