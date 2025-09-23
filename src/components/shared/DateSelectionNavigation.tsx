import React from "react";
import { ChevronLeft } from "lucide-react";

interface DateSelectionNavigationProps {
  onBackToHome: () => void;
  onBackToDateSelection?: () => void;
  showBackToDateSelection?: boolean;
  maroonBg?: string;
}

const DateSelectionNavigation: React.FC<DateSelectionNavigationProps> = ({
  onBackToHome,
  onBackToDateSelection,
  showBackToDateSelection = false,
  maroonBg = "bg-[#7A0000]"
}) => {
  return (
    <div className="p-5 border-t flex justify-center gap-3">
      <button
        onClick={onBackToHome}
        className={`flex items-center gap-2 px-4 py-1.5 text-sm text-white rounded-md hover:brightness-110 ${maroonBg}`}
      >
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </button>
      {showBackToDateSelection && onBackToDateSelection && (
        <button
          onClick={onBackToDateSelection}
          className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Date Selection
        </button>
      )}
    </div>
  );
};

export default DateSelectionNavigation;
