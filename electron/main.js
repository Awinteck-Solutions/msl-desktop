const { app, BrowserWindow } = require('electron')
const path = require('path')

let win;
const creatWindow = () => {
    win = new BrowserWindow({})
    let appPath = path.join(__dirname, '../dist/index.html')
    console.log('appPath :>> ', appPath);
    win.loadFile(appPath)
    win.webContents.openDevTools()
}

app.whenReady().then(() => {
    creatWindow()
})

