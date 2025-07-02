import { useState, FormEvent } from "react";
import { useDispatch } from "react-redux";
import { setSalesFormData } from "../../../redux/slices/SalesSlice";
import { MdDateRange } from "react-icons/md";

type Props = {
  onSubmit: (details: {
    billCycle: number;
    customerType: "ordinary" | "bulk";
  }) => void;
};

const SalesForm = ({ onSubmit }: Props) => {
  const [billCycle, setBillCycle] = useState("");
  const [customerType, setCustomerType] = useState<"ordinary" | "bulk">(
    "ordinary"
  );


  const dispatch = useDispatch();

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const salesDetails = {
      billCycle: parseInt(billCycle),
      customerType,
    };
    onSubmit(salesDetails);
    dispatch(setSalesFormData(salesDetails));
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="p-4 rounded-lg shadow-sm border border-gray-100 w-full flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 bg-white"
      >
        {/* Customer Type */}
        <div className="flex flex-col w-full sm:w-[28%]">
          <label className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
            <MdDateRange className="text-[#800000] text-sm" />
            Customer Type
          </label>
          <select
            value={customerType}
            onChange={(e) =>
              setCustomerType(e.target.value as "ordinary" | "bulk")
            }
            className="rounded-md bg-gray-50 h-8 px-3 text-xs border border-gray-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-colors text-gray-700"
            required
          >
            <option value="ordinary">Ordinary</option>
            <option value="bulk">Bulk</option>
          </select>
        </div>

        {/* Bill Cycle */}
        <div className="flex flex-col w-full sm:w-[28%]">
          <label className="text-xs text-gray-600 flex items-center gap-1.5 mb-1">
            <MdDateRange className="text-[#800000] text-sm" />
            Bill Cycle
          </label>
          <input
            type="number"
            value={billCycle}
            onChange={(e) => setBillCycle(e.target.value)}
            className="rounded-md bg-gray-50 h-8 px-3 text-xs border border-gray-200 focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-colors text-gray-700"
            placeholder="Enter bill cycle"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-[#800000] text-white px-4 py-2 rounded-md text-xs font-medium w-full sm:w-[12%] h-8 hover:bg-[#800000]/90 transition-colors focus:ring-2 focus:ring-[#800000]/20 focus:outline-none"
        >
          Submit
        </button>
      </form>

      {/* Error */}
  
    </>
  );
};

export default SalesForm;
