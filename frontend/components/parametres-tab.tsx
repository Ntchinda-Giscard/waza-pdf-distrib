"use client"

import { ParametreTabBar } from "@/components/parametre-tab-bar"
import { DatabaseTab } from "@/components/database-tab"
import { FoldersTab } from "@/components/folders-tab"
import { MatriculeTab } from "@/components/matricule-tab"
import { EmailTab } from "@/components/email-tab"
import { SettingsTab } from "@/components/settings-tab"
import { useAppStore } from "@/lib/store"

export function ParametresTab() {
  const { activeParametreTab } = useAppStore()

  const renderActiveParametreTab = () => {
    switch (activeParametreTab) {
      case "database":
        return <DatabaseTab />
      case "folders":
        return <FoldersTab />
      case "matricule":
        return <MatriculeTab />
      case "email":
        return <EmailTab />
      case "settings":
        return <SettingsTab />
      default:
        return <DatabaseTab />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Paramètre Sub-Tab Navigation */}
      <ParametreTabBar />

      {/* Paramètre Tab Content */}
      <div className="flex-1 overflow-auto">{renderActiveParametreTab()}</div>
    </div>
  )
}
