module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./assets/icon",
    executableName: "db-connection-manager",
    appBundleId: "com.yourcompany.dbconnectionmanager",
    appCategoryType: "public.app-category.developer-tools",
    win32metadata: {
      CompanyName: "Your Company",
      FileDescription: "Database Connection Manager",
      OriginalFilename: "db-connection-manager.exe",
      ProductName: "DB Connection Manager",
      InternalName: "DBConnectionManager",
    },
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "DBConnectionManager",
        authors: "Your Company",
        description: "Database Connection Manager Application",
        iconUrl: "https://url-to-icon.ico",
        setupIcon: "./assets/icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "Your Company",
          homepage: "https://yourcompany.com",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        options: {
          maintainer: "Your Company",
          homepage: "https://yourcompany.com",
        },
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO",
        background: "./assets/dmg-background.png",
        icon: "./assets/icon.icns",
      },
    },
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "your-username",
          name: "your-repo",
        },
        prerelease: false,
      },
    },
  ],
}
