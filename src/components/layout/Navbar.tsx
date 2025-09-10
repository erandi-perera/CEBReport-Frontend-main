import CEBlogo from "../../assets/CEBLOGO.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="h-14 bg-gradient-to-r from-white to-gray-50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] flex items-center justify-between px-6 sm:px-0 relative bg-fixed border-b border-gray-100 ">
      <Link to="/home" className="flex items-center" aria-label="Go to Home">
        <div className="w-14 sm:w-16 md:w-20 transition-transform duration-300 flex items-center">
          <img
            src={CEBlogo}
            alt="CEB Logo"
            className="w-full h-auto object-contain max-h-10"
          />
        </div>
        <div className="text-lg sm:text-2xl font-semibold text-[#800000] hidden sm:block tracking-wide ml-4">
          CEB REPORTING
        </div>
      </Link>
      <div className="flex items-center gap-3"></div>
    </nav>
  );
};
export default Navbar;
