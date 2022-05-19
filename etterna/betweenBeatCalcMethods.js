"use strict";

function calcTime() {
	var bpmVal = 120;
	var snapVal = 4;
	var secondsPerBeat = 1;
	var result = "Results will go here.";
	var resultTarget = document.getElementById("resultText");
	
	bpmVal = parseFloat(document.getElementById("BPMVal").value);
	snapVal = parseInt(document.getElementById("beatSnaps").value);
	
	if(isNaN(bpmVal)) {
		result = "BPM given was not a valid number.";
		resultTarget.innerHTML = result;
		return;
	}
	else if (bpmVal <= 0) {
		result = "BPM given was not positive.";
		resultTarget.innerHTML = result;
		return;
	}
	
	if(isNaN(snapVal)) {
		result = "Snap given was not a valid number.";
		resultTarget.innerHTML = result;
		return;
	}
	
	//Convert BPM into beats per second
	secondsPerBeat = bpmVal / 60;
	
	//Convert to snap of user choice
	secondsPerBeat *= (snapVal / 4);
	
	//Invert fraction
	secondsPerBeat = Math.pow(secondsPerBeat, -1);
	
	//Display results; limit display of seconds between beats to six decimal places
	secondsPerBeat = +parseFloat(secondsPerBeat.toFixed(6));
	
	result = "At " + bpmVal + " BPM, there are " + secondsPerBeat + " seconds between ";
	if(snapVal % 10 == 1 && snapVal > 13) {
		result = result + snapVal + "st";
	}
	else if (snapVal % 10 == 2 && snapVal > 13) {
		result = result + snapVal + "nd";
	}
	else if (snapVal % 10 == 3 && snapVal > 13) {
		result = result + snapVal + "rd";
	}
	else {
		result = result + snapVal + "th";
	}
	result = result + " notes.";
	resultTarget.innerHTML = result;
}