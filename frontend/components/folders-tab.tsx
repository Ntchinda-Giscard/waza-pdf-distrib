"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { FolderOpen, Trash2, Edit, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppStore, type FolderDatabaseLink } from "@/lib/store";
import { toast } from "sonner";

// Extend the Window interface to include electronAPI
declare global {
  interface Window {
    electronAPI?: any;
  }
}

// Enhanced duplicate detection system
class FolderDuplicateDetector {
  private existingLinks: FolderDatabaseLink[];

  constructor(existingLinks: FolderDatabaseLink[]) {
    this.existingLinks = existingLinks;
  }

  validateNewConfiguration(
    mainFolder: string,
    subFolder: string,
    excludeId?: string
  ): {
    isValid: boolean;
    errorMessage: string;
  } {
    const isDuplicate = this.existingLinks.some((link) => {
      if (excludeId && link.id === excludeId) return false;
      return link.mainFolder === mainFolder && link.subFolder === subFolder;
    });

    if (isDuplicate) {
      return {
        isValid: false,
        errorMessage: `Cette configuration existe déjà.`,
      };
    }

    return {
      isValid: true,
      errorMessage: "",
    };
  }
}

export function FoldersTab() {
  const {
    folderDatabaseLinks,
    databaseConnections,
    addFolderDatabaseLink,
    updateFolderDatabaseLink,
    removeFolderDatabaseLink,
  } = useAppStore();

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FolderDatabaseLink>>({
    mainFolder: "",
    subFolder: "",
    linkedDatabase: "",
    archiveFolder: "",
    logFolder: "",
    tableName: "T_SAL",
    matriculeField: "MatriculeSalarie",
    emailField: "EMail",
    isSageDatabase: false,
  });
  const [availableSubfolders, setAvailableSubfolders] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isElectronAvailable, setIsElectronAvailable] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  // Check if Electron API is available when component mounts
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      setIsElectronAvailable(true);
      console.log("Frontend: Electron API is available");
    } else {
      setIsElectronAvailable(false);
      console.log("Frontend: Running in web browser mode");
    }
  }, []);

  // Validate configuration whenever form data changes
  useEffect(() => {
    if (formData.mainFolder && formData.subFolder) {
      const detector = new FolderDuplicateDetector(folderDatabaseLinks);
      const validation = detector.validateNewConfiguration(
        formData.mainFolder,
        formData.subFolder,
        isEditing || undefined
      );

      if (!validation.isValid) {
        setValidationError(validation.errorMessage);
      } else {
        setValidationError("");
      }
    } else {
      setValidationError("");
    }
  }, [formData.mainFolder, formData.subFolder, folderDatabaseLinks, isEditing]);

  // Refs for hidden file inputs
  const mainFolderInputRef = useRef<HTMLInputElement>(null);
  const archiveFolderInputRef = useRef<HTMLInputElement>(null);
  const logFolderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelection = async () => {
    if (!isElectronAvailable) {
      alert("Folder picker is only available in the desktop app");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Frontend: Requesting folder picker...");

      const result = await window.electronAPI.openFolderPicker();
      console.log("Frontend: Received result from Electron:", result);

      if (result.success && result.path) {
        setFormData((prev) => ({
          ...prev,
          mainFolder: result.path,
          subFolder: "",
        }));

        const subfolders = await window.electronAPI.scanSubFolders(result.path);
        setAvailableSubfolders(subfolders);
        console.log("Frontend: User selected folder:", result.path);
      } else if (result.success === false && result.message) {
        console.log(
          "Frontend: Folder selection canceled or failed:",
          result.message
        );
      }
    } catch (error) {
      console.error("Frontend: Error during folder selection:", error);
      alert("An error occurred while selecting the folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectArchive = async () => {
    if (!isElectronAvailable) {
      alert("Folder picker is only available in the desktop app");
      return;
    }

    try {
      console.log("Frontend: Requesting folder picker...");
      const result = await window.electronAPI.openFolderPicker();
      console.log("Frontend: Received result from Electron:", result);

      if (result.success && result.path) {
        setFormData((prev) => ({
          ...prev,
          archiveFolder: result.path,
        }));
        console.log("Frontend: User selected archive folder:", result.path);
      } else if (result.success === false && result.message) {
        console.log(
          "Frontend: Folder selection canceled or failed:",
          result.message
        );
      }
    } catch (error) {
      console.error("Frontend: Error during folder selection:", error);
      alert("An error occurred while selecting the folder");
    }
  };

  const handleSelectJournal = async () => {
    if (!isElectronAvailable) {
      alert("Folder picker is only available in the desktop app");
      return;
    }

    try {
      console.log("Frontend: Requesting folder picker...");
      const result = await window.electronAPI.openFolderPicker();
      console.log("Frontend: Received result from Electron:", result);

      if (result.success && result.path) {
        setFormData((prev) => ({
          ...prev,
          logFolder: result.path,
        }));
        console.log("Frontend: User selected log folder:", result.path);
      } else if (result.success === false && result.message) {
        console.log(
          "Frontend: Folder selection canceled or failed:",
          result.message
        );
      }
    } catch (error) {
      console.error("Frontend: Error during folder selection:", error);
      alert("An error occurred while selecting the folder");
    }
  };

  const handleSubmit = async () => {
    console.log("Submitting form data:", formData);

    // Basic validation
    if (
      !formData.mainFolder ||
      !formData.subFolder ||
      !formData.linkedDatabase
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Simple duplicate check
    const isDuplicate = folderDatabaseLinks.some((link) => {
      if (isEditing && link.id === isEditing) return false;
      return (
        link.mainFolder === formData.mainFolder &&
        link.subFolder === formData.subFolder
      );
    });

    if (isDuplicate) {
      toast.error("Cette configuration existe déjà");
      return;
    }

    const data = {
      main_folder: formData.mainFolder,
      subfolder_name: formData.subFolder,
      link_database: formData.linkedDatabase,
      archive_folder: formData.archiveFolder,
      log_folder: formData.logFolder,
      tablename: formData.tableName,
      matricule_field: formData.matriculeField,
      email_field: formData.emailField,
    };

    try {
      if (isEditing) {
        updateFolderDatabaseLink(isEditing, formData);
        const response = await fetch(
          "http://127.0.0.1:8000/folder-config/update",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.detail || "Erreur inconnue";
          toast.error(`Échec de la mise à jour: ${errorMessage}`);
          console.error("Failed to update folder database link:", errorData);
          return;
        }

        toast.success(
          `Configuration mise à jour avec succès: (${formData.mainFolder})`
        );
        setIsEditing(null);
      } else {
        const response = await fetch(
          "http://127.0.0.1:8000/folder-config/add",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.detail || "Erreur inconnue";
          toast.error(`Échec de l'ajout: ${errorMessage}`);
          console.error("Failed to add folder database link:", errorData);
          return;
        }

        addFolderDatabaseLink(formData as Omit<FolderDatabaseLink, "id">);
        toast.success(`Liaison ajoutée avec succès`);
      }

      // Reset only linkedDatabase, keep other fields for re-use
      setFormData((prev) => ({
        ...prev,
        linkedDatabase: "",
        isSageDatabase: false,
      }));
      setValidationError("");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Erreur lors de la soumission du formulaire");
    }
  };

  const handleEdit = (link: FolderDatabaseLink) => {
    setFormData(link);
    setIsEditing(link.id);
    if (link.mainFolder) {
      setAvailableSubfolders([]);
    }
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({
      mainFolder: "",
      subFolder: "",
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
    });
    setAvailableSubfolders([]);
    setValidationError("");
  };

  const handleClearAll = () => {
    setFormData({
      mainFolder: "",
      subFolder: "",
      linkedDatabase: "",
      archiveFolder: "",
      logFolder: "",
      isSageDatabase: false,
    });
    setAvailableSubfolders([]);
    setValidationError("");
  };

  const handleDelete = async (subFolder: string) => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/folder-config/delete",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subfolder_name: subFolder }),
        }
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      toast.success(`Liaison supprimée avec succès`);
    } catch (error) {
      toast.error(`Suppression impossible`);
    }
  };

  // Function to construct absolute path from file path
  const getAbsolutePath = (file: File): string => {
    const relativePath = file.webkitRelativePath;
    const mainFolderName = relativePath.split("/")[0];
    let absolutePath = "";

    if (file.name && (file as any).path) {
      const fullPath = (file as any).path;
      if (fullPath) {
        const pathParts = fullPath.split(/[/\\]/);
        const mainFolderIndex = pathParts.findIndex(
          (part: string) => part === mainFolderName
        );
        if (mainFolderIndex > 0) {
          absolutePath = pathParts.slice(0, mainFolderIndex + 1).join("/");
        }
      }
    }

    if (!absolutePath) {
      absolutePath = `C:/Users/Documents/${mainFolderName}`;
    }

    return absolutePath;
  };

  // Function to extract all unique subfolders from file list
  const extractSubfolders = (files: FileList): string[] => {
    const subfolders = new Set<string>();

    Array.from(files).forEach((file) => {
      const pathParts = file.webkitRelativePath.split("/");

      if (pathParts.length >= 3) {
        subfolders.add(pathParts[1]);
      }

      for (let i = 1; i < pathParts.length - 1; i++) {
        if (pathParts[i] && pathParts[i] !== pathParts[0]) {
          const subfolderPath = pathParts.slice(1, i + 1).join("/");
          subfolders.add(subfolderPath);
        }
      }
    });

    return Array.from(subfolders).sort();
  };

  const handleMainFolderSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsScanning(true);

      try {
        const firstFile = files[0];
        const absolutePath = getAbsolutePath(firstFile);
        const subfolders = extractSubfolders(files);

        console.log("Folder scan results:", {
          absolutePath,
          subfolders,
          totalFiles: files.length,
        });

        setFormData((prev) => ({
          ...prev,
          mainFolder: absolutePath,
          subFolder: "",
        }));

        setAvailableSubfolders(subfolders);
      } catch (error) {
        console.error("Error scanning folder:", error);
        const firstFile = files[0];
        const relativePath = firstFile.webkitRelativePath;
        const mainFolderName = relativePath.split("/")[0];

        setFormData((prev) => ({
          ...prev,
          mainFolder: mainFolderName,
          subFolder: "",
        }));
        setAvailableSubfolders([]);
      } finally {
        setIsScanning(false);
      }
    }

    event.target.value = "";
  };

  const handleFolderSelect = (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      const absolutePath = getAbsolutePath(firstFile);
      setFormData((prev) => ({ ...prev, [field]: absolutePath }));
    }
    event.target.value = "";
  };

  const openFolderPicker = (field: string) => {
    switch (field) {
      case "mainFolder":
        mainFolderInputRef.current?.click();
        break;
      case "archiveFolder":
        archiveFolderInputRef.current?.click();
        break;
      case "logFolder":
        logFolderInputRef.current?.click();
        break;
    }
  };

  // Group links by main folder and subfolder for better display
  const groupedLinks = folderDatabaseLinks.reduce((acc, link) => {
    const key = `${link.mainFolder}/${link.subFolder}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(link);
    return acc;
  }, {} as Record<string, FolderDatabaseLink[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Liaison Dossiers / Bases de Données
        </h2>
        {/* <Button
          onClick={handleClearAll}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent"
        >
          Effacer Tout
        </Button> */}
      </div>

      {/* Hidden file inputs for folder selection */}
      <input
        ref={mainFolderInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleMainFolderSelect}
        accept="*/*"
      />
      <input
        ref={archiveFolderInputRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => handleFolderSelect("archiveFolder", e)}
        accept="*/*"
      />
      <input
        ref={logFolderInputRef}
        type="file"
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
          {/* Validation Error Alert */}
          {validationError && (
            <Alert className="border-red-700 bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Folder */}
          <div className="space-y-2">
            <Label className="text-gray-200">Dossier Principal</Label>
            <div className="flex space-x-2">
              <Input
                value={formData.mainFolder || ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    mainFolder: e.target.value,
                  }));
                  if (e.target.value !== formData.mainFolder) {
                    setAvailableSubfolders([]);
                    setFormData((prev) => ({
                      ...prev,
                      mainFolder: e.target.value,
                      subFolder: "",
                    }));
                  }
                }}
                className="bg-gray-800 border-gray-700 text-white flex-1"
                placeholder="Chemin absolu du dossier principal (ex: E:/Dossier du fichier a traiter)"
              />
              <Button
                type="button"
                variant="outline"
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
              value={formData.subFolder || ""}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, subFolder: value }))
              }
              disabled={availableSubfolders.length === 0 || isLoading}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue
                  placeholder={
                    isLoading
                      ? "Analyse en cours..."
                      : availableSubfolders.length === 0
                      ? "Sélectionnez d'abord un dossier principal"
                      : "Sélectionner un sous-dossier"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {availableSubfolders.map((folder) => (
                  <SelectItem
                    key={folder}
                    value={folder}
                    className="text-white hover:bg-gray-700"
                  >
                    📁 {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              {isLoading
                ? "Recherche des sous-dossiers..."
                : availableSubfolders.length > 0
                ? `${availableSubfolders.length} sous-dossier(s) trouvé(s) dans le dossier principal`
                : "Aucun sous-dossier détecté - sélectionnez un dossier principal contenant des sous-dossiers"}
            </p>
          </div>

          {/* Linked Database */}
          <div className="space-y-2">
            <Label className="text-gray-200">Base de Données Liée</Label>
            <Input
              value={formData.linkedDatabase || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  linkedDatabase: e.target.value,
                }))
              }
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Entrer le nom de la base de données"
            />
            <p className="text-xs text-gray-400">
              Chaque sous-dossier ne peut avoir qu'une seule base de données
              liée
            </p>
          </div>

          {/* Archive and Log Folders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier d'Archivage</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.archiveFolder || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      archiveFolder: e.target.value,
                    }))
                  }
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
              <p className="text-xs text-gray-400">
                Chemin absolu pour l'archivage
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Dossier de Journalisation</Label>
              <div className="flex space-x-2">
                <Input
                  value={formData.logFolder || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      logFolder: e.target.value,
                    }))
                  }
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
              <p className="text-xs text-gray-400">
                Chemin absolu pour la journalisation
              </p>
            </div>
          </div>

          {/* SAGE Database Radio Button */}
          <div className="space-y-3">
            <Label className="text-gray-200">Type de Base de Données</Label>
            <RadioGroup
              value={formData.isSageDatabase ? "sage" : "other"}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  isSageDatabase: value === "sage",
                }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="bg-blue-900"
                  value="sage"
                  id="sage"
                />
                <Label htmlFor="sage" className="text-gray-300">
                  Base SAGE
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  className="bg-blue-900"
                  value="other"
                  id="other"
                />
                <Label htmlFor="other" className="text-gray-300">
                  Autre Base de Données
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-gray-400">
              Chaque liaison peut avoir un type de base différent
            </p>
          </div>

          {/* Conditional Fields for Non-SAGE Databases */}
          {!formData.isSageDatabase && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Nom de la Table</Label>
                <Input
                  value={formData.tableName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tableName: e.target.value,
                    }))
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Nom de la table"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Champ Matricule</Label>
                  <Input
                    value={formData.matriculeField || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        matriculeField: e.target.value,
                      }))
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Nom du champ matricule"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Champ Email</Label>
                  <Input
                    value={formData.emailField || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emailField: e.target.value,
                      }))
                    }
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Nom du champ email"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isScanning}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isEditing ? "Mettre à Jour" : "Ajouter cette Liaison"}
            </Button>
            {isEditing && (
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-700 bg-transparent"
              >
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links List - Grouped by Folder/Subfolder */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Liaisons Configurées
        </h3>
        {folderDatabaseLinks.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6 text-center">
              <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Aucune liaison configurée</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedLinks).map(([folderKey, links]) => {
            const [mainFolder, subFolder] = folderKey.split("/");
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
                    <div
                      key={link.id}
                      className="p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">
                              Base: {link.linkedDatabase}
                            </span>
                            {link.isSageDatabase && (
                              <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">
                                SAGE
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            {link.archiveFolder && (
                              <p>Archive: {link.archiveFolder}</p>
                            )}
                            {link.logFolder && <p>Logs: {link.logFolder}</p>}
                            {!link.isSageDatabase && link.tableName && (
                              <p>
                                Table: {link.tableName} | Matricule:{" "}
                                {link.matriculeField} | Email: {link.emailField}
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
                            onClick={() => {
                              handleDelete(link.subFolder);
                              removeFolderDatabaseLink(link.id);
                            }}
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
            );
          })
        )}
      </div>
    </div>
  );
}
