type DetailProps = {
  label: string;
  value: string | null | undefined;
  className?: string;
};

const Detail: React.FC<DetailProps> = ({ label, value, className }) => (
  <div className={`flex flex-col px-5 py-2 ${className}`}>
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="text-gray-800 bg-gray-50 border border-gray-200 py-3 px-6 text-sm font-medium rounded">
      {value || "N/A"}
    </span>
  </div>
);
export default Detail;
