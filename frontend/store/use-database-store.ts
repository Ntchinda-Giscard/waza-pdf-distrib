import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Subfolder = {
  id: string
  subfolder_name: string
  link_database: string
  email_field: string
  license_field: string
  table: string
}

export type DatabaseConfig = {
  db_server: string
  db_username: string
  db_password: string
  folder_name: string
  ref_text: string
  numner_of_char: number
  license_key: string
  subfolders: Subfolder[]
}

type DatabaseStore = {
  // Form state
  config: DatabaseConfig
  availableSubfolders: string[]
  isScanning: boolean
  scanError: string | null
  isSubmitting: boolean
  submitSuccess: boolean
  submitError: string | null

  // Actions
  setConfig: (config: Partial<DatabaseConfig>) => void
  addSubfolder: () => void
  updateSubfolder: (id: string, subfolder: Partial<Subfolder>) => void
  removeSubfolder: (id: string) => void
  setAvailableSubfolders: (folders: string[]) => void
  setIsScanning: (isScanning: boolean) => void
  setScanError: (error: string | null) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  setSubmitSuccess: (success: boolean) => void
  setSubmitError: (error: string | null) => void
  resetForm: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const initialConfig: DatabaseConfig = {
  db_server: "",
  db_username: "",
  db_password: "",
  folder_name: "",
  ref_text: "",
  numner_of_char: 0,
  license_key: "",
  subfolders: [
    {
      id: generateId(),
      subfolder_name: "",
      link_database: "",
      email_field: "",
      license_field: "",
      table: "",
    },
  ],
}

export const useDatabaseStore = create<DatabaseStore>()(
  persist(
    (set) => ({
      // Initial state
      config: initialConfig,
      availableSubfolders: [],
      isScanning: false,
      scanError: null,
      isSubmitting: false,
      submitSuccess: false,
      submitError: null,

      // Actions
      setConfig: (config) =>
        set((state) => ({
          config: { ...state.config, ...config },
        })),

      addSubfolder: () =>
        set((state) => ({
          config: {
            ...state.config,
            subfolders: [
              ...state.config.subfolders,
              {
                id: generateId(),
                subfolder_name: "",
                link_database: "",
                email_field: "",
                license_field: "",
                table: "",
              },
            ],
          },
        })),

        
      updateSubfolder: (id, subfolder) =>
        set((state) => ({
          config: {
            ...state.config,
            subfolders: state.config.subfolders.map((s) => (s.id === id ? { ...s, ...subfolder } : s)),
          },
        })),

      removeSubfolder: (id) =>
        set((state) => ({
          config: {
            ...state.config,
            subfolders: state.config.subfolders.filter((s) => s.id !== id),
          },
        })),

      setAvailableSubfolders: (folders) => set({ availableSubfolders: folders }),
      setIsScanning: (isScanning) => set({ isScanning }),
      setScanError: (error) => set({ scanError: error }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
      setSubmitSuccess: (success) => set({ submitSuccess: success }),
      setSubmitError: (error) => set({ submitError: error }),

      resetForm: () =>
        set({
          config: initialConfig,
          submitSuccess: false,
          scanError: null,
          submitError: null,
        }),
    }),
    {
      name: "database-connections",
    },
  ),
)
