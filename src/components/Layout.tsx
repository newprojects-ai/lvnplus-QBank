import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Brain, FileText, Cog, FileCheck, Upload, LayoutDashboard, Sparkles } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Generator', href: '/generator', icon: Brain },
  { name: 'Reviewer', href: '/reviewer', icon: FileCheck },
  { name: 'Export', href: '/export', icon: Upload },
  { name: 'AI Playground', href: '/playground', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Cog },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">QBank</h1>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}