import { useState, FormEvent, useEffect } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import { useDispatch } from "react-redux";
import { setBillingData } from "../../../../redux/slices/BillingSlice";
import { MdPermIdentity } from "react-icons/md";
import { MdDateRange } from "react-icons/md";

type Props = {
  onSubmit: (details: {
    acctNo: string;
    FbillCycle: number;
    TbillCycle: number;
  }) => void;
};

type YrMnthDetail = {
  yrMonth: string;
};

type BillMonthResponse = {
  yrMnthDetail: YrMnthDetail[];
};

const BillingForm = ({ onSubmit }: Props) => {
  const [acctNo, setAcctNo] = useState("");
  const [FbillCycle, setFbillCycle] = useState("");
  const [TbillCycle, setTbillCycle] = useState("");
  const [months, setMonths] = useState<YrMnthDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();

  // Debounced function to post acctNo and fetch months
  const fetchMonths = debounce(async (acct: string) => {
    if (!acct || acct.length < 3) return;
    try {
      setLoading(true);

      const url =
        acct[2] === "7"
          ? "/CEBINFO_API_2025/api/billMonthBulk" // alternate URL when 3rd digit is 7
          : "/CEBINFO_API_2025/api/billMonth"; // default URL

      const response = await axios.post<BillMonthResponse>(url, {
        acctNo: acct,
      });

      setMonths(response.data.yrMnthDetail || []);
      console.log("Fetched months:", response.data.yrMnthDetail);
      setError("");
    } catch (err) {
      
      setMonths([]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, 500);
  // 500ms debounce

  // Effect to trigger POST request when acctNo changes
  useEffect(() => {
    fetchMonths(acctNo);
    return () => {
      fetchMonths.cancel();
    };
  }, [acctNo]);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const billingDetails = {
      acctNo,
      FbillCycle: parseInt(FbillCycle),
      TbillCycle: parseInt(TbillCycle),
    };
    onSubmit(billingDetails);
    dispatch(setBillingData(billingDetails));
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="p-4 rounded-lg shadow-sm border border-gray-100 w-full flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 bg-white"
      >
        {/* Account Number */}
        <div className="flex flex-col w-full sm:w-[28%]">
          <label className="text-xs  text-gray-600 flex items-center gap-1.5 mb-1">
            <MdPermIdentity className="text-[#800000] text-sm" />
            Account Number
          </label>
          <input
            type="text"
            value={acctNo}
            onChange={(e) => setAcctNo(e.target.value)}
            className="rounded-md bg-gray-50 h-8 px-3 text-xs border border-gray-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-colors"
            required
            placeholder="Enter account number"
          />
        </div>

        {/* From Month */}
        <div className="flex flex-col w-full sm:w-[28%]">
          <label className="text-xs  text-gray-600 flex items-center gap-1.5 mb-1">
            <MdDateRange className="text-[#800000] text-sm" />
            From month
          </label>
          <select
            value={FbillCycle}
            onChange={(e) => setFbillCycle(e.target.value)}
            className="rounded-md bg-gray-50 h-8 px-3 text-xs border border-gray-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-colors text-gray-700"
            required
            disabled={loading}
          >
            <option value="">Select month</option>
            {months.map((month) => (
              <option key={month.yrMonth} value={month.yrMonth}>
                {month.yrMonth}
              </option>
            ))}
          </select>
        </div>

        {/* To Month */}
        <div className="flex flex-col w-full sm:w-[28%]">
          <label className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
            <MdDateRange className="text-[#800000] text-sm" />
            To month
          </label>
          <select
            value={TbillCycle}
            onChange={(e) => setTbillCycle(e.target.value)}
            className="rounded-md bg-gray-50 h-8 px-3 text-xs border border-gray-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-colors text-gray-700"
            required
            disabled={loading}
          >
            <option value="">Select month</option>
            {months.map((month) => (
              <option key={month.yrMonth} value={month.yrMonth}>
                {month.yrMonth}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-[#800000] text-white px-4 py-2 rounded-md text-xs font-medium w-full sm:w-[12%] h-8 hover:bg-[#800000]/90 transition-colors focus:ring-2 focus:ring-[#800000]/20 focus:outline-none"
        >
          Generate Report
        </button>
      </form>

      {/* Error */}
      {error && <p className="text-red-500 mt-2 text-xs">{error}</p>}

      {/* Popup */}
    </>
  );
};

export default BillingForm;
