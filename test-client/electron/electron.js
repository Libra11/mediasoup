/*
 * @Author: Libra
 * @Date: 2023-05-12 13:39:08
 * @LastEditTime: 2023-05-12 14:27:13
 * @LastEditors: Libra
 * @Description: 
 */
// electron/electron.js

import path from 'path'
import { app, BrowserWindow } from 'electron'

const isDev = process.env.IS_DEV === 'true'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
			enableRemoteModule: true,
			nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
	mainWindow.loadURL(isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`)
  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
