"use client"

import { Play, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function HomeTab() {
  const { isLicenseActive, startPayrollDistribution, databaseConnections, folderDatabaseLinks } = useAppStore()

  const isConfigurationComplete = () => {
    return databaseConnections.length > 0 && folderDatabaseLinks.length > 0
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Distribution des Bulletin de Paie</h1>
          <p className="text-gray-400 text-lg">Automatisez l'envoi des bulletin de paie par courrier électronique</p>
        </div>

        {/* License Status */}
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {isLicenseActive ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-400 font-medium">Licence Activée</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-yellow-400 font-medium">Licence Requise</span>
              </>
            )}
          </div>
          {!isLicenseActive && (
            <p className="text-xs text-gray-400">Une licence valide est requise pour utiliser cette application</p>
          )}
        </div>

        {/* Configuration Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <span className="text-sm text-gray-300">Bases de données configurées</span>
            <span
              className={cn("text-sm font-medium", databaseConnections.length > 0 ? "text-green-400" : "text-gray-500")}
            >
              {databaseConnections.length}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
            <span className="text-sm text-gray-300">Liaisons dossiers configurées</span>
            <span
              className={cn("text-sm font-medium", folderDatabaseLinks.length > 0 ? "text-green-400" : "text-gray-500")}
            >
              {folderDatabaseLinks.length}
            </span>
          </div>
        </div>

        {/* Main Action Button */}
        <Button
          onClick={startPayrollDistribution}
          disabled={!isLicenseActive || !isConfigurationComplete()}
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Play className="w-5 h-5 mr-2" />
          Lancer l'Envoi des Bulletin
        </Button>

        {(!isLicenseActive || !isConfigurationComplete()) && (
          <div className="text-xs text-gray-500 space-y-1">
            {!isLicenseActive && <p>• Activez votre licence</p>}
            {databaseConnections.length === 0 && <p>• Configurez au moins une base de données</p>}
            {folderDatabaseLinks.length === 0 && <p>• Configurez au moins une liaison dossier/BDD</p>}
          </div>
        )}
      </div>
    </div>
  )
}
