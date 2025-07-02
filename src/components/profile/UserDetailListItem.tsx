type DetailProps = {
  label: string;
  value: string | null | undefined;
  className?: string;
};

const Detail: React.FC<DetailProps> = ({ label, value, className }) => (
  <div className={`flex flex-col px-5 py-2 ${className}`}>
    <span className="text-gray-600 font-medium">{label}</span>
    <span className="text-gray-800 bg-gray-100 py-3 px-6">
      {value || "N/A"}
    </span>
  </div>
);
export default Detail;
