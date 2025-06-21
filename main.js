const { app, BrowserWindow } = require("electron");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// More robust development mode detection
const isDev = process.env.NODE_ENV === "development" || 
              process.env.ELECTRON_IS_DEV === "1" ||
              !app.isPackaged;

let backendProcess;
let frontendProcess;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "icons", "icon.png"),
    backgroundColor: "#ffffff",
  });

  mainWindow.loadURL("http://localhost:3000");

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

function startBackend() {
  // Determine the correct path to the backend executable
  const exePath = isDev
    ? path.join(__dirname, "../backend/dist/main.exe")
    : path.join(process.resourcesPath, "backend", "dist", "main.exe");

  console.log(`Attempting to start backend at: ${exePath}`);

  // Check if the executable exists before trying to run it
  if (!fs.existsSync(exePath)) {
    console.error(`Backend executable not found at: ${exePath}`);
    return;
  }

  // For Windows executables, we don't need shell: true
  // This approach is more reliable for .exe files
  backendProcess = spawn(exePath, [], {
    cwd: path.dirname(exePath),
    stdio: ['pipe', 'pipe', 'pipe'], // Explicitly define stdio
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data.toString()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend ERR] ${data.toString()}`);
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend process:", err);
    console.error("Make sure your backend executable is properly built and accessible");
  });

  backendProcess.on("exit", (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
  });
}

function startFrontend() {
  if (isDev) {
    // Development mode: run Next.js dev server
    console.log("Starting frontend in development mode...");
    
    const frontendPath = path.join(__dirname, "../frontend");
    console.log(`Frontend path: ${frontendPath}`);

    // Check if frontend directory exists
    if (!fs.existsSync(frontendPath)) {
      console.error(`Frontend directory not found at: ${frontendPath}`);
      return;
    }

    // Use exec instead of spawn for npm commands on Windows
    // This handles the npm.cmd vs npm distinction automatically
    frontendProcess = exec("npm run dev", {
      cwd: frontendPath,
    });

  } else {
    // Production mode: run the built Next.js application
    console.log("Starting frontend in production mode...");
    
    const serverJs = path.join(process.resourcesPath, "frontend", "server.js");
    console.log(`Server.js path: ${serverJs}`);

    // Check if server.js exists
    if (!fs.existsSync(serverJs)) {
      console.error(`Server.js not found at: ${serverJs}`);
      return;
    }

    frontendProcess = spawn("node", [serverJs], {
      cwd: path.dirname(serverJs),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  frontendProcess.stdout.on("data", (data) => {
    console.log(`[Frontend] ${data.toString()}`);
  });

  frontendProcess.stderr.on("data", (data) => {
    console.error(`[Frontend ERR] ${data.toString()}`);
  });

  frontendProcess.on("error", (err) => {
    console.error("Failed to start frontend process:", err);
  });

  frontendProcess.on("exit", (code, signal) => {
    console.log(`Frontend process exited with code ${code} and signal ${signal}`);
  });
}

// Function to wait for the frontend server to be ready
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    function checkServer() {
      const http = require('http');
      const urlParts = new URL(url);
      
      const req = http.request({
        hostname: urlParts.hostname,
        port: urlParts.port,
        path: '/',
        method: 'GET',
        timeout: 1000
      }, (res) => {
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startTime < timeout) {
          setTimeout(checkServer, 1000);
        } else {
          reject(new Error('Server startup timeout'));
        }
      });

      req.end();
    }
    
    checkServer();
  });
}

app.whenReady().then(async () => {
  console.log("Electron app is ready, starting processes...");
  
  // Start backend first
  startBackend();
  
  // Start frontend
  startFrontend();

  // Wait for the frontend server to be ready before opening the window
  try {
    console.log("Waiting for frontend server to be ready...");
    await waitForServer("http://localhost:3000");
    console.log("Frontend server is ready, creating window...");
    createWindow();
  } catch (error) {
    console.error("Frontend server failed to start:", error);
    // Create window anyway, but user will see connection error
    createWindow();
  }
});

app.on("window-all-closed", () => {
  console.log("All windows closed, cleaning up processes...");
  
  if (backendProcess) {
    console.log("Killing backend process...");
    backendProcess.kill('SIGTERM');
  }
  
  if (frontendProcess) {
    console.log("Killing frontend process...");
    frontendProcess.kill('SIGTERM');
  }
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});