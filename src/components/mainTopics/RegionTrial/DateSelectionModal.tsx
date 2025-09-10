import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

interface Region {
  compId: string;
  CompName: string;
}

interface DateSelectionModalProps {
  modalOpen: boolean;
  closeDateModal: () => void;
  selectedRegion: Region | null;
  handleDateSelection: (year: number, month: string) => void;
  maroon: string;
  maroonBg: string;
}

const DateSelectionModal: React.FC<DateSelectionModalProps> = ({
  modalOpen,
  closeDateModal,
  selectedRegion,
  handleDateSelection,
  maroon,
  maroonBg
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>("January");

  if (!modalOpen || !selectedRegion) return null;

  const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
    "13th Period"
  ];

  const handleSubmit = () => {
    handleDateSelection(selectedYear, selectedMonth);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-200 relative max-h-[90vh] overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${maroon}`}>
            Select Period for {selectedRegion.CompName}
          </h3>
          <button
            onClick={closeDateModal}
            className="text-gray-500 hover:text-red-500"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
          <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto mb-4">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                ${selectedYear === year
                  ? `${maroonBg} text-white border-[#7A0000]`
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                style={{ minWidth: "40px" }}
              >
                {year}
              </button>
            ))}
          </div>
          
          <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
          <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`text-xs py-1 rounded cursor-pointer border transition-colors duration-150
                ${selectedMonth === month
                  ? `${maroonBg} text-white border-[#7A0000]`
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                style={{ minWidth: "50px" }}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={closeDateModal}
            className="bg-gray-500 text-white py-2 px-6 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            className={`${maroonBg} text-white py-2 px-6 rounded hover:brightness-110 transition-colors text-sm`}
          >
            View Trial Balance
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelectionModal;
