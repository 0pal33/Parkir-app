let scanner
let scanLocked=false
let currentCamera="environment"

async function startScan(){

showScan()

if(scanner){
await scanner.stop().catch(()=>{})
scanner.clear()
scanner=null
}

scanner=new Html5Qrcode("reader")

scanner.start(
{facingMode:currentCamera},
{fps:10,qrbox:250},
onScan
)

}

async function stopScan(){

if(scanner){
await scanner.stop().catch(()=>{})
scanner.clear()
scanner=null
}

showHome()

}
