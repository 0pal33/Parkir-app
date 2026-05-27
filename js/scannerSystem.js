window.scanner = null
window.scanLocked = false
window.currentCamera = "environment"
window.scanStarting = false

window.startScan = async function(){

if(window.scanStarting) return
window.scanStarting = true

showScan()

try{

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}
window.scanner.clear()
window.scanner = null
}

window.scanner = new Html5Qrcode("reader")

await window.scanner.start(
{ facingMode: window.currentCamera },
{
fps:15,
qrbox:{ width:250,height:250 },
aspectRatio:1,
rememberLastUsedCamera:true,
experimentalFeatures:{
useBarCodeDetectorIfSupported:true
}
},
window.onScan
)

}catch(err){

alert("Kamera gagal dibuka")

showHome()

}

window.scanStarting = false

}

window.stopScan = async function(){

try{

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}

window.scanner.clear()
window.scanner = null
}

}catch(e){}

showHome()

}

/* ======================
SWITCH CAMERA
====================== */

window.switchCamera = async function(){

if(window.scanStarting) return

if(window.currentCamera === "environment"){
window.currentCamera = "user"
}else{
window.currentCamera = "environment"
}

try{

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}

window.scanner.clear()
window.scanner = null
}

}catch(e){}

window.startScan()

}