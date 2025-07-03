// frontend/components/FolderPicker.js - This is your user interface component
import { useState, useEffect } from 'react';

const FolderPicker = () => {
  // State to store the selected folder path
  const [selectedPath, setSelectedPath] = useState('');
  // State to show loading status when dialog is open
  const [isLoading, setIsLoading] = useState(false);
  // State to check if we're running in Electron environment
  const [isElectronAvailable, setIsElectronAvailable] = useState(false);

  // Check if Electron API is available when component mounts
  useEffect(() => {
    // This runs after the component is rendered
    // We check if window.electronAPI exists (created by our preload script)
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectronAvailable(true);
      console.log('Frontend: Electron API is available');
    } else {
      setIsElectronAvailable(false);
      console.log('Frontend: Running in web browser mode');
    }
  }, []);

  // This function handles the folder picking process
  const handleFolderSelection = async () => {
    // First, check if we're in Electron environment
    if (!isElectronAvailable) {
      alert('Folder picker is only available in the desktop app');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Frontend: Requesting folder picker...');

      // Call the Electron API that we exposed in preload.js
      // This will trigger the main process to open the native folder dialog
      const result = await window.electronAPI.openFolderPicker();
      
      console.log('Frontend: Received result from Electron:', result);

      // Handle the response from the main process
      if (result.success && result.path) {
        // User successfully selected a folder
        setSelectedPath(result.path);
        console.log('Frontend: User selected folder:', result.path);
        console.log('Frontend: Complete absolute path:', result.path);
        
        // You can do additional processing here, such as:
        // - Save to local storage
        // - Update other components
        // - Trigger other actions based on the selected folder
        
      } else if (result.success === false && result.message) {
        // User canceled or there was an issue
        console.log('Frontend: Folder selection canceled or failed:', result.message);
      }
      
    } catch (error) {
      // Handle any errors that might occur during the process
      console.error('Frontend: Error during folder selection:', error);
      alert('An error occurred while selecting the folder');
    } finally {
      // Always reset loading state
      setIsLoading(false);
    }
  };

  // Function to clear the selected path
  const clearSelection = () => {
    setSelectedPath('');
    console.log('Frontend: Cleared folder selection');
  };

  return (
    <div className="folder-picker-container">
      <h2>Desktop Folder Picker</h2>
      
      {/* Status indicator */}
      <div className="status-indicator">
        <p>
          <strong>Environment:</strong> {isElectronAvailable ? 'Desktop App' : 'Web Browser'}
        </p>
      </div>

      {/* Main action button */}
      <button 
        onClick={handleFolderSelection}
        disabled={isLoading || !isElectronAvailable}
        className="folder-picker-button"
      >
        {isLoading ? 'Opening Folder Dialog...' : 'Pick a Folder'}
      </button>

      {/* Clear button - only show if we have a selected path */}
      {selectedPath && (
        <button 
          onClick={clearSelection}
          className="clear-button"
        >
          Clear Selection
        </button>
      )}

      {/* Display the selected path */}
      {selectedPath && (
        <div className="selected-path-display">
          <h3>Selected Folder:</h3>
          <div className="path-container">
            <code>{selectedPath}</code>
          </div>
          <div className="path-info">
            <p><strong>Type:</strong> Absolute Path</p>
            <p><strong>Length:</strong> {selectedPath.length} characters</p>
            <p><strong>Platform:</strong> {navigator.platform}</p>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="help-text">
        {isElectronAvailable ? (
          <p>Click "Pick a Folder" to open your system's native folder selection dialog.</p>
        ) : (
          <p>This feature requires the desktop version of the application.</p>
        )}
      </div>

      {/* Styling */}
      <style jsx>{`
        .folder-picker-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .status-indicator {
          background-color: ${isElectronAvailable ? '#e8f5e8' : '#fff3cd'};
          border: 1px solid ${isElectronAvailable ? '#4caf50' : '#ffc107'};
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 20px;
        }

        .folder-picker-button {
          background-color: #0070f3;
          color: white;
          border: none;
          padding: 12px 24px;
          margin: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .folder-picker-button:hover:not(:disabled) {
          background-color: #0051a2;
        }

        .folder-picker-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .clear-button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          margin: 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .clear-button:hover {
          background-color: #c82333;
        }

        .selected-path-display {
          margin-top: 20px;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #0070f3;
        }

        .path-container {
          background-color: #ffffff;
          padding: 12px;
          border-radius: 4px;
          border: 1px solid #dee2e6;
          margin: 10px 0;
          word-break: break-all;
        }

        .path-container code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 14px;
          color: #333;
        }

        .path-info {
          margin-top: 10px;
          font-size: 14px;
          color: #666;
        }

        .path-info p {
          margin: 5px 0;
        }

        .help-text {
          margin-top: 20px;
          padding: 10px;
          background-color: #f1f3f4;
          border-radius: 4px;
          font-size: 14px;
          color: #666;
        }

        h2 {
          color: #333;
          margin-bottom: 20px;
        }

        h3 {
          color: #0070f3;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default FolderPicker;