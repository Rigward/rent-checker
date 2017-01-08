const electron = require('electron')
const {app, BrowserWindow, Tray, Menu} = electron
const request = require('request')
const jsdom = require('jsdom')

app.on('ready', () => {
  let win = new BrowserWindow({width: 1024, height: 800})
  win.loadURL('file://' + __dirname + '/index.html')
  win.webContents.openDevTools()
});

exports.openWindow = (link) => {
  let win = new BrowserWindow({width: 1024, height: 800})
  win.loadURL(link)
}
