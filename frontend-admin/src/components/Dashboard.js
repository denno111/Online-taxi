import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Taxi Platform Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                {user?.userType}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Your Dashboard
              </h2>
              <p className="text-gray-600 mb-8">
                This is your {user?.userType} dashboard. More features will be
                added in upcoming sprints.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Profile
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage your account information
                  </p>
                  <div className="mt-4">
                    <p className="text-sm">
                      <strong>Email:</strong> {user?.email}
                    </p>
                    <p className="text-sm">
                      <strong>Phone:</strong> {user?.phone}
                    </p>
                    <p className="text-sm">
                      <strong>Status:</strong>{" "}
                      {user?.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Account Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your account verification status
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          user?.isEmailVerified ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="text-sm">
                        Email{" "}
                        {user?.isEmailVerified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          user?.isPhoneVerified ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="text-sm">
                        Phone{" "}
                        {user?.isPhoneVerified ? "Verified" : "Not Verified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Common tasks and settings
                  </p>
                  <div className="mt-4 space-y-2">
                    <button className="block w-full text-left text-sm text-primary-600 hover:text-primary-700">
                      Edit Profile
                    </button>
                    <button className="block w-full text-left text-sm text-primary-600 hover:text-primary-700">
                      Change Password
                    </button>
                    {user?.userType === "driver" && (
                      <button className="block w-full text-left text-sm text-primary-600 hover:text-primary-700">
                        Manage Vehicle Info
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
