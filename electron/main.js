const {app,BrowserWindow}=require("electron");
const path=require("path");
function createWindow(){
 const win=new BrowserWindow({width:460,height:760,minWidth:380,minHeight:650,backgroundColor:"#101a2e",title:"Flappy Bird Arcade Edition",webPreferences:{contextIsolation:true,nodeIntegration:false}});
 win.loadFile(path.join(__dirname,"../index.html"));
}
app.whenReady().then(()=>{createWindow();app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()})});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
