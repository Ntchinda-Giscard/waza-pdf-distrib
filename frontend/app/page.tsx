"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DatabaseFormModal } from "@/components/database-form-modal"
import { PlusCircle, Zap } from "lucide-react"
import axios from "axios"
import { motion } from "framer-motion"
import {useDatabaseStore } from "@/store/use-database-store"
import { toast } from "react-hot-toast"
import { extractPdfTextFromFile } from "@/utils/read-pdf"

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAutomating, setIsAutomating] = useState(false)
  const { config, setConfig } = useDatabaseStore()

  const handleAutomationTest = async () => {
    setIsAutomating(true)
    try {
      await axios.post("http://localhost:8000/run-automtion/")
      toast.success("Automation test completed successfully!", {
        className: "bg-teal-50 text-teal-800 border-teal-200",
      })

      
    } catch (error) {
      console.log("Automation test failed. Please try again.")
      toast.error("Automation test failed. Please try again.", {
        className: "bg-rose-50 text-rose-800 border-rose-200",
      })
    } finally {
      setIsAutomating(false)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-sky-600">Database Connection Manager</h1>
          <p className="text-muted-foreground mt-2">Configure database connections for your folder structure</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => setIsModalOpen(true)} className="bg-sky-500 hover:bg-sky-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Connection
          </Button>
        </motion.div>
      </div>

      <div className="flex justify-center my-12">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full max-w-md">
          <Button
            onClick={handleAutomationTest}
            disabled={isAutomating}
            className="w-full py-6 text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md"
          >
            {isAutomating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Zap className="mr-2 h-6 w-6" />
              </motion.div>
            ) : (
              <Zap className="mr-2 h-6 w-6" />
            )}
            Run Automation Test
          </Button>
        </motion.div>
      </div>

      <DatabaseFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  )
}
