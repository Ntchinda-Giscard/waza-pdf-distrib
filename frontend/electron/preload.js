const { contextBridge, ipcRenderer } = require("electron")

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  scanFolder: (folderPath) => ipcRenderer.invoke("scan-folder", folderPath),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  runAutomation: () => ipcRenderer.invoke("run-automation"),
})
