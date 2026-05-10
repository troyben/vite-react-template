import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarStore } from '../stores/sidebarStore';
import { LayoutDashboard, FileText, Building2, Users, Shapes, LayoutTemplate, Settings, CircleUser, LogOut, Package, SlidersHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const expanded = useSidebarStore((s) => s.expanded);
  const toggle = useSidebarStore((s) => s.toggle);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/templates') return location.pathname === '/templates';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    ...(user?.role === 'admin' ? [{ path: '/dashboard', title: 'Dashboard', icon: LayoutDashboard }] : []),
    { path: '/quotations', title: 'Quotations', icon: FileText },
    ...(user?.role !== 'client' ? [{ path: '/clients', title: 'Clients', icon: Building2 }] : []),
    ...(user?.role !== 'client' ? [{ path: '/templates', title: 'Templates', icon: LayoutTemplate }] : []),
    ...(user?.role === 'admin' ? [{ path: '/users', title: 'Users', icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ path: '/materials', title: 'Materials', icon: Package }] : []),
    ...(user?.role !== 'client' ? [{ path: '/templates/create', title: 'Create Template', icon: Shapes }] : []),
    ...(user?.role === 'admin' ? [{ path: '/system-settings', title: 'System Settings', icon: SlidersHorizontal }] : []),
  ];

  return (
    <div className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-[width] duration-200 ${expanded ? 'w-56' : 'w-16'}`}>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Logo + toggle */}
        <div className={`flex h-16 items-center border-b ${expanded ? 'justify-between px-3' : 'justify-center'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.jpg" alt="Logo" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            {expanded && (
              <span className="truncate text-sm font-semibold">Malonic</span>
            )}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${expanded ? '' : 'absolute -right-3 top-4 border bg-card shadow-sm'}`}
          >
            {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex flex-1 flex-col gap-1 py-4 ${expanded ? 'px-3' : 'items-center'}`}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <div
                key={link.path}
                className="relative"
                onMouseEnter={() => setHoveredLink(link.path)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                <Link
                  to={link.path}
                  className={`relative flex h-10 items-center rounded-lg transition-all ${
                    expanded ? 'w-full gap-3 px-3' : 'w-10 justify-center'
                  } ${
                    active
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {active && (
                    <span className={`absolute top-1 bottom-1 w-[3px] rounded-full bg-violet-600 ${expanded ? '-left-3' : '-left-[13px]'}`} />
                  )}
                  <Icon className={`h-5 w-5 shrink-0 ${active ? 'stroke-[2.5]' : ''}`} />
                  {expanded && (
                    <span className="truncate text-sm font-medium">{link.title}</span>
                  )}
                </Link>
                {!expanded && hoveredLink === link.path && (
                  <div className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-sm font-medium text-popover-foreground shadow-md ring-1 ring-border">
                    {link.title}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User menu */}
      <div className={`flex items-center border-t py-4 ${expanded ? 'px-3' : 'justify-center'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger className={`flex items-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${expanded ? 'w-full gap-2 px-2 py-1.5' : 'h-10 w-10 justify-center rounded-full'}`}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-9 w-9 shrink-0 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <CircleUser className="h-8 w-8 shrink-0 text-primary" />
            )}
            {expanded && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium">{user?.name}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Settings</div>
                  <div className="text-xs text-muted-foreground">Manage your profile</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <div>
                  <div className="text-sm">Logout</div>
                  <div className="text-xs text-muted-foreground">Sign out of your account</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
