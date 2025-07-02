import ceblogo from "../assets/ceb-wave.png";
import LoginCard from "../components/login/LoginCard";

const LoginPage = () => {
  return (
    <main className="min-h-screen w-full">
      <section className="relative w-full min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-x-0 bottom-0 w-full"
          style={{
            backgroundImage: `url(${ceblogo})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% auto",
            height: "400px",
            opacity: 0.8,
            zIndex: -1,
          }}
        ></div>

        <div className="w-full max-w-md opacity-80">
          <LoginCard />
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
