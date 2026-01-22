const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let serverProcess;

function createWindow() {
  const isPackaged = app.isPackaged;
  const isDev = !app.isPackaged;

  const serverPath = app.isPackaged
  ? path.join(process.resourcesPath, "server", "index.js")
  : path.join(__dirname, "../../server/index.js");

    serverProcess = fork(serverPath, [], {
      env: { 
        ...process.env,
        FORKED: "true",
        PORT: 5000 
      }
    });

    ipcMain.handle("show-message-box", async (event, options) => {
      const result = await dialog.showMessageBox(options);
      return result;
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

  //frontend path
if (isPackaged) {
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  
 setTimeout(() => {
    win.loadFile(indexPath).catch((e) => console.error("Failed to load index.html:", e));
  }, 1000);

} else {
  win.loadURL("http://localhost:5173");
}

if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // THIS IS THE KEY: Load the index.html from the dist folder
    win.loadFile(path.join(__dirname, '../dist/index.html'));
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