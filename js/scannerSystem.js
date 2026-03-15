window.scanner = null
window.scanLocked = false
window.currentCamera = "environment"

window.startScan = async function(){

showScan()

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}
window.scanner.clear()
window.scanner=null
}

window.scanner = new Html5Qrcode("reader")

await window.scanner.start(
{ facingMode: window.currentCamera },
{
fps:15,
qrbox:{ width:250,height:250 },
aspectRatio:1.0,
rememberLastUsedCamera:true,
experimentalFeatures:{
useBarCodeDetectorIfSupported:true
}
},
window.onScan
)

}

window.stopScan = async function(){

if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}
window.scanner.clear()
window.scanner=null
}

showHome()

}

/* ===== SWITCH CAMERA ===== */

window.switchCamera = async function(){

if(window.currentCamera === "environment"){
window.currentCamera = "user"
}else{
window.currentCamera = "environment"
}

/* stop scanner TANPA showHome */
if(window.scanner){
try{
await window.scanner.stop()
}catch(e){}
window.scanner.clear()
window.scanner=null
}

/* start lagi */
window.startScan()

}