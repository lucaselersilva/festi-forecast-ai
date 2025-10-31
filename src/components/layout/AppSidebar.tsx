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
  Workflow,
  Sparkles,
  Cake,
  Shield
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useTenantFeatures } from "@/hooks/useTenantFeatures"
import { useUserRoles } from "@/hooks/useUserRoles"

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
  { title: "Dashboard", url: "/dashboard", icon: BarChart3, featureKey: "dashboard" },
  { title: "Import Data", url: "/import", icon: Upload, featureKey: "import" },
  { title: "Insights Planner", url: "/insights-planner", icon: Target, featureKey: "insights" },
  { title: "Clustering", url: "/clustering", icon: Activity, featureKey: "clustering" },
  { title: "Orquestrador", url: "/orchestrator", icon: Workflow, featureKey: "orchestrator" },
  { title: "Assistente Marketing", url: "/marketing-assistant", icon: Sparkles, featureKey: "marketing" },
  { title: "Aniversariantes", url: "/birthdays", icon: Cake, featureKey: "birthdays" },
  { title: "Zig Casas", url: "/zig-casas", icon: Users, featureKey: "zig-casas" },
  { title: "Events", url: "/events", icon: Calendar, featureKey: "events" },
  { title: "Sponsors", url: "/sponsors", icon: Briefcase, featureKey: "sponsors" },
]

const adminItems = [
  { title: "Logs", url: "/admin/logs", icon: FileText, featureKey: "settings" },
  { title: "Settings", url: "/settings", icon: Settings, featureKey: "settings" },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"
  const { isFeatureEnabled, isLoading } = useTenantFeatures()
  const { isAdmin, isLoading: rolesLoading } = useUserRoles()

  const isActive = (path: string) => {
    if (path === "/dashboard") return currentPath === "/dashboard"
    return currentPath.startsWith(path)
  }
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"

  // Filter items based on features
  const filteredMainItems = mainItems.filter((item) =>
    isLoading ? true : isFeatureEnabled(item.featureKey)
  )

  const filteredAdminItems = adminItems.filter((item) =>
    isLoading ? true : isFeatureEnabled(item.featureKey)
  )

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
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
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
              {filteredAdminItems.map((item) => (
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

        {/* Super Admin Section */}
        {!rolesLoading && isAdmin && (
          <SidebarGroup className="border-t border-border/20 mt-2 pt-2">
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
              Super Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className={getNavCls}>
                      <Shield className="w-4 h-4" />
                      {!isCollapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}