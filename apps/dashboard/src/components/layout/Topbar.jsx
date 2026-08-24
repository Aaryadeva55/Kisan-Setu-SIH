import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, useMarkNotificationAsRead } from '../../hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Bell, LogOut, User, Menu, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils';

export function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { data: notifData } = useNotifications();
  const markRead = useMarkNotificationAsRead();

  const notifications = notifData?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Trigger & Page Title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden h-9 w-9 text-muted-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
            {title || 'Dashboard'}
          </h1>
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            {user?.orgName || 'Kisan Setu Agri-Linkage Platform'}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9 rounded-full">
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold ring-2 ring-surface">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-lg">
            <div className="flex items-center justify-between p-3.5 border-b border-border">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alerts & WhatsApp Dispatches
              </h4>
              <span className="text-xs font-semibold text-primary">{unreadCount} New</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  You're all caught up!
                </div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link || '#'}
                    onClick={() => handleNotificationClick(n)}
                    className={`block p-3 text-xs transition-colors hover:bg-muted/50 ${
                      !n.isRead ? 'bg-agri-50/60 font-medium' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-foreground">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(n.createdAt, 'hh:mm a')}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground line-clamp-2">{n.message}</p>
                  </Link>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2)?.toUpperCase() || 'KS'}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary pt-1">
                  <Shield className="h-3 w-3" />
                  {user?.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/buyer/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Account Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
