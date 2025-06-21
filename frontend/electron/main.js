const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const axios = require("axios")
const isDev = process.env.NODE_ENV === "development"

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "icons", "icon.png"),
    backgroundColor: "#ffffff",
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000")
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"))
  }

  // Handle API requests from renderer
  ipcMain.handle("scan-folder", async (event, folderPath) => {
    try {
      const fs = require("fs").promises
      const entries = await fs.readdir(folderPath, { withFileTypes: true })
      const subfolders = entries.filter((entry) => entry.isDirectory()).map((dir) => dir.name)
      return subfolders
    } catch (error) {
      console.error("Error scanning folder:", error)
      throw error
    }
  })

  ipcMain.handle("save-config", async (event, config) => {
    try {
      const response = await axios.post("http://localhost:8000/config/add", config)
      return response.data
    } catch (error) {
      console.error("Error saving config:", error)
      throw error
    }
  })

  ipcMain.handle("run-automation", async () => {
    try {
      const response = await axios.post("http://localhost:8000/authomation/test")
      return response.data
    } catch (error) {
      console.error("Error running automation:", error)
      throw error
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
