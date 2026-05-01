window.hideAll=function(){

let reader=document.getElementById("reader")
let manual=document.getElementById("manualBox")
let result=document.getElementById("resultBox")

if(reader) reader.style.display="none"
if(manual) manual.style.display="none"
if(result) result.innerHTML=""

let f=document.querySelector(".floatingTambah")
if(f) f.remove()

}

window.showHome=function(){

hideAll()

let powerBtn=document.querySelector(".logout-btn")
let dash=document.getElementById("dashboardBtn")
let sw=document.getElementById("switchCamBtn")

if(!powerBtn) return

if(localStorage.getItem("adminLogin")==="true"){

if(dash) dash.style.display="flex"
powerBtn.style.background="#e74c3c"
powerBtn.onclick=logoutAdmin

}else{

if(dash) dash.style.display="none"
powerBtn.style.background="#28a745"
powerBtn.onclick=goAdmin

}

if(sw) sw.style.display="none"

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="startScan()">Start Scanning</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showMenuLain()">Menu Lainnya</button>
`

loadReminder()

}

window.showMenuLain=function(){

hideAll()

let isAdmin = localStorage.getItem("adminLogin")==="true"

let html = `
<div style="display:flex;flex-direction:column;gap:15px;width:100%;max-width:280px;margin:auto;">
<button class="green" onclick="showBulanan()">Bulanan</button>
<button class="blue" onclick="goTitipan()">Titip Jajan</button>
`

if(isAdmin){
html += `<button class="blue" onclick="goStok()">Stok Barang</button>`
}

html += `</div>`

let mid=document.getElementById("middleBox")
if(mid) mid.innerHTML = html

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="showHome()">Kembali</button>
`

}

window.goTitipan=function(){
location.href="titipan.html"
}

window.showScan=function(){

hideAll()

let reader=document.getElementById("reader")
let sw=document.getElementById("switchCamBtn")

if(reader) reader.style.display="block"
if(sw) sw.style.display="inline-block"

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="stopScan()">Stop</button>
`

}

window.showResult=function(){

let sw=document.getElementById("switchCamBtn")
if(sw) sw.style.display="none"

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="scanUlang()">Scan Ulang</button>
<button class="blue" onclick="manualAgain()">Ketik Lagi</button>
`

}

window.showManualState=function(){

hideAll()

let manual=document.getElementById("manualBox")

if(manual) manual.style.display="block"

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="cancelManual()">Batal</button>
`

}

window.goAdmin=function(){
location.href="admin.html"
}

window.goDashboard=function(){
location.href="dashboard.html"
}

window.logoutAdmin=function(){
localStorage.removeItem("adminLogin")
location.reload()
}

window.showManual=function(){
showManualState()
}