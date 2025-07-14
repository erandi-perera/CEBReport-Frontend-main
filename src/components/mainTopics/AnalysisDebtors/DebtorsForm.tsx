import React from "react";

interface DebtorsFormProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  maroon: string;
  maroonGrad: string;
  navigate: (n: number) => void;
  getCodeLabel: () => string;
  getCodePlaceholder: () => string;
}

const DebtorsForm: React.FC<DebtorsFormProps> = ({
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  maroon,
  maroonGrad,
  navigate,

  getCodePlaceholder
}) => (
  <>
    <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200 border border-gray-200">
      {/* Back icon handled in parent */}
      Back
    </button>
    <div className="mb-4">
      <h1 className={`text-xl font-bold ${maroon}`}>Debtors Analysis</h1>
      <p className="text-xs text-gray-500">Debtors Summary By Area, Province, Divition Or Entire CEB </p>
    </div>
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Select</label>
        <select
          name="option"
          value={formData.option}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
        >
          <option value="A">Area</option>
          <option value="P">Province</option>
          <option value="D">Divition</option>
          <option value="E">Entire CEB</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Bill Month</label>
        <input
          type="text"
          name="cycle"
          value={formData.cycle}
          onChange={handleInputChange}
          placeholder="e.g. 430"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
        />
      </div>
      {formData.option !== "E" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Area</label>
          <input
            type="text"
            name="areaCode"
            value={formData.areaCode}
            onChange={handleInputChange}
            placeholder={getCodePlaceholder()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#7A0000] transition"
          />
        </div>
      )}
      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              name="showOrdinary"
              checked={formData.showOrdinary}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000]"
            />
            Ordinary
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              name="showBulk"
              checked={formData.showBulk}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-[#7A0000] focus:ring-[#7A0000]"
            />
            Bulk
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`flex-1 flex items-center justify-center px-4 py-2 text-white ${maroonGrad} rounded text-xs disabled:opacity-50 hover:brightness-110`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </>
          ) : (
            <>Search</>
          )}
        </button>
      </div>
    </form>
  </>
);

export default DebtorsForm; 