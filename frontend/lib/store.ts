import { toast } from "sonner"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ConnectionType = "odbc" | "native"
export type DatabaseType = "postgresql" | "mysql" | "mssql"

export interface OdbcSource {
  name: string
  driver: string
  description?: string
}

export interface ConnectionData {
  connectionType: ConnectionType
  odbcSource?: string
  databaseType?: DatabaseType
  serverName?: string
  username: string
  password: string
  tableName: string // Now required for both ODBC and Native
  matriculeColumnName: string
  emailColumnName: string
  databaseName?: string
  // New fields
  pdfFolderPath: string
  licenseKey: string
  referenceText: string
  maxCharacters: number
}

interface ConnectionStore {
  connectionData: ConnectionData
  odbcSources: OdbcSource[]
  isModalOpen: boolean
  isLoadingOdbcSources: boolean
  odbcSourcesError: string | null
  setConnectionData: (data: Partial<ConnectionData>) => void
  setModalOpen: (open: boolean) => void
  resetConnectionData: () => void
  fetchOdbcSources: () => Promise<void>
  sendToBackend: () => Promise<void>
}

const initialConnectionData: ConnectionData = {
  connectionType: "odbc",
  username: "",
  password: "",
  tableName: "",
  matriculeColumnName: "",
  emailColumnName: "",
  pdfFolderPath: "",
  licenseKey: "",
  referenceText: "",
  maxCharacters: 1000,
}

export const useConnectionStore = create<ConnectionStore>()(
    persist(
        (set, get) => ({
          connectionData: initialConnectionData,
          odbcSources: [],
          isModalOpen: false,
          isLoadingOdbcSources: false,
          odbcSourcesError: null,
          setConnectionData: (data) =>
              set((state) => ({
                connectionData: { ...state.connectionData, ...data },
              })),
          setModalOpen: (open) => {
            set({ isModalOpen: open })
            // Fetch ODBC sources when modal opens
            if (open) {
              get().fetchOdbcSources()
            }
          },
          resetConnectionData: () => set({ connectionData: initialConnectionData }),
          fetchOdbcSources: async () => {
            set({ isLoadingOdbcSources: true, odbcSourcesError: null })
            try {
              // Try both localhost and 127.0.0.1
              const endpoints = ["http://localhost:8000/odbc/odbc-sources", "http://127.0.0.1:8000/odbc/odbc-sources"]

              let response: Response | null = null
              let lastError: Error | null = null

              for (const endpoint of endpoints) {
                try {
                  response = await fetch(endpoint, {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  })
                  if (response.ok) break
                } catch (error) {
                  lastError = error as Error
                  continue
                }
              }

              if (!response || !response.ok) {
                throw new Error(lastError?.message || "Failed to fetch ODBC sources")
              }

              const sources: OdbcSource[] = await response.json()
              console.log("sorces", sources)
              set({ odbcSources: sources.odbc_sources, isLoadingOdbcSources: false })
            } catch (error) {
              console.error("Error fetching ODBC sources:", error)
              set({
                odbcSourcesError:
                    "Failed to connect to FastAPI server. Please ensure it's running on localhost:8000 or 127.0.0.1:8000",
                isLoadingOdbcSources: false,
                // Provide fallback mock data for development
                odbcSources: [
                  { name: "SQL Server Native Client", driver: "SQLNCLI11", description: "SQL Server Native Client 11.0" },
                  {
                    name: "PostgreSQL ODBC Driver",
                    driver: "PostgreSQL Unicode",
                    description: "PostgreSQL ODBC Driver (Unicode)",
                  },
                  { name: "MySQL ODBC Driver", driver: "MySQL ODBC 8.0 Driver", description: "MySQL ODBC 8.0 Driver" },
                ],
              })
            }
          },
          sendToBackend: async () => {
            const { connectionData } = get()
            try {
              console.log("Sending data to backend:", connectionData)

              const response = await fetch("http://127.0.0.1:8000/test/", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(connectionData),
              })

              const data = await response.json()

              if (response.ok) {
                console.log("Data sent successfully")
                toast.success("Data sent successfully!", {
                  description: "Your data has been processed by the backend.",
                })
              } else {
                const errorMessage = typeof data.detail === "string"
                  ? data.detail
                  : JSON.stringify(data)

                toast.error("Failed to send data to backend", {
                  description: errorMessage,
                })

                console.error("Failed to send data:", errorMessage)
              }
            } catch (error: any) {
              console.error("Error sending data:", error)
              toast.error("Network or unexpected error", {
                description: error.message || "Unknown error occurred.",
              })
            }
          }




        }),
        {
          name: "connection-storage",
          partialize: (state) => ({
            connectionData: state.connectionData,
          }),
        },
    ),
)
