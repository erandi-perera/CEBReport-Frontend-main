import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import { 
  Zap
} from "lucide-react";

const Home: React.FC = () => {
  const { user } = useUser();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maroonGrad = "bg-gradient-to-r from-[#7A0000] to-[#A52A2A]";



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
                     {/* Hero Section */}
        <div className={`relative overflow-hidden bg-white text-gray-900 py-8 px-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         <div className="max-w-6xl mx-auto">
           <div className="text-center">
                           <h1 className="text-2xl md:text-3xl font-bold mb-2 animate-fade-in text-[#7A0000]">
                Welcome{user?.Name ? `, ${user.Name}` : ""}
              </h1>
              <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto leading-relaxed mb-3">
                Access comprehensive management reports and analytics for informed decision-making
              </p>
           </div>
         </div>
         
                   {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-6 left-6 w-12 h-12 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-full animate-pulse"></div>
            <div className="absolute top-16 right-12 w-8 h-8 bg-gradient-to-r from-green-400/45 to-blue-400/45 rounded-full animate-ping"></div>
            <div className="absolute bottom-8 left-1/4 w-6 h-6 bg-gradient-to-r from-orange-400/50 to-red-400/50 rounded-full animate-bounce"></div>
            <div className="absolute top-1/2 left-1/3 w-10 h-10 bg-gradient-to-r from-purple-400/35 to-pink-400/35 rounded-full animate-float"></div>
            <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-gradient-to-r from-cyan-400/40 to-blue-400/40 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/4 right-1/3 w-14 h-14 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          </div>
       </div>

             <div className="max-w-6xl mx-auto px-4 py-4">


                 {/* Main Content Grid */}
         <div className="grid grid-cols-1 gap-6 mb-6">
           {/* About Section */}
           <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
             <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                               <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${maroonGrad} text-white animate-pulse`} style={{
                    background: 'linear-gradient(45deg, #7A0000, #A52A2A, #7A0000)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-shift 2s ease-in-out infinite'
                  }}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">About This Portal</h2>
                </div>
               <p className="text-gray-700 leading-relaxed mb-4 text-base">
                 This comprehensive portal provides secure access to CEB management reports and analytics. 
                 Designed for efficiency and ease of use, it offers role-based access to critical financial 
                 and operational data.
               </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Access</h4>
                    <p className="text-sm text-gray-600">EPF number-based authentication with role-based permissions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Real-time Data</h4>
                    <p className="text-sm text-gray-600">Access to live financial and operational reports</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Export Options</h4>
                    <p className="text-sm text-gray-600">CSV export and print functionality for all reports</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-600">Advanced analysis tools for data-driven decisions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

                                                                                                           {/* Animated Decorative Elements */}
                   <div className="relative overflow-hidden py-12">
                     {/* Background animated elements - similar to hero section */}
                     <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                       <div className="absolute top-4 left-8 w-10 h-10 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full animate-pulse"></div>
                       <div className="absolute top-12 right-16 w-6 h-6 bg-gradient-to-r from-green-400/35 to-blue-400/35 rounded-full animate-ping"></div>
                       <div className="absolute bottom-6 left-1/3 w-8 h-8 bg-gradient-to-r from-orange-400/40 to-red-400/40 rounded-full animate-bounce"></div>
                       <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-to-r from-purple-400/25 to-pink-400/25 rounded-full animate-float"></div>
                       <div className="absolute bottom-1/3 left-1/4 w-7 h-7 bg-gradient-to-r from-cyan-400/30 to-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '0.8s'}}></div>
                       <div className="absolute top-1/4 left-1/2 w-9 h-9 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                       <div className="absolute bottom-1/4 right-1/3 w-11 h-11 bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full animate-ping" style={{animationDelay: '1.2s'}}></div>
                       <div className="absolute top-3/4 left-1/6 w-5 h-5 bg-gradient-to-r from-emerald-400/30 to-green-400/30 rounded-full animate-float" style={{animationDelay: '0.6s'}}></div>
                     </div>
                     
                     {/* Center decorative elements */}
                     <div className="flex justify-center items-center space-x-8 relative z-10">
                       <div className="w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-pulse flex items-center justify-center">
                         <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
                       </div>
                       <div className="w-12 h-12 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full animate-ping flex items-center justify-center">
                         <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
                       </div>
                       <div className="w-20 h-20 bg-gradient-to-r from-orange-400/20 to-red-400/20 rounded-full animate-float flex items-center justify-center">
                         <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse"></div>
                       </div>
                       <div className="w-14 h-14 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-bounce flex items-center justify-center">
                         <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-ping"></div>
                       </div>
                     </div>
                   </div>

                  
      </div>
      
    </div>
  );
};

export default Home;


