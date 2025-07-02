"use client"

import { Hash } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

export function MatriculeTab() {
  const { matriculeConfig, setMatriculeConfig } = useAppStore()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuration de Détection des Matricules</h2>
      </div>

      {/* Configuration Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Paramètres de Détection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-200">Nombre de Caractères du Matricule</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={matriculeConfig.numberOfCharacters}
                onChange={(e) => setMatriculeConfig({ numberOfCharacters: Number.parseInt(e.target.value) || 1 })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="6"
              />
              <p className="text-xs text-gray-400">Nombre de chiffres composant le matricule</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Texte de Référence</Label>
              <Input
                value={matriculeConfig.referenceText}
                onChange={(e) => setMatriculeConfig({ referenceText: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="MAT"
              />
              <p className="text-xs text-gray-400">Texte précédant le matricule dans le nom du fichier</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
