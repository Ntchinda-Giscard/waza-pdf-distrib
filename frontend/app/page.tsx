"use client"

import { TabBar } from "@/components/tab-bar"
import { HomeTab } from "@/components/home-tab"
import { ParametresTab } from "@/components/parametres-tab"
import { LicenseModal } from "@/components/license-modal"
import { useAppStore } from "@/lib/store"
import Image from "next/image"

export default function HomePage() {
  const { activeTab } = useAppStore()

  const renderActiveTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />
      case "parametres":
        return <ParametresTab />
      default:
        return <HomeTab />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 relative">
      {/* Watermark Background Logo */}
      <div className="absolute inset-0 z-0 flex items-start justify-right pointer-events-none">
        <div className="relative w-[800px] h-[400px] max-w-[100vw] max-h-[60vh] rounded-md">
          <Image
            src="/logowaza.jpg"
            alt=""
            fill
            priority
            quality={75}
            sizes="(max-width: 768px) 100vw"
            className="object-contain opacity-20 select-none"
            style={{
              filter: "brightness(1) contrast(0.9) saturate(0.9)",
            }}
          />
        </div>
      </div>

      {/* Main Content - Above Watermark */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Application Title Bar */}
        <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 shadow-lg">
          <h1 className="text-white font-semibold">Application de Distribution Automatisée des Fiches de Paie</h1>
        </div>

        {/* Main Tab Navigation */}
        <TabBar />

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">{renderActiveTab()}</div>
      </div>

      {/* License Modal */}
      <LicenseModal />
    </div>
  )
}
