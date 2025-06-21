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

// Create a log file for debugging
const logDir = isDev ? path.join(__dirname, '../logs') : path.join(path.dirname(app.getPath('exe')), 'logs')
const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

/**
 * Enhanced logging function that writes to both console and file
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`
  
  console.log(logMessage)
  
  try {
    let fullMessage = logMessage
    if (data) {
      fullMessage += `\nData: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`
    }
    fullMessage += '\n'
    
    fs.appendFileSync(logFile, fullMessage)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

// Override console methods to also log to file
const originalConsoleLog = console.log
const originalConsoleError = console.error

console.log = (...args) => {
  originalConsoleLog(...args)
  log('info', args.join(' '))
}

console.error = (...args) => {
  originalConsoleError(...args)
  log('error', args.join(' '))
}

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
      log('info', 'Development mode: assuming FastAPI dev server is running on port', DEV_BACKEND_PORT)
      this.isReady = true
      return Promise.resolve()
    }

    log('info', 'Production mode: starting FastAPI server')
    
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
      
      log('info', `Starting FastAPI server from: ${backendExecutable}`)
      
      this.server = spawn(backendExecutable, [], {
        env: {
          ...process.env,
          PORT: PRODUCTION_BACKEND_PORT,
          HOST: '0.0.0.0', // Changed from 127.0.0.1 to 0.0.0.0 for better binding
          PYTHONUNBUFFERED: '1' // Ensure Python output is not buffered
        },
        stdio: ['pipe', 'pipe', 'pipe']
      })

      this.server.stdout.on('data', (data) => {
        const output = data.toString().trim()
        log('info', `FastAPI stdout: ${output}`)
        
        // Look for various FastAPI startup indicators
        if (output.includes('Uvicorn running') || 
            output.includes('Application startup complete') ||
            output.includes('Started server process') ||
            output.includes(`Waiting for application startup`) ||
            output.includes('ASGI') ||
            output.toLowerCase().includes('listening')) {
          
          log('info', 'FastAPI server startup detected from stdout')
          if (!this.isReady) {
            this.isReady = true
            resolve()
          }
        }
      })

      this.server.stderr.on('data', (data) => {
        const error = data.toString().trim()
        log('warn', `FastAPI stderr: ${error}`)
        
        // Some FastAPI servers log startup info to stderr
        if (error.includes('Uvicorn running') || 
            error.includes('Application startup complete') ||
            error.includes('Started server process')) {
          
          log('info', 'FastAPI server startup detected from stderr')
          if (!this.isReady) {
            this.isReady = true  
            resolve()
          }
        }
      })

      this.server.on('error', (error) => {
        log('error', 'Failed to start FastAPI server:', error)
        reject(error)
      })

      this.server.on('close', (code, signal) => {
        log('warn', `FastAPI server exited with code ${code}, signal: ${signal}`)
        this.isReady = false
      })

      // Increased timeout and better logging
      setTimeout(() => {
        if (!this.isReady) {
          log('warn', 'FastAPI server timeout reached, but process seems to be running. Proceeding...')
          this.isReady = true
          resolve()
        }
      }, 15000) // Increased from 12000 to 15000ms
    })
  }

  async waitForServer() {
    if (isDev) {
      return true
    }

    log('info', 'Verifying FastAPI server is responding...')
    
    const maxAttempts = 45 // Increased from 30
    const targetPort = PRODUCTION_BACKEND_PORT

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const http = require('http')
        
        await new Promise((resolve, reject) => {
          // Try multiple endpoints that might exist
          const endpoints = ['/health', '/docs', '/openapi.json', '/']
          let endpointIndex = 0
          
          const tryEndpoint = () => {
            if (endpointIndex >= endpoints.length) {
              reject(new Error('All endpoints failed'))
              return
            }
            
            const endpoint = endpoints[endpointIndex]
            const url = `http://localhost:${targetPort}${endpoint}`
            
            log('debug', `Attempt ${attempt}: Trying endpoint ${url}`)
            
            const request = http.get(url, (response) => {
              log('info', `Success! FastAPI server responded to ${endpoint} with status ${response.statusCode}`)
              resolve()
            }).on('error', (error) => {
              log('debug', `Endpoint ${endpoint} failed: ${error.message}`)
              endpointIndex++
              tryEndpoint()
            })
            
            request.setTimeout(5000) // Increased timeout per request
          }
          
          tryEndpoint()
        })

        log('info', `FastAPI server is responding after ${attempt} attempts`)
        return true
      } catch (error) {
        log('debug', `Attempt ${attempt}: FastAPI server not ready, waiting... (${error.message})`)
        await sleep(2000) // Increased from 1000ms
      }
    }

    log('error', 'FastAPI server failed to respond within expected time')
    
    // Don't throw error immediately, try to continue anyway
    log('warn', 'Continuing with app startup despite FastAPI health check failure')
    return false
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
  log('info', `Starting application in ${isDev ? 'development' : 'production'} mode...`)
  log('info', `App path: ${app.getAppPath()}`)
  log('info', `Exe path: ${app.getPath('exe')}`)
  log('info', `Log file: ${logFile}`)

  try {
    log('info', 'Starting backend server...')
    await backendManager.startServer()
    
    log('info', 'Backend server started, checking health...')
    const backendHealthy = await backendManager.waitForServer()
    
    if (backendHealthy) {
      log('info', '✓ Backend server is ready and responding!')
    } else {
      log('warn', '⚠ Backend server started but health check failed - continuing anyway')
    }

    log('info', 'Starting frontend server...')
    await frontendManager.startServer()
    log('info', '✓ Frontend server is ready!')

    log('info', '✓ All servers started successfully!')
  } catch (error) {
    log('error', '❌ Failed to start servers:', error)
    
    // Show an error dialog to help with debugging
    const { dialog } = require('electron')
    const errorMessage = `Failed to start application servers:\n\n${error.message}\n\nCheck the log file at:\n${logFile}`
    
    dialog.showErrorBox('Startup Error', errorMessage)
    
    // Don't quit immediately - let the user see the error and check logs
    // app.quit()
    // return
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
    log('error', 'Failed to load application:', { errorCode, errorDescription })
  })

  mainWindow.webContents.once('did-finish-load', () => {
    log('info', '✓ Application loaded successfully')
    mainWindow.show()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  const appURL = isDev ? 
    `http://localhost:${DEV_FRONTEND_PORT}` : 
    `http://localhost:${PRODUCTION_FRONTEND_PORT}`
  
  log('info', 'Loading application from:', appURL)
  
  try {
    await mainWindow.loadURL(appURL)
  } catch (error) {
    log('error', 'Failed to load URL:', error)
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