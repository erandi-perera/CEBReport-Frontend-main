import LoginPage from "./pages/LoginPage";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./Layout";
import UserDetails from "./pages/UserDetails";
import MaterialDetails from "./mainTopics/inventory/MaterialDetails";
import ReportRoutes from "./routes/ReportRoutes";
import "./index.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/user"
          element={
            <Layout>
              <UserDetails />
            </Layout>
          }
        />

        <Route
          path="/report/inventory/material-details/:matCd"
          element={
            <Layout>
              <MaterialDetails />
            </Layout>
          }
        />

        {ReportRoutes()}
      </Routes>
      <ToastContainer />
    </>
  );
}
export default App;
