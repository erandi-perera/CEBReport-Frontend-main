import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext.tsx";
import { LoggedProvider } from "./contexts/UserLoggedStateContext.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/Store.ts";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <LoggedProvider>
      <UserProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </UserProvider>
    </LoggedProvider>
  </BrowserRouter>
);
