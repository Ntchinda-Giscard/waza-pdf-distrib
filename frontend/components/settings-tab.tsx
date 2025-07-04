"use client"

import { Settings, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function SettingsTab() {
  const { licenseKey, setLicenseKey, setShowLicenseModal } = useAppStore()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Paramètres</h2>
      </div>

      {/* License Management */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Key className="w-5 h-5 mr-2" />
            Gestion de la Licence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-200">Clé de Licence Actuelle</Label>
            <div className="flex space-x-2">
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white flex-1"
                placeholder="Aucune licence activée"
                readOnly
              />
              <Button
                onClick={() => setShowLicenseModal(true)}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Modifier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      {/* <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Paramètres de l'Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-200">Délai d'Attente (secondes)</Label>
            <Input type="number" className="bg-gray-800 border-gray-700 text-white" placeholder="30" />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-200">Nombre de Tentatives</Label>
            <Input type="number" className="bg-gray-800 border-gray-700 text-white" placeholder="3" />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Sauvegarder</Button>
        </CardContent>
      </Card> */}
    </div>
  )
}
