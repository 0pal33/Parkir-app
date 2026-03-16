window.hideAll=function(){

document.getElementById("reader").style.display="none"
document.getElementById("manualBox").style.display="none"
document.getElementById("resultBox").innerHTML=""

}

window.showHome=function(){

hideAll()

let powerBtn=document.querySelector(".logout-btn")

if(localStorage.getItem("adminLogin")==="true"){

/* ADMIN MODE */

document.getElementById("dashboardBtn").style.display="flex"

powerBtn.style.background="#e74c3c"   // merah
powerBtn.onclick=logoutAdmin

}else{

/* PETUGAS MODE */

document.getElementById("dashboardBtn").style.display="none"

powerBtn.style.background="#28a745"   // hijau
powerBtn.onclick=goAdmin

}

document.getElementById("switchCamBtn").style.display="none"

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="startScan()">Start Scanning</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showBulanan()">Bulanan</button>
`

loadReminder()

}

window.showScan=function(){

hideAll()

document.getElementById("reader").style.display="block"
document.getElementById("switchCamBtn").style.display="inline-block"

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="stopScan()">Stop</button>
`

}

window.showResult=function(){

document.getElementById("switchCamBtn").style.display="none"

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="scanUlang()">Scan Ulang</button>
<button class="blue" onclick="manualAgain()">Ketik Lagi</button>
`

}

window.showManualState=function(){

hideAll()

document.getElementById("manualBox").style.display="block"

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="cancelManual()">Batal</button>
`

}

window.goAdmin=function(){
window.location.href="admin.html"
}

window.goDashboard=function(){
window.location.href="dashboard.html"
}

window.logoutAdmin=function(){

localStorage.removeItem("adminLogin")

location.reload()

}