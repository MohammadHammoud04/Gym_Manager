const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let serverProcess;

function createWindow() {
  const isPackaged = app.isPackaged;

  // 1. Correct Server Path
  // When packaged, electron-builder puts 'extraResources' in the 'resources' folder
  const serverPath = isPackaged 
    ? path.join(process.resourcesPath, "server", "index.js") 
    : path.join(__dirname, "../../server/index.js");

  // Start the backend server
  serverProcess = fork(serverPath, [], {
    env: { FORKED: "true" } // Useful if you want your server to know it's being run by Electron
  });

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      // In production, preload is usually in the same folder as main.cjs
      preload: path.join(__dirname, "preload.js"), 
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 2. Correct Frontend Path
  if (isPackaged) {
    // path.join(__dirname, "../dist/index.html") works IF 'dist' and 'electron' 
    // are siblings inside the 'client' folder.
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    win.loadFile(indexPath).catch((e) => console.error("Failed to load index.html:", e));
  } else {
    win.loadURL("http://localhost:5173");
  }

  win.on("closed", () => {
    if (serverProcess) serverProcess.kill();
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});