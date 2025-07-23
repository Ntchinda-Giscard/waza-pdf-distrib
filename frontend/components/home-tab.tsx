"use client"

import { Play, CheckCircle, AlertCircle, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { toast } from "sonner"

export function HomeTab() {
  const { isLicenseActive, startPayrollDistribution, databaseConnections, folderDatabaseLinks, emailConfig } = useAppStore()
  const [loading, setLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("");


  // const handlePayrollDistribution = async() =>{
  //   const response = await fetch("http://127.0.0.1:8000/run/automation", {
  //       method: 'POST',
  //       headers: {
  //           'Content-Type': 'application/json'
  //       },
  //   })
  // }

  const handlePayrollDistribution = async () => {
    setIsLoading(true);
    setProgress(0);
    setStatus("Initialisation...");

    try {
      const response = await fetch("http://127.0.0.1:8000/run/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.body) {
        throw new Error("Aucune réponse retournée.");
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(splitStream("\n"));

      const streamReader = reader.getReader();

      while (true) {
        const { value, done } = await streamReader.read();
        if (done) break;
        if (!value) continue;

        try {
          const msg = JSON.parse(value);
          if (msg.error) {
            toast.error(msg.error);
            setStatus(msg.error);
          } else {
            if (typeof msg.progress === "number") setProgress(msg.progress);

            if (msg.matricule) {
              setStatus(`📄 Matricule: ${msg.matricule} → 📧 ${msg.email || "Aucun email"}`);
            }

            if (msg.message) setStatus(msg.message);
          }
        } catch (e) {
          console.warn("Chunk parse error", e);
        }
      }

      toast.success("🎉 Distribution terminée !");
      setStatus("✅ Distribution complétée");
    } catch (err) {
      toast.error("❌ Erreur durant la distribution");
      console.error(err);
      setStatus("Erreur de communication serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = async () =>{
        
    if (folderDatabaseLinks[0]?.logFolder){
      try{
        setLoading(true);
        const result = await window.electronAPI.openFolder(folderDatabaseLinks[0]?.logFolder)
        setLoading(false);
      }catch(error){
        setLoading(false);
      }finally{
        setLoading(false);
      }

    }
  }

  const isConfigurationComplete = () => {
    return databaseConnections.length > 0 && folderDatabaseLinks.length > 0
  }

  return (
    <div className="flex flex-col items-center overflow-y-scroll justify-center h-full p-8">
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
          onClick={handlePayrollDistribution}
          disabled={!isLicenseActive || !isConfigurationComplete() || !emailConfig }
          size="lg"
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <Play className="w-5 h-5 mr-2" />
          Lancer l'Envoi des Bulletin
        </Button>

        <Button
          onClick={handleOpenFolder}
          // disabled={!isLicenseActive || !isConfigurationComplete()}
          disabled={loading}
          size="lg"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 text-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <FolderOpen className="w-5 h-5 mr-2" />
          Ouvrir dossier de journalisation
        </Button>
        {isLoading && (
        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{status}</p>
        </div>
      )}

        {(!isLicenseActive || !isConfigurationComplete()) && (
          <div className="text-xs text-gray-500 space-y-1">
            {!isLicenseActive && <p>• Activez votre licence</p>}
            {databaseConnections.length === 0 && <p>• Configurez au moins une base de données</p>}
            {folderDatabaseLinks.length === 0 && <p>• Configurez au moins une liaison dossier/BDD</p>}
            {!emailConfig && <p>• Configurer votre serveur mail</p>}
          </div>
        )}
      </div>
    </div>
  )
}


// Utilitaire pour découper le stream ligne par ligne
function splitStream(delimiter: string) {
  let buffer = "";
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      const parts = buffer.split(delimiter);
      buffer = parts.pop()!;
      for (const part of parts) controller.enqueue(part);
    },
    flush(controller) {
      if (buffer) controller.enqueue(buffer);
    },
  });
}