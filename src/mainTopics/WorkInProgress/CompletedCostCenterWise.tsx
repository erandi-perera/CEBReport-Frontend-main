import React, { useEffect, useState } from "react";
import { Search, RotateCcw, Eye, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "../../contexts/UserContext";

interface Department {
  DeptId: string;
  DeptName: string;
}

interface CompletedData {
  ProjectNo: string;
  StdCost: number;
  Descr: string;
  FundId: string;
  AccountCode: string;
  CatCd: string;
  DeptId: string;
  CctName: string;
  C8: string;
  CommitedCost: number;
  PaidDate: string | null;
  PivReceiptNo: string | null;
  PivNo: string | null;
  PivAmount: number;
  ConfDt: string;
}

const CompletedCostCenterWise = () => {
  // Get user from context
  const { user } = useUser();
  
  // Main state
  const [data, setData] = useState<Department[]>([]);
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filtered, setFiltered] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  // Selection state
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);

  // Completed data modal state
  const [completedModalOpen, setCompletedModalOpen] = useState(false);
  const [completedData, setCompletedData] = useState<CompletedData[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedError, setCompletedError] = useState<string | null>(null);

  // Get EPF Number from user context (Userno field)
  const epfNo = user?.Userno || "";
  
  // Debug log to see what EPF number is being used
  useEffect(() => {
    console.log('Current user:', user);
    console.log('EPF Number being used:', epfNo);
  }, [user, epfNo]);

  // Colors
  const maroon = "text-[#7A0000]";
  const maroonBg = "bg-[#7A0000]";
  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";

  // Paginated departments
  const paginatedDepartments = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Fetch departments - Same API as other components
  useEffect(() => {
    const fetchData = async () => {
      // Don't fetch if no EPF number
      if (!epfNo) {
        setError("No EPF number available. Please login again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/misapi/api/incomeexpenditure/departments/${epfNo}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const parsed = await res.json();
        
        let rawData = [];
        if (Array.isArray(parsed)) {
          rawData = parsed;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          rawData = parsed.data;
        } else if (parsed.result && Array.isArray(parsed.result)) {
          rawData = parsed.result;
        } else if (parsed.departments && Array.isArray(parsed.departments)) {
          rawData = parsed.departments;
        } else {
          console.log('Unexpected response structure:', parsed);
          rawData = [];
        }
        
        const final: Department[] = rawData.map((item: any) => ({
          DeptId: item.DeptId?.toString() || item.deptId?.toString() || "",
          DeptName: item.DeptName?.toString().trim() || item.deptName?.toString().trim() || "",
        }));
        
        setData(final);
        setFiltered(final);
      } catch (e: any) {
        console.error('API Error:', e);
        setError(e.message.includes("JSON.parse") ? "Invalid data format received from server. Please check if the API is returning valid JSON." : e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [epfNo]);

  // Filter departments
  useEffect(() => {
    const f = data.filter(
      (d) =>
        (!searchId || d.DeptId.toLowerCase().includes(searchId.toLowerCase())) &&
        (!searchName || d.DeptName.toLowerCase().includes(searchName.toLowerCase()))
    );
    setFiltered(f);
    setPage(1);
  }, [searchId, searchName, data]);

  const handleDepartmentSelect = (department: Department) => {
    setSelectedDepartment(department);
    setShowDateRangePicker(true);
  };

  const closeDateRangeModal = () => {
    setShowDateRangePicker(false);
    setSelectedDepartment(null);
    setStartDate(null);
    setEndDate(null);
    setShowCalendar(null);
  };

  const handleViewCompletedProjects = async () => {
    if (!selectedDepartment || !startDate || !endDate) {
      return;
    }

    setCompletedLoading(true);
    setCompletedError(null);
    setCompletedData([]);
    setShowDateRangePicker(false);
    setShowCalendar(null);

    try {
      // Format dates for API call
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `/workprogress/api/workinprogresscompletedcostcenterwise/${selectedDepartment.DeptId}/${fromDate}/${toDate}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(result)) {
        data = result;
      } else if (result.data && Array.isArray(result.data)) {
        data = result.data;
      } else if (result.result && Array.isArray(result.result)) {
        data = result.result;
      } else {
        console.log('Unexpected response structure:', result);
        data = [];
      }

      setCompletedData(data);
      setCompletedModalOpen(true);
    } catch (error: any) {
      console.error('Error fetching completed projects:', error);
      setCompletedError(error.message);
    } finally {
      setCompletedLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchId("");
    setSearchName("");
  };

  // Calendar component
  const CalendarComponent = ({ type }: { type: 'start' | 'end' }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const selectedDate = type === 'start' ? startDate : endDate;
    const setSelectedDate = type === 'start' ? setStartDate : setEndDate;

    const today = new Date();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Generate calendar days
    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      setShowCalendar(null);
    };

    const goToPreviousMonth = () => {
      setCurrentMonth(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
      setCurrentMonth(new Date(year, month + 1, 1));
    };

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return (
      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[240px] max-w-[280px]">
        <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
          <button
            onClick={goToPreviousMonth}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <h3 className="font-bold text-xs text-gray-800 px-1">
            {monthNames[month]} {year}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="p-0.5 text-center font-semibold text-gray-600 bg-gray-50 rounded text-xs">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="p-0.5"></div>;
            }
            
            const isSelected = selectedDate && 
              date.getDate() === selectedDate.getDate() &&
              date.getMonth() === selectedDate.getMonth() &&
              date.getFullYear() === selectedDate.getFullYear();
            
            const isToday = date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();
            
            const isDisabled = date > today;
            
            return (
              <button
                key={index}
                onClick={() => !isDisabled && handleDateSelect(date)}
                disabled={isDisabled}
                className={`p-0.5 text-center rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#7A0000] text-white shadow-sm'
                    : isToday
                    ? 'bg-blue-100 text-blue-600 font-bold border border-blue-300'
                    : isDisabled
                    ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                    : 'hover:bg-gray-100'
                }`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
        
        <div className="mt-2 pt-1 border-t border-gray-200">
          <button
            onClick={() => setShowCalendar(null)}
            className="w-full py-0.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 text-sm font-sans relative">
      {/* Blur overlay when date range modal is open */}
      {showDateRangePicker && (
        <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-40 rounded-xl"></div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className={`text-xl font-bold ${maroon}`}>
            Completed Cost Center Wise
          </h2>
        </div>
      </div>

      {/* Search Controls */}
      <div className="flex flex-wrap gap-3 justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchId}
            placeholder="Search by Dept ID"
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
            autoComplete="off"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            value={searchName}
            placeholder="Search by Name"
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8 pr-3 py-1.5 w-40 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition text-sm"
            autoComplete="off"
          />
        </div>
        {(searchId || searchName) && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <RotateCcw className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading departments...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-gray-600 bg-gray-100 p-4 rounded">No departments found.</div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="max-h-[50vh] overflow-y-auto">
              <table className="w-full table-fixed text-left text-gray-700 text-sm">
                <thead className={`${maroonGrad} text-white sticky top-0`}>
                  <tr>
                    <th className="px-4 py-2 w-1/4">Department ID</th>
                    <th className="px-4 py-2 w-1/2">Department Name</th>
                    <th className="px-4 py-2 w-1/4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDepartments.map((department, i) => (
                    <tr key={`${department.DeptId}-${i}`} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2 truncate font-mono">{department.DeptId}</td>
                      <td className="px-4 py-2 truncate">{department.DeptName}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDepartmentSelect(department)}
                          className={`px-3 py-1 ${maroonGrad} text-white rounded-md text-xs font-medium hover:brightness-110 transition shadow`}
                        >
                          <Eye className="inline-block mr-1 w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-3 mt-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {page} of {Math.ceil(filtered.length / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / pageSize), p + 1))}
              disabled={page >= Math.ceil(filtered.length / pageSize)}
              className="px-3 py-1 border rounded bg-white text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Date Range Picker Modal */}
      {showDateRangePicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-16">
          {/* White Backdrop Blur */}
          <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-lg"></div>
          
          {/* Professional Modal Container */}
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 overflow-hidden ml-8">
            {/* Modal Header - White Design */}
            <div className="bg-white p-4 text-gray-800 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold mb-1 text-[#7A0000]">SELECT DATE RANGE</h2>
                  <div className="w-8 h-1 bg-[#7A0000] mb-1"></div>
                  <h3 className="text-xl font-black text-[#7A0000]">VIEW PROJECTS</h3>
                  <p className="text-gray-600 mt-1 text-xs">
                    Department: <span className="font-semibold text-[#7A0000]">{selectedDepartment?.DeptName}</span>
                  </p>
                </div>
                <button 
                  onClick={closeDateRangeModal}
                  className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body - Increased Height */}
            <div className="p-4 min-h-[400px] flex flex-col">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-gray-800 mb-1">ENTER DATE RANGE BELOW TO UNLOCK</h4>
                <p className="text-gray-600 text-xs">Select both start and end dates to view completed projects</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Start Date Card */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    START DATE
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={startDate ? startDate.toLocaleDateString() : ''}
                      placeholder="Click to select start date"
                      readOnly
                      onClick={() => setShowCalendar(showCalendar === 'start' ? null : 'start')}
                      className="w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7A0000] focus:border-[#7A0000] cursor-pointer bg-gray-50 hover:bg-white transition-all duration-200 font-medium"
                    />
                    <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  </div>
                  {startDate && (
                    <div className="mt-3 text-green-600 font-semibold flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      Start date selected
                    </div>
                  )}
                  {showCalendar === 'start' && <CalendarComponent type="start" />}
                </div>

                {/* End Date Card */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    END DATE
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={endDate ? endDate.toLocaleDateString() : ''}
                      placeholder="Click to select end date"
                      readOnly
                      onClick={() => setShowCalendar(showCalendar === 'end' ? null : 'end')}
                      className="w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7A0000] focus:border-[#7A0000] cursor-pointer bg-gray-50 hover:bg-white transition-all duration-200 font-medium"
                    />
                    <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  </div>
                  {endDate && (
                    <div className="mt-3 text-green-600 font-semibold flex items-center">
                      <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                      End date selected
                    </div>
                  )}
                  {showCalendar === 'end' && <CalendarComponent type="end" />}
                </div>
              </div>

              {/* Date Range Summary - White Card */}
              {startDate && endDate && (
                <div className="mb-6 p-4 bg-white border border-gray-200 rounded-md text-gray-800 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 bg-[#7A0000] rounded-full mr-2"></div>
                    <h4 className="text-sm font-bold text-[#7A0000]">SELECTED DATE RANGE</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">FROM DATE</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {startDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-0.5">TO DATE</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {endDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-600 text-xs">
                      TOTAL DURATION: <span className="font-bold text-sm text-[#7A0000]">{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons - Bottom of Card */}
              <div className="flex gap-2 justify-between items-center pt-4 border-t border-gray-200 mt-auto">
                <button
                  onClick={closeDateRangeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleViewCompletedProjects}
                  disabled={!startDate || !endDate}
                  className={`px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    startDate && endDate
                      ? 'bg-gradient-to-r from-[#7A0000] to-[#A52A2A] text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  View Projects
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed Projects Modal */}
      {completedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-lg"></div>
          
          {/* Modal Container */}
          <div className="relative bg-white w-full max-w-7xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-white p-4 text-gray-800 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold mb-1 text-[#7A0000]">COMPLETED PROJECTS</h2>
                  <div className="w-8 h-1 bg-[#7A0000] mb-1"></div>
                  <h3 className="text-xl font-black text-[#7A0000]">PROJECT DETAILS</h3>
                  <p className="text-gray-600 mt-1 text-xs">
                    Department: <span className="font-semibold text-[#7A0000]">{selectedDepartment?.DeptName}</span>
                  </p>
                  <p className="text-gray-600 text-xs">
                    Period: <span className="font-semibold text-[#7A0000]">
                      {startDate?.toLocaleDateString()} to {endDate?.toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => setCompletedModalOpen(false)}
                  className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Loading State */}
              {completedLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0000] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading completed projects...</p>
                </div>
              )}

              {/* Error State */}
              {completedError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-800">Error Loading Data</h3>
                      <p className="text-red-700 text-sm mt-1">{completedError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              {!completedLoading && !completedError && completedData.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  {/* Currency indicator */}
                  <div className="flex justify-end p-2 bg-gray-50 border-b">
                    <span className="text-xs font-semibold text-gray-600">Currency: LKR</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700">
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Account Code</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Project Code</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Category Code</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Fund ID</th>
                          <th className="px-2 py-2 text-right border-r border-gray-200 font-semibold">Standard Cost</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Description</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Dept ID</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">PIV No.</th>
                          <th className="px-2 py-2 text-center border-r border-gray-200 font-semibold">Paid Date</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">PIV Receipt No.</th>
                          <th className="px-2 py-2 text-right border-r border-gray-200 font-semibold">Committed Cost</th>
                          <th className="px-2 py-2 text-left border-r border-gray-200 font-semibold">Material/Labour/Other</th>
                          <th className="px-2 py-2 text-right border-r border-gray-200 font-semibold">PIV Amount</th>
                          <th className="px-2 py-2 text-center border-r border-gray-200 font-semibold">Confirmation Date</th>
                          <th className="px-2 py-2 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedData.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs">{item.AccountCode}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs font-mono">{item.ProjectNo?.trim()}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs">{item.CatCd?.trim()}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs font-mono">{item.FundId?.trim()}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-right text-xs">
                              {item.StdCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs max-w-xs truncate" title={item.Descr?.trim()}>
                              {item.Descr?.trim()}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs">{item.DeptId}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs font-mono">{item.PivNo || '-'}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-center text-xs">
                              {item.PaidDate ? new Date(item.PaidDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs font-mono">{item.PivReceiptNo || '-'}</td>
                            <td className="px-2 py-2 border-r border-gray-200 text-right text-xs">
                              {item.CommitedCost?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-xs text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.C8 === 'LAB' ? 'bg-blue-100 text-blue-800' :
                                item.C8 === 'MAT' ? 'bg-green-100 text-green-800' :
                                item.C8 === 'OTH' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {item.C8 || 'N/A'}
                              </span>
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-right text-xs">
                              {item.PivAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200 text-center text-xs">
                              {item.ConfDt ? new Date(item.ConfDt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-2 py-2 text-right text-xs font-semibold">
                              {(item.StdCost + item.CommitedCost + item.PivAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-gray-300">
                          <td colSpan={4} className="px-2 py-3 font-bold text-gray-800">TOTAL</td>
                          <td className="px-2 py-3 text-right font-bold text-gray-800">
                            {completedData.reduce((sum, item) => sum + (item.StdCost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td colSpan={5}></td>
                          <td className="px-2 py-3 text-right font-bold text-gray-800">
                            {completedData.reduce((sum, item) => sum + (item.CommitedCost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                          <td className="px-2 py-3 text-right font-bold text-gray-800">
                            {completedData.reduce((sum, item) => sum + (item.PivAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td></td>
                          <td className="px-2 py-3 text-right font-bold text-[#7A0000] text-lg">
                            {completedData.reduce((sum, item) => sum + (item.StdCost || 0) + (item.CommitedCost || 0) + (item.PivAmount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* No Data State */}
              {!completedLoading && !completedError && completedData.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Completed Projects Found</h3>
                    <p className="text-gray-500">
                      No completed projects were found for the selected department and date range.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCompletedModalOpen(false)}
                className="px-6 py-2 bg-[#7A0000] text-white rounded-lg hover:bg-[#A52A2A] transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedCostCenterWise;