import { useState } from "react"
import { 
  BarChart3, 
  Upload, 
  Users, 
  Calendar, 
  Briefcase, 
  Settings,
  TrendingUp,
  FileText,
  Target,
  Activity,
  Workflow
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Import Data", url: "/import", icon: Upload },
  { title: "Insights Planner", url: "/insights-planner", icon: Target },
  { title: "Clustering", url: "/clustering", icon: Activity },
  { title: "Orquestrador", url: "/orchestrator", icon: Workflow },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Sponsors", url: "/sponsors", icon: Briefcase },
]

const adminItems = [
  { title: "Logs", url: "/admin/logs", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/"
    return currentPath.startsWith(path)
  }
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-border/50`} collapsible="icon">
      <SidebarContent className="p-2">
        {/* Brand */}
        <div className="px-3 py-6 border-b border-border/20 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold gradient-text">EventVision</h2>
                <p className="text-xs text-muted-foreground">Analytics Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Analytics
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavCls}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}