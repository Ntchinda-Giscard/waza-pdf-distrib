"use client"

import { Database, Link, Hash, Mail, Cog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

const parametreTabs = [
  { id: "database", label: "Configuration BDD", icon: Database },
  { id: "folders", label: "Liaison Dossiers/BDD", icon: Link },
  { id: "matricule", label: "Configuration Matricule", icon: Hash },
  { id: "email", label: "Configuration Email", icon: Mail },
  { id: "settings", label: "Paramètres", icon: Cog },
]

export function ParametreTabBar() {
  const { activeParametreTab, setActiveParametreTab } = useAppStore()

  return (
    <div className="flex items-center bg-gray-850 border-b border-gray-700 overflow-x-auto">
      {parametreTabs.map((tab) => {
        const Icon = tab.icon
        return (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              "flex items-center space-x-2 px-4 py-2.5 rounded-none border-r border-gray-700 transition-colors duration-150 whitespace-nowrap text-sm",
              activeParametreTab === tab.id
                ? "bg-gray-800 text-white border-b-2 border-blue-400"
                : "text-gray-300 hover:text-gray-200 hover:bg-gray-800",
            )}
            onClick={() => setActiveParametreTab(tab.id as any)}
          >
            <Icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
