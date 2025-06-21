"use server"

import fs from "fs/promises"
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Scans a folder and returns a list of subfolders
 */
export async function scanFolderStructure(folderPath: string): Promise<string[]> {
  try {
    // Check if the folder exists
    await fs.access(folderPath)

    // Read the directory contents
    const entries = await fs.readdir(folderPath, { withFileTypes: true })

    // Filter for directories only
    const subfolders = entries.filter((entry) => entry.isDirectory()).map((dir) => dir.name)

    return subfolders
  } catch (error) {
    console.error("Error scanning folder structure:", error)
    throw new Error(`Failed to scan folder: ${(error as Error).message}`)
  }
}



