import React from "react";
import { FaCubes } from "react-icons/fa";

interface MaterialHeaderProps {
  matCd: string | undefined;
  materialName: string | null;
  navigate: (path: string) => void;
}

const MaterialHeader: React.FC<MaterialHeaderProps> = ({ matCd, materialName }) => (
  <>
    <div className="mb-8">
      <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-sm border border-gray-100 px-6 py-4 mb-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 border border-blue-100 shadow-sm mr-3">
          <FaCubes className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-lg font-normal text-gray-800 tracking-tight leading-tight mb-0.5">
            Material Details 
          </h1>
          <div className="text-xs text-gray-500 font-medium truncate">
            {matCd && (
              <span className="mr-2">
                Material Code And Name: <span className="text-gray-700 font-semibold">{matCd}</span>
                {materialName && (
                  <span className="text-gray-700 font-semibold"> - {materialName}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

export default MaterialHeader; 