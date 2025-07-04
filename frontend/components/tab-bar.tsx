"use client"

import { Home, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

const mainTabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "parametres", label: "Paramètres Généraux", icon: Settings },
]

export function TabBar() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-800">
      {mainTabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-none border-r border-gray-800 transition-colors duration-150 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-850",
            )}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
