const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')
const sleep = promisify(setTimeout)

const isDev = process.env.NODE_ENV === 'development'
const DEV_FRONTEND_PORT = 3000
const DEV_BACKEND_PORT = 8000
const PRODUCTION_FRONTEND_PORT = 3001
const PRODUCTION_BACKEND_PORT = 8001

// This class manages your Next.js frontend server
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
      const serverPath = path.join(__dirname, '../frontend/server.js')
      const workingDirectory = path.join(__dirname, '../frontend')
      
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

      // Set up the same logging and error handling as before
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

      this.server.on('error', reject)
      
      setTimeout(() => {
        if (!this.isReady) {
          this.isReady = true
          resolve()
        }
      }, 5000)
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

// This new class manages your FastAPI backend server
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
      // In production, we need to determine how to run your Python backend
      // This depends on how you've packaged your FastAPI application
      
      // Option 1: If you've created an executable with PyInstaller or similar
      const backendExecutable = path.join(__dirname, '../backend/dist/main.exe')
      
      // Option 2: If you're including a Python runtime and running the script directly
      // const pythonPath = path.join(__dirname, '../python/python.exe')
      // const backendScript = path.join(__dirname, '../backend/main.py')
      
      // For this example, I'll show the executable approach
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
        
        // Look for FastAPI startup messages
        if (output.includes('Uvicorn running') || output.includes('Application startup complete')) {
          this.isReady = true
          resolve()
        }
      })

      this.server.stderr.on('data', (data) => {
        const error = data.toString()
        console.error('FastAPI server error:', error)
        // FastAPI often logs startup info to stderr, so don't immediately reject
      })

      this.server.on('error', (error) => {
        console.error('Failed to start FastAPI server:', error)
        reject(error)
      })

      this.server.on('close', (code) => {
        console.log(`FastAPI server exited with code ${code}`)
        this.isReady = false
      })

      // Timeout fallback
      setTimeout(() => {
        if (!this.isReady) {
          console.log('FastAPI server timeout reached, assuming ready')
          this.isReady = true
          resolve()
        }
      }, 8000) // FastAPI might take longer to start than Next.js
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
          // Try to hit a health check endpoint or root endpoint
          const request = http.get(`http://localhost:${targetPort}/health`, (response) => {
            resolve()
          }).on('error', () => {
            // If /health doesn't exist, try root endpoint
            const rootRequest = http.get(`http://localhost:${targetPort}/`, (response) => {
              resolve()
            }).on('error', reject)
            
            rootRequest.setTimeout(2000)
          })
          
          request.setTimeout(2000)
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

// Create instances of both server managers
const frontendManager = new NextJsServerManager()
const backendManager = new FastAPIServerManager()

async function createWindow() {
  console.log(`Starting application in ${isDev ? 'development' : 'production'} mode...`)

  try {
    // Start both servers - the order matters here
    console.log('Starting backend server...')
    await backendManager.startServer()
    await backendManager.waitForServer()
    console.log('Backend server is ready!')

    console.log('Starting frontend server...')
    await frontendManager.startServer()
    console.log('Frontend server is ready!')

    console.log('All servers started successfully!')
  } catch (error) {
    console.error('Failed to start servers:', error)
    // You might want to show an error dialog to the user here
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

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('Application loaded successfully')
    mainWindow.show()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Connect to the appropriate frontend port
  const appURL = isDev ? 
    `http://localhost:${DEV_FRONTEND_PORT}` : 
    `http://localhost:${PRODUCTION_FRONTEND_PORT}`
  
  console.log('Loading application from:', appURL)
  await mainWindow.loadURL(appURL)
}

// Handle application lifecycle
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // Shut down both servers in reverse order
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