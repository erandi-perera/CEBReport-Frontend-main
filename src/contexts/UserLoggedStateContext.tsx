import { createContext, useContext, useEffect, useState } from "react";

type UserLogged = {
  Errormsg: string;
  Logged: boolean;
};

type UserLoggedContextType = {
  logged: UserLogged;
  setLogged: (user: UserLogged) => void;
  logout: () => void;
};

const loginContext = createContext<UserLoggedContextType | undefined>(
  undefined
);

export const LoggedProvider = ({ children }: { children: React.ReactNode }) => {
  const [logged, setLogged] = useState<UserLogged>(() => {
    const stored = localStorage.getItem("userLogged");
    return stored ? JSON.parse(stored) : { Errormsg: "", Logged: true };
  });

  useEffect(() => {
    localStorage.setItem("userLogged", JSON.stringify(logged));
  }, [logged]);

  const logout = () => {
    setLogged({ Errormsg: "", Logged: false });
    localStorage.removeItem("userLogged");
    localStorage.removeItem("userData"); // Add this line
  };

  return (
    <loginContext.Provider value={{ logged, setLogged, logout }}>
      {children}
    </loginContext.Provider>
  );
};

export const useLogged = () => {
  const loggedContext = useContext(loginContext);
  if (!loggedContext) {
    throw new Error("User must be within LoggedProvider");
  }
  return loggedContext;
};
