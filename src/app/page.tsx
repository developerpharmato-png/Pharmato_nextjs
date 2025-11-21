import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex flex-col items-center justify-center p-8 text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Medicine Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive solution for managing medicines, prescriptions, and admins
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link
            href="/login"
            className="flex-1 px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Admin Login
          </Link>
          <Link
            href="/register"
            className="flex-1 px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600"
          >
            Register
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">💊</div>
            <h3 className="font-semibold text-lg mb-2">Medicine Inventory</h3>
            <p className="text-gray-600 text-sm">Manage and track medicine stock</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold text-lg mb-2">Prescriptions</h3>
            <p className="text-gray-600 text-sm">Track patient prescriptions</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-lg mb-2">User Management</h3>
            <p className="text-gray-600 text-sm">Manage user accounts</p>
          </div>
        </div>
      </main>
    </div>
  );
}
