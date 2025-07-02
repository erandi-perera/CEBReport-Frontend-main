import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../contexts/UserContext";
import { useLogged } from "../../contexts/UserLoggedStateContext";
import { postJSON } from "../../helpers/LoginHelper";
import InputField from "../shared/InputField";
import ceb from "../../assets/CEBLOGO.png";

const LoginCard = () => {
  const { setLogged } = useLogged();
  const { setUser } = useUser();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    localStorage.removeItem("userData");

    try {
      const IsLogged = await postJSON("/CBRSAPI/CBRSUPERUserLogin", {
        Username: username,
        Password: password,
      });

      setLogged(IsLogged);

      if (IsLogged?.Logged) {
        toast.success("Login successful!", { autoClose: 2000 });
        navigate("/report/general");

        const userData = await postJSON("/CBRSAPI/CBRSEPFNOLogin", {
          Username: username,
          Password: password,
        });

        setUser(userData);

        if (userData?.Logged) {
          console.log("User details have been fetched successfully");
        } else {
          console.log("User details can't be fetched");
        }
      } else {
        toast.error("Invalid username or password");
      }
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Network or server error");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-[#ffffff] shadow-lg rounded-lg p-4 sm:p-6 md:p-8">
        <div className="flex justify-center mb-4">
          <img
            src={ceb}
            alt="CEB Logo"
            className="w-24 sm:w-32 md:w-35 h-auto"
          />
        </div>
        <div className="text-center text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Sign In With Credentials
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              className="form-checkbox text-gray-700 w-4 h-4"
            />
            <span className="ml-2 text-sm text-gray-600">Remember Me</span>
          </div>
          <button
            type="submit"
            className="w-full bg-[#7c0000] text-white py-2 px-4 rounded shadow hover:shadow-lg transition-all duration-150 text-sm sm:text-base"
          >
            Sign In
          </button>
        </form>
        <div className="flex justify-between mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500"></div>
      </div>
    </div>
  );
};

export default LoginCard;
