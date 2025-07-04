"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { FolderOpen, Trash2, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAppStore, type FolderDatabaseLink } from "@/lib/store"
import { log } from "console"

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: any
  }
}

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
  const [availableSubfolders, setAvailableSubfolders] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  // State to store the selected folder path
  const [selectedPath, setSelectedPath] = useState('');
  // State to show loading status when dialog is open
  const [isLoading, setIsLoading] = useState(false);
  // State to check if we're running in Electron environment
  const [isElectronAvailable, setIsElectronAvailable] = useState(false);

  const [subfolder, setSubfolder] = useState([])
  const [archiveSelectedFolder, setArchiveFolder] = useState(false)
  const [logSelectedFolder, setLogFolder] = useState(false)

  // Check if Electron API is available when component mounts
    useEffect(() => {
      // This runs after the component is rendered
      // We check if window.electronAPI exists (created by our preload script)
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsElectronAvailable(true);
        console.log('Frontend: Electron API is available');
      } else {
        setIsElectronAvailable(false);
        console.log('Frontend: Running in web browser mode');
      }
    }, []);

  // Refs for hidden file inputs
  const mainFolderInputRef = useRef<HTMLInputElement>(null)
  const archiveFolderInputRef = useRef<HTMLInputElement>(null)
  const logFolderInputRef = useRef<HTMLInputElement>(null)


  const handleFolderSelection = async () => {
    // First, check if we're in Electron environment
    if (!isElectronAvailable) {
      alert('Folder picker is only available in the desktop app');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Frontend: Requesting folder picker...');

      // Call the Electron API that we exposed in preload.js
      // This will trigger the main process to open the native folder dialog
      const result = await window.electronAPI.openFolderPicker();
      
      console.log('Frontend: Received result from Electron:', result);

      // Handle the response from the main process
      if (result.success && result.path) {
        // User successfully selected a folder
        setSelectedPath(result.path);
        const subfolders = await window.electronAPI.scanSubFolders(result.path);
        setSubfolder(subfolders)
        console.log('Frontend: User selected folder:', result.path);
        console.log('Frontend: Complete absolute path:', result.path);
        
        // You can do additional processing here, such as:
        // - Save to local storage
        // - Update other components
        // - Trigger other actions based on the selected folder
        
      } else if (result.success === false && result.message) {
        // User canceled or there was an issue
        console.log('Frontend: Folder selection canceled or failed:', result.message);
      }
      
    } catch (error) {
      // Handle any errors that might occur during the process
      console.error('Frontend: Error during folder selection:', error);
      alert('An error occurred while selecting the folder');
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  const handleSelectArchive = async () => {
    // First, check if we're in Electron environment
    if (!isElectronAvailable) {
      alert('Folder picker is only available in the desktop app');
      return;
    }

    try {
      console.log('Frontend: Requesting folder picker...');

      // Call the Electron API that we exposed in preload.js
      // This will trigger the main process to open the native folder dialog
      const result = await window.electronAPI.openFolderPicker();
      
      console.log('Frontend: Received result from Electron:', result);

      // Handle the response from the main process
      if (result.success && result.path) {
        // User successfully selected a folder
        setArchiveFolder(result.path);
        console.log('Frontend: User selected folder:', result.path);
        console.log('Frontend: Complete absolute path:', result.path);
        
        
      } else if (result.success === false && result.message) {
        // User canceled or there was an issue
        console.log('Frontend: Folder selection canceled or failed:', result.message);
      }
      
    } catch (error) {
      // Handle any errors that might occur during the process
      console.error('Frontend: Error during folder selection:', error);
      alert('An error occurred while selecting the folder');
    } finally {
      // Always reset loading state
    }
  };

  const handleSelectJournal = async () => {
    // First, check if we're in Electron environment
    if (!isElectronAvailable) {
      alert('Folder picker is only available in the desktop app');
      return;
    }

    try {
      console.log('Frontend: Requesting folder picker...');

      // Call the Electron API that we exposed in preload.js
      // This will trigger the main process to open the native folder dialog
      const result = await window.electronAPI.openFolderPicker();
      
      console.log('Frontend: Received result from Electron:', result);

      // Handle the response from the main process
      if (result.success && result.path) {
        // User successfully selected a folder
        setLogFolder(result.path);
        console.log('Frontend: User selected folder:', result.path);
        console.log('Frontend: Complete absolute path:', result.path);
        
        
      } else if (result.success === false && result.message) {
        // User canceled or there was an issue
        console.log('Frontend: Folder selection canceled or failed:', result.message);
      }
      
    } catch (error) {
      // Handle any errors that might occur during the process
      console.error('Frontend: Error during folder selection:', error);
      alert('An error occurred while selecting the folder');
    } finally {
      // Always reset loading state
    }
  };

  // Function to clear the selected path
  const clearSelection = () => {
    setSelectedPath('');
    console.log('Frontend: Cleared folder selection');
  };


  const handleSubmit = () => {
    if (isEditing) {
      updateFolderDatabaseLink(isEditing, formData)
      setIsEditing(null)
    } else {
      addFolderDatabaseLink(formData as Omit<FolderDatabaseLink, "id">)
    }

    // Reset only database-specific fields, keep folder paths for easy re-use
    setFormData({
      ...formData,
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
      tableName: "",
      matriculeField: "",
      emailField: "",
    })
  }

  const handleEdit = (link: FolderDatabaseLink) => {
    setFormData(link)
    setIsEditing(link.id)
    // If editing, we might want to reload subfolders for the main folder
    if (link.mainFolder) {
      // In a real app, you'd scan the folder here
      setAvailableSubfolders([])
    }
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
    setAvailableSubfolders([])
  }

  const handleClearAll = () => {
    setFormData({
      mainFolder: "",
      subFolder: "",
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
    })
    setAvailableSubfolders([])
  }

  // Function to construct absolute path from file path
  const getAbsolutePath = (file: File): string => {
    // Get the webkitRelativePath which gives us the folder structure
    const relativePath = file.webkitRelativePath

    // Extract the main folder name (first part of the path)
    const mainFolderName = relativePath.split("/")[0]

    // In a browser environment, we can't get the true absolute path for security reasons
    // But we can construct a more complete path using the file's properties
    // For demonstration, we'll simulate getting the drive/root path

    // Try to extract drive information if available (Windows-style)
    // This is a workaround since browsers don't expose full paths
    let absolutePath = ""

    // Check if we can infer the drive from the file name or path
    // In a real desktop app, you'd use the actual file system API
    if (file.name && (file as any).path) {
      // Some browsers/environments might have a path property
      const fullPath = (file as any).path
      if (fullPath) {
        const pathParts = fullPath.split(/[/\\]/)
        const mainFolderIndex = pathParts.findIndex((part) => part === mainFolderName)
        if (mainFolderIndex > 0) {
          absolutePath = pathParts.slice(0, mainFolderIndex + 1).join("/")
        }
      }
    }

    // Fallback: construct a reasonable path
    if (!absolutePath) {
      // For demo purposes, we'll assume a common structure
      // In a real app, you'd get this from the actual file system
      absolutePath = `C:/Users/Documents/${mainFolderName}`
    }

    return absolutePath
  }

  // Function to extract all unique subfolders from file list
  const extractSubfolders = (files: FileList): string[] => {
    const subfolders = new Set<string>()

    Array.from(files).forEach((file) => {
      const pathParts = file.webkitRelativePath.split("/")

      // If there are more than 2 parts (mainFolder/subfolder/file), we have subfolders
      if (pathParts.length >= 3) {
        // Add the immediate subfolder (second level)
        subfolders.add(pathParts[1])
      }

      // Also check for deeper nested folders
      for (let i = 1; i < pathParts.length - 1; i++) {
        if (pathParts[i] && pathParts[i] !== pathParts[0]) {
          // Build the relative path from main folder
          const subfolderPath = pathParts.slice(1, i + 1).join("/")
          subfolders.add(subfolderPath)
        }
      }
    })

    return Array.from(subfolders).sort()
  }

  const handleMainFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setIsScanning(true)

      try {
        // Get the first file to determine the absolute path
        const firstFile = files[0]

        // Get the absolute path of the main folder
        const absolutePath = getAbsolutePath(firstFile)

        // Extract all subfolders from the file list
        const subfolders = extractSubfolders(files)

        console.log("Folder scan results:", {
          absolutePath,
          subfolders,
          totalFiles: files.length,
        })

        // Update form data with absolute path
        setFormData({
          ...formData,
          mainFolder: absolutePath,
          subFolder: "", // Reset subfolder when main folder changes
        })

        // Update available subfolders
        setAvailableSubfolders(subfolders)
      } catch (error) {
        console.error("Error scanning folder:", error)
        // Fallback to basic path extraction
        const firstFile = files[0]
        const relativePath = firstFile.webkitRelativePath
        const mainFolderName = relativePath.split("/")[0]

        setFormData({
          ...formData,
          mainFolder: mainFolderName,
          subFolder: "",
        })
        setAvailableSubfolders([])
      } finally {
        setIsScanning(false)
      }
    }

    // Clear the input to allow selecting the same folder again
    event.target.value = ""
  }

  const handleFolderSelect = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Get the complete folder path
      const firstFile = files[0]
      const absolutePath = getAbsolutePath(firstFile)

      // Set the complete folder path in the form
      setFormData({ ...formData, [field]: absolutePath })
    }

    // Clear the input to allow selecting the same folder again
    event.target.value = ""
  }

  const openFolderPicker = (field: string) => {
    switch (field) {
      case "mainFolder":
        mainFolderInputRef.current?.click()
        break
      case "archiveFolder":
        archiveFolderInputRef.current?.click()
        break
      case "logFolder":
        logFolderInputRef.current?.click()
        break
    }
  }

  // Group links by main folder and subfolder for better display
  const groupedLinks = folderDatabaseLinks.reduce(
    (acc, link) => {
      const key = `${link.mainFolder}/${link.subFolder}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(link)
      return acc
    },
    {} as Record<string, FolderDatabaseLink[]>,
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Liaison Dossiers / Bases de Données</h2>
        <Button
          onClick={handleClearAll}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          Effacer Tout
        </Button>
      </div>

      {/* Hidden file inputs for folder selection */}
      <input
        ref={mainFolderInputRef}
        type="file"
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={handleMainFolderSelect}
        accept="*/*"
      />
      <input
        ref={archiveFolderInputRef}
        type="file"
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={(e) => handleFolderSelect("archiveFolder", e)}
        accept="*/*"
      />
      <input
        ref={logFolderInputRef}
        type="file"
        webkitdirectory=""
        style={{ display: "none" }}
        onChange={(e) => handleFolderSelect("logFolder", e)}
        accept="*/*"
      />

      {/* Configuration Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            {isEditing ? "Modifier la Liaison" : "Ajouter une Nouvelle Liaison"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Folder */}
          <div className="space-y-2">
            <Label className="text-gray-200">Dossier Principal</Label>
            <div className="flex space-x-2">
              <Input
                value={  selectedPath || formData.mainFolder}
                onChange={(e) => {
                //   setFormData({ ...formData, mainFolder: e.target.value })
                  setFormData({ ...formData, mainFolder: selectedPath })
                  // Clear subfolders when manually editing main folder
                //   if (e.target.value !== formData.mainFolder) {
                //     setAvailableSubfolders([])
                //     setFormData({ ...formData, mainFolder: e.target.value, subFolder: "" })
                //   }
                if (selectedPath !== formData.mainFolder) {
                    setAvailableSubfolders([])
                    setFormData({ ...formData, mainFolder: selectedPath, subFolder: "" })
                  }
                }}
                className="bg-gray-800 border-gray-700 text-white flex-1"
                placeholder="Chemin absolu du dossier principal (ex: E:/Dossier du fichier a traiter)"
              />
              {/* <p>{selectedPath || formData.mainFolder}</p> */}
              <Button
                type="button"
                variant="outline"
                // onClick={() => openFolderPicker("mainFolder")}
                // disabled={isScanning}
                onClick={handleFolderSelection}
                disabled={isLoading || !isElectronAvailable}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                title="Sélectionner un dossier"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FolderOpen className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {isScanning
                ? "Analyse du dossier en cours..."
                : "Chemin absolu complet du dossier principal (ex: E:/Dossier du fichier a traiter)"}
            </p>
          </div>

          {/* Sub Folder */}
          <div className="space-y-2">
            <Label className="text-gray-200">Sous-dossier</Label>
            <Select
              value={formData.subFolder || subfolder}
              onValueChange={(value) => setFormData({ ...formData, subFolder: value })}
            //   disabled={availableSubfolders.length === 0 || isScanning}
            disabled={subfolder.length === 0 || isLoading}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                {/* <SelectValue
                  placeholder={
                    isScanning
                      ? "Analyse en cours..."
                      : availableSubfolders.length === 0
                        ? "Sélectionnez d'abord un dossier principal"
                        : "Sélectionner un sous-dossier"
                  }
                /> */}
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Analyse en cours..."
                      : subfolder.length === 0
                        ? "Sélectionnez d'abord un dossier principal"
                        : "Sélectionner un sous-dossier"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {/* {availableSubfolders.map((folder) => (
                  <SelectItem key={folder} value={folder} className="text-white hover:bg-gray-700">
                    📁 {folder}
                  </SelectItem>
                ))} */}
                {subfolder.map((folder) => (
                  <SelectItem key={folder} value={folder} className="text-white hover:bg-gray-700">
                    📁 {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* <p className="text-xs text-gray-400">
              {isScanning
                ? "Recherche des sous-dossiers..."
                : availableSubfolders.length > 0
                  ? `${availableSubfolders.length} sous-dossier(s) trouvé(s) dans le dossier principal`
                  : "Aucun sous-dossier détecté - sélectionnez un dossier principal contenant des sous-dossiers"}
            </p> */}
            <p className="text-xs text-gray-400">
              {isLoading
                ? "Recherche des sous-dossiers..."
                : subfolder.length > 0
                  ? `${subfolder.length} sous-dossier(s) trouvé(s) dans le dossier principal`
                  : "Aucun sous-dossier détecté - sélectionnez un dossier principal contenant des sous-dossiers"}
            </p>
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
            <p className="text-xs text-gray-400">Chaque sous-dossier peut avoir plusieurs bases de données liées</p>
          </div>

          {/* Archive and Log Folders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier d'Archivage</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.archiveFolder || archiveSelectedFolder}
                  onChange={(e) => setFormData({ ...formData, archiveFolder: archiveSelectedFolder })}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  placeholder="Chemin absolu du dossier d'archivage"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectArchive}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                  title="Sélectionner le dossier d'archivage"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">Chemin absolu pour l'archivage</p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier de Journalisation</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.logFolder || logSelectedFolder}
                  onChange={(e) => setFormData({ ...formData, logFolder: logSelectedFolder })}
                  className="bg-gray-800 border-gray-700 text-white flex-1"
                  placeholder="Chemin absolu du dossier de logs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectJournal}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
                  title="Sélectionner le dossier de logs"
                >
                  <FolderOpen className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">Chemin absolu pour la journalisation</p>
            </div>
          </div>

          {/* SAGE Database Radio Button */}
          <div className="space-y-3">
            <Label className="text-gray-200">Type de Base de Données</Label>
            <RadioGroup
              value={formData.isSageDatabase ? "sage" : "other"}
              className="bg-blue-500"
              onValueChange={(value) => setFormData({ ...formData, isSageDatabase: value === "sage" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="bg-blue-500" value="sage" id="sage" />
                <Label htmlFor="sage" className="text-gray-300">
                  Base SAGE
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem className="bg-blue-500" value="other" id="other" />
                <Label htmlFor="other" className="text-gray-300">
                  Autre Base de Données
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-400">Chaque liaison peut avoir un type de base différent</p>
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
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700" disabled={isScanning}>
              <Plus className="w-4 h-4 mr-2" />
              {isEditing ? "Mettre à Jour" : "Ajouter cette Liaison"}
            </Button>
            {isEditing && (
              <Button onClick={handleCancel} variant="outline" className="border-gray-700 bg-transparent">
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links List - Grouped by Folder/Subfolder */}
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
          Object.entries(groupedLinks).map(([folderKey, links]) => {
            const [mainFolder, subFolder] = folderKey.split("/")
            return (
              <Card key={folderKey} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center text-lg">
                    <FolderOpen className="w-5 h-5 mr-2 text-green-400" />
                    {subFolder}
                    <span className="ml-2 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                      {links.length} liaison{links.length > 1 ? "s" : ""}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-400">Dossier: {mainFolder}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {links.map((link, index) => (
                    <div key={link.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">Base: {link.linkedDatabase}</span>
                            {link.isSageDatabase && (
                              <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">SAGE</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            {link.archiveFolder && <p>Archive: {link.archiveFolder}</p>}
                            {link.logFolder && <p>Logs: {link.logFolder}</p>}
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
