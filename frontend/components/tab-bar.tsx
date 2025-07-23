"use client"

import { Home, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

const mainTabs = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "parametres", label: "Paramètres", icon: Settings },
]

export function TabBar() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="flex items-center">
      {mainTabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              "flex items-center space-x-2 px-6 py-3 rounded-none border-r border-gray-800/60 transition-all duration-200 whitespace-nowrap backdrop-blur-md relative",
              activeTab === tab.id
                ? "bg-gradient-to-b from-blue-800/40 to-gray-800/80 text-white border-b-2 border-blue-400 shadow-lg"
                : "text-gray-300 hover:text-white hover:bg-gradient-to-b hover:from-blue-900/20 hover:to-gray-800/60",
            )}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <Icon className="w-4 h-4 drop-shadow-sm" />
            <span className="text-sm font-medium drop-shadow-sm">{tab.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
