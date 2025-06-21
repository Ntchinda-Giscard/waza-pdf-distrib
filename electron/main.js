const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const sleep = promisify(setTimeout)

const isDev = process.env.NODE_ENV === 'development'
const DEV_FRONTEND_PORT = 3000
const DEV_BACKEND_PORT = 8000
const PRODUCTION_FRONTEND_PORT = 3001
const PRODUCTION_BACKEND_PORT = 8001

/**
 * Gets the correct resource path based on whether we're in development or production
 * In development: uses relative paths from the electron folder
 * In production: uses paths relative to the bundled app's resources
 */
function getResourcePath(relativePath) {
  if (isDev) {
    // In development, use paths relative to the electron folder
    return path.join(__dirname, relativePath)
  } else {
    // In production, use app.getPath('exe') to get the app location
    // and navigate to the resources folder
    const appPath = path.dirname(app.getPath('exe'))
    return path.join(appPath, 'resources', relativePath)
  }
}

/**
 * Validates that a required resource exists before trying to use it
 * This helps us provide better error messages when files are missing
 */
function validateResourceExists(resourcePath, resourceName) {
  if (!fs.existsSync(resourcePath)) {
    const error = `Required resource not found: ${resourceName} at ${resourcePath}`
    console.error(error)
    throw new Error(error)
  }
  console.log(`✓ Found ${resourceName} at: ${resourcePath}`)
}

class NextJsServerManager {
  constructor() {
    this.server = null
    this.isReady = false
  }

  async startServer() {
    if (isDev) {
      console.log('Development mode: assuming Next.js dev server is running on port', DEV_FRONTEND_PORT)
      this.isReady = true
      return Promise.resolve()
    }

    console.log('Production mode: starting Next.js standalone server')
    
    return new Promise((resolve, reject) => {
      // Use the resource path helper to find the frontend server
      const serverPath = getResourcePath('frontend/server.js')
      const workingDirectory = getResourcePath('frontend')
      
      // Validate that our frontend resources exist
      try {
        validateResourceExists(serverPath, 'Next.js server script')
        validateResourceExists(workingDirectory, 'Frontend working directory')
      } catch (error) {
        reject(error)
        return
      }
      
      console.log(`Starting Next.js server from: ${serverPath}`)
      console.log(`Working directory: ${workingDirectory}`)
      
      this.server = spawn('node', [serverPath], {
        env: {
          ...process.env,
          PORT: PRODUCTION_FRONTEND_PORT,
          NODE_ENV: 'production',
          NEXT_DIST_DIR: '.next'
        },
        cwd: workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.server.stdout.on('data', (data) => {
        const output = data.toString()
        console.log('Next.js server:', output)
        
        if (output.includes('ready') || output.includes('started server')) {
          this.isReady = true
          resolve()
        }
      })

      this.server.stderr.on('data', (data) => {
        console.error('Next.js server error:', data.toString())
      })

      this.server.on('error', (error) => {
        console.error('Next.js server spawn error:', error)
        reject(error)
      })
      
      // Increased timeout for production startup
      setTimeout(() => {
        if (!this.isReady) {
          console.log('Next.js server timeout reached, assuming ready')
          this.isReady = true
          resolve()
        }
      }, 10000)
    })
  }

  shutdown() {
    if (this.server && !isDev) {
      console.log('Shutting down Next.js server')
      this.server.kill('SIGTERM')
      this.server = null
      this.isReady = false
    }
  }
}

class FastAPIServerManager {
  constructor() {
    this.server = null
    this.isReady = false
  }

  async startServer() {
    if (isDev) {
      console.log('Development mode: assuming FastAPI dev server is running on port', DEV_BACKEND_PORT)
      this.isReady = true
      return Promise.resolve()
    }

    console.log('Production mode: starting FastAPI server')
    
    return new Promise((resolve, reject) => {
      // Use the resource path helper to find the backend executable
      const backendExecutable = getResourcePath('backend/main.exe')
      
      // Validate that our backend executable exists
      try {
        validateResourceExists(backendExecutable, 'FastAPI backend executable')
      } catch (error) {
        reject(error)
        return
      }
      
      console.log(`Starting FastAPI server from: ${backendExecutable}`)
      
      this.server = spawn(backendExecutable, [], {
        env: {
          ...process.env,
          PORT: PRODUCTION_BACKEND_PORT,
          HOST: '127.0.0.1'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.server.stdout.on('data', (data) => {
        const output = data.toString()
        console.log('FastAPI server:', output)
        
        if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
          this.isReady = true
          resolve()
        }
      })

      this.server.stderr.on('data', (data) => {
        const error = data.toString()
        console.error('FastAPI server error:', error)
      })

      this.server.on('error', (error) => {
        console.error('Failed to start FastAPI server:', error)
        reject(error)
      })

      this.server.on('close', (code) => {
        console.log(`FastAPI server exited with code ${code}`)
        this.isReady = false
      })

      setTimeout(() => {
        if (!this.isReady) {
          console.log('FastAPI server timeout reached, assuming ready')
          this.isReady = true
          resolve()
        }
      }, 12000)
    })
  }

  async waitForServer() {
    if (isDev) {
      return true
    }

    console.log('Verifying FastAPI server is responding...')
    
    const maxAttempts = 30
    const targetPort = PRODUCTION_BACKEND_PORT

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const http = require('http')
        
        await new Promise((resolve, reject) => {
          const request = http.get(`http://localhost:${targetPort}/health`, (response) => {
            resolve()
          }).on('error', () => {
            const rootRequest = http.get(`http://localhost:${targetPort}/`, (response) => {
              resolve()
            }).on('error', reject)
            
            rootRequest.setTimeout(3000)
          })
          
          request.setTimeout(3000)
        })

        console.log(`FastAPI server is responding after ${attempt} attempts`)
        return true
      } catch (error) {
        console.log(`Attempt ${attempt}: FastAPI server not ready, waiting...`)
        await sleep(1000)
      }
    }

    throw new Error('FastAPI server failed to start within expected time')
  }

  shutdown() {
    if (this.server && !isDev) {
      console.log('Shutting down FastAPI server')
      this.server.kill('SIGTERM')
      this.server = null
      this.isReady = false
    }
  }
}

const frontendManager = new NextJsServerManager()
const backendManager = new FastAPIServerManager()

async function createWindow() {
  console.log(`Starting application in ${isDev ? 'development' : 'production'} mode...`)
  console.log(`App path: ${app.getAppPath()}`)
  console.log(`Exe path: ${app.getPath('exe')}`)

  try {
    console.log('Starting backend server...')
    await backendManager.startServer()
    await backendManager.waitForServer()
    console.log('✓ Backend server is ready!')

    console.log('Starting frontend server...')
    await frontendManager.startServer()
    console.log('✓ Frontend server is ready!')

    console.log('✓ All servers started successfully!')
  } catch (error) {
    console.error('❌ Failed to start servers:', error)
    
    // Show an error dialog to help with debugging
    const { dialog } = require('electron')
    dialog.showErrorBox('Startup Error', 
      `Failed to start application servers:\n\n${error.message}\n\nCheck the console for more details.`)
    
    app.quit()
    return
  }

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev
    },
    show: false
  })

  // Add better error handling for the window loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load application:', errorCode, errorDescription)
  })

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('✓ Application loaded successfully')
    mainWindow.show()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  const appURL = isDev ? 
    `http://localhost:${DEV_FRONTEND_PORT}` : 
    `http://localhost:${PRODUCTION_FRONTEND_PORT}`
  
  console.log('Loading application from:', appURL)
  
  try {
    await mainWindow.loadURL(appURL)
  } catch (error) {
    console.error('Failed to load URL:', error)
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  frontendManager.shutdown()
  backendManager.shutdown()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  frontendManager.shutdown()
  backendManager.shutdown()
})