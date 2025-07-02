"use client"

import { TabBar } from "@/components/tab-bar"
import { HomeTab } from "@/components/home-tab"
import { DatabaseTab } from "@/components/database-tab"
import { FoldersTab } from "@/components/folders-tab"
import { MatriculeTab } from "@/components/matricule-tab"
import { EmailTab } from "@/components/email-tab"
import { SettingsTab } from "@/components/settings-tab"
import { LicenseModal } from "@/components/license-modal"
import { useAppStore } from "@/lib/store"

export default function HomePage() {
  const { activeTab } = useAppStore()

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />
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
        return <HomeTab />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Application Title Bar */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4">
        <h1 className="text-white font-semibold">Application de Distribution Automatisée des Fiches de Paie</h1>
      </div>

      {/* Tab Navigation */}
      <TabBar />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderActiveTab()}</div>

      {/* License Modal */}
      <LicenseModal />
    </div>
  )
}
