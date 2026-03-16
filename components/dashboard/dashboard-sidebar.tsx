"use client"

import { cn } from "@/lib/utils"
import {
  Bot,
  FileText,
  Gift,
  Home,
  Lightbulb,
  Newspaper,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Star,
  Mail,
  MessageCircle,
  HelpCircle,
  CreditCard,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardSidebarProps {
  activeItem: string
  onItemChange: (itemId: string) => void
  firstName?: string
  lastName?: string
  onLogout?: () => void
}

export function DashboardSidebar({ activeItem, onItemChange, firstName = "User", lastName = "", onLogout }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const fullName = lastName ? `${firstName} ${lastName}` : firstName
  const firstLetter = firstName.charAt(0).toUpperCase()

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "upsc-ai", label: "UPSC AI Assistant", icon: Bot },
    { id: "test-builder", label: "Test Builder", icon: FileText },
    { id: "mind-mapper", label: "AI Mind Maps", icon: Lightbulb },
    { id: "mains-evaluator", label: "Mains Evaluator", icon: PenTool },
    { id: "current-affairs", label: "Current Affairs", icon: Newspaper },
    { id: "refer-earn", label: "Refer & Earn", icon: Gift, badge: "NEW" },
  ]

  return (
    <aside
      className={cn(
        "border-r border-border/40 bg-background min-h-[calc(100vh-4rem)] transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 border-b border-border/40 flex items-center justify-between">
        {!isCollapsed && <span className="text-sm font-medium text-muted-foreground">Menu</span>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-muted rounded transition-colors ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onItemChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  activeItem === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">{item.badge}</span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-border/40 p-2 space-y-2">
        {/* Upgrade to Pro Button */}
        <div className="px-2">
          <Button
            className={cn("w-full bg-cyan-500 hover:bg-cyan-600 text-white", isCollapsed && "px-2")}
            size={isCollapsed ? "icon" : "default"}
          >
            <Star className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Upgrade to Pro"}
          </Button>
        </div>

        {/* User Profile with Dropdown */}
        <div className={cn("px-2 pb-2", isCollapsed ? "flex justify-center" : "")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer w-full",
                  isCollapsed && "justify-center",
                )}
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {firstLetter}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fullName}</p>
                    <p className="text-xs text-muted-foreground">Free</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Support</DropdownMenuLabel>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2" />
                Mail
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Us
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Membership</DropdownMenuLabel>
              <DropdownMenuItem>
                <CreditCard className="h-4 w-4 mr-2" />
                Plans
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Account</DropdownMenuLabel>
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={onLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  )
}
