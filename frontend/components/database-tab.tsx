"use client"

import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react"
import { Database, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore, type ConnectionType, type DatabaseType, type DatabaseConnection } from "@/lib/store"

export function DatabaseTab() {
  const {
    databaseConnections,
    odbcSources,
    addDatabaseConnection,
    updateDatabaseConnection,
    removeDatabaseConnection,
    fetchOdbcSources,
  } = useAppStore()

  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<DatabaseConnection>>({
    connectionType: "odbc",
    username: "",
    password: "",
  })

  const handleSubmit = () => {
    if (isEditing) {
      updateDatabaseConnection(isEditing, formData)
      setIsEditing(null)
    } else {
      addDatabaseConnection(formData as Omit<DatabaseConnection, "id">)
    }
    setFormData({ connectionType: "odbc", username: "", password: "" })
  }

  const handleEdit = (connection: DatabaseConnection) => {
    setFormData(connection)
    setIsEditing(connection.id)
  }

  const handleCancel = () => {
    setIsEditing(null)
    setFormData({ connectionType: "odbc", username: "", password: "" })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuration des Bases de Données</h2>
        <Button
          onClick={() => fetchOdbcSources()}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Actualiser ODBC
        </Button>
      </div>

      {/* Configuration Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{isEditing ? "Modifier la Connexion" : "Nouvelle Connexion"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Type */}
          <div className="space-y-2">
            <Label className="text-gray-200">Type de Connexion</Label>
            <RadioGroup
              value={formData.connectionType}
              onValueChange={(value: ConnectionType) => setFormData({ ...formData, connectionType: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="odbc" id="odbc" />
                <Label htmlFor="odbc" className="text-gray-300">
                  Connexion ODBC
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="native" id="native" />
                <Label htmlFor="native" className="text-gray-300">
                  Connexion SQL Native
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* ODBC Configuration */}
          {formData.connectionType === "odbc" && (
            <div className="space-y-2">
              <Label className="text-gray-200">Source de Données (DSN)</Label>
              <Select
                value={formData.odbcSource}
                onValueChange={(value) => setFormData({ ...formData, odbcSource: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Sélectionner une source ODBC" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {odbcSources.map((source: { name: string | undefined | null }) => {
                    const name = source.name ?? "";
                    return (
                      <SelectItem key={name} value={name} className="text-white">
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Native Configuration */}
          {formData.connectionType === "native" && (
            <>
              <div className="space-y-2">
                <Label className="text-gray-200">Type de Base de Données</Label>
                <Select
                  value={formData.databaseType}
                  onValueChange={(value: DatabaseType) => setFormData({ ...formData, databaseType: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="postgresql" className="text-white">
                      PostgreSQL
                    </SelectItem>
                    <SelectItem value="mysql" className="text-white">
                      MySQL
                    </SelectItem>
                    <SelectItem value="mssql" className="text-white">
                      MSSQL
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Nom du Serveur</Label>
                <Input
                  value={formData.serverName || ""}
                  onChange={(e) => setFormData({ ...formData, serverName: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="localhost ou IP du serveur"
                />
              </div>
            </>
          )}

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Nom d'Utilisateur</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Nom d'utilisateur"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Mot de Passe</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Mot de passe"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Mettre à Jour" : "Ajouter"}
            </Button>
            {isEditing && (
              <Button onClick={handleCancel} variant="outline" className="border-gray-700 bg-transparent">
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connections List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Connexions Configurées</h3>
        {databaseConnections.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <Database className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Aucune connexion configurée</p>
            </CardContent>
          </Card>
        ) : (
          databaseConnections.map((connection) => (
            <Card key={connection.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="font-medium text-white">
                        {connection.connectionType === "odbc"
                          ? connection.odbcSource
                          : `${connection.databaseType?.toUpperCase()} - ${connection.serverName}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">Utilisateur: {connection.username}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(connection)}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeDatabaseConnection(String(connection.id))}
                      className="border-red-700 text-red-400 hover:bg-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
