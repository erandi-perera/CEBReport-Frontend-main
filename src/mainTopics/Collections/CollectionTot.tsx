import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HeadOfficeCollectionTotal: React.FC = () => {
  const maroon = "text-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);

  const handleViewReport = () => {
    if (!fromDate || !dueDate) {
      alert('Please select both From Date and Due Date');
      return;
    }

    // Replace with your real report logic (API call, show table, etc.)
    console.log('View Report params:', {
      from: fromDate.toISOString().split('T')[0],
      to: dueDate.toISOString().split('T')[0],
    });

    alert('Report view triggered (mock)');
  };

  const handleDownloadPDF = () => {
    if (!fromDate || !dueDate) {
      alert('Please select both From Date and Due Date');
      return;
    }

    // Replace with your real PDF generation / download logic
    console.log('Download PDF params:', {
      from: fromDate.toISOString().split('T')[0],
      to: dueDate.toISOString().split('T')[0],
    });

    alert('PDF download started (mock)');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans">
      {/* Title / Header + Form */}
      <h2 className={`text-xl font-bold mb-6 ${maroon}`}>
        Head Office Collection Total
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleViewReport();
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* From Date */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>
              From Date
            </label>
            <DatePicker
              selected={fromDate}
              onChange={(date: Date | null) => setFromDate(date)}
              selectsStart
              startDate={fromDate ?? undefined}
              endDate={dueDate ?? undefined}
              maxDate={dueDate ?? new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select from date"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent outline-none"
              wrapperClassName="w-full"
            />
          </div>

          {/* Due Date */}
          <div className="flex flex-col">
            <label className={`${maroon} text-xs font-medium mb-1`}>
              To Date
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date: Date | null) => setDueDate(date)}
              selectsEnd
              startDate={fromDate ?? undefined}
              endDate={dueDate ?? undefined}
              minDate={fromDate ?? undefined}
              maxDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select to date"
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent outline-none"
              wrapperClassName="w-full"
            />
          </div>

          {/* Empty column for alignment */}
          <div className="hidden md:block" />
        </div>

        {/* Buttons - both View Report and Download PDF */}
        <div className="w-full mt-6 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            type="submit"
            className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow ${maroonGrad} text-white hover:opacity-90 min-w-[140px]`}
          >
            View Report
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className={`px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow ${maroonGrad} text-white hover:opacity-90 min-w-[140px]`}
          >
            Download PDF
          </button>
        </div>
      </form>

      {/* Optional: Report preview area (shown after dates are selected) */}
      {fromDate && dueDate && (
        <div className="mt-8 border border-gray-300 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${maroon}`}>
                Head Office Collection Total Report
              </h3>
              <button
                onClick={() => {
                  setFromDate(null);
                  setDueDate(null);
                }}
                className={`px-5 py-2 ${maroonGrad} text-white text-xs rounded-md shadow`}
              >
                New Search
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Date Range:{' '}
              <span className="font-bold">
                {fromDate.toLocaleDateString('en-GB')} to{' '}
                {dueDate.toLocaleDateString('en-GB')}
              </span>
            </p>

            {/* Placeholder for future table / chart */}
            <div className="text-center py-12 text-gray-500 border-t border-gray-200">
              Report content will appear here (table, chart, totals...)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadOfficeCollectionTotal;