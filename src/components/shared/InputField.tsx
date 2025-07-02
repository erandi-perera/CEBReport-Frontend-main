const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (e: any) => void;
  placeholder: string;
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded text-sm shadow focus:outline-none focus:ring"
      />
    </div>
  );
};

export default InputField;
