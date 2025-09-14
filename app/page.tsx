"use client";
import { withUser } from "@workos-inc/authkit-nextjs/components";
import { useRouter } from "next/navigation";

interface HomePageProps {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

const HomePageComponent = ({ user }: HomePageProps) => {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600 mb-8">
              You're already logged in. Ready to continue?
            </p>
            <button
              onClick={handleDashboard}
              className="w-full bg-[#8661C1] text-white py-3 px-4 rounded-md hover:bg-[#7550A8] transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Refactor Project
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access your dashboard and manage your projects.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-[#8661C1] text-white py-3 px-4 rounded-md hover:bg-[#7550A8] transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default withUser(HomePageComponent);
