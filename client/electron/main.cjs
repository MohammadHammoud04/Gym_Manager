const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let serverProcess;

function createWindow() {
  const isPackaged = app.isPackaged;
  const isDev = !app.isPackaged;

  const serverPath = isPackaged
    ? path.join(process.resourcesPath, "server", "index.js")
    : path.join(__dirname, "../../server/index.js");

  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env,
      FORKED: "true",
      PORT: 5000 
    }
  });

  serverProcess.on('message', (msg) => console.log('Server:', msg));
  serverProcess.on('error', (err) => console.error('Server Error:', err));

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), 
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    setTimeout(() => {
      win.loadFile(path.join(__dirname, "..", "dist", "index.html"))
        .catch((e) => console.error("Failed to load index.html:", e));
    }, 1000);
  }

  win.on("closed", () => {
    if (serverProcess) serverProcess.kill();
  });
}

ipcMain.handle("show-message-box", async (event, options) => {
  return await dialog.showMessageBox(options);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});