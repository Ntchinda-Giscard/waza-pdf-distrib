import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ConnectionType = "odbc" | "native"
export type DatabaseType = "postgresql" | "mysql" | "mssql"
export type TabType = "home" | "parametres"
export type ParametreTabType = "database" | "folders" | "matricule" | "email" | "settings"

export interface OdbcSource {
  name: string
  driver: string
  description?: string
}

export interface DatabaseConnection {
  id: string
  connectionType: ConnectionType
  odbcSource?: string
  databaseType?: DatabaseType
  serverName?: string
  username: string
  password: string
}

export interface FolderDatabaseLink {
  id: string
  mainFolder: string
  subFolder: string
  linkedDatabase: string
  archiveFolder?: string
  logFolder?: string
  isSageDatabase: boolean
  tableName?: string
  matriculeField?: string
  emailField?: string
}

export interface MatriculeConfig {
  numberOfCharacters: number
  referenceText: string
  detectionPattern?: string
}

export interface EmailConfig {
  smtpServer: string
  smtpPort: number
  senderEmail: string
  senderPassword: string
  useSSL: boolean
  useTLS: boolean
  timeout: number
  retryAttempts: number
}

interface AppState {
  // Tab management
  activeTab: TabType
  activeParametreTab: ParametreTabType
  setActiveTab: (tab: TabType) => void
  setActiveParametreTab: (tab: ParametreTabType) => void

  // License management
  licenseKey: string
  isLicenseActive: boolean
  showLicenseModal: boolean
  setLicenseKey: (key: string) => void
  setShowLicenseModal: (show: boolean) => void
  activateLicense: () => void

  // Database connections
  databaseConnections: DatabaseConnection[]
  odbcSources: OdbcSource[]
  isLoadingOdbcSources: boolean
  odbcSourcesError: string | null
  addDatabaseConnection: (connection: Omit<DatabaseConnection, "id">) => void
  updateDatabaseConnection: (id: string, updates: Partial<DatabaseConnection>) => void
  removeDatabaseConnection: (id: string) => void
  fetchOdbcSources: () => Promise<void>

  // Folder database links
  folderDatabaseLinks: FolderDatabaseLink[]
  addFolderDatabaseLink: (link: Omit<FolderDatabaseLink, "id">) => void
  updateFolderDatabaseLink: (id: string, updates: Partial<FolderDatabaseLink>) => void
  removeFolderDatabaseLink: (id: string) => void

  // Matricule configuration
  matriculeConfig: MatriculeConfig
  setMatriculeConfig: (config: Partial<MatriculeConfig>) => void

  // Email configuration
  emailConfig: EmailConfig
  setEmailConfig: (config: Partial<EmailConfig>) => void
  testEmailConfiguration: () => Promise<boolean>

  // Payroll process
  startPayrollDistribution: () => void
}

const defaultMatriculeConfig: MatriculeConfig = {
  numberOfCharacters: 6,
  referenceText: "MAT",
  detectionPattern: "",
}

const defaultEmailConfig: EmailConfig = {
  smtpServer: "",
  smtpPort: 587,
  senderEmail: "",
  senderPassword: "",
  useSSL: false,
  useTLS: true,
  timeout: 30,
  retryAttempts: 3,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Tab management
      activeTab: "home",
      activeParametreTab: "database",
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveParametreTab: (tab) => set({ activeParametreTab: tab }),

      // License management
      licenseKey: "",
      isLicenseActive: false,
      showLicenseModal: false,
      setLicenseKey: (key) => set({ licenseKey: key }),
      setShowLicenseModal: (show) => set({ showLicenseModal: show }),
      activateLicense: () => {
        const { licenseKey } = get()
        if (licenseKey.trim()) {
          set({
            isLicenseActive: true,
            showLicenseModal: false,
          })
        }
      },

      // Database connections
      databaseConnections: [],
      odbcSources: [],
      isLoadingOdbcSources: false,
      odbcSourcesError: null,

      addDatabaseConnection: (connection) => {
        const newConnection = {
          ...connection,
          id: Date.now().toString(),
        }
        set((state) => ({
          // databaseConnections: [...state.databaseConnections, newConnection],
          databaseConnections: [newConnection],
        }))
      },

      updateDatabaseConnection: (id, updates) => {
        set((state) => ({
          databaseConnections: state.databaseConnections.map((conn) =>
            conn.id === id ? { ...conn, ...updates } : conn,
          ),
        }))
      },

      removeDatabaseConnection: (id) => {
        set((state) => ({
          databaseConnections: state.databaseConnections.filter((conn) => conn.id !== id),
        }))
      },

      fetchOdbcSources: async () => {
        set({ isLoadingOdbcSources: true, odbcSourcesError: null })
        try {
          const response = await fetch("http://127.0.0.1:8000/odbc/odbc-sources")
          console.log(response)
          if (response.ok) {
            const sources = await response.json()
            console.log(sources)
            set({ odbcSources: sources.odbc_sources, isLoadingOdbcSources: false })
          } else {
            throw new Error("Failed to fetch ODBC sources")
          }
        } catch (error: any) {
          // Fallback to mock data if server is not available
          const mockOdbcSources: OdbcSource[] = [
            {
              name: "SQL Server Native Client 11.0",
              driver: "SQLNCLI11",
              description: "Microsoft SQL Server Native Client 11.0",
            },
            {
              name: "PostgreSQL ODBC Driver (Unicode)",
              driver: "PostgreSQL Unicode",
              description: "PostgreSQL ODBC Driver with Unicode support",
            },
            { name: "MySQL ODBC 8.0 Driver", driver: "MySQL ODBC 8.0 Driver", description: "MySQL Connector/ODBC 8.0" },
            {
              name: "Microsoft Access Driver",
              driver: "Microsoft Access Driver (*.mdb, *.accdb)",
              description: "Microsoft Access Database Engine",
            },
            {
              name: "Oracle ODBC Driver",
              driver: "Oracle in OraClient19Home1",
              description: "Oracle Database ODBC Driver",
            },
            { name: "SQLite3 ODBC Driver", driver: "SQLite3 ODBC Driver", description: "SQLite ODBC Driver" },
          ]
          set({
            odbcSources: mockOdbcSources,
            odbcSourcesError: "Using offline ODBC sources (server unavailable)",
            isLoadingOdbcSources: false,
          })
        }
      },

      // Folder database links
      folderDatabaseLinks: [],

      addFolderDatabaseLink: (link) => {
        const newLink = {
          ...link,
          id: Date.now().toString(),
        }
        set((state) => ({
          folderDatabaseLinks: [...state.folderDatabaseLinks, newLink],
        }))
      },

      updateFolderDatabaseLink: (id, updates) => {
        set((state) => ({
          folderDatabaseLinks: state.folderDatabaseLinks.map((link) =>
            link.id === id ? { ...link, ...updates } : link,
          ),
        }))
      },

      removeFolderDatabaseLink: (id) => {
        set((state) => ({
          folderDatabaseLinks: state.folderDatabaseLinks.filter((link) => link.id !== id),
        }))
      },

      // Matricule configuration
      matriculeConfig: defaultMatriculeConfig,
      setMatriculeConfig: (config) => {
        set((state) => ({
          matriculeConfig: { ...state.matriculeConfig, ...config },
        }))
      },

      // Email configuration
      emailConfig: defaultEmailConfig,
      setEmailConfig: (config) => {
        set((state) => ({
          emailConfig: { ...state.emailConfig, ...config },
        }))
      },

      testEmailConfiguration: async () => {
        const { emailConfig } = get()
        try {
          // Simulate email test - in real app, this would test SMTP connection
          console.log("Testing email configuration:", emailConfig)
          await new Promise((resolve) => setTimeout(resolve, 2000))
          return true
        } catch (error) {
          console.error("Email test failed:", error)
          return false
        }
      },

      // Payroll process
      startPayrollDistribution: () => {
        const { isLicenseActive, databaseConnections, folderDatabaseLinks, matriculeConfig, emailConfig } = get()

        if (!isLicenseActive) {
          console.log("License activation required before continuing.")
          set({ showLicenseModal: true })
          return
        }

        if (databaseConnections.length === 0) {
          console.log("At least one database must be configured.")
          set({ activeTab: "parametres", activeParametreTab: "database" })
          return
        }

        if (folderDatabaseLinks.length === 0) {
          console.log("At least one folder/database link must be configured.")
          set({ activeTab: "parametres", activeParametreTab: "folders" })
          return
        }

        if (!emailConfig.smtpServer || !emailConfig.senderEmail) {
          console.log("Email configuration required.")
          set({ activeTab: "parametres", activeParametreTab: "email" })
          return
        }

        // Start the payroll distribution process
        console.log("Starting payroll distribution process...")
        console.log("Configuration:", {
          databases: databaseConnections.length,
          links: folderDatabaseLinks.length,
          matriculeConfig,
          emailConfig: { ...emailConfig, senderPassword: "[REDACTED]" },
        })
      },
    }),
    {
      name: "payroll-app-storage",
      partialize: (state) => ({
        licenseKey: state.licenseKey,
        isLicenseActive: state.isLicenseActive,
        activeParametreTab: state.activeParametreTab,
        databaseConnections: state.databaseConnections,
        folderDatabaseLinks: state.folderDatabaseLinks,
        matriculeConfig: state.matriculeConfig,
        emailConfig: state.emailConfig,
      }),
    },
  ),
)

// Also export the connection store for backward compatibility
export const useConnectionStore = useAppStore
