import { Sidebar } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-11 flex-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-end px-4">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
