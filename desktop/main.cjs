/* SUPRA Writer Windows desktop host (MIT) — restricted Electron APIs. */
'use strict';
const {app, BrowserWindow, ipcMain, dialog, Menu, shell, protocol, net, session} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const ALLOWED_EXTENSIONS = new Set(['.docx','.html','.txt']);
const MAX_BYTES = 25 * 1024 * 1024;
const ROOT = path.resolve(__dirname, '..');
let window = null;
let currentFile = null;
let openingPath = null;

protocol.registerSchemesAsPrivileged([{scheme:'supra',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const isSafeExtension = p => ALLOWED_EXTENSIONS.has(path.extname(p).toLowerCase());
const files = [
  {name:'Word document',extensions:['docx']},
  {name:'HTML document',extensions:['html']},
  {name:'Plain text',extensions:['txt']}
];
function targetWindow(event) {
  if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame) {
    throw new Error('Unrecognized document request');
  }
  return window;
}
async function readDocument(target) {
  if (!isSafeExtension(target)) throw Error('Unsupported document type');
  const stat = await fs.stat(target);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw Error('Document must be a file below 25 MB');
  const contents = await fs.readFile(target);
  currentFile = target;
  return {name:path.basename(target),bytes:new Uint8Array(contents)};
}
function sendCommand(name) {
  if(window && !window.isDestroyed())window.webContents.send('desktop:command',name);
}
function buildMenu() {
  const menus = [
    {label:'File',submenu:[
      {label:'New document',accelerator:'CmdOrCtrl+N',click:()=>sendCommand('new')},
      {label:'Open...',accelerator:'CmdOrCtrl+O',click:()=>sendCommand('open')},
      {type:'separator'},
      {label:'Save Word document',accelerator:'CmdOrCtrl+S',click:()=>sendCommand('save')},
      {label:'Save As...',accelerator:'CmdOrCtrl+Shift+S',click:()=>sendCommand('saveAs')},
      {label:'Export PDF...',click:()=>sendCommand('pdf')},
      {type:'separator'},
      {label:'Print...',accelerator:'CmdOrCtrl+P',click:()=>sendCommand('print')},
      {type:'separator'},
      {role:'quit',label:'Exit'}
    ]},
    {label:'Edit',submenu:[
      {role:'undo'},{role:'redo'},{type:'separator'},
      {role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'},
      {type:'separator'},
      {label:'Find...',accelerator:'CmdOrCtrl+F',click:()=>sendCommand('find')},
      {label:'Replace...',accelerator:'CmdOrCtrl+H',click:()=>sendCommand('replace')}
    ]},
    {label:'View',submenu:[{role:'reload'},{role:'togglefullscreen'}, {role:'resetZoom'}, {role:'zoomIn'},{role:'zoomOut'}]},
    {label:'Help',submenu:[
      {label:'Help',click:()=>sendCommand('help')},
      {label:'Source code (GitHub)',click:()=>shell.openExternal('https://github.com/flandersdb-oss/SUPRA-Writer')},
      {label:'Version '+app.getVersion(),enabled:false}
    ]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
}
async function createWindow() {
  window = new BrowserWindow({
    width:1400,height:920,minWidth:800,minHeight:620, backgroundColor:'#172638',
    icon:path.join(ROOT,'icons','icon-512.png'),
    title:'SUPRA Writer — Windows Alpha',
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}
  });
  const wc = window.webContents;
  wc.setWindowOpenHandler(({url}) => {
    try {const u=new URL(url);if(u.protocol==='https:' && ['github.com','www.github.com'].includes(u.hostname))void shell.openExternal(u.href);}catch{}
    return {action:'deny'};
  });
  wc.on('will-navigate',(event,url)=>{
    if(url !== 'supra://writer/index.html') event.preventDefault();
  });
  wc.on('will-attach-webview',e=>e.preventDefault());
  await window.loadURL('supra://writer/index.html');
  if(openingPath) {const p=openingPath;openingPath=null;try{const item=await readDocument(p);wc.send('desktop:open-file',item)}catch(e){await dialog.showMessageBox(window,{type:'warning',message:'Could not open document',detail:e.message});}}
  window.on('closed',()=>{window=null;});
}
function validFileName(fileName){return typeof fileName==='string' && fileName.length>=1 && fileName.length<=150 && !/[\\/:*?"<>|\x00-\x1f]/.test(fileName) && isSafeExtension(fileName);}
function safeBytes(bytes){
  if(!(bytes instanceof Uint8Array || ArrayBuffer.isView(bytes) || bytes instanceof ArrayBuffer))throw Error('Invalid file data');
  const data=Buffer.from(bytes instanceof ArrayBuffer? new Uint8Array(bytes) : bytes.buffer, bytes instanceof ArrayBuffer?0:bytes.byteOffset, bytes instanceof ArrayBuffer?bytes.byteLength:bytes.byteLength);
  if(data.length>MAX_BYTES)throw Error('Document exceeds 25 MB limit');
  return data;
}
function wireIpc() {
  ipcMain.handle('document:open',async event=>{
    const win=targetWindow(event);
    const out=await dialog.showOpenDialog(win,{title:'Open a document',properties:['openFile'],filters:[{name:'Word, HTML or text',extensions:['docx','html','txt']},...files]});
    if(out.canceled || !out.filePaths.length)return null;
    return readDocument(out.filePaths[0]);
  });
  ipcMain.handle('document:save',async (event,arg)=>{
    const win=targetWindow(event);
    if(!arg || !validFileName(arg.fileName))throw Error('Invalid document filename');
    const data=safeBytes(arg.bytes);
    const extension=path.extname(arg.fileName).toLowerCase();
    let destination=currentFile && path.extname(currentFile).toLowerCase()===extension && !arg.saveAs ?currentFile:null;
    if(!destination){
      const out=await dialog.showSaveDialog(win,{title:'Save '+arg.fileName,defaultPath:currentFile && path.extname(currentFile).toLowerCase()===extension ? currentFile:path.join(app.getPath('documents'),arg.fileName),filters:[...files]});
      if(out.canceled || !out.filePath)return {saved:false,canceled:true};
      destination=out.filePath;
      if(!isSafeExtension(destination) || path.extname(destination).toLowerCase()!==extension)throw Error('Filename extension must match the document format');
    }
    await fs.writeFile(destination,data,{flag:'w'});
    currentFile=destination;
    win.setTitle(path.basename(destination)+' — SUPRA Writer');
    return {saved:true,fileName:path.basename(destination)};
  });
  ipcMain.handle('document:pdf',async (event)=>{
    const win=targetWindow(event);
    const out=await dialog.showSaveDialog(win,{title:'Export as PDF',defaultPath:path.join(app.getPath('documents'),'SUPRA-Document.pdf'),filters:[{name:'PDF document',extensions:['pdf']}]});
    if(out.canceled || !out.filePath)return {saved:false,canceled:true};
    if(path.extname(out.filePath).toLowerCase()!=='.pdf')throw Error('Choose a .pdf filename');
    const bytes=await win.webContents.printToPDF({printBackground:true,preferCSSPageSize:true});
    await fs.writeFile(out.filePath,bytes);
    return {saved:true,fileName:path.basename(out.filePath)};
  });
  ipcMain.handle('document:reset',event=>{targetWindow(event);currentFile=null;window.setTitle('SUPRA Writer — Windows');return true;});
}
if(!app.requestSingleInstanceLock())app.quit();
else {
  app.on('second-instance',(_event,argv)=>{
    const match=argv.find(v=>typeof v==='string'&&isSafeExtension(v));
    if(match&&window){readDocument(match).then(item=>window.webContents.send('desktop:open-file',item)).catch(()=>{});}
    if(window){if(window.isMinimized())window.restore();window.focus();}
  });
  app.whenReady().then(async()=>{
    app.setAppUserModelId('org.flandersdb.supra.writer');
    session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    const args=process.argv.slice(1);openingPath=args.find(v=>typeof v==='string'&&isSafeExtension(v))||null;
    protocol.handle('supra',request=>{
      const url=new URL(request.url);
      if(url.hostname!=='writer')return new Response('Not Found',{status:404});
      const decoded=decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const target=path.resolve(ROOT,decoded);
      if(!target.startsWith(ROOT+path.sep) || !/\.(html|js|css|png|svg|webmanifest)$/i.test(target))return new Response('Not Found',{status:404});
      return net.fetch(pathToFileURL(target).toString());
    });
    wireIpc();buildMenu();await createWindow();
  });
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)void createWindow();});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
