window.hideAll=function(){

let reader=document.getElementById("reader")
let manual=document.getElementById("manualBox")
let result=document.getElementById("resultBox")

if(reader) reader.style.display="none"
if(manual) manual.style.display="none"
if(result) result.innerHTML=""

/* hapus tombol floating */
let f=document.querySelector(".floatingTambah")
if(f) f.remove()

}

window.showHome=function(){

hideAll()

let powerBtn=document.querySelector(".logout-btn")
if(!powerBtn) return

if(localStorage.getItem("adminLogin")==="true"){

document.getElementById("dashboardBtn").style.display="flex"

powerBtn.style.background="#e74c3c"
powerBtn.onclick=logoutAdmin

}else{

document.getElementById("dashboardBtn").style.display="none"

powerBtn.style.background="#28a745"
powerBtn.onclick=goAdmin

}

let sw=document.getElementById("switchCamBtn")
if(sw) sw.style.display="none"

document.getElementById("middleBox").innerHTML=""

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="startScan()">Start Scanning</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showMenuLain()">Menu Lainnya</button>
`

loadReminder()

}

window.showMenuLain=function(){

hideAll()

document.getElementById("middleBox").innerHTML=`
<div style="display:flex;flex-direction:column;gap:15px;width:100%;max-width:280px;margin:auto;">
<button class="green" onclick="showBulanan()">Bulanan</button>
<button class="blue" onclick="goTitipan()">Titip Jajan</button>
</div>
`

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`

}

window.goTitipan=function(){
window.location.href="titipan.html"
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