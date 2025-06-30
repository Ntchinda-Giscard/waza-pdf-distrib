"use client"

import { Database, Send, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectionModal } from "@/components/connection-modal"
import { useConnectionStore } from "@/lib/store"

export default function HomePage() {
  const { setModalOpen, sendToBackend, connectionData } = useConnectionStore()

  const handleSendToBackend = async () => {
    await sendToBackend()
  }

  const isConfigurationComplete = () => {
    const {
      connectionType,
      username,
      password,
      tableName,
      matriculeColumnName,
      emailColumnName,
      pdfFolderPath,
      licenseKey,
    } = connectionData

    // Check required fields for all connection types
    if (
        !username ||
        !password ||
        !tableName ||
        !matriculeColumnName ||
        !emailColumnName ||
        !pdfFolderPath ||
        !licenseKey
    ) {
      return false
    }

    if (connectionType === "odbc") {
      return !!connectionData.odbcSource
    }

    if (connectionType === "native") {
      return !!(connectionData.databaseType && connectionData.serverName && connectionData.databaseName)
    }

    return true
  }

  return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Header */}
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Database Connection Manager</h1>
            <p className="text-gray-400 text-lg">
              Configure your database connection settings with ODBC or native drivers
            </p>
          </div>

          {/* Primary Button */}
          <Button
              onClick={() => setModalOpen(true)}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <Database className="w-5 h-5 mr-2" />
            Configure Connection
          </Button>

          {/* Status Indicator */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <div
                  className={`w-3 h-3 rounded-full transition-colors duration-200 ${isConfigurationComplete() ? "bg-green-500 shadow-green-500/50 shadow-lg" : "bg-gray-600"}`}
              />
              <span className="text-sm text-gray-400">
              {isConfigurationComplete() ? "Configuration Complete" : "Configuration Pending"}
            </span>
            </div>

            {/* Send to Backend Button */}
            <Button
                onClick={handleSendToBackend}
                disabled={!isConfigurationComplete()}
                variant="outline"
                size="lg"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-medium bg-transparent transition-all duration-200"
            >
              <Send className="w-5 h-5 mr-2" />
              Send to Backend
            </Button>
          </div>

          {/* Configuration Preview */}
          {isConfigurationComplete() && (
              <div className="mt-8 p-4 bg-gray-900 rounded-lg border border-gray-800 shadow-lg">
                <h3 className="text-sm font-medium text-gray-200 mb-3 flex items-center">
                  <Server className="w-4 h-4 mr-2" />
                  Current Configuration
                </h3>
                <div className="text-xs text-gray-400 space-y-1 text-left">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="text-blue-400 font-medium">{connectionData.connectionType.toUpperCase()}</span>
                  </div>
                  {connectionData.connectionType === "odbc" && connectionData.odbcSource && (
                      <div className="flex justify-between">
                        <span>ODBC Source:</span>
                        <span className="text-blue-400 font-medium truncate ml-2">{connectionData.odbcSource}</span>
                      </div>
                  )}
                  {connectionData.connectionType === "native" && connectionData.databaseType && (
                      <div className="flex justify-between">
                        <span>Database:</span>
                        <span className="text-blue-400 font-medium">{connectionData.databaseType.toUpperCase()}</span>
                      </div>
                  )}
                  {connectionData.connectionType === "native" && connectionData.serverName && (
                      <div className="flex justify-between">
                        <span>Server:</span>
                        <span className="text-blue-400 font-medium truncate ml-2">{connectionData.serverName}</span>
                      </div>
                  )}
                  <div className="flex justify-between">
                    <span>Table:</span>
                    <span className="text-green-400 font-medium">{connectionData.tableName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Username:</span>
                    <span className="text-green-400 font-medium">{connectionData.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PDF Path:</span>
                    <span className="text-orange-400 font-medium truncate ml-2">{connectionData.pdfFolderPath}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Chars:</span>
                    <span className="text-cyan-400 font-medium">{connectionData.maxCharacters}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License:</span>
                    <span className="text-yellow-400 font-medium">
                  {connectionData.licenseKey ? "••••••••" : "Not set"}
                </span>
                  </div>
                </div>
              </div>
          )}

          {/* FastAPI Connection Info */}
          <div className="mt-6 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-500">
              ODBC sources are fetched from FastAPI server at localhost:8000 or 127.0.0.1:8000
            </p>
          </div>
        </div>

        <ConnectionModal />
      </div>
  )
}
