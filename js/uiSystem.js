function hideAll(){

document.getElementById("reader").style.display="none"
document.getElementById("manualBox").style.display="none"
document.getElementById("resultBox").innerHTML=""

}

function showHome(){

hideAll()

document.getElementById("bottomButtons").innerHTML=`
<button class="orange" onclick="startScan()">Start Scanning</button>
<button class="blue" onclick="showManual()">Ketik Manual</button>
<button class="green" onclick="showBulanan()">Bulanan</button>
`

loadReminder()

}
