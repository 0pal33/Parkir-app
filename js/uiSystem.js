window.hideAll=function(){

document.getElementById("reader").style.display="none"
document.getElementById("manualBox").style.display="none"
document.getElementById("resultBox").innerHTML=""

}

window.showHome=function(){

hideAll()

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

document.getElementById("bottomButtons").innerHTML=`
<button class="red" onclick="stopScan()">Stop</button>
`

}

window.showResult=function(){

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