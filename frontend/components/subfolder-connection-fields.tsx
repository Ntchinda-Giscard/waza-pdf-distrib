"use client"

import type { UseFormReturn } from "react-hook-form"
import type { FormValues } from "@/components/database-connection-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface SubfolderConnectionFieldsProps {
  subfolders: string[]
  form: UseFormReturn<FormValues>
}

export function SubfolderConnectionFields({ subfolders, form }: SubfolderConnectionFieldsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Subfolder Database Connections</h3>
      <p className="text-sm text-muted-foreground mb-4">Configure database connections for each subfolder</p>

      {subfolders.map((folder, index) => (
        <Card key={folder} className="border border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Folder: {folder}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name={`subfolderConnections.${index}.folderName`}
              defaultValue={folder}
              render={({ field }) => <Input type="hidden" {...field} />}
            />

            <FormField
              control={form.control}
              name={`subfolderConnections.${index}.databaseName`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter database name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`subfolderConnections.${index}.connectionString`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection String</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter connection string" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
