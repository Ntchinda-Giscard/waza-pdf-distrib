"use client"

import { useState } from "react"
import { X, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/store"
import { toast } from "sonner"

export function LicenseModal() {
  const { showLicenseModal, licenseKey, setLicenseKey, activateLicense, setShowLicenseModal } = useAppStore()
  const [tempLicenseKey, setTempLicenseKey] = useState(licenseKey)

  const handleActivate = async () => {
  const response = await fetch("http://127.0.0.1:8000/license/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ license: tempLicenseKey }),
  });

  if (!response.ok) {
    // Read the JSON payload
    const errorData = await response.json();
    // Use `detail` instead of `message`
    const msg = errorData.detail || "Erreur inconnue";
    toast.error(`Échec de l'activation de la licence : ${msg}`);
    return;
  }

  setLicenseKey(tempLicenseKey);
  activateLicense();
  toast.success("Licence activée avec succès");
};


  if (!showLicenseModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Activation de Licence
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLicenseModal(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license" className="text-sm font-medium text-gray-200">
              Clé de Licence
            </Label>
            <Input
              id="license"
              type="text"
              value={tempLicenseKey}
              onChange={(e) => setTempLicenseKey(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Entrez votre clé de licence"
            />
          </div>

          <div className="text-sm text-gray-400">
            <p>Veuillez entrer une clé de licence valide pour activer l'application.</p>
          </div>
        </div>

        <div className="border-t border-gray-800 p-6">
          <Button
            onClick={handleActivate}
            disabled={!tempLicenseKey.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
          >
            Activer la Licence
          </Button>
        </div>
      </div>
    </div>
  )
}
