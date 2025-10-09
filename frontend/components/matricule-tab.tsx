"use client";

import {
  Beaker,
  FlaskConical,
  FlaskConicalIcon,
  Hash,
  TestTube,
  TestTubeDiagonal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { TestMatriculeModal } from "./test-matricule-modal";

export function MatriculeTab() {
  const { matriculeConfig, setMatriculeConfig } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const data = {
      number_of_character: matriculeConfig.numberOfCharacters,
      ref_text: matriculeConfig.referenceText,
    };
    // Handle form submission
    setIsLoading(true);
    const response = await fetch("http://127.0.0.1:8000/matricule/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Handle error
      toast.error("Échec de la mise à jour de la configuration du matricule");
      console.error("Failed to update matricule config:", response.statusText);
      setIsLoading(false);
      throw new Error("Failed to update matricule config");
    }
    toast.success("Configuration du matricule mise à jour avec succès");
    setIsLoading(false);

    // Handle success
    console.log("Matricule config updated successfully");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Test Modal */}
      <TestMatriculeModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Configuration de Détection des Matricules
        </h2>
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
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="border-blue-700 text-blue-700 hover:bg-blue-600 hover:text-white"
            size="sm"
          >
            <TestTubeDiagonal className="w-5 h-5 text-blue-700 hover:bg-blue-600" />
            Tester et trouver le matricule
          </Button>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-200">
                Nombre de Caractères du Matricule
              </Label>
              <Input
                type="number"
                min="0"
                // max="20"
                value={matriculeConfig.numberOfCharacters}
                onChange={(e) => {
                  setMatriculeConfig({
                    numberOfCharacters: Number.parseInt(e.target.value),
                  });
                  handleSubmit();
                }}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="6"
              />
              <p className="text-xs text-gray-400">
                Nombre de chiffres composant le matricule
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">Texte de Référence</Label>
              <Input
                value={matriculeConfig.referenceText}
                onChange={(e) =>
                  setMatriculeConfig({ referenceText: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="MAT"
              />
              <p className="text-xs text-gray-400">
                Texte avant le matricule dans le nom du fichier
              </p>
            </div>
          </div>
          <Button
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setMatriculeConfig({ ...matriculeConfig });
              handleSubmit();
            }}
          >
            Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
