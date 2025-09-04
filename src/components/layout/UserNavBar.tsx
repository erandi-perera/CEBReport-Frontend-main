import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import { useState, useRef, useEffect } from "react";
import { useLogged } from "../../contexts/UserLoggedStateContext";

const UserNavBar = () => {
  const navigate = useNavigate();
  const { user } = useUser(); // make sure logout is defined in your context
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { logout } = useLogged();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event: any) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    navigate("/user");
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <div
      className="w-full h-16 flex items-center justify-end bg-[#800000] px-4 sm:px-6 gap-2 sm:gap-3 relative"
      ref={dropdownRef}
    >
      <FaUser className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      <div
        className="text-white text-xs sm:text-xs cursor-pointer hover:text-gray-200 transition-colors"
        onClick={handleToggle}
      >
        {user.Name}
      </div>

      {isOpen && (
        <div className="absolute right-4 sm:right-6 top-full mt-1 bg-white shadow-lg rounded-md w-40 z-50">
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm transition-colors"
            onClick={handleProfileClick}
          >
            My Profile
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600 transition-colors"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserNavBar;
