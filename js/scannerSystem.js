window.scanner = null
window.scanLocked = false
window.currentCamera = "environment"

window.startScan = async function(){

showScan()

if(window.scanner){
await window.scanner.stop().catch(()=>{})
window.scanner.clear()
window.scanner=null
}

window.scanner = new Html5Qrcode("reader")

await window.scanner.start(
{ facingMode:"environment" },
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
await window.scanner.stop().catch(()=>{})
window.scanner.clear()
window.scanner=null
}

showHome()

}