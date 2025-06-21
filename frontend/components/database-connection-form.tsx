"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { motion } from "framer-motion"
import { Loader2, Plus, Trash2, FolderSearch } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { scanFolderStructure } from "@/lib/actions"
import { useDatabaseStore, type Subfolder } from "@/store/use-database-store"
import { toast } from "react-hot-toast"

// Define the form schema
const formSchema = z.object({
  odbc_source: z.string().min(1, "ODBC source is required"),
  db_server: z.string().min(1, "Database server is required"),
  db_username: z.string().min(1, "Username is required"),
  db_password: z.string().min(1, "Password is required"),
  folder_name: z.string().min(1, "Folder path is required"),
  ref_text: z.string().min(1, "Reference text is required"),
  numner_of_char: z.coerce.number().int().min(1, "Number of characters must be at least 1"),
  license_key: z.string().min(1, "License key is required"),
  subfolders: z
    .array(
      z.object({
        id: z.string(),
        subfolder_name: z.string().min(1, "Subfolder name is required"),
        link_database: z.string().min(1, "Database name is required"),
        email_field: z.string().min(1, "Email field is required"),
        license_field: z.string().min(1, "License field is required"),
        table: z.string().min(1, "Table name is required"),
      }),
    )
    .min(1, "At least one subfolder mapping is required"),
})

export type FormValues = z.infer<typeof formSchema>

interface DatabaseConnectionFormProps {
  onSuccess?: () => void
}

export function DatabaseConnectionForm({ onSuccess }: DatabaseConnectionFormProps) {
  // Get state from Zustand store
  const {
    config,
    availableSubfolders,
    isScanning,
    scanError,
    isSubmitting,
    submitSuccess,
    submitError,
    setConfig,
    addSubfolder,
    updateSubfolder,
    removeSubfolder,
    setAvailableSubfolders,
    setIsScanning,
    setScanError,
    setIsSubmitting,
    setSubmitSuccess,
    setSubmitError,
  } = useDatabaseStore()

  // Initialize form with values from store
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: config,
  })

  // Update form when store changes
  useEffect(() => {
    form.reset(config)
  }, [form, config])

  const handleScanFolder = async () => {
    const folderPath = form.getValues("folder_name")

    if (!folderPath) {
      form.setError("folder_name", {
        type: "manual",
        message: "Please enter a folder path",
      })
      return
    }

    setIsScanning(true)
    setScanError(null)

    try {
      const folders = await scanFolderStructure(folderPath)
      setAvailableSubfolders(folders)
      toast.success(`Found ${folders.length} subfolders`, {
        className: "bg-sky-50 text-sky-800 border-sky-200",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to scan folder structure"
      setScanError(errorMessage)
      toast.error(errorMessage, {
        className: "bg-rose-50 text-rose-800 border-rose-200",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const onSubmit = async (data: FormValues) => {
    console.log("Submitting form with data:", data)
    setIsSubmitting(true)
    setSubmitSuccess(false)
    setSubmitError(null)

    try {
      // Format data for API
      const apiData = {
        ...data,
        // Remove the id field from subfolders as it's not needed in the API
        subfolders: data.subfolders.map(({ id, ...rest }) => rest),
      }

      // Send data to API
      const response = await axios.post("http://localhost:8000/user-config/", apiData)

      // Update the store with form data
      setConfig(data)
      setSubmitSuccess(true)

      toast.success("Configuration saved successfully!", {
        className: "bg-teal-50 text-teal-800 border-teal-200",
      })

      // Call onSuccess callback if provided
      if (onSuccess 
        // && response.status >= 200 && response.status < 300
      ) {
        setTimeout(onSuccess, 1500)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit form. Please try again."
      setSubmitError(errorMessage)

      toast.error(errorMessage, {
        className: "bg-rose-50 text-rose-800 border-rose-200",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update store when form fields change
  const handleFieldChange = (field: keyof FormValues, value: any) => {
    setConfig({ [field]: value })
  }

  // Update subfolder in store
  const handleSubfolderChange = (id: string, field: keyof Omit<Subfolder, "id">, value: string) => {
    updateSubfolder(id, { [field]: value })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="bg-slate-50">
                <CardTitle>Database Connection Details</CardTitle>
                <CardDescription>Enter the database connection credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <FormField
                  control={form.control}
                  name="db_server"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Server</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DESKTOP-U5UJ75L\\SQL21STDX3V12"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleFieldChange("db_server", e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="odbc_source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ODBC Driver</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ODBC Driver 17 for SQL Server"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleFieldChange("odbc_source", e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="db_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="my_super_user"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleFieldChange("db_username", e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="db_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="StrongP@ssw0rd!"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleFieldChange("db_password", e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="bg-slate-50">
                <CardTitle>Folder Configuration</CardTitle>
                <CardDescription>Specify the folder path and configuration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="folder_name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Folder Path</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="F:\\testFolder"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange("folder_name", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the path to the folder containing subfolders you want to configure
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="self-end mb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleScanFolder}
                      disabled={isScanning}
                      className="border-sky-200 hover:bg-sky-50"
                    >
                      {isScanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-500" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <FolderSearch className="mr-2 h-4 w-4 text-sky-500" />
                          Scan Folder
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ref_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Text</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="N° de Sécurité Sociale"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange("ref_text", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numner_of_char"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Characters</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="5"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleFieldChange("numner_of_char", Number.parseInt(e.target.value) || 0)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="license_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="WAZA-MjUtOWIyYTU3MTc="
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleFieldChange("license_key", e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {scanError && (
                  <Alert variant="destructive">
                    <AlertDescription>{scanError}</AlertDescription>
                  </Alert>
                )}

                {availableSubfolders.length > 0 && (
                  <Alert className="bg-sky-50 border-sky-200">
                    <AlertDescription className="text-sky-800">
                      Found {availableSubfolders.length} subfolders: {availableSubfolders.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Subfolder Mappings</CardTitle>
                    <CardDescription>Link databases to specific subfolders</CardDescription>
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSubfolder}
                      className="border-sky-200 hover:bg-sky-50"
                    >
                      <Plus className="mr-2 h-4 w-4 text-sky-500" />
                      Add Subfolder
                    </Button>
                  </motion.div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {config.subfolders.map((subfolder, index) => (
                  <motion.div
                    key={subfolder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="border-slate-200">
                      <CardHeader className="pb-2 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md">Subfolder #{index + 1}</CardTitle>
                          {config.subfolders.length > 1 && (
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubfolder(subfolder.id)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove subfolder</span>
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name={`subfolders.${index}.id`}
                          render={({ field }) => <Input type="hidden" {...field} />}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`subfolders.${index}.subfolder_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subfolder Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="folder1"
                                    list={`subfolders-${index}`}
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleSubfolderChange(subfolder.id, "subfolder_name", e.target.value)
                                    }}
                                  />
                                </FormControl>
                                {availableSubfolders.length > 0 && (
                                  <datalist id={`subfolders-${index}`}>
                                    {availableSubfolders.map((folder) => (
                                      <option key={folder} value={folder} />
                                    ))}
                                  </datalist>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`subfolders.${index}.link_database`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Link Database</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="PAIETEST"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleSubfolderChange(subfolder.id, "link_database", e.target.value)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`subfolders.${index}.table`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Table Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="T_SAL"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleSubfolderChange(subfolder.id, "table", e.target.value)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`subfolders.${index}.email_field`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Field</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="EMail"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleSubfolderChange(subfolder.id, "email_field", e.target.value)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`subfolders.${index}.license_field`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>License Field</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="MatriculeSalarie"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleSubfolderChange(subfolder.id, "license_field", e.target.value)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </CardContent>
              <CardFooter className="pt-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Configuration"
                    )}
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>

        {submitSuccess && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="bg-teal-50 border-teal-200">
              <AlertDescription className="text-teal-800">
                Database connection configuration saved successfully!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {submitError && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </form>
    </Form>
  )
}
