import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Chronicle from "./pages/Chronicle";
import Workers from "./pages/Workers";
import Audit from "./pages/Audit";

const navItems = [
  { to: "/", label: "Dashboard", sub: "系统概览" },
  { to: "/chronicle", label: "Chronicle", sub: "编年体" },
  { to: "/workers", label: "Workers", sub: "状态监控" },
  { to: "/audit", label: "Audit", sub: "审计报告" },
];

export default function App() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-6 border-b border-gray-800">
          <h1 className="text-lg font-semibold tracking-wide text-white">
            Hermes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">知识管理系统</p>
        </div>

        <ul className="flex-1 py-3 space-y-0.5 px-2">
          {navItems.map(({ to, label, sub }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`
                }
              >
                <span className="font-medium">{label}</span>
                <span className="ml-2 text-xs text-gray-500">{sub}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-600">
          v0.1.0
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chronicle" element={<Chronicle />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/audit" element={<Audit />} />
        </Routes>
      </main>
    </div>
  );
}
