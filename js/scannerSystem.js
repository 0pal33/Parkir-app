window.scanner = null
window.scanLocked = false
window.currentCamera = "environment"

window.startScan = async function(){

showScan()

if(scanner){
await scanner.stop().catch(()=>{})
scanner.clear()
scanner=null
}

scanner = new Html5Qrcode("reader")

scanner.start(
{ facingMode: currentCamera },
{ fps:10, qrbox:250 },
onScan
)

}

window.stopScan = async function(){

if(scanner){
await scanner.stop().catch(()=>{})
scanner.clear()
scanner=null
}

showHome()

}