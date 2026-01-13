import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  Calendar,
  Megaphone,
  BarChart3,
  Crown,
  Menu,
  X,
  Building2,
  LogOut,
  ChevronRight,
  ArrowLeftRight,
  MessageCircle,
  Video,
  Ticket,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const hrNavItems: NavItem[] = [
  { label: "Dashboard", path: "/hr", icon: LayoutDashboard },
  { label: "Employees", path: "/hr/employees", icon: Users },
  { label: "Attendance", path: "/hr/attendance", icon: Clock },
  { label: "Leave Management", path: "/hr/leaves", icon: Calendar },
  { label: "Meetings", path: "/hr/meetings", icon: Video },
  { label: "Tickets", path: "/hr/tickets", icon: Ticket },
  { label: "Notice Board", path: "/hr/notices", icon: Megaphone },
  { label: "Chat", path: "/hr/chat", icon: MessageCircle },
  { label: "Analytics", path: "/hr/analytics", icon: BarChart3 },
  { label: "Settings", path: "/hr/settings", icon: SettingsIcon },
];

const bossNavItems: NavItem[] = [
  { label: "Dashboard", path: "/boss", icon: LayoutDashboard },
  { label: "Employees", path: "/boss/employees", icon: Users },
  { label: "Meetings", path: "/boss/meetings", icon: Calendar },
  { label: "Tasks", path: "/boss/tasks", icon: Briefcase },
  { label: "Notices", path: "/boss/notices", icon: Megaphone },
  { label: "Chat", path: "/boss/chat", icon: MessageCircle },
  { label: "Analytics", path: "/boss/analytics", icon: BarChart3 },
  { label: "Settings", path: "/boss/settings", icon: SettingsIcon },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Determine which portal to show based on current route
  const isOnBossRoute = location.pathname.startsWith('/boss');
  const isOnHRRoute = location.pathname.startsWith('/hr');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'boss': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'hr': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'manager': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Determine which nav items to show based on user role and current route
  const getNavItems = () => {
    const canAccessHRPortal = user?.role === 'admin' || user?.role === 'hr';
    const canAccessBossPortal = user?.role === 'admin' || user?.role === 'boss' || user?.role === 'manager';
    
    // For admin, show based on current route to avoid "two sidebars" look
    if (user?.role === 'admin') {
      if (isOnBossRoute) {
        return { hr: null, boss: bossNavItems, canSwitchTo: 'hr' };
      } else {
        return { hr: hrNavItems, boss: null, canSwitchTo: 'boss' };
      }
    } else if (user?.role === 'boss' || user?.role === 'manager') {
      return { hr: null, boss: bossNavItems, canSwitchTo: null };
    } else if (user?.role === 'hr') {
      return { hr: hrNavItems, boss: null, canSwitchTo: null };
    }
    return { hr: null, boss: null, canSwitchTo: null };
  };

  const { hr: hrItems, boss: bossItems, canSwitchTo } = getNavItems();
  
  const handleSwitchPortal = () => {
    if (canSwitchTo === 'hr') {
      navigate('/hr');
    } else if (canSwitchTo === 'boss') {
      navigate('/boss');
    }
  };

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <NavLink
        to={item.path}
        className={cn(
          "nav-item group",
          isActive && "nav-item-active"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-300 border-r border-sidebar-border",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-accent-foreground text-lg">Cross DIGI</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {/* HR Portal Section - Only show if user has access */}
        {hrItems && (
          <div className="mb-6">
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                <Users className="w-4 h-4" />
                <span>HR Portal</span>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {hrItems.map((item) => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Boss Dashboard Section - Only show if user has access */}
        {bossItems && (
          <div>
            {!isCollapsed && (
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
                <Crown className="w-4 h-4 text-warning" />
                <span>Boss View</span>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {bossItems.map((item) => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}
        
        {/* Switch Portal Button for Admin */}
        {canSwitchTo && (
          <div className="mt-6 pt-4 border-t border-sidebar-border">
            <button
              onClick={handleSwitchPortal}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center"
              )}
            >
              <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm">
                  Switch to {canSwitchTo === 'hr' ? 'HR Portal' : 'Boss View'}
                </span>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* Footer - User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-sidebar-primary-foreground">
                  {getInitials(user?.employee?.firstName, user?.employee?.lastName)}
                </span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                      {user?.employee?.firstName} {user?.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                        getRoleBadgeColor(user?.role)
                      )}>
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sidebar-muted" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
