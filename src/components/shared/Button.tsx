import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  color?: string;
  width?: string;
  height?: string;
  onClick?: () => void;
  className?: string;
};

const CustomButton: React.FC<ButtonProps> = ({
  children,
  icon,
  iconPosition = "right",
  color = "bg-blue-500",
  width = "w-auto",
  height = "h-auto",
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-around text-white px-4 py-2 rounded text-xs ${color} ${width} ${height} ${className}`}
    >
      {icon && iconPosition === "left" && <span>{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span>{icon}</span>}
    </button>
  );
};

export default CustomButton;
