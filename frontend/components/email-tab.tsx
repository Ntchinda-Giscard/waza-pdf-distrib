"use client"
import { Mail } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAppStore } from "@/lib/store"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner"

export function EmailTab() {
  const { emailConfig, setEmailConfig } = useAppStore()
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const data = {
      smtp_server: emailConfig.smtpServer,
      port: emailConfig.smtpPort,
      user_name: emailConfig.senderEmail,
      password: emailConfig.senderPassword,
      ssl: emailConfig.useSSL,
      tls: emailConfig.useTLS,
    }
    // Handle form submission
    setIsLoading(true);
    const response = await fetch("http://127.0.0.1:8000/email/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      // Handle error
      toast.error("Échec de la mise à jour de la configuration email")
      console.error("Failed to update email config:", response.statusText)
      setIsLoading(false)
      throw new Error("Failed to update email config")
    }
    toast.success("Configuration email mise à jour avec succès")
    setIsLoading(false)

    // Handle success
    console.log("Email config updated successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuration Email</h2>
      </div>

      {/* SMTP Configuration */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Paramètres SMTP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Serveur SMTP</Label>
              <Input
                value={emailConfig.smtpServer}
                onChange={(e) => setEmailConfig({ smtpServer: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Port SMTP</Label>
              <Input
                type="number"
                value={emailConfig.smtpPort}
                onChange={(e) => setEmailConfig({ smtpPort: Number.parseInt(e.target.value) || 587 })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Email d'Expédition</Label>
              <Input
                type="email"
                value={emailConfig.senderEmail}
                onChange={(e) => setEmailConfig({ senderEmail: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="noreply@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-200">Mot de Passe</Label>
              <Input
                type="password"
                value={emailConfig.senderPassword}
                onChange={(e) => setEmailConfig({ senderPassword: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-gray-200">Options de Sécurité</Label>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ssl"
                  checked={emailConfig.useSSL}
                  onCheckedChange={(checked) => setEmailConfig({ useSSL: checked as boolean })}
                />
                <Label htmlFor="ssl" className="text-gray-300">
                  Utiliser SSL
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tls"
                  checked={emailConfig.useTLS}
                  onCheckedChange={(checked) => setEmailConfig({ useTLS: checked as boolean })}
                />
                <Label htmlFor="tls" className="text-gray-300">
                  Utiliser TLS
                </Label>
              </div>
            </div>
          </div>
          <Button 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              setEmailConfig({ ...emailConfig });
              handleSubmit();
            }}
          >
              Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
