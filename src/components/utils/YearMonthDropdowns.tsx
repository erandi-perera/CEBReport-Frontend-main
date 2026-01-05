import React, {useState, useEffect} from "react";
import {FaChevronDown} from "react-icons/fa";

interface YearMonthDropdownsProps {
	selectedYear: number | null;
	setSelectedYear: (year: number | null) => void;
	selectedMonth: number | null;
	setSelectedMonth: (month: number | null) => void;
	className?: string;
}

/**
 * Reusable Year and Month Dropdowns
 * Includes: Current year ±10 years, and months 1–13 (with "13th Period")
 */
const YearMonthDropdowns: React.FC<YearMonthDropdownsProps> = ({
	selectedYear,
	setSelectedYear,
	selectedMonth,
	setSelectedMonth,
	className = "",
}) => {
	// Available years: current year and past 20 years
	const years = Array.from(
		{length: 21},
		(_, i) => new Date().getFullYear() - i
	);

	// Months 1 to 13 (13 = 13th Period)
	const months = Array.from({length: 13}, (_, i) => i + 1);

	// Dropdown open states
	const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
	const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

	// Close dropdowns when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (
				!target.closest(".year-dropdown") &&
				!target.closest(".month-dropdown")
			) {
				setYearDropdownOpen(false);
				setMonthDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const getMonthName = (monthNum: number | null): string => {
		if (monthNum === null) return "Select Month";

		const monthNames = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];
		return monthNames[monthNum - 1] || "Select Month";
	};

	return (
		<div className={`flex gap-4 ${className}`}>
			{/* Year Dropdown */}
			<div className="year-dropdown relative w-40">
				<label className="block text-xs font-medium text-gray-700 mb-1">
					Year
				</label>
				<button
					type="button"
					onClick={() => {
						setYearDropdownOpen(!yearDropdownOpen);
						setMonthDropdownOpen(false);
					}}
					className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#7A0000]"
				>
					<span>
						{selectedYear !== null ? selectedYear : "Select Year"}
					</span>
					<FaChevronDown
						className={`w-3 h-3 text-gray-400 transition-transform ${
							yearDropdownOpen ? "rotate-180" : ""
						}`}
					/>
				</button>

				{yearDropdownOpen && (
					<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
						{years.map((year) => (
							<button
								key={year}
								type="button"
								onClick={() => {
									setSelectedYear(year);
									setYearDropdownOpen(false);
								}}
								className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
									selectedYear === year
										? "bg-[#7A0000] text-white"
										: "text-gray-700"
								}`}
							>
								{year}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Month Dropdown */}
			<div className="month-dropdown relative w-48">
				<label className="block text-xs font-medium text-gray-700 mb-1">
					Month
				</label>
				<button
					type="button"
					onClick={() => {
						setMonthDropdownOpen(!monthDropdownOpen);
						setYearDropdownOpen(false);
					}}
					className="w-full flex justify-between items-center px-3 py-1.5 border border-gray-300 rounded bg-white text-gray-700 text-sm focus:outline-none focus:ring-1 focus:ring-[#7A0000]"
				>
					<span>{getMonthName(selectedMonth)}</span>
					<FaChevronDown
						className={`w-3 h-3 text-gray-400 transition-transform ${
							monthDropdownOpen ? "rotate-180" : ""
						}`}
					/>
				</button>

				{monthDropdownOpen && (
					<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
						{months.map((month) => (
							<button
								key={month}
								type="button"
								onClick={() => {
									setSelectedMonth(month);
									setMonthDropdownOpen(false);
								}}
								className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
									selectedMonth === month
										? "bg-[#7A0000] text-white"
										: "text-gray-700"
								}`}
							>
								{getMonthName(month)}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default YearMonthDropdowns;
