import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import StaffProfileModal from "./StaffProfileModal";
import Logo from "../../RCLPG_Logo.jpg";

const navClass = ({ isActive }) =>
  `px-4 py-2.5 text-sm rounded-xl transition ${
    isActive
      ? "font-bold text-red-600 bg-red-50"
      : "font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
  }`;

export default function Layout({ children }) {
  const { logout, admin, isAdministrator } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={Logo}
                alt="RCLPG Logo"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/80x80?text=RCLPG";
                }}
                className="h-16 w-16 object-contain rounded-xl shadow-sm border border-slate-100"
              />
              <div>
                <span className="block text-lg font-black text-slate-900 tracking-tight leading-none">
                  RCLPG Portal
                </span>
                <span className="text-[11px] text-red-600 font-bold tracking-wider uppercase mt-1.5 block">
                  Management Hub
                </span>
              </div>
            </div>

            <nav
              className="hidden md:flex space-x-1"
              aria-label="Main Navigation"
            >
              <NavLink to="/dashboard" className={navClass} end>
                Dashboard & Sales
              </NavLink>
              <NavLink to="/inventory" className={navClass}>
                Inventory Catalog
              </NavLink>
              <NavLink to="/sales-log" className={navClass}>
                Customer & Sales Log
              </NavLink>
              <NavLink to="/credit-logs" className={navClass}>
                Credit Logs
              </NavLink>
              {isAdministrator && (
                <NavLink to="/admin/profile" className={navClass}>
                  Admin Profile
                </NavLink>
              )}
            </nav>

            <div className="hidden sm:flex items-center space-x-2">
              {!isAdministrator && (
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2.5 rounded-xl transition"
                  aria-label="Open profile"
                >
                  Profile
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition"
              >
                Logout
              </button>
            </div>

            <button
              type="button"
              className="md:hidden text-slate-600 p-2 rounded-xl"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="md:hidden">
          {mobileOpen && (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-950/50"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            />
          )}
          <div
            className={`fixed top-0 right-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <p className="text-sm font-black text-slate-900">Menu</p>
                <p className="text-xs text-slate-500">Navigate the portal</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 space-y-2 px-4 py-4" aria-label="Mobile Navigation">
              <Link
                to="/dashboard"
                className="block rounded-xl px-3 py-2.5 text-sm font-bold text-red-600 bg-red-50"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard & Sales
              </Link>
              <Link
                to="/inventory"
                className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                Inventory Catalog
              </Link>
              <Link
                to="/sales-log"
                className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                Customer & Sales Log
              </Link>
              <Link
                to="/credit-logs"
                className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
              >
                Credit Logs
              </Link>
              {isAdministrator && (
                <Link
                  to="/admin/profile"
                  className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Profile
                </Link>
              )}
              {!isAdministrator && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(true);
                    setMobileOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-100"
                >
                  Profile
                </button>
              )}
            </nav>
            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg bg-slate-800 px-3 py-2.5 text-xs font-bold text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-400 font-medium">
        <p>
          &copy; {new Date().getFullYear()} RCLPG Portal. All rights reserved.
        </p>
      </footer>

      {profileOpen && !isAdministrator && (
        <StaffProfileModal onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
