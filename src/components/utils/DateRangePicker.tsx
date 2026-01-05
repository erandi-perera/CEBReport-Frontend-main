// File: components/DateRangePicker.tsx
import React from "react";

interface DateRangePickerProps {
	fromDate: string;
	toDate: string;
	onFromChange: (value: string) => void;
	onToChange: (value: string) => void;
	minDate?: string;
	maxDate?: string;
	disabled?: boolean;
	labelClassName?: string;
	inputClassName?: string;
}

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
const currentDay = String(today.getDate()).padStart(2, "0");

const DateRangePicker: React.FC<DateRangePickerProps> = ({
	maxDate = `${currentYear}-${currentMonth}-${currentDay}`,
	minDate = `${currentYear - 20}-${currentMonth}-${currentDay}`,
	fromDate,
	toDate,
	onFromChange,
	onToChange,
	disabled = false,
	labelClassName = "text-xs font-bold text-[#7A0000]",
	inputClassName = "pl-3 pr-3 py-1.5 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm",
}) => {
	return (
		<div className="flex flex-col sm:flex-row sm:justify-end sm:gap-6 gap-4 w-full mb-2">
			<div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
				<label className={labelClassName}>From Date:</label>
				<input
					type="date"
					value={fromDate}
					onChange={(e) => onFromChange(e.target.value)}
					min={minDate}
					max={maxDate}
					disabled={disabled}
					className={`${inputClassName} w-full sm:w-auto`}
				/>
			</div>
			<div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
				<label className={labelClassName}>To Date:</label>
				<input
					type="date"
					value={toDate}
					onChange={(e) => onToChange(e.target.value)}
					min={minDate}
					max={maxDate}
					disabled={disabled}
					className={`${inputClassName} w-full sm:w-auto`}
				/>
			</div>
		</div>
	);
};

export default DateRangePicker;
