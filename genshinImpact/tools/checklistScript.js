var dailyTab = document.getElementById("dailyTab");
var weeklyTab = document.getElementById("weeklyTab");
var dailyList = document.getElementById("dailyList");
var dailyChecks = dailyList.getElementsByTagName("input");
var dailyBox = document.getElementById("dailyStatus");
var weeklyList = document.getElementById("weeklyList");
var weeklyChecks = weeklyList.getElementsByTagName("input");
var weeklyBox = document.getElementById("weeklyStatus");

//Label associations
var labels = document.getElementsByTagName("label");
for (var i=0; i < labels.length; i++) {
	if (labels[i].htmlFor != "") { //The value of the "for" attribute of a label
		var elem = document.getElementById(labels[i].htmlFor);
		if (elem) {
			elem.label = labels[i];
		}
	}
}

//Add event listeners to checkboxes; add coloring to boxes already checked prior
var boxes = document.getElementsByTagName("input");
for (var i=0; i < boxes.length; i++) {
	if (boxes[i].type == "checkbox") {
		boxes[i].addEventListener("change", function() {checkToggle(this)});
		if (boxes[i].checked == true) {
			console.log(boxes[i]);
			boxes[i].label.style.backgroundColor = "#66ff66";
		}
	}
}

checkLists();

//Switch the active tab for the daily/weekly task lists, and reflect this visually
function switchTab (givenTab) {
	if (givenTab === "daily") {
		dailyTab.className = "active";
		weeklyTab.className = "";
		dailyList.style.display = "inline-block";
		dailyList.style.border = "1px solid white";
		weeklyList.style.display = "none";
		weeklyList.style.border = "none";
	}
	else if (givenTab === "weekly") {
		dailyTab.className = "";
		weeklyTab.className = "active";
		dailyList.style.display = "none";
		dailyList.style.border = "none";
		weeklyList.style.display = "inline-block";
		weeklyList.style.border = "1px solid white";
	}
}

//Toggle color of checkbox labels based on state, and trigger an overall check of each list's state
function checkToggle(elem) {
	if(elem.checked == true) {
		elem.label.style.backgroundColor = "#66ff66";
	}
	else if (elem.className === "optional") {
		elem.label.style.backgroundColor = "#00ccff";
	}
	else {
		elem.label.style.backgroundColor = "#ff6666";
	}
	checkLists();
}

//Check to see if each list of tasks is completed (excluding optional tasks), and visually reflect this
function checkLists() {
	checkDaily();
	checkWeekly();
}

function checkDaily() {
	var dailyState = true;
	
	for (var i=0; i < dailyChecks.length; i++) {
		if (dailyChecks[i].className.indexOf("optional") == -1 && !(dailyChecks[i].checked)) {
			dailyState = false;
			break;
		}
	}
	
	if (dailyState) {
		dailyBox.style.backgroundColor = "#66ff66";
		dailyBox.innerHTML = "Daily Tasks Complete";
	}  else {
		dailyBox.style.backgroundColor = "#ff6666";
		dailyBox.innerHTML = "Daily Tasks Incomplete";
	}
}

function checkWeekly() {
	var weeklyState = true;
	
	for (var i=0; i < weeklyChecks.length; i++) {
		if (weeklyChecks[i].className.indexOf("optional") == -1 && !(weeklyChecks[i].checked)) {
			weeklyState = false;
			break;
		}
	}
	
	if (weeklyState) {
		weeklyBox.style.backgroundColor = "#66ff66";
		weeklyBox.innerHTML = "Weekly Tasks Complete";
	}  else {
		weeklyBox.style.backgroundColor = "#ff6666";
		weeklyBox.innerHTML = "Weekly Tasks Incomplete";
	}
}

/* Potential future addition: allowing user to toggle which tasks are optional.
Add "Optional: " to the innerHTML of checkbox labels to show the change.
Revert by using string.replace on that string, replacing the optional text with an empty string. */