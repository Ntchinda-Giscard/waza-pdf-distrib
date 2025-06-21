// scripts/copy-assets.js
const fs = require('fs-extra')
const path = require('path')

/**
 * This script prepares all the assets needed for the Electron build process.
 * It copies your built frontend and backend files to a resources directory
 * that Electron Builder will include in the final packaged application.
 */

async function copyAssets() {
  console.log('🚀 Starting asset preparation for Electron build...')
  
  const resourcesDir = path.join(__dirname, '../resources')
  
  try {
    // Clean up any existing resources directory
    console.log('🧹 Cleaning up existing resources directory...')
    await fs.remove(resourcesDir)
    await fs.ensureDir(resourcesDir)
    
    // Step 1: Copy the built Next.js frontend
    console.log('📦 Copying Next.js frontend assets...')
    
    const frontendSource = path.join(__dirname, '../frontend')
    const frontendDest = path.join(resourcesDir, 'frontend')
    
    // Check if the Next.js build exists
    const nextBuildPath = path.join(frontendSource, '.next')
    if (!await fs.pathExists(nextBuildPath)) {
      throw new Error(`Next.js build not found at ${nextBuildPath}. Please run 'npm run build' in your frontend directory first.`)
    }
    
    // Copy the entire frontend directory, but we can exclude some development files
    await fs.copy(frontendSource, frontendDest, {
      filter: (src, dest) => {
        const relativePath = path.relative(frontendSource, src)
        
        // Skip node_modules, development files, and cache directories
        if (relativePath.includes('node_modules') || 
            relativePath.includes('.git') ||
            relativePath.includes('.next/cache') ||
            relativePath.startsWith('.env')) {
          return false
        }
        
        return true
      }
    })
    
    console.log('✅ Frontend assets copied successfully')
    
    // Step 2: Copy the backend executable and dependencies
    console.log('🐍 Copying FastAPI backend assets...')
    
    const backendSource = path.join(__dirname, '../backend/dist')
    const backendDest = path.join(resourcesDir, 'backend')
    
    // Check if the backend executable exists
    const backendExe = path.join(backendSource, 'main.exe')
    if (!await fs.pathExists(backendExe)) {
      throw new Error(`Backend executable not found at ${backendExe}. Please ensure your FastAPI app is compiled to an executable.`)
    }
    
    // Copy all backend distribution files
    await fs.copy(backendSource, backendDest)
    console.log('✅ Backend assets copied successfully')
    
    // Step 3: Verify the structure
    console.log('🔍 Verifying copied assets...')
    
    const frontendServerJs = path.join(frontendDest, 'server.js')
    const backendMainExe = path.join(backendDest, 'main.exe')
    
    if (!await fs.pathExists(frontendServerJs)) {
      console.warn('⚠️  Warning: server.js not found in frontend directory. Make sure your Next.js app is configured for standalone output.')
    } else {
      console.log('✅ Frontend server.js found')
    }
    
    if (!await fs.pathExists(backendMainExe)) {
      console.warn('⚠️  Warning: main.exe not found in backend directory.')
    } else {
      console.log('✅ Backend main.exe found')
    }
    
    // Step 4: Create a manifest file for debugging
    const manifest = {
      timestamp: new Date().toISOString(),
      frontend: {
        path: 'frontend',
        serverExists: await fs.pathExists(frontendServerJs),
        buildExists: await fs.pathExists(path.join(frontendDest, '.next'))
      },
      backend: {
        path: 'backend',
        executableExists: await fs.pathExists(backendMainExe)
      }
    }
    
    await fs.writeJson(path.join(resourcesDir, 'manifest.json'), manifest, { spaces: 2 })
    console.log('📋 Asset manifest created')
    
    console.log('🎉 Asset preparation completed successfully!')
    console.log(`📁 Resources are ready in: ${resourcesDir}`)
    
  } catch (error) {
    console.error('❌ Asset preparation failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

// Handle different ways this script might be called
if (require.main === module) {
  copyAssets()
}

module.exports = copyAssets