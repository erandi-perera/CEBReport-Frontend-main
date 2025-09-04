type DetailProps = {
  label: string;
  value: string | null | undefined;
  className?: string;
};

const Detail: React.FC<DetailProps> = ({ label, value, className }) => (
  <div className={`flex flex-col px-5 py-2 ${className}`}>
    <span className="text-gray-600 text-sm">{label}</span>
    <span className="text-[#7A0000] bg-[#FDF2F2] py-3 px-6 text-sm font-semibold rounded">
      {value || "N/A"}
    </span>
  </div>
);
export default Detail;
