import React from 'react';
import { 
  Area, 
  BillCycleOption, 
  FormData
} from './types';
import { 
  CUSTOMER_TYPE_OPTIONS, 
  TIME_PERIODS, 
  MAROON_COLOR, 
  MAROON_GRADIENT 
} from './utils';

interface AgeAnalysisFormProps {
  formData: FormData;
  areas: Area[];
  billCycleOptions: BillCycleOption[];
  reportLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AgeAnalysisForm: React.FC<AgeAnalysisFormProps> = ({
  formData,
  areas,
  billCycleOptions,
  reportLoading,
  onInputChange,
  onSubmit
}) => {
  return (
    <>
      <h2 className={`text-xl font-bold mb-6 ${MAROON_COLOR}`}>Age Analysis</h2>
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Type Dropdown */}
          <div className="flex flex-col">
            <label className={`${MAROON_COLOR} text-xs font-medium mb-1`}>
              Select Customer Type:
            </label>
            <select
              name="custType"
              value={formData.custType}
              onChange={onInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent mb-1"
            >
              {CUSTOMER_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value} className="text-xs py-1">
                  {type.display} - {type.value}
                </option>
              ))}
            </select>
          </div>

          {/* Bill Cycle Dropdown */}
          <div className="flex flex-col">
            <label className={`${MAROON_COLOR} text-xs font-medium mb-1`}>
              Select Bill Cycle:
            </label>
            <select
              name="billCycle"
              value={formData.billCycle}
              onChange={onInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {billCycleOptions.map((option) => (
                <option key={option.code} value={option.code} className="text-xs py-1">
                  {option.display} - {option.code}
                </option>
              ))}
            </select>
          </div>

          {/* Area Dropdown */}
          <div className="flex flex-col">
            <label className={`${MAROON_COLOR} text-xs font-medium mb-1`}>
              Select Area:
            </label>
            <select
              name="areaCode"
              value={formData.areaCode}
              onChange={onInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {areas.map((area) => (
                <option key={area.AreaCode} value={area.AreaCode} className="text-xs py-1">
                  {area.AreaName} ({area.AreaCode})
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Dropdown */}
          <div className="flex flex-col">
            <label className={`${MAROON_COLOR} text-xs font-medium mb-1`}>
              Select Time Period:
            </label>
            <select
              name="timePeriod"
              value={formData.timePeriod}
              onChange={onInputChange}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-[#7A0000] focus:border-transparent"
              required
            >
              {TIME_PERIODS.map((period) => (
                <option key={period.value} value={period.value} className="text-xs py-1">
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* View Report Button */}
        <div className="w-full mt-6 flex justify-end">
          <button
            type="submit"
            disabled={reportLoading || !formData.areaCode || !formData.billCycle || !formData.custType}
            className={`
              px-6 py-2 rounded-md font-medium transition-opacity duration-300 shadow
              ${MAROON_GRADIENT} text-white
              ${reportLoading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}
            `}
          >
            {reportLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : "View Report"}
          </button>
        </div>
      </form>
    </>
  );
};

export default AgeAnalysisForm; 