"use client"

import { X, AlertCircle, Loader2, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useConnectionStore, type ConnectionType, type DatabaseType } from "@/lib/store"
import {useState} from "react";

export function ConnectionModal() {
  const [loading, setLoading] = useState(false)
  const {
    connectionData,
    odbcSources,
    isModalOpen,
    isLoadingOdbcSources,
    odbcSourcesError,
    setConnectionData,
    setModalOpen,
    fetchOdbcSources,
  } = useConnectionStore()

  const handleConnectionTypeChange = (value: ConnectionType) => {
    setConnectionData({
      connectionType: value,
      odbcSource: value === "odbc" ? connectionData.odbcSource : undefined,
      databaseType: value === "native" ? "postgresql" : undefined,
      serverName: value === "native" ? connectionData.serverName : undefined,
      databaseName: value === "native" ? connectionData.databaseName : undefined,
    })
  }

  const handleDatabaseTypeChange = (value: DatabaseType) => {
    setConnectionData({ databaseType: value })
  }

  const handleOdbcSourceChange = (value: string) => {
    setConnectionData({ odbcSource: value })
  }

  const handleInputChange = (field: string, value: string | number) => {
    setConnectionData({ [field]: value })
  }

  const handleRetryOdbcSources = () => {
    fetchOdbcSources()
  }

  const handleSubmitConfigration = async () => {
    const connData = {
      odbc_source: connectionData.odbcSource,
      connection_type: connectionData.connectionType,
      db_type: connectionData.databaseType,
      db_server: connectionData.serverName,
      db_username: connectionData.username,
      db_password: connectionData.password,
      db_name: connectionData.databaseName,
      db_port: 5432,
      folder_name: connectionData.pdfFolderPath,
      license_key: connectionData.licenseKey,
      number_of_char: connectionData.maxCharacters,
      ref_text: connectionData.referenceText,
      table_name: connectionData.tableName,
      email_field: connectionData.emailColumnName,
      license_field: connectionData.matriculeColumnName
    };

    await fetch("http://127.0.0.1:8000/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(connData)
    })
        .then(response => response.json())
        .then(data => {
          console.log("Réponse du serveur :", data);
        })
        .catch(error => {
          console.error("Erreur lors de la requête :", error);
        });
  };

  if (!isModalOpen) return null

  return (
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

        {/* Modal */}
        <div className="relative ml-auto h-full w-full max-w-lg bg-gray-900 border-l border-gray-800 shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white">Database Connection</h2>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Connection Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-200">Connection Type</Label>
                  <RadioGroup
                      value={connectionData.connectionType}
                      onValueChange={handleConnectionTypeChange}
                      className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="odbc" id="odbc" className="border-gray-600 text-blue-500" />
                      <Label htmlFor="odbc" className="text-gray-300 cursor-pointer">
                        ODBC Connection
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="native" id="native" className="border-gray-600 text-blue-500" />
                      <Label htmlFor="native" className="text-gray-300 cursor-pointer">
                        Native Connection
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* ODBC Source Selection */}
                {connectionData.connectionType === "odbc" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-200">ODBC Data Source</Label>

                      {odbcSourcesError && (
                          <Alert className="bg-yellow-900/20 border-yellow-800">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <AlertDescription className="text-yellow-200 text-sm">
                              {odbcSourcesError}
                              <Button
                                  variant="link"
                                  size="sm"
                                  onClick={handleRetryOdbcSources}
                                  className="text-yellow-400 hover:text-yellow-300 p-0 h-auto ml-2"
                              >
                                Retry
                              </Button>
                            </AlertDescription>
                          </Alert>
                      )}

                      <Select
                          value={connectionData.odbcSource}
                          onValueChange={handleOdbcSourceChange}
                          disabled={isLoadingOdbcSources}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          {isLoadingOdbcSources ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading ODBC sources...
                              </div>
                          ) : (
                              <SelectValue placeholder="Select ODBC data source" />
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          {odbcSources.map((source) => (
                              <SelectItem key={source.name} value={source.name} className="text-white hover:bg-gray-700">
                                <div className="flex flex-col">
                                  <span>{source.name}</span>
                                  {source.description && <span className="text-xs text-gray-400">{source.description}</span>}
                                </div>
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                )}

                {/* Database Type (Native only) */}
                {connectionData.connectionType === "native" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-200">Database Type</Label>
                      <Select value={connectionData.databaseType} onValueChange={handleDatabaseTypeChange}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="postgresql" className="text-white hover:bg-gray-700">
                            PostgreSQL
                          </SelectItem>
                          <SelectItem value="mysql" className="text-white hover:bg-gray-700">
                            MySQL
                          </SelectItem>
                          <SelectItem value="mssql" className="text-white hover:bg-gray-700">
                            MSSQL
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                )}

                {/* Server Name (Native only) */}
                {connectionData.connectionType === "native" && (
                    <div className="space-y-2">
                      <Label htmlFor="serverName" className="text-sm font-medium text-gray-200">
                        Server Name
                      </Label>
                      <Input
                          id="serverName"
                          type="text"
                          value={connectionData.serverName || ""}
                          onChange={(e) => handleInputChange("serverName", e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter server name or IP address"
                      />
                    </div>
                )}

                {/* Database Name (Native only) */}
                {connectionData.connectionType === "native" && (
                    <div className="space-y-2">
                      <Label htmlFor="databaseName" className="text-sm font-medium text-gray-200">
                        Database Name
                      </Label>
                      <Input
                          id="databaseName"
                          type="text"
                          value={connectionData.databaseName || ""}
                          onChange={(e) => handleInputChange("databaseName", e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter database name"
                      />
                    </div>
                )}

                {/* Table Name (Both ODBC and Native) */}
                <div className="space-y-2">
                  <Label htmlFor="tableName" className="text-sm font-medium text-gray-200">
                    Table Name
                  </Label>
                  <Input
                      id="tableName"
                      type="text"
                      value={connectionData.tableName}
                      onChange={(e) => handleInputChange("tableName", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter table name"
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-200">
                    Username
                  </Label>
                  <Input
                      id="username"
                      type="text"
                      value={connectionData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                    Password
                  </Label>
                  <Input
                      id="password"
                      type="password"
                      value={connectionData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter password"
                  />
                </div>

                {/* Separator */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-medium text-gray-200 mb-4">Column Configuration</h3>
                </div>

                {/* Matricule Column Name */}
                <div className="space-y-2">
                  <Label htmlFor="matriculeColumn" className="text-sm font-medium text-gray-200">
                    Matricule Column Name
                  </Label>
                  <Input
                      id="matriculeColumn"
                      type="text"
                      value={connectionData.matriculeColumnName}
                      onChange={(e) => handleInputChange("matriculeColumnName", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter matricule column name"
                  />
                </div>

                {/* Email Column Name */}
                <div className="space-y-2">
                  <Label htmlFor="emailColumn" className="text-sm font-medium text-gray-200">
                    Email Column Name
                  </Label>
                  <Input
                      id="emailColumn"
                      type="text"
                      value={connectionData.emailColumnName}
                      onChange={(e) => handleInputChange("emailColumnName", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter email column name"
                  />
                </div>

                {/* Separator */}
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-medium text-gray-200 mb-4">Additional Configuration</h3>
                </div>

                {/* PDF Folder Path */}
                <div className="space-y-2">
                  <Label htmlFor="pdfFolderPath" className="text-sm font-medium text-gray-200">
                    PDF Folder Path
                  </Label>
                  <div className="relative">
                    <Input
                        id="pdfFolderPath"
                        type="text"
                        value={connectionData.pdfFolderPath}
                        onChange={(e) => handleInputChange("pdfFolderPath", e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 pl-10"
                        placeholder="Enter path to PDF files folder"
                    />
                    <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* License Key */}
                <div className="space-y-2">
                  <Label htmlFor="licenseKey" className="text-sm font-medium text-gray-200">
                    License Key
                  </Label>
                  <Input
                      id="licenseKey"
                      type="text"
                      value={connectionData.licenseKey}
                      onChange={(e) => handleInputChange("licenseKey", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter license key"
                  />
                </div>

                {/* Reference Text */}
                <div className="space-y-2">
                  <Label htmlFor="referenceText" className="text-sm font-medium text-gray-200">
                    Reference Text
                  </Label>
                  <Textarea
                      id="referenceText"
                      value={connectionData.referenceText}
                      onChange={(e) => handleInputChange("referenceText", e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                      placeholder="Enter reference text or description"
                  />
                </div>

                {/* Maximum Characters */}
                <div className="space-y-2">
                  <Label htmlFor="maxCharacters" className="text-sm font-medium text-gray-200">
                    Maximum Characters
                  </Label>
                  <Input
                      id="maxCharacters"
                      type="number"
                      min="1"
                      max="10000"
                      value={connectionData.maxCharacters}
                      onChange={(e) => handleInputChange("maxCharacters", Number.parseInt(e.target.value) || 1000)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="1000"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-800 p-6">
              <Button
                  onClick={() => {
                    setModalOpen(false)
                    handleSubmitConfigration()
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>
  )
}
