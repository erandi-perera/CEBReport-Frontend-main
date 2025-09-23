import React from "react";

interface BackButtonProps {
  onClick: () => void;
  text?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onClick, 
  text = "Back to Home", 
  variant = "primary",
  className = ""
}) => {
  const baseClasses = "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  const variantClasses = {
    primary: "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 focus:ring-gray-300",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg 
        stroke="currentColor" 
        fill="currentColor" 
        strokeWidth="0" 
        viewBox="0 0 448 512" 
        className="w-3 h-3" 
        height="1em" 
        width="1em" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path>
      </svg>
      {text}
    </button>
  );
};

export default BackButton;


