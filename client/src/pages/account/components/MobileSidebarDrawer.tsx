import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileSidebarDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-chalk-dim hover:text-chalk transition-all mb-4"
      >
        <Menu className="w-4 h-4" /> Account Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-obsidian border-r border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-chalk">Account</span>
              <button onClick={() => setOpen(false)} className="text-chalk-dim hover:text-chalk">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
