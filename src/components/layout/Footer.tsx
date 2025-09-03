const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-1 md:space-y-0">
          {/* Company Info */}
          <div className="text-center md:text-left">
            <p className="text-gray-600 text-xs">
              Designed and Developed by{" "}
              <span className="font-medium text-[#800000]">
                IT Branch CEB@2025
              </span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} CEB. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
