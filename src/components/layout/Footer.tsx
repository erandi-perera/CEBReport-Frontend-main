const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            © {currentYear} Ceylon Electricity Board. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm mt-1">
            Designed and Developed with ❤️ by IT Branch CEB@{currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
