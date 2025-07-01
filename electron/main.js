// const { app, BrowserWindow, dialog } = require("electron");
// const { spawn, exec } = require("child_process");
// const path = require("path");
// const fs = require("fs");
// const http = require("http");

// // Enhanced development mode detection
// const isDev = process.env.NODE_ENV === "development" || 
//               process.env.ELECTRON_IS_DEV === "1" ||
//               !app.isPackaged;

// // Port configuration - using different ports for dev vs production
// const FRONTEND_PORT = isDev ? 3000 : 3001;
// const BACKEND_PORT = isDev ? 8000 : 8001;

// let backendProcess;
// let frontendProcess;
// let mainWindow;

// // Enhanced logging system
// const logFile = path.join(
//   isDev ? __dirname : path.dirname(app.getPath('exe')), 
//   'debug.log'
// );

// function log(level, message, data = null) {
//   const timestamp = new Date().toISOString();
//   const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
//   console.log(logMessage);
  
//   try {
//     let fullMessage = logMessage;
//     if (data) {
//       fullMessage += `\nData: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`;
//     }
//     fullMessage += '\n';
    
//     fs.appendFileSync(logFile, fullMessage);
//   } catch (error) {
//     console.error('Failed to write to log file:', error);
//   }
// }

// function createWindow() {
//   log('info', 'Creating main window');
  
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       devTools: true // Always enable devTools for debugging
//     },
//     icon: path.join(__dirname, "icons", "icon.png"),
//     backgroundColor: "#ffffff",
//     show: false // Don't show until ready
//   });

//   // Enhanced error handling for window loading
//   mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
//     log('error', 'Window failed to load', {
//       errorCode,
//       errorDescription,
//       validatedURL,
//       isDev,
//       frontendPort: FRONTEND_PORT
//     });
    
//     // Show error dialog with useful information
//     dialog.showErrorBox(
//       'Loading Error', 
//       `Failed to load application:\n\nError: ${errorDescription}\nURL: ${validatedURL}\n\nCheck ${logFile} for more details.`
//     );
//   });

//   mainWindow.webContents.once('did-finish-load', () => {
//     log('info', 'Window loaded successfully');
//     mainWindow.show();
    
//     // Always open dev tools in production for debugging
//     if (!isDev) {
//       mainWindow.webContents.openDevTools();
//     }
//   });

//   // Add console message logging from the renderer process
//   mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
//     log('renderer', `Console [${level}]: ${message} (${sourceId}:${line})`);
//   });

//   const appURL = `http://localhost:${FRONTEND_PORT}`;
//   log('info', `Loading application from: ${appURL}`);
  
//   mainWindow.loadURL(appURL);
// }

// function getResourcePath(relativePath) {
//   if (isDev) {
//     // In development, use paths relative to the electron folder
//     return path.join(__dirname, relativePath);
//   } else {
//     // In production, resources are in the app's resources directory
//     // This is where electron-builder puts your extraResources
//     return path.join(process.resourcesPath, relativePath);
//   }
// }

// function startBackend() {
//   return new Promise((resolve, reject) => {
//     log('info', 'Starting backend server');
    
//     if (isDev) {
//       log('info', 'Development mode: assuming backend is running separately');
//       resolve();
//       return;
//     }

//     // Determine the correct path to the backend executable
//     const exePath = getResourcePath(path.join("backend", "main.exe"));
//     log('info', `Backend executable path: ${exePath}`);

//     // Check if the executable exists
//     if (!fs.existsSync(exePath)) {
//       const error = `Backend executable not found at: ${exePath}`;
//       log('error', error);
//       reject(new Error(error));
//       return;
//     }

//     log('info', 'Starting backend process');
//     backendProcess = spawn(exePath, [], {
//       cwd: path.dirname(exePath),
//       stdio: ['pipe', 'pipe', 'pipe'],
//       env: {
//         ...process.env,
//         PORT: BACKEND_PORT.toString()
//       }
//     });

//     backendProcess.stdout.on("data", (data) => {
//       log('backend', data.toString().trim());
//     });

//     backendProcess.stderr.on("data", (data) => {
//       log('backend-err', data.toString().trim());
//     });

//     backendProcess.on("error", (err) => {
//       log('error', 'Backend process error', err);
//       reject(err);
//     });

//     backendProcess.on("exit", (code, signal) => {
//       log('warn', `Backend process exited with code ${code}, signal: ${signal}`);
//     });

//     // Give the backend time to start
//     setTimeout(() => {
//       log('info', 'Backend startup timeout reached, assuming ready');
//       resolve();
//     }, 5000);
//   });
// }

// function startFrontend() {
//   return new Promise((resolve, reject) => {
//     log('info', 'Starting frontend server');
    
//     if (isDev) {
//       log('info', 'Development mode: assuming frontend dev server is running');
//       resolve();
//       return;
//     }

//     // In production, we need to start the Next.js standalone server
//     const serverJsPath = getResourcePath(path.join("frontend", "server.js"));
//     log('info', `Frontend server.js path: ${serverJsPath}`);

//     // Check if server.js exists
//     if (!fs.existsSync(serverJsPath)) {
//       const error = `Frontend server.js not found at: ${serverJsPath}`;
//       log('error', error);
//       reject(new Error(error));
//       return;
//     }

//     log('info', 'Starting frontend process');
//     frontendProcess = spawn("node", [serverJsPath], {
//       cwd: path.dirname(serverJsPath),
//       stdio: ['pipe', 'pipe', 'pipe'],
//       env: {
//         ...process.env,
//         PORT: FRONTEND_PORT.toString(),
//         NODE_ENV: 'production'
//       }
//     });

//     frontendProcess.stdout.on("data", (data) => {
//       const output = data.toString().trim();
//       log('frontend', output);
      
//       // Look for Next.js ready indicators
//       if (output.includes('ready') || output.includes('started server') || output.includes('listening')) {
//         log('info', 'Frontend server appears to be ready');
//         resolve();
//       }
//     });

//     frontendProcess.stderr.on("data", (data) => {
//       log('frontend-err', data.toString().trim());
//     });

//     frontendProcess.on("error", (err) => {
//       log('error', 'Frontend process error', err);
//       reject(err);
//     });

//     frontendProcess.on("exit", (code, signal) => {
//       log('warn', `Frontend process exited with code ${code}, signal: ${signal}`);
//     });

//     // Timeout for frontend startup
//     setTimeout(() => {
//       log('info', 'Frontend startup timeout reached, proceeding anyway');
//       resolve();
//     }, 10000);
//   });
// }

// // Enhanced server health check
// function waitForServer(url, maxAttempts = 30) {
//   return new Promise((resolve, reject) => {
//     let attempts = 0;
    
//     function checkServer() {
//       attempts++;
//       log('debug', `Health check attempt ${attempts} for ${url}`);
      
//       const urlParts = new URL(url);
//       const req = http.request({
//         hostname: urlParts.hostname,
//         port: urlParts.port,
//         path: '/',
//         method: 'GET',
//         timeout: 2000
//       }, (res) => {
//         log('info', `Server health check successful for ${url} (status: ${res.statusCode})`);
//         resolve();
//       });

//       req.on('error', (err) => {
//         log('debug', `Health check failed for ${url}: ${err.message}`);
        
//         if (attempts < maxAttempts) {
//           setTimeout(checkServer, 1000);
//         } else {
//           log('error', `Server health check failed after ${maxAttempts} attempts`);
//           reject(new Error(`Server not responding after ${maxAttempts} attempts`));
//         }
//       });

//       req.on('timeout', () => {
//         log('debug', `Health check timeout for ${url}`);
//         req.destroy();
//       });

//       req.end();
//     }
    
//     checkServer();
//   });
// }

// // Main application startup sequence
// app.whenReady().then(async () => {
//   log('info', 'Electron app ready, starting initialization', {
//     isDev,
//     frontendPort: FRONTEND_PORT,
//     backendPort: BACKEND_PORT,
//     resourcesPath: process.resourcesPath,
//     appPath: app.getAppPath()
//   });
  
//   try {
//     // Start servers in sequence
//     log('info', 'Step 1: Starting backend server');
//     await startBackend();
    
//     log('info', 'Step 2: Starting frontend server');
//     await startFrontend();
    
//     // Wait for servers to be ready
//     log('info', 'Step 3: Waiting for servers to be ready');
    
//     if (isDev) {
//       // In development, check both servers
//       await Promise.all([
//         waitForServer(`http://localhost:${FRONTEND_PORT}`),
//         waitForServer(`http://localhost:${BACKEND_PORT}/docs`).catch(() => {
//           log('warn', 'Backend health check failed, but continuing...');
//         })
//       ]);
//     } else {
//       // In production, primarily check frontend
//       await waitForServer(`http://localhost:${FRONTEND_PORT}`);
//     }
    
//     log('info', 'Step 4: Creating main window');
//     createWindow();
    
//   } catch (error) {
//     log('error', 'Application startup failed', error);
    
//     // Show detailed error dialog
//     dialog.showErrorBox(
//       'Startup Failed',
//       `Application failed to start:\n\n${error.message}\n\nPlease check ${logFile} for detailed logs.`
//     );
    
//     // Don't quit immediately - let user see the error
//     setTimeout(() => {
//       app.quit();
//     }, 5000);
//   }
// });

// app.on("window-all-closed", () => {
//   log('info', 'All windows closed, cleaning up');
  
//   if (backendProcess) {
//     log('info', 'Terminating backend process');
//     backendProcess.kill('SIGTERM');
//   }
  
//   if (frontendProcess) {
//     log('info', 'Terminating frontend process');
//     frontendProcess.kill('SIGTERM');
//   }
  
//   if (process.platform !== "darwin") {
//     app.quit();
//   }
// });

// app.on("activate", () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// // Handle app shutdown gracefully
// app.on('before-quit', () => {
//   log('info', 'Application shutting down');
  
//   if (backendProcess) {
//     backendProcess.kill('SIGTERM');
//   }
  
//   if (frontendProcess) {
//     frontendProcess.kill('SIGTERM');
//   }
// });


const { app, BrowserWindow, dialog } = require("electron");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");
const net = require("net");
const os = require("os");

// Enhanced development mode detection
const isDev = process.env.NODE_ENV === "development" || 
              process.env.ELECTRON_IS_DEV === "1" ||
              !app.isPackaged;

// Port configuration - using different ports for dev vs production
const FRONTEND_PORT = isDev ? 3000 : 3002;
const BACKEND_PORT = isDev ? 8000 : 8001;

let backendProcess;
let frontendProcess;
let mainWindow;
let isShuttingDown = false;

// Process tracking for cleanup
const trackedProcesses = new Set();

// Enhanced logging system
const logFile = path.join(
  isDev ? __dirname : path.dirname(app.getPath('exe')), 
  'debug.log'
);

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  try {
    let fullMessage = logMessage;
    if (data) {
      fullMessage += `\nData: ${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`;
    }
    fullMessage += '\n';
    
    fs.appendFileSync(logFile, fullMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Kill processes on specific ports
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Use netstat and taskkill
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          log('debug', `No process found on port ${port}`);
          resolve();
          return;
        }
        
        const lines = stdout.split('\n');
        const pids = new Set();
        
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            pids.add(match[1]);
          }
        });
        
        if (pids.size === 0) {
          log('debug', `No PIDs found for port ${port}`);
          resolve();
          return;
        }
        
        log('info', `Killing processes on port ${port}: ${Array.from(pids).join(', ')}`);
        
        let killCount = 0;
        pids.forEach(pid => {
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            killCount++;
            if (killError) {
              log('warn', `Failed to kill process ${pid}: ${killError.message}`);
            } else {
              log('info', `Successfully killed process ${pid}`);
            }
            
            if (killCount === pids.size) {
              resolve();
            }
          });
        });
      });
    } else {
      // Unix/Linux/Mac: Use lsof and kill
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (error || !stdout) {
          log('debug', `No process found on port ${port}`);
          resolve();
          return;
        }
        
        const pids = stdout.trim().split('\n').filter(pid => pid);
        if (pids.length === 0) {
          resolve();
          return;
        }
        
        log('info', `Killing processes on port ${port}: ${pids.join(', ')}`);
        
        exec(`kill -9 ${pids.join(' ')}`, (killError) => {
          if (killError) {
            log('warn', `Failed to kill processes: ${killError.message}`);
          } else {
            log('info', `Successfully killed processes on port ${port}`);
          }
          resolve();
        });
      });
    }
  });
}

// Enhanced process cleanup
async function cleanupProcesses() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log('info', 'Starting process cleanup');
  
  const cleanupPromises = [];
  
  // Kill our spawned processes first
  if (backendProcess && !backendProcess.killed) {
    log('info', 'Terminating backend process');
    cleanupPromises.push(new Promise((resolve) => {
      backendProcess.on('exit', resolve);
      backendProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!backendProcess.killed) {
          log('warn', 'Force killing backend process');
          backendProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    }));
  }
  
  if (frontendProcess && !frontendProcess.killed) {
    log('info', 'Terminating frontend process');
    cleanupPromises.push(new Promise((resolve) => {
      frontendProcess.on('exit', resolve);
      frontendProcess.kill('SIGTERM');
      
      // Force kill after 5 seconds
      setTimeout(() => {
        if (!frontendProcess.killed) {
          log('warn', 'Force killing frontend process');
          frontendProcess.kill('SIGKILL');
        }
        resolve();
      }, 5000);
    }));
  }
  
  // Kill any processes on our ports
  cleanupPromises.push(killProcessOnPort(FRONTEND_PORT));
  cleanupPromises.push(killProcessOnPort(BACKEND_PORT));
  
  // Kill any tracked processes
  trackedProcesses.forEach(pid => {
    try {
      process.kill(pid, 'SIGTERM');
      log('info', `Killed tracked process ${pid}`);
    } catch (error) {
      log('warn', `Failed to kill tracked process ${pid}: ${error.message}`);
    }
  });
  
  await Promise.all(cleanupPromises);
  log('info', 'Process cleanup completed');
}

// Check if Node.js is installed and get version
function checkNodeJs() {
  return new Promise((resolve) => {
    exec('node --version', (error, stdout) => {
      if (error) {
        log('warn', 'Node.js not found in PATH');
        resolve({ installed: false, version: null });
      } else {
        const version = stdout.trim();
        log('info', `Node.js found: ${version}`);
        resolve({ installed: true, version });
      }
    });
  });
}

// Download and install Node.js
async function installNodeJs() {
  return new Promise((resolve, reject) => {
    const platform = os.platform();
    const arch = os.arch();
    
    log('info', `Installing Node.js for ${platform} ${arch}`);
    
    let downloadUrl;
    let filename;
    
    // Determine download URL based on platform
    const nodeVersion = 'v20.11.0'; // LTS version
    
    switch (platform) {
      case 'win32':
        if (arch === 'x64') {
          downloadUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-x64.msi`;
          filename = `node-${nodeVersion}-x64.msi`;
        } else {
          downloadUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-x86.msi`;
          filename = `node-${nodeVersion}-x86.msi`;
        }
        break;
      case 'darwin':
        downloadUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}.pkg`;
        filename = `node-${nodeVersion}.pkg`;
        break;
      case 'linux':
        downloadUrl = `https://nodejs.org/dist/${nodeVersion}/node-${nodeVersion}-linux-x64.tar.xz`;
        filename = `node-${nodeVersion}-linux-x64.tar.xz`;
        break;
      default:
        reject(new Error(`Unsupported platform: ${platform}`));
        return;
    }
    
    const tempDir = os.tmpdir();
    const installerPath = path.join(tempDir, filename);
    
    log('info', `Downloading Node.js from: ${downloadUrl}`);
    
    // Download the installer
    const https = require('https');
    const file = fs.createWriteStream(installerPath);
    
    https.get(downloadUrl, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        log('info', `Node.js installer downloaded to: ${installerPath}`);
        
        // Install Node.js
        let installCommand;
        
        switch (platform) {
          case 'win32':
            installCommand = `msiexec /i "${installerPath}" /quiet /norestart`;
            break;
          case 'darwin':
            installCommand = `sudo installer -pkg "${installerPath}" -target /`;
            break;
          case 'linux':
            // For Linux, we'll extract to a local directory
            const extractPath = path.join(app.getPath('userData'), 'nodejs');
            installCommand = `mkdir -p "${extractPath}" && tar -xf "${installerPath}" -C "${extractPath}" --strip-components=1`;
            break;
        }
        
        log('info', `Running install command: ${installCommand}`);
        
        exec(installCommand, (error, stdout, stderr) => {
          if (error) {
            log('error', 'Node.js installation failed', error);
            reject(error);
          } else {
            log('info', 'Node.js installation completed successfully');
            
            // Clean up installer
            try {
              fs.unlinkSync(installerPath);
            } catch (cleanupError) {
              log('warn', 'Failed to clean up installer', cleanupError);
            }
            
            resolve();
          }
        });
      });
    }).on('error', (error) => {
      log('error', 'Failed to download Node.js installer', error);
      reject(error);
    });
  });
}

// Enhanced Node.js check with installation prompt
async function ensureNodeJs() {
  const nodeCheck = await checkNodeJs();
  
  if (!nodeCheck.installed) {
    const response = await dialog.showMessageBox(null, {
      type: 'question',
      buttons: ['Install Node.js', 'Continue without Node.js', 'Exit'],
      defaultId: 0,
      title: 'Node.js Required',
      message: 'Node.js is required to run this application.',
      detail: 'Would you like to install Node.js automatically? This may require administrator privileges.'
    });
    
    switch (response.response) {
      case 0: // Install Node.js
        try {
          await installNodeJs();
          
          // Verify installation
          const recheckNode = await checkNodeJs();
          if (!recheckNode.installed) {
            throw new Error('Node.js installation verification failed');
          }
          
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'Installation Complete',
            message: 'Node.js has been installed successfully!',
            detail: 'The application will now continue starting.'
          });
          
        } catch (error) {
          log('error', 'Node.js installation failed', error);
          
          const retryResponse = await dialog.showMessageBox(null, {
            type: 'error',
            buttons: ['Retry', 'Continue Anyway', 'Exit'],
            defaultId: 1,
            title: 'Installation Failed',
            message: 'Failed to install Node.js automatically.',
            detail: `Error: ${error.message}\n\nYou can try installing Node.js manually from nodejs.org or continue without it (frontend may not work).`
          });
          
          if (retryResponse.response === 0) {
            return ensureNodeJs(); // Retry
          } else if (retryResponse.response === 2) {
            app.quit();
            return false;
          }
        }
        break;
        
      case 1: // Continue without Node.js
        log('warn', 'Continuing without Node.js - frontend may not work');
        break;
        
      case 2: // Exit
        app.quit();
        return false;
    }
  }
  
  return true;
}

function createWindow() {
  log('info', 'Creating main window');
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    },
    icon: path.join(__dirname, "icons", "icon.png"),
    backgroundColor: "#ffffff",
    show: false
  });

  // Enhanced error handling for window loading
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log('error', 'Window failed to load', {
      errorCode,
      errorDescription,
      validatedURL,
      isDev,
      frontendPort: FRONTEND_PORT
    });
    
    dialog.showErrorBox(
      'Loading Error', 
      `Failed to load application:\n\nError: ${errorDescription}\nURL: ${validatedURL}\n\nCheck ${logFile} for more details.`
    );
  });

  mainWindow.webContents.once('did-finish-load', () => {
    log('info', 'Window loaded successfully');
    mainWindow.show();
    
    if (!isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    log('renderer', `Console [${level}]: ${message} (${sourceId}:${line})`);
  });

  // Handle window close
  mainWindow.on('close', async (event) => {
    if (!isShuttingDown) {
      log('info', 'Window close requested, starting cleanup');
      event.preventDefault();
      
      try {
        await cleanupProcesses();
        mainWindow.destroy();
      } catch (error) {
        log('error', 'Error during cleanup', error);
        mainWindow.destroy();
      }
    }
  });

  const appURL = `http://127.0.0.1:${FRONTEND_PORT}`;
  log('info', `Loading application from: ${appURL}`);
  
  mainWindow.loadURL(appURL);
}

function getResourcePath(relativePath) {
  if (isDev) {
    return path.join(__dirname, relativePath);
  } else {
    return path.join(process.resourcesPath, relativePath);
  }
}

function startBackend() {
  return new Promise((resolve, reject) => {
    log('info', 'Starting backend server');
    
    if (isDev) {
      log('info', 'Development mode: assuming backend is running separately');
      resolve();
      return;
    }

    const exePath = getResourcePath(path.join("backend", "main.exe"));
    log('info', `Backend executable path: ${exePath}`);

    if (!fs.existsSync(exePath)) {
      const error = `Backend executable not found at: ${exePath}`;
      log('error', error);
      reject(new Error(error));
      return;
    }

    log('info', 'Starting backend process');
    backendProcess = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: BACKEND_PORT.toString(),
        HOST: '127.0.0.1'
      }
    });

    // Track the process
    trackedProcesses.add(backendProcess.pid);

    backendProcess.stdout.on("data", (data) => {
      log('backend', data.toString().trim());
    });

    backendProcess.stderr.on("data", (data) => {
      log('backend-err', data.toString().trim());
    });

    backendProcess.on("error", (err) => {
      log('error', 'Backend process error', err);
      reject(err);
    });

    backendProcess.on("exit", (code, signal) => {
      log('warn', `Backend process exited with code ${code}, signal: ${signal}`);
      trackedProcesses.delete(backendProcess.pid);
    });

    setTimeout(() => {
      log('info', 'Backend startup timeout reached, assuming ready');
      resolve();
    }, 5000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('info', 'Starting frontend server');
    
    if (isDev) {
      log('info', 'Development mode: assuming frontend dev server is running');
      resolve();
      return;
    }

    const serverJsPath = getResourcePath(path.join("frontend", "server.js"));
    log('info', `Frontend server.js path: ${serverJsPath}`);

    if (!fs.existsSync(serverJsPath)) {
      const error = `Frontend server.js not found at: ${serverJsPath}`;
      log('error', error);
      reject(new Error(error));
      return;
    }

    log('info', 'Starting frontend process');
    
    let resolved = false;
    
    frontendProcess = spawn("node", [serverJsPath], {
      cwd: path.dirname(serverJsPath),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: FRONTEND_PORT.toString(),
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1'
      }
    });

    // Track the process
    trackedProcesses.add(frontendProcess.pid);

    frontendProcess.stdout.on("data", (data) => {
      const output = data.toString().trim();
      log('frontend', output);
      
      if (!resolved && (
        output.includes('Ready in') || 
        output.includes('started server') || 
        output.includes('listening on') ||
        output.includes('Local:') ||
        (output.includes('✓') && output.includes('Ready'))
      )) {
        log('info', 'Frontend server detected as ready from output');
        resolved = true;
        setTimeout(() => resolve(), 1000);
      }
    });

    frontendProcess.stderr.on("data", (data) => {
      const output = data.toString().trim();
      log('frontend-err', output);
      
      if (!resolved && (
        output.includes('Ready in') || 
        output.includes('started server') ||
        output.includes('listening on')
      )) {
        log('info', 'Frontend server detected as ready from stderr');
        resolved = true;
        setTimeout(() => resolve(), 1000);
      }
    });

    frontendProcess.on("error", (err) => {
      log('error', 'Frontend process error', err);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });

    frontendProcess.on("exit", (code, signal) => {
      log('warn', `Frontend process exited with code ${code}, signal: ${signal}`);
      trackedProcesses.delete(frontendProcess.pid);
      if (!resolved) {
        resolved = true;
        reject(new Error(`Frontend process exited unexpectedly with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!resolved) {
        log('info', 'Frontend startup timeout reached, proceeding with connection test');
        resolved = true;
        resolve();
      }
    }, 15000);
  });
}

function waitForServer(port, maxAttempts = 60, intervalMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function checkServer() {
      attempts++;
      log('debug', `Health check attempt ${attempts} for port ${port}`);
      
      const socket = new net.Socket();
      
      const timeout = setTimeout(() => {
        socket.destroy();
        log('debug', `Health check timeout for port ${port}`);
        
        if (attempts < maxAttempts) {
          setTimeout(checkServer, intervalMs);
        } else {
          log('error', `Server health check failed after ${maxAttempts} attempts`);
          reject(new Error(`Server not responding on port ${port} after ${maxAttempts} attempts`));
        }
      }, 3000);
      
      socket.connect(port, '127.0.0.1', () => {
        clearTimeout(timeout);
        socket.destroy();
        log('info', `Server health check successful for port ${port}`);
        resolve();
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        socket.destroy();
        log('debug', `Health check failed for port ${port}: ${err.message}`);
        
        if (attempts < maxAttempts) {
          setTimeout(checkServer, intervalMs);
        } else {
          log('error', `Server health check failed after ${maxAttempts} attempts`);
          reject(new Error(`Server not responding on port ${port} after ${maxAttempts} attempts: ${err.message}`));
        }
      });
    }
    
    checkServer();
  });
}

function waitForHttpServer(port, maxAttempts = 30, intervalMs = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function checkServer() {
      attempts++;
      log('debug', `HTTP health check attempt ${attempts} for port ${port}`);
      
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        log('info', `HTTP health check successful for port ${port} (status: ${res.statusCode})`);
        resolve();
      });

      req.on('error', (err) => {
        log('debug', `HTTP health check failed for port ${port}: ${err.message}`);
        
        if (attempts < maxAttempts) {
          setTimeout(checkServer, intervalMs);
        } else {
          log('error', `HTTP server health check failed after ${maxAttempts} attempts`);
          reject(new Error(`HTTP server not responding on port ${port} after ${maxAttempts} attempts`));
        }
      });

      req.on('timeout', () => {
        log('debug', `HTTP health check timeout for port ${port}`);
        req.destroy();
      });

      req.end();
    }
    
    checkServer();
  });
}

// Main application startup sequence
app.whenReady().then(async () => {
  log('info', 'Electron app ready, starting initialization', {
    isDev,
    frontendPort: FRONTEND_PORT,
    backendPort: BACKEND_PORT,
    resourcesPath: process.resourcesPath,
    appPath: app.getAppPath()
  });
  
  try {
    // Clean up any existing processes on our ports
    log('info', 'Step 0: Cleaning up existing processes');
    await killProcessOnPort(FRONTEND_PORT);
    await killProcessOnPort(BACKEND_PORT);
    
    // Ensure Node.js is available
    log('info', 'Step 1: Checking Node.js installation');
    const nodeOk = await ensureNodeJs();
    if (!nodeOk) return;
    
    // Start servers in sequence
    log('info', 'Step 2: Starting backend server');
    await startBackend();
    
    log('info', 'Step 3: Starting frontend server');
    await startFrontend();
    
    // Wait for servers to be ready
    log('info', 'Step 4: Waiting for servers to be ready');
    
    if (isDev) {
      await Promise.all([
        waitForServer(FRONTEND_PORT, 30, 2000).catch(async () => {
          log('warn', 'Socket health check failed, trying HTTP check...');
          return waitForHttpServer(FRONTEND_PORT, 15, 2000);
        }),
        waitForServer(BACKEND_PORT, 15, 1000).catch(() => {
          log('warn', 'Backend health check failed, but continuing...');
        })
      ]);
    } else {
      try {
        await waitForServer(FRONTEND_PORT, 60, 1000);
      } catch (error) {
        log('warn', 'Socket health check failed, trying HTTP method...');
        await waitForHttpServer(FRONTEND_PORT, 30, 1000);
      }
    }
    
    log('info', 'Step 5: Creating main window');
    createWindow();
    
  } catch (error) {
    log('error', 'Application startup failed', error);
    
    dialog.showErrorBox(
      'Startup Failed',
      `Application failed to start:\n\n${error.message}\n\nPlease check ${logFile} for detailed logs.\n\nThe application will continue to try starting in the background.`
    );
    
    log('info', 'Attempting to create window despite health check failure');
    createWindow();
  }
});

// Enhanced app event handlers with better process cleanup
app.on("window-all-closed", async () => {
  log('info', 'All windows closed, cleaning up');
  await cleanupProcesses();
  
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async (event) => {
  if (!isShuttingDown) {
    log('info', 'Application shutting down');
    event.preventDefault();
    
    try {
      await cleanupProcesses();
      app.exit(0);
    } catch (error) {
      log('error', 'Error during shutdown cleanup', error);
      app.exit(1);
    }
  }
});

// Handle various exit signals
process.on('SIGINT', async () => {
  log('info', 'Received SIGINT, cleaning up...');
  await cleanupProcesses();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('info', 'Received SIGTERM, cleaning up...');
  await cleanupProcesses();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  log('error', 'Uncaught exception', error);
  await cleanupProcesses();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  log('error', 'Unhandled promise rejection', { reason, promise });
  await cleanupProcesses();
  process.exit(1);
});