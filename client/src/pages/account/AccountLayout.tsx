import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MobileSidebarDrawer } from './components/MobileSidebarDrawer';

export default function AccountLayout() {
  useEffect(() => { document.title = 'Account — Kalakaarian'; }, []);

  return (
    <div className="min-h-screen bg-obsidian py-8 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 hidden md:block">
          <h1 className="text-2xl font-bold text-chalk">Account</h1>
          <p className="text-sm text-chalk-dim mt-1">Manage your profile, security, and preferences</p>
        </div>

        <MobileSidebarDrawer />

        <div className="md:grid md:grid-cols-[220px_1fr] md:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block md:sticky md:top-20 self-start">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <Sidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
