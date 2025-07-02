"use client"

import { useState } from "react"
import { FolderOpen, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAppStore, type FolderDatabaseLink } from "@/lib/store"

export function FoldersTab() {
  const {
    folderDatabaseLinks,
    databaseConnections,
    addFolderDatabaseLink,
    updateFolderDatabaseLink,
    removeFolderDatabaseLink,
  } = useAppStore()

  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<FolderDatabaseLink>>({
    mainFolder: "",
    subFolder: "",
    linkedDatabase: "",
    archiveFolder: "",
    logFolder: "",
    isSageDatabase: false,
  })

  const handleSubmit = () => {
    if (isEditing) {
      updateFolderDatabaseLink(isEditing, formData)
      setIsEditing(null)
    } else {
      addFolderDatabaseLink(formData as Omit<FolderDatabaseLink, "id">)
    }
    setFormData({
      mainFolder: "",
      subFolder: "",
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
    })
  }

  const handleEdit = (link: FolderDatabaseLink) => {
    setFormData(link)
    setIsEditing(link.id)
  }

  const handleCancel = () => {
    setIsEditing(null)
    setFormData({
      mainFolder: "",
      subFolder: "",
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
    })
  }

  const handleFolderPicker = (field: string) => {
    // In a real application, this would open a native folder picker
    // For now, we'll simulate it with a prompt
    const folderPath = prompt(`Sélectionner le dossier pour ${field}:`)
    if (folderPath) {
      setFormData({ ...formData, [field]: folderPath })
    }
  }

  // Mock subfolder options - in real app, this would be populated based on selected main folder
  const mockSubfolders = ["Janvier_2024", "Février_2024", "Mars_2024", "Avril_2024"]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Liaison Dossiers / Bases de Données</h2>
      </div>

      {/* Configuration Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{isEditing ? "Modifier la Liaison" : "Nouvelle Liaison"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Folder */}
          <div className="space-y-2">
            <Label className="text-gray-200">Dossier Principal</Label>
            <div className="flex space-x-2">
              <Input
                value={formData.mainFolder || ""}
                onChange={(e) => setFormData({ ...formData, mainFolder: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white flex-1"
                placeholder="Chemin du dossier principal"
              />
              <Button
                variant="outline"
                onClick={() => handleFolderPicker("mainFolder")}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sub Folder */}
          <div className="space-y-2">
            <Label className="text-gray-200">Sous-dossier</Label>
            <Select
              value={formData.subFolder}
              onValueChange={(value) => setFormData({ ...formData, subFolder: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sélectionner un sous-dossier" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {mockSubfolders.map((folder) => (
                  <SelectItem key={folder} value={folder} className="text-white">
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Linked Database */}
          <div className="space-y-2">
            <Label className="text-gray-200">Base de Données Liée</Label>
            <Input
              value={formData.linkedDatabase || ""}
              onChange={(e) => setFormData({ ...formData, linkedDatabase: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Entrer le nom de la base de données"
            />
          </div>

          {/* Archive and Log Folders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier d'Archivage</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.archiveFolder || ""}
                  onChange={(e) => setFormData({ ...formData, archiveFolder: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  placeholder="Dossier d'archivage"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFolderPicker("archiveFolder")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier de Journalisation</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.logFolder || ""}
                  onChange={(e) => setFormData({ ...formData, logFolder: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  placeholder="Dossier de logs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFolderPicker("logFolder")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* SAGE Database Radio Button */}
          <div className="space-y-3">
            <Label className="text-gray-200">Type de Base de Données</Label>
            <RadioGroup
              value={formData.isSageDatabase ? "sage" : "other"}
              onValueChange={(value) => setFormData({ ...formData, isSageDatabase: value === "sage" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sage" id="sage" />
                <Label htmlFor="sage" className="text-gray-300">
                  Base SAGE
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="text-gray-300">
                  Autre Base de Données
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Conditional Fields for Non-SAGE Databases */}
          {!formData.isSageDatabase && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Nom de la Table</Label>
                <Input
                  value={formData.tableName || ""}
                  onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Nom de la table"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Champ Matricule</Label>
                  <Input
                    value={formData.matriculeField || ""}
                    onChange={(e) => setFormData({ ...formData, matriculeField: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Nom du champ matricule"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Champ Email</Label>
                  <Input
                    value={formData.emailField || ""}
                    onChange={(e) => setFormData({ ...formData, emailField: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Nom du champ email"
                  />
                </div>
              </div>
            </div>
          )}

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

      {/* Links List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Liaisons Configurées</h3>
        {folderDatabaseLinks.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Aucune liaison configurée</p>
            </CardContent>
          </Card>
        ) : (
          folderDatabaseLinks.map((link) => {
            return (
              <Card key={link.id} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-white">{link.subFolder}</span>
                        {link.isSageDatabase && (
                          <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">SAGE</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Dossier: {link.mainFolder}</p>
                        <p>Base: {link.linkedDatabase}</p>
                        {!link.isSageDatabase && link.tableName && (
                          <p>
                            Table: {link.tableName} | Matricule: {link.matriculeField} | Email: {link.emailField}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(link)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFolderDatabaseLink(link.id)}
                        className="border-red-700 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
