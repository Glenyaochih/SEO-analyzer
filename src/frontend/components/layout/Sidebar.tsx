'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/issues', label: 'Issues' },
  { href: '/trends', label: 'Trends' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-52 flex-none bg-gray-900 dark:bg-gray-950 text-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <span className="text-base font-bold text-brand-400">SEO Analyzer</span>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === href
                ? 'bg-brand-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
