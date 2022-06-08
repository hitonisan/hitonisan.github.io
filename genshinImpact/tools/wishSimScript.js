"use strict";

/* To do list:
-Reduce the number of unnecessary global variables once the simulations are working correctly
-Reminder: 50% featured chances should have priority roll before determining a split of non-featured chances; you'll get inaccurate sims otherwise, underrepresenting the featured rolls

-The main problem was how to resolve 4-star and 5-star guarantee collisions
-It isn't certain what happens when they collide, and finding info is nearly impossible (it's a very rare occurrence, and involves such generic search terms that it's futile to find an exact topic)
-My solution is to look for a previous wish (within the past 10 wishes) that is not a 5-star or 4-star, and replace it with a 4-star to satisfy the 4-star guarantee; if no such wish exists, delay the 4-star guarantee until the next wish
	-No previous wish could be a 5-star, as the 5-star guarantee couldn't possibly trigger otherwise
	-No previous wish could be a 4-star, as the 4-star guarantee couldn't possibly trigger otherwise
	-Therefore, the previous wish would have to be a 3-star that could be replaced
	-As such, you would only ever need to replace the previous wish with a 4-star
		-Should that previous wish not exist (which would only happen on the first wish of a simulation), just delay the 4-star guarantee until the next wish


3-star roll:
-No guarantees: add the 3-star result
-4-star guarantee: replace the result with a 4-star result
-5-star guarantee: replace the result with a 5-star result
-4-star and 5-star guarantee: replace the result with a 5-star result; move 4-star result to previous 3-star wish, or delay guarantee if not possible

4-star roll:
-No guarantees: add the 4-star result
-4-star guarantee: add the 4-star result
-5-star guarantee: replace the result with a 5-star result
-4-star and 5-star guarantee: replace the result with a 5-star result; move 4-star result to previous 3-star wish, or delay guarantee if not possible

5-star roll:
-No guarantees: add the 5-star result
-4-star guarantee: add the 5-star result, and reset the 4-star guarantee counter. Featured flags should trigger by rarity.
-5-star guarantee: add the 5-star result
-4-star and 5-star guarantee:  add the 5-star result; move 4-star result to previous 3-star wish, or delay guarantee if not possible

Random logic function:
randVal = Math.floor(Math.random() * 1000) + 1; - random number from 1 to 1000

Probability divisions:
-Standard banner:
	-3-star: 1 to 943 (94.3%, so 943 possible values)
	-4-star: 944 to 994 (5.1%, so 51 possible values)
		-Make a 1-500 roll to determine if the 4-star is a character or weapon
	-5-star: 995 to 1000 (0.6%, so 6 possible values)
		-Make a 1-500 roll to determine if the 5-star is a character or weapon
-Event character banner:
  -3-star: 1 to 943 (94.3%, so 943 possible values)
  -4-star: 944 to 994 (5.1%, so 51 possible values)
	-First, if a guarantee flag is not triggered, make a 1-500 roll to see if a featured character is hit
	-If that misses, make a 1-500 roll to determine if the 4-star will be a character or weapon
	-If that hits, use Math.floor(Math.random() * 999) + 1 to fetch a random number from 1 to 999, then divide b/w featured characters at 333 and 666
  -5-star: 995 to 1000 (0.6%, so 6 possible values)
	-If a guarantee flag is not triggered, make a 1-500 roll to see if the featured character is hit
-Event weapon banner:
	-3-star: 1 to 933 (93.3%, so 933 possible values)
	-4-star: 934 to 993 (6%, so 60 possible values)
	  -First, make a 1-750 roll to see if a featured weapon is hit
	  -If that misses, make a 1-500 roll to determine if the 4-star will be a character or weapon
	  -If that hits, make a roll and divide by sections of 200 to find out which of the 5 featured weapons it'll be
	-5-star: 994 to 1000 (0.7%, so 7 possible values)
	  -First, make a 1-750 roll to see if a featured weapon is hit
	  -If that hits, make a roll and divide by sections of 500 to find out which of the 2 featured weapons it'll be
	  
-Non-featured 4-star rolls, using real-world data:
  -Standard banner lacks featured rolls, so no analysis is necessary
  -Event character banner:
    -66.67% of rolls are featured 4-star characters
	-5% of rolls are non-featured 4-star characters (15% of overall non-featured 4-stars) (1 to 150 - 15%, so 150 possible values)
	-28.33% of rolls are 4-star weapons (85% of overall non-featured 4-stars) (151 to 1000 - 85%, so 850 possible values)
  -Event weapon banner:
    -80% of rolls are featured 4-star weapons
	-18.5% of rolls are 4-star characters (92.5% of overall non-featured 4 stars) (1 to 925 - 92.5%, so 925 possible values)
	-1.5% of rolls are non-featured 4-star weapons (7.5% of overall non-featured 4 stars) (926 to 1000 - 7.5%, so 75 possible values)
*/

//Form elements relevant to all simulations
const bannerTypes = document.getElementsByName("bannerType"); //Radio buttons for determining banner to use
const simTypes = document.getElementsByName("simType"); //Radio buttons for determining simulation goal
const goalValInput = document.getElementById("simGoal"); //Numeric value for goal to achieve
const pity4Input = document.getElementById("pity4"); //Numeric value for starting 4-star pity
const pity5Input = document.getElementById("pity5"); //Numeric value for starting 5-star pity

//Form elements that may be used, depending on other options' values
const guarantee4StarToggle = document.getElementById("guaranteeFeat4Star"); //Checkbox for assuring a featured 4-star roll is next
const guarantee5StarToggle = document.getElementById("guaranteeFeat5Star"); //Checkbox for assuring a featured 5-star roll is next
const realNonFeat4StarOdds = document.getElementById("realNonFeat4Star"); //Checkbox toggling 50/50 or realistic 4-star odds for non-featured pulls
const eventCharTargets = document.getElementsByName("eventCharTarget"); //Radio buttons for desired result in event character banners
const epitomizedPathOpts = document.getElementsByName("epitomizedChoice"); //Radio buttons determining how Epitomized Path should be used
const fatePointInput = document.getElementById("fatePoints"); //Numeric value for starting Fate Point count in Epitomized Path
const eventWeapTargets = document.getElementsByName("eventWeapTarget"); //Radio buttons for desired result in event weapon banners

//Variables for tracking numeric parameter inputs
var goalVal = 1;
var pity4 = 0;
var pity5 = 0;

//Variables for tracking simulation results (universal)
var targetedSim = false; //Flag for storing sim mode: false for wish count, true for desired result count
var simProgress = 0; //Total progress toward number of wishes/desired results
var count5any = 0; //Non-specific 5-star pulls
var count4any = 0; //Non-specific 4-star pulls
var count3 = 0; //3-star weapon pulls

//Variables for tracking simulation results (specific cases)
var count5charAny = 0; //5-star character pulls
var count5charFeat = 0; //5-star featured character pulls (event character banner)
var count5weapAny = 0; //5-star weapon pulls
var count5weapFeat1 = 0; //5-star featured weapon 1 pulls (event weapon banner)
var count5weapFeat2 = 0; //5-star featured weapon 2 pulls (event weapon banner)

var count4charAny = 0; //Non-specific 4-star character pulls
var count4weapAny = 0; //Non-specific 4-star weapon pulls
var count4charFeat1 = 0; //4-star featured character 1 pulls (event character banner)
var count4charFeat2 = 0; //4-star featured character 2 pulls (event character banner)
var count4charFeat3 = 0; //4-star featured character 3 pulls (event character banner)
var count4weapFeat1 = 0; //4-star featured weapon 1 pulls (event weapon banner)
var count4weapFeat2 = 0; //4-star featured weapon 2 pulls (event weapon banner)
var count4weapFeat3 = 0; //4-star featured weapon 3 pulls (event weapon banner)
var count4weapFeat4 = 0; //4-star featured weapon 4 pulls (event weapon banner)
var count4weapFeat5 = 0; //4-star featured weapon 5 pulls (event weapon banner)

var wishCount = 0; //The total number of wishes performed; for use during desired goal simulations

var nonFeat4Threshold = 500; //Probability variable used to determine whether or not a non-featured 4-star roll is a weapon or character

var feat5Miss = false; //Flag for featured 5-star guarantee on missed 5-star roll
var feat4Miss = false; //Flag for featured 4-star guarantee on missed 4-star roll
var fateActive = 0; //Flag for using Epitomized Path (event weapon banner): 0 to disable, 1 for weapon 1, 2 for weapon 2
var fateCount = 0; //Fate point counter for Epitomized Path (event weapon banner)

var randVal = 0; //Variable for storing random number generations

const resultContainer = document.getElementById("resultP"); //The <p> element used to display results
var resultContent = "Results will go here.";

var i = 0;

optionSwitch();

//Change available form options when the requested banner type or simulation type changes
function optionSwitch() {
	//Standard banner - no extra options; no featured targets available, so desired result mode can't be used
	if (bannerTypes[0].checked) {
		simTypes[1].disabled = "disabled";
		simTypes[0].checked = "checked";
		
		guarantee4StarToggle.disabled = "disabled";
		guarantee5StarToggle.disabled = "disabled";
		
		realNonFeat4StarOdds.disabled = "disabled";
		
		for (i=0; i < eventCharTargets.length; i++) {
		  eventCharTargets[i].disabled = "disabled";
	    }
	    for (i=0; i < epitomizedPathOpts.length; i++) {
		  epitomizedPathOpts[i].disabled = "disabled";
	    }
		fatePointInput.disabled = "disabled";
	    for (i=0; i < eventWeapTargets.length; i++) {
		  eventWeapTargets[i].disabled = "disabled";
	    }
	}
	//Event character banner - character to pursue, if desired result mode is on
	else if (bannerTypes[1].checked) {
		simTypes[1].removeAttribute("disabled");
		
		guarantee4StarToggle.removeAttribute("disabled");
		guarantee5StarToggle.removeAttribute("disabled");
		
		realNonFeat4StarOdds.removeAttribute("disabled");
		
		if (simTypes[1].checked) {
		  for (i=0; i < eventCharTargets.length; i++) {
		    eventCharTargets[i].removeAttribute("disabled");
	      }
		}
		else {
			for (i=0; i< eventCharTargets.length; i++) {
				eventCharTargets[i].disabled = "disabled";
			}
		}
	    for (i=0; i < epitomizedPathOpts.length; i++) {
		  epitomizedPathOpts[i].disabled = "disabled";
	    }
		fatePointInput.disabled = "disabled";
	    for (i=0; i < eventWeapTargets.length; i++) {
		  eventWeapTargets[i].disabled = "disabled";
	    }
	}
	//Event weapon banner - Epitomized Path; character to pursue, if desired result mode is on
	else {
		simTypes[1].removeAttribute("disabled");
		
		guarantee4StarToggle.removeAttribute("disabled");
		guarantee5StarToggle.removeAttribute("disabled");
		
		realNonFeat4StarOdds.removeAttribute("disabled");
		
		for (i=0; i < eventCharTargets.length; i++) {
		  eventCharTargets[i].disabled = "disabled";
	    }
	    for (i=0; i < epitomizedPathOpts.length; i++) {
		  epitomizedPathOpts[i].removeAttribute("disabled");
	    }
		fatePointInput.removeAttribute("disabled");
		if (simTypes[1].checked) {
	      for (i=0; i < eventWeapTargets.length; i++) {
		    eventWeapTargets[i].removeAttribute("disabled");
	      }
		}
		else {
			for (i=0; i < eventWeapTargets.length; i++) {
				eventWeapTargets[i].disabled = "disabled";
			}
		}
	}
}

//Perform wish simulation
function runSim() {
	//Set variables to defaults
	initializeVars();
	
	//Fetch numeric inputs and sim goal
	goalVal = goalValInput.value;
	pity4 = pity4Input.value;
	pity5 = pity5Input.value;
	
	if(isNaN(goalVal)) {
		resultContainer.innerHTML = "Error: the value given for the target number of wishes/desired results was not a number.";
		return;
	}
	else if (goalVal < 1) {
		resultContainer.innerHTML = "Error: a non-positive target number of wishes/desired results was given.";
		return;
	}
	
	if(isNaN(pity4)) {
		resultContainer.innerHTML = "Error: the value given for the 4-star starting pity was not a number.";
		return;
	}
	else if (pity4 < 0) {
		resultContainer.innerHTML = "Error: the value for the 4-star starting pity cannot be negative.";
		return;
	}
	else if (pity4 > 9) {
		resultContainer.innerHTML = "Error: the value for the 4-star starting pity cannot exceed 9.";
		return;
	}
	
	if(isNaN(pity5)) {
		resultContainer.innerHTML = "Error: the value given for the 5-star starting pity was not a number.";
		return;
	}
	else if (pity5 < 0) {
		resultContainer.innerHTML = "Error: the value for the 5-star starting pity cannot be negative.";
		return;
	}
	else if (pity5 > 89) {
		resultContainer.innerHTML = "Error: the value for the 4-star starting pity cannot exceed 89.";
		return;
	}
	
	//Set guarantee flags
	if (guarantee4StarToggle.checked) {
		feat4Miss = true;
	}
	if (guarantee5StarToggle.checked) {
		feat5Miss = true;
	}
	
	//Determine if the sim is focusing on getting a desired result a set number of times or not
	if (simTypes[0].checked) {
		targetedSim = false;
	} else {
		targetedSim = true;
	}
	
	//Separate logic by banner type
	if (bannerTypes[0].checked) {
		runStandardSim();
	}
	else if (bannerTypes[1].checked) {
		runEventCharSim();
	}
	else {
		runEventWeapSim();
	}
}

//Set variables to starting values for each new simulation
function initializeVars() {
	simProgress = 0;
	count5any = 0;
	count4any = 0;
	count3 = 0;
	
	count5charAny = 0;
	count5charFeat = 0;
	count5weapAny = 0;
	count5weapFeat1 = 0;
	count5weapFeat2 = 0;
	
	count4charAny = 0;
	count4weapAny = 0;
	count4charFeat1 = 0;
	count4charFeat2 = 0;
	count4charFeat3 = 0;
	count4weapFeat1 = 0;
	count4weapFeat2 = 0;
	count4weapFeat3 = 0;
	count4weapFeat4 = 0;
	count4weapFeat5 = 0;
	
	feat5Miss = false;
	feat4Miss = false;
	fateActive = 0;
	fateCount = 0;
	
	nonFeat4Threshold = 500;
	
	wishCount = 0;
	
	resultContent = "";
}

//Random value function - fetch a number between 1 and X
function getRandVal(modifier) {
	return Math.floor(Math.random() * modifier) + 1;
}

//Standard banner simulation
function runStandardSim() {
	//Only total wish count can be the goal here due to a lack of featured characters
	//Check for 4-star and 5-star guarantee collision on first wish; resolve if necessary
	if (pity5 >= 89 && pity4 >= 9)  {
		//Trigger the 5-star guarantee
		simProgress++;
		count5any++;
		pity5 = 0;
		
		//Determine character/weapon typing
		
		randVal = getRandVal(1000);
		if (randVal >= 501) { //5-star weapon
			count5weapAny++;
		}
		else { //5-star character
			count5charAny++;
		}
		
		//Delay 4-star pity
		pity4++;
	}
	
	//Enter main loop
	while (simProgress < goalVal) {
		//Resolve 5-star guarantee, if active
		if (pity5 >= 89) {
			//Check for 4-star and 5-star guarantee collision; resolve if necessary
			if (pity4 >= 9) {
				//Replace last wish's 3-star with a 4-star, and update counters accordingly
				count3--;
				count4any++;
				pity4 = 0; //This happens on the previous wish, but we're going to increment this on the current wish
				
				randVal = getRandVal(1000);
				if (randVal >= 501) { //4-star weapon
					count4weapAny++;
				}
				else { //4-star character
					count4charAny++;
				}
			}
			
			//Resolve the 5-star guarantee
			simProgress++;
			count5any++;
			pity5 = 0;
			pity4++;
			
			randVal = getRandVal(1000);
		    if (randVal >= 501) { //5-star weapon
			    count5weapAny++;
		    }
		    else { //5-star character
			    count5charAny++;
		    }
		}
		else {
			randVal = getRandVal(1000);
			
			if (randVal >= 995) //5-star rolled
			{
				simProgress++;
				count5any++;
				pity5 = 0;
				
				//Check to see if this happened on a 4-star guarantee
				if (pity4 >= 9) {
					pity4 = 0;
				}
				else {
					pity4++;
				}
				
				randVal = getRandVal(1000);
		        if (randVal >= 501) { //5-star weapon
			        count5weapAny++;
		        }
		        else { //5-star character
			        count5charAny++;
		        }
			}
			else if (pity4 >= 9 || randVal >= 944) //4-star rolled
			{
				simProgress++;
				count4any++;
				pity5++;
				pity4 = 0;
				
				randVal = getRandVal(1000);
				if (randVal >= 501) { //4-star weapon
					count4weapAny++;
				}
				else { //4-star character
					count4charAny++;
				}
			}
			else { //3-star rolled
				simProgress++;
				count3++;
				pity5++;
				pity4++;
			}
		}
	}
	
	//Goal value reached, output results to screen
	resultContent = "Total wishes simulated: " + simProgress + "<br /><br />";
	
	resultContent += "5-star rolls: " + count5any + "<br />";
	resultContent += "5-star characters: " + count5charAny + "<br />";
	resultContent += "5-star weapons: " + count5weapAny + "<br /> <br />";
	
	resultContent += "4-star rolls: " + count4any + "<br />";
	resultContent += "4-star characters: " + count4charAny + "<br />";
	resultContent += "4-star weapons: " + count4weapAny + "<br /><br />";
	
	resultContent += "3-star weapons: " + count3 + "<br /><br />";
	
	resultContent += "Current 5-star pity count: " + pity5 + "<br />";
	resultContent += "Current 4-star pity count: " + pity4 + "<br />";
	
	resultContainer.innerHTML = resultContent;
	
}

//Event character banner simulation
function runEventCharSim() {
	//Set 4-star non-featured pull threshold, if necessary
	if (realNonFeat4StarOdds.checked) {
		nonFeat4Threshold = 150;
	}
	
	//Separate sim by goal type
	if (targetedSim == false) { //Wish count
		//Check for 4-star and 5-star collision on first wish; resolve if necessary
		if (pity5 >= 89 && pity4 >= 9)  {
		  //Trigger the 5-star guarantee
		  simProgress++;
		  count5charAny++;
		  pity5 = 0;
		
		  //Determine if rolled 5-star character is featured or not
		  randVal = getRandVal(1000);
		  if (feat5Miss || randVal >= 501) { //5-star featured character
			  count5charFeat++;
			  feat5Miss = false;
		  }
		  else { //5-star non-featured character
			  feat5Miss = true;
		  }
		
		  //Delay 4-star pity
		  pity4++;
	    }
		
		//Enter main loop
		while (simProgress < goalVal) {
			//Resolve 5-star guarantee, if active
			if (pity5 >= 89) {
				//Check for 4-star and 5-star guarantee collision; resolve if necessary
				if (pity4 >= 9) {
				  //Replace last wish's 3-star with a 4-star, and update counters accordingly
				  count3--;
				  count4any++;
				  pity4 = 0; //Since this needs to happen on the previous wish, but we're going to increment this on the current wish
				  
				  //Check for featured character hit
				  randVal = getRandVal(1000);
				  if (feat4Miss || randVal >= 501) { //Featured 4-star character
					  count4charAny++;
					  feat4Miss = false;
					  
					  //Determine which featured character this is
					  randVal = getRandVal(999);
					  if (randVal >= 667) { //Featured 4-star character 1
						count4charFeat1++;
					  }
					  else if (randVal >= 334) { //Featured 4-star character 2
						count4charFeat2++;
					  }
					  else { //Featured 4-star character 3
					   count4charFeat3++;
					  }
				  }
				  else { //Non-featured 4-star roll, check to see if it's a weapon or character
					 feat4Miss = true;
					 
					 randVal = getRandVal(1000);
					 if (randVal > nonFeat4Threshold) { //4-star weapon
						 count4weapAny++;
					 }
					 else { //4-star non-featured character
						 count4charAny++;
					 }
				  }
				}
				
				//Resolve the 5-star guarantee
				simProgress++;
				count5charAny++;
				pity5 = 0;
				pity4++;
				
				//Check for featured character 
				randVal = getRandVal(1000);
		        if (feat5Miss || randVal >= 501) { //5-star featured character
			       count5charFeat++;
			       feat5Miss = false;
		        }
		        else { //5-star non-featured character
			       feat5Miss = true;
		        }
			}
			else {
			  randVal = getRandVal(1000);

              if (randVal >= 995) { //5-star character
				  simProgress++;
				  count5charAny++;
				  pity5 = 0;
				  
				  //Check to see if this happened on a 4-star guarantee
				  if (pity4 >= 9) {
					  pity4 = 0;
				  }
				  else {
					  pity4++;
				  }
				  
				  //Check for featured character
				  randVal = getRandVal(1000);
		          if (feat5Miss || randVal >= 501) { //5-star featured character
			         count5charFeat++;
			         feat5Miss = false;
		          }
		          else { //5-star non-featured character
			         feat5Miss = true;
		          }
			  }
			  else if (pity4 >= 9 || randVal >= 944) { //4-star rolled
				  simProgress++;
				  count4any++;
				  pity5++;
				  pity4 = 0;
				  
				  randVal = getRandVal(1000);
				  //Check for featured character hit
				   if (feat4Miss || randVal >= 501) { //Featured 4-star character
				      count4charAny++;
					  feat4Miss = false;
					  
				      //Determine which featured character this is
				      randVal = getRandVal(999);
					  if (randVal >= 667) { //Featured 4-star character 1
					    count4charFeat1++;
					  }
					  else if (randVal >= 334) { //Featured 4-star character 2
						count4charFeat2++;
					  }
					  else { //Featured 4-star character 3
						count4charFeat3++;
					  }
					}
					else { //Non-featured 4-star, check for character or weapon roll
						feat4Miss = true;
						
						randVal = getRandVal(1000);
						if (randVal > nonFeat4Threshold) { //4-star weapon
							count4weapAny++;
						}
						else { //4-star non-featured character
							count4charAny++;
						}
					}
			  }
			  else { //3-star rolled
				  simProgress++;
				  count3++;
				  pity5++;
				  pity4++;
			  }
			}
		}
		
		//Goal value reached, output results
		resultContent = "Total wishes simulated: " + simProgress + "<br /><br />";
		
		resultContent += "5-star characters: " + count5charAny + "<br />";
		resultContent += "5-star featured characters: " + count5charFeat + "<br /><br />";
		
		resultContent += "4-star rolls: " + count4any + "<br />";
		resultContent += "4-star character rolls: " + count4charAny + "<br />";
		resultContent += "- 4-star featured character 1 rolls: " + count4charFeat1 + "<br />";
		resultContent += "- 4-star featured character 2 rolls: " + count4charFeat2 + "<br />";
		resultContent += "- 4-star featured character 3 rolls: " + count4charFeat3 + "<br />";
		resultContent += "4-star weapon rolls: " + count4weapAny + "<br /><br />";
		
		resultContent += "3-star weapon rolls: " + count3 + "<br /><br />";
		
		resultContent += "Current 5-star pity count: " + pity5 + "<br />";
	    resultContent += "Current 4-star pity count: " + pity4 + "<br />";
		
		if (feat5Miss) {
			resultContent += "Next 5-star character will be featured<br />";
		} else {
			resultContent += "Next 5-star character is not guaranteed to be featured<br />";
		}
		
		if (feat4Miss) {
			resultContent += "Next 4-star roll will be a featured character<br />";
		} else {
			resultContent += "Next 4-star roll is not guaranteed to be a featured character<br />";
		}
		
		resultContainer.innerHTML = resultContent;
	}
	else { //Desired result count
	    //Determine result target
		var flagChar5Feat = false;
		var flagChar4Feat1 = false;
		var flagChar4Feat2 = false;
		var flagChar4Feat3 = false;
		
		if (eventCharTargets[0].checked) { //Target 5-star featured character
			flagChar5Feat = true;
		}
		else if (eventCharTargets[1].checked) { //Target 4-star featured character 1
			flagChar4Feat1 = true;
		}
		else if (eventCharTargets[2].checked) { //Target 4-star featured character 2
			flagChar4Feat2 = true;
		}
		else { //Target 4-star featured character 3
			flagChar4Feat3 = true;
		}
	
		//Check for 4-star and 5-star collision on first wish; resolve if necessary
		if (pity5 >= 89 && pity4 >= 9)  {
		  //Trigger the 5-star guarantee
		  wishCount++;
		  count5charAny++;
		  pity5 = 0;
		
		  //Determine if rolled 5-star character is featured or not
		  randVal = getRandVal(1000);
		  if (feat5Miss || randVal >= 501) { //5-star featured character
			  count5charFeat++;
			  feat5Miss = false;
			  
			  if (flagChar5Feat) { //If 5-star featured characters are the goal, advance simulator progress
				  simProgress++;
			  }
		  }
		  else { //5-star non-featured character
			  feat5Miss = true;
		  }
		
		  //Delay 4-star pity
		  pity4++;
	    }
		
		//Enter main loop
		while (simProgress < goalVal) {
			//Resolve 5-star guarantee, if active
			if (pity5 >= 89) {
				//Check for 4-star and 5-star guarantee collision; resolve if necessary
				if (pity4 >= 9) {
				  //Replace last wish's 3-star with a 4-star, and update counters accordingly
				  count3--;
				  count4any++;
				  pity4 = 0; //Since this needs to happen on the previous wish, but we're going to increment this on the current wish
				  
				  //Check for featured character hit
				  randVal = getRandVal(1000);
				  if (feat4Miss || randVal >= 501) { //Featured 4-star character
					  count4charAny++;
					  feat4Miss = false;
					  
					  //Determine which featured character this is
					  randVal = getRandVal(999);
					  if (randVal >= 667) { //Featured 4-star character 1
						count4charFeat1++;
						
						if (flagChar4Feat1) {
							simProgress++;
						}
					  }
					  else if (randVal >= 334) { //Featured 4-star character 2
						count4charFeat2++;
						
						if (flagChar4Feat2) {
							simProgress++;
						}
					  }
					  else { //Featured 4-star character 3
					    count4charFeat3++;
					   
					    if (flagChar4Feat3) {
						    simProgress++;
					    }
					  }
				  }
				  else { //Non-featured 4-star roll, check to see if it's a weapon or character
					 feat4Miss = true;
					 
					 randVal = getRandVal(1000);
					 if (randVal > nonFeat4Threshold) { //4-star weapon
						 count4weapAny++;
					 }
					 else { //4-star non-featured character
						 count4charAny++;
					 }
				  }
				}
				
				//Resolve the 5-star guarantee
				wishCount++;
				count5charAny++;
				pity5 = 0;
				pity4++;
				
				//Check for featured character 
				randVal = getRandVal(1000);
		        if (feat5Miss || randVal >= 501) { //5-star featured character
			       count5charFeat++;
			       feat5Miss = false;
				   
				   if (flagChar5Feat) { //If the 5-star featured character is the goal, advance simulator progress
					   simProgress++;
				   }
		        }
		        else { //5-star non-featured character
			       feat5Miss = true;
		        }
			}
			else {
			  randVal = getRandVal(1000);

              if (randVal >= 995) { //5-star character
				  wishCount++;
				  count5charAny++;
				  pity5 = 0;
				  
				  //Check to see if this happened on a 4-star guarantee
				  if (pity4 >= 9) {
					  pity4 = 0;
				  }
				  else {
					  pity4++;
				  }
				  
				  //Check for featured character
				  randVal = getRandVal(1000);
		          if (feat5Miss || randVal >= 501) { //5-star featured character
			         count5charFeat++;
			         feat5Miss = false;
					 
					 if (flagChar5Feat) { //If the 5-star featured character is the goal, advance simulator progress
					   simProgress++;
				     }
		          }
		          else { //5-star non-featured character
			         feat5Miss = true;
		          }
			  }
			  else if (pity4 >= 9 || randVal >= 944) { //4-star rolled
				  wishCount++;
				  count4any++;
				  pity5++;
				  pity4 = 0;
				  
				  randVal = getRandVal(1000);
				  //Check for featured character hit
				   if (feat4Miss || randVal >= 501) { //Featured 4-star character
				      count4charAny++;
					  feat4Miss = false;
					  
				      //Determine which featured character this is
				      randVal = getRandVal(999);
					  if (randVal >= 667) { //Featured 4-star character 1
					    count4charFeat1++;
						
						if (flagChar4Feat1) { //If the first 4-star featured character is the goal, advance simulator progress
							simProgress++;
						}
					  }
					  else if (randVal >= 334) { //Featured 4-star character 2
						count4charFeat2++;
						
						if (flagChar4Feat2) { //If the second 4-star featured character is the goal, advance simulator progress
							simProgress++;
						}
					  }
					  else { //Featured 4-star character 3
						count4charFeat3++;
						
						if (flagChar4Feat3) { //If the third 4-star featured character is the goal, advance simulator progress
							simProgress++;
						}
					  }
					}
					else { //Non-featured 4-star, check for character or weapon roll
						feat4Miss = true;
						randVal = getRandVal(1000);
						  
						if (randVal > nonFeat4Threshold) { //4-star weapon
							count4weapAny++;
						}
						else { //4-star non-featured character
							count4charAny++;
						}
					}
			  }
			  else { //3-star rolled
				  wishCount++;
				  count3++;
				  pity5++;
				  pity4++;
			  }
			}
		}
		
		//Goal value reached, output results
		resultContent = "Total wishes simulated: " + wishCount + "<br /><br />";
		
		resultContent += "5-star characters: " + count5charAny + "<br />";
		resultContent += "5-star featured characters: " + count5charFeat + "<br /><br />";
		
		resultContent += "4-star rolls: " + count4any + "<br />";
		resultContent += "4-star character rolls: " + count4charAny + "<br />";
		resultContent += "- 4-star featured character 1 rolls: " + count4charFeat1 + "<br />";
		resultContent += "- 4-star featured character 2 rolls: " + count4charFeat2 + "<br />";
		resultContent += "- 4-star featured character 3 rolls: " + count4charFeat3 + "<br />";
		resultContent += "4-star weapon rolls: " + count4weapAny + "<br /><br />";
		
		resultContent += "3-star weapon rolls: " + count3 + "<br /><br />";
		
		resultContent += "Current 5-star pity count: " + pity5 + "<br />";
	    resultContent += "Current 4-star pity count: " + pity4 + "<br />";
		
		if (feat5Miss) {
			resultContent += "Next 5-star character will be featured<br />";
		} else {
			resultContent += "Next 5-star character is not guaranteed to be featured<br />";
		}
		
		if (feat4Miss) {
			resultContent += "Next 4-star roll will be a featured character<br />";
		} else {
			resultContent += "Next 4-star roll is not guaranteed to be a featured character<br />";
		}
		
		resultContainer.innerHTML = resultContent;
	}
}

//Event weapon banner simulation
function runEventWeapSim() {
	//Check for pity value error
	if (pity5 > 79) {
		resultContent = "Error: the maximum 5-star pity value for an event weapon banner is 79. The pity provided was " + pity5 + ".";
		resultContainer.innerHTML = resultContent;
		return;
	}
	
	//Check for Epitomized Path status
	if (epitomizedPathOpts[0].checked) { //Disable Epitomized Path
		fateActive = 0;
	}
	else if (epitomizedPathOpts[1].checked) { //Epitomized Path focused on featured 5-star weapon 1
		fateActive = 1;
		fateCount = fatePointInput.value;
		
		if(isNaN(fateCount)) {
			resultContainer.innerHTML = "Error: the given starting value of Fate Points for Epitomized Path was not a number.";
			return;
		}
		else if (fateCount < 0) {
			resultContainer.innerHTML = "Error: the starting number of Fate Points cannot be negative.";
			return;
		}
		else if (fateCount > 2) {
			resultContainer.innerHTML = "Error: the starting number of Fate Points cannot exceed 2.";
			return;
		}
	}
	else { //Epitomized Path focused on featured 5-star weapon 2
		fateActive = 2;
		fateCount = fatePointInput.value;
		
		if(isNaN(fateCount)) {
			resultContainer.innerHTML = "Error: the given starting value of Fate Points for Epitomized Path was not a number.";
			return;
		}
		else if (fateCount < 0) {
			resultContainer.innerHTML = "Error: the starting number of Fate Points cannot be negative.";
			return;
		}
		else if (fateCount > 2) {
			resultContainer.innerHTML = "Error: the starting number of Fate Points cannot exceed 2.";
			return;
		}
	}
	
	//Set 4-star non-featured pull threshold, if necessary
	if (realNonFeat4StarOdds.checked) {
		nonFeat4Threshold = 925;
	}
	
	//Separate sim by goal type
	if (targetedSim == false) { //Wish count mode
		//Check for 4-star and 5-star guarantee collision on first wish, resolve if necessary
		if (pity5 >= 79 && pity4 >= 9) {
			//Trigger the 5-star guarantee
			simProgress++;
			count5weapAny++;
			pity5 = 0;
			
			//Determine if the 5-star weap is featured or not; Epitomized Path may play a role in this
			if (fateCount == 2) { //Epitomized Path forcing a featured weapon
				if (fateActive == 1) {
					count5WeapFeat1++;
				}
				else {
					count5WeapFeat2++;
				}
				fateCount = 0;
				feat5Miss = false;
			}
			else {
				randVal = getRandVal(1000);
				if (feat5Miss || randVal >= 251) { //Featured 5-star weapon hit; determine which one was hit
				    feat5Miss = false;
					randVal = getRandVal(1000);
					if (randVal >= 501) { //Featured 5-star weapon 1 hit
						count5weapFeat1++;
						
						if (fateActive == 2) { //If Epitomized Path is focused on the second weapon, add a Fate Point
							fateCount++;
						}
						else { //Either Epitomized Path is disabled, or the desired featured weapon was hit, so reset the counter
							fateCount = 0;
						}
					}
					else { //Featured 5-star weapon 2 hit
						count5weapFeat2++;
						
						if (fateActive == 1) { //If Epitomized Path is focused on the first weapon, add a Fate Point
							fateCount++;
						}
						else { //Either Epitomized Path is disabled, or the desired featured weapon was hit, so reset the counter
							fateCount = 0;
						}
					}
				}
				else { //Non-featured 5-star weapon hit
					feat5Miss = true;
					if (fateActive != 0) { //If Epitomized Path isn't disabled, add a Fate Point
						fateCount++;
					}
				}
			}
			
			//Delay 4-star pity
			pity4++;
		}
		
		//Enter main loop
		while (simProgress < goalVal) {
			//Resolve 5-star guarantee, if active
			if (pity5 >= 79) {
				//Check for 4-star and 5-star collision, resolve if necessary
				if (pity4 >= 9) {
					//Replace last wish's 3-star with a 4-star, and update counters accordingly
				    count3--;
				    count4any++;
				    pity4 = 0; //Since this needs to happen on the previous wish, but we're going to increment this on the current wish
					
					//Check for featured weapon hit
					randVal = getRandVal(1000);
					if (feat4Miss || randVal >= 251) { //Featured 4-star weapon, determine which one it is
						count4weapAny++;
						feat4Miss = false;
						
						randVal = getRandVal(1000);
						if (randVal >= 801) { //Featured 4-star weapon 1
							count4weapFeat1++;
						}
						else if (randVal >= 601) { //Featured 4-star weapon 2
							count4weapFeat2++;
						}
						else if (randVal >= 401) { //Featured 4-star weapon 3
							count4weapFeat3++;
						}
						else if (randVal >= 201) { //Featured 4-star weapon 4
							count4weapFeat4++;
						}
						else { //Featured 4-star weapon 5
							count4weapFeat5++;
						}
					}
					else { //Non-featured 4-star, check to see if it's a weapon or character
						feat4Miss = true;
						
						randVal = getRandVal(1000);
						if (randVal > nonFeat4Threshold) { //Non-featured 4-star weapon
							count4weapAny++;
						}
						else { //4-star character
							count4charAny++;
						}
					}
				}
				
				//Resolve the 5-star guarantee
				simProgress++;
				count5weapAny++;
				pity5 = 0;
				pity4++;
				
				//Check for featured weapon
				randVal = getRandVal(1000);
				if (fateCount == 2) { //Forced featured 5-star weapon via Epitomized Path
					fateCount = 0;
					feat5Miss = false;
					
					if (fateActive == 1) {
						count5weapFeat1++;
					}
					else {
						count5weapFeat2++;
					}
				}
				else if (feat5Miss || randVal >= 251) { //Featured 5-star weapon, determine which one it is
					feat5Miss = false;
					
					randVal = getRandVal(1000);
					if (randVal >= 501) { //Featured 5-star weapon 1 hit
						count5weapFeat1++;
						
						if (fateActive == 2) { //If Epitomized Path is focused on featured 5-star weapon 2, add a Fate Point
							fateCount++;
						}
						else { //Epitomized Path is either disabled or focused on featured 5-star weapon 1 - set Fate Points to 0
							fateCount = 0;
						}
					}
					else { //Featured 5-star weapon 2 hit
						count5weapFeat2++;
						
						if (fateActive == 1) { //If Epitomized Path is focused on featured 5-star weapon 1, add a Fate Point
							fateCount++;
						}
						else { //Epitomized Path is either disabled or focused on featured 5-star weapon 2 - set Fate Points to 0
							fateCount = 0;
						}
					}
				}
				else { //Non-featured 5-star weapon
					feat5Miss = true;
					
					if (fateActive != 0) {
						fateCount++;
					}
				}
			}
			else {
				randVal = getRandVal(1000);
				
				if (randVal >= 994) { //5-star weapon
					simProgress++;
					count5weapAny++;
					pity5 = 0;
					
					//Check to see if this happened on a 4-star guarantee
					if (pity4 >= 9) {
						pity4 = 0;
					}
					else {
						pity4++;
					}
					
					//Check to see if a featured weapon was hit
					randVal = getRandVal(1000);
					if (fateCount == 2) { //Epitomized Path forcing featured 5-star weapon hit
					    fateCount = 0;
						feat5Miss = false;
						
						if (fateActive == 1) {
						    count5weapFeat1++;
					    }
					    else {
						    count5weapFeat2++;
					    }
					}
					else if (feat5Miss || randVal >= 251) { //Featured 5-star weapon hit, determine which one
						feat5Miss = false;
						
						randVal = getRandVal(1000);
					    if (randVal >= 501) { //Featured 5-star weapon 1 hit
						    count5weapFeat1++;
						
						    if (fateActive == 2) { //If Epitomized Path is focused on featured 5-star weapon 2, add a Fate Point
							    fateCount++;
						    }
						    else { //Epitomized Path is either disabled or focused on featured 5-star weapon 1 - set Fate Points to 0
							    fateCount = 0;
						    }
					    }
					    else { //Featured 5-star weapon 2 hit
						    count5weapFeat2++;
						
						    if (fateActive == 1) { //If Epitomized Path is focused on featured 5-star weapon 1, add a Fate Point
							    fateCount++;
						    }
						    else { //Epitomized Path is either disabled or focused on featured 5-star weapon 2 - set Fate Points to 0
							    fateCount = 0;
						    }
					    }
					}
					else { //Non-featured 5-star weapon hit
						feat5Miss = true;
						
						if (fateActive != 0) {
							fateCount++;
						}
					}
				}
				else if (pity4 >= 9 || randVal >= 934) { //4-star roll, determine if it's a character or weapon
				    simProgress++;
				    count4any++;
					pity5++;
					pity4 = 0;
				
					//Check for featured weapon hit
					randVal = getRandVal(1000);
					
					if (feat4Miss || randVal >= 251) { //Featured 4-star weapon hit, determine which one
						feat4Miss = false;
						count4weapAny++;
						
						randVal = getRandVal(1000);
						if (randVal >= 801) { //Featured 4-star weapon 1
							count4weapFeat1++;
						}
						else if (randVal >= 601) { //Featured 4-star weapon 2
							count4weapFeat2++;
						}
						else if (randVal >= 401) { //Featured 4-star weapon 3
							count4weapFeat3++;
						}
						else if (randVal >= 201) { //Featured 4-star weapon 4
							count4weapFeat4++;
						}
						else { //Featured 4-star weapon 5
							count4weapFeat5++;
						}
						
					}
					else { //Non-featured 4-star hit, determine if it's a weapon or character
						feat4Miss = true;
						
						randVal = getRandVal(1000);
						if (randVal > nonFeat4Threshold) { //Non-featured 4-star weapon
							count4weapAny++;
						}
						else { //4-star character
							count4charAny++;
						}
					}
				}
				else { //3-star weapon
					simProgress++;
					count3++;
					pity5++;
					pity4++;
				}
			}
		}
		
		//Goal value reached, output results
		resultContent = "Total wishes simulated: " + simProgress + "<br /><br />";
		
		resultContent += "5-star weapons: " + count5weapAny + "<br />";
		resultContent += "- 5-star featured weapon 1 rolls: " + count5weapFeat1 + "<br />";
		resultContent += "- 5-star featured weapon 2 rolls: " + count5weapFeat2 + "<br /><br />";
		
		resultContent += "4-star rolls: " + count4any + "<br />";
		resultContent += "4-star weapon rolls: " + count4weapAny + "<br />";
		resultContent += "- 4-star featured weapon 1 rolls: " + count4weapFeat1 + "<br />";
		resultContent += "- 4-star featured weapon 2 rolls: " + count4weapFeat2 + "<br />";
		resultContent += "- 4-star featured weapon 3 rolls: " + count4weapFeat3 + "<br />";
		resultContent += "- 4-star featured weapon 4 rolls: " + count4weapFeat4 + "<br />";
		resultContent += "- 4-star featured weapon 5 rolls: " + count4weapFeat5 + "<br />";
		resultContent += "4-star character rolls: " + count4charAny + "<br /><br />";
		
		resultContent += "3-star weapon rolls: " + count3 + "<br /><br />";
		
		resultContent += "Current 5-star pity count: " + pity5 + "<br />";
	    resultContent += "Current 4-star pity count: " + pity4 + "<br />";
		
		if (fateCount == 2) {
			resultContent += "Next 5-star weapon will be the weapon chosen through Epitomized Path<br />";
		}
		else if (feat5Miss) {
			resultContent += "Next 5-star weapon will be featured<br />";
		}
		else {
			resultContent += "Next 5-star weapon is not guaranteed to be featured<br />";
		}
		
		if (feat4Miss) {
			resultContent += "Next 4-star roll will be a featured weapon<br /><br />";
		} else {
			resultContent += "Next 4-star roll is not guaranteed to be a featured weapon<br /><br />";
		}
		
		if (fateActive == 1) {
		  if (fateCount != 1) {
			  resultContent += "There are currently " + fateCount + " Fate Points active for featured weapon 1<br />";	
		  }
		  else {
			  resultContent += "There is currently " + fateCount + " Fate Point active for featured weapon 1<br />";	
		  }
		}
		else if (fateActive == 2) {
		  if (fateCount != 1) {
			resultContent += "There are currently " + fateCount + " Fate Points active for featured weapon 2<br />";	
		  }
		  else {
			resultContent += "There is currently " + fateCount + " Fate Point active for featured weapon 2<br />";	
		  }
		}
		
		resultContainer.innerHTML = resultContent;
	}
	else { //Desired result mode
		//Determine desired target
		var flagWeap5Feat1 = false;
		var flagWeap5Feat2 = false;
		var flagWeap4Feat1 = false;
		var flagWeap4Feat2 = false;
		var flagWeap4Feat3 = false;
		var flagWeap4Feat4 = false;
		var flagWeap4Feat5 = false;
		
		if (eventWeapTargets[0].checked) { //Featured 5-star weapon 1
			flagWeap5Feat1 = true;
		}
		else if (eventWeapTargets[1].checked) { //Featured 5-star weapon 2
			flagWeap5Feat2 = true;
		}
		else if (eventWeapTargets[2].checked) { //Featured 4-star weapon 1
			flagWeap4Feat1 = true;
		}
		else if (eventWeapTargets[3].checked) { //Featured 4-star weapon 2
			flagWeap4Feat2 = true;
		}
		else if (eventWeapTargets[4].checked) { //Featured 4-star weapon 3
			flagWeap4Feat3 = true;
		}
		else if (eventWeapTargets[5].checked) { //Featured 4-star weapon 4
			flagWeap4Feat4 = true;
		}
		else { //Featured 4-star weapon 5
			flagWeap4Feat5 = true;
		}
		
		//Check for 4-star and 5-star guarantee collision on first wish, resolve if necessary
		if (pity5 >= 79 && pity4 >= 9) {
			//Trigger the 5-star guarantee
			wishCount++;
			count5weapAny++;
			pity5 = 0;
			
			//Determine if the 5-star weap is featured or not; Epitomized Path may play a role in this
			if (fateCount == 2) { //Epitomized Path forcing a featured weapon
				if (fateActive == 1) {
					count5WeapFeat1++;
					
					if (flagWeap5Feat1) {
						simProgress++;
					}
				}
				else {
					count5WeapFeat2++;
					
					if (flagWeap5Feat2) {
						simProgress++;
					}
				}
				fateCount = 0;
				feat5Miss = false;
			}
			else {
				randVal = getRandVal(1000);
				if (feat5Miss || randVal >= 251) { //Featured 5-star weapon hit; determine which one was hit
				    feat5Miss = false;
					randVal = getRandVal(1000);
					if (randVal >= 501) { //Featured 5-star weapon 1 hit
						count5weapFeat1++;
						
						if (fateActive == 2) { //If Epitomized Path is focused on the second weapon, add a Fate Point
							fateCount++;
						}
						else { //Either Epitomized Path is disabled, or the desired featured weapon was hit, so reset the counter
							fateCount = 0;
						}
						
						if (flagWeap5Feat1) {
							simProgress++;
						}
					}
					else { //Featured 5-star weapon 2 hit
						count5weapFeat2++;
						
						if (fateActive == 1) { //If Epitomized Path is focused on the first weapon, add a Fate Point
							fateCount++;
						}
						else { //Either Epitomized Path is disabled, or the desired featured weapon was hit, so reset the counter
							fateCount = 0;
						}
						
						if (flagWeap5Feat2) {
							simProgress++;
						}
					}
				}
				else { //Non-featured 5-star weapon hit
					feat5Miss = true;
					if (fateActive != 0) { //If Epitomized Path isn't disabled, add a Fate Point
						fateCount++;
					}
				}
			}
			
			//Delay 4-star pity
			pity4++;
		}
		
		//Enter main loop
		while (simProgress < goalVal) {
			//Resolve 5-star guarantee, if active
			if (pity5 >= 79) {
				//Check for 4-star and 5-star collision, resolve if necessary
				if (pity4 >= 9) {
					//Replace last wish's 3-star with a 4-star, and update counters accordingly
				    count3--;
				    count4any++;
				    pity4 = 0; //Since this needs to happen on the previous wish, but we're going to increment this on the current wish
					
					//Check for featured weapon hit
					randVal = getRandVal(1000);
					if (feat4Miss || randVal >= 251) { //Featured 4-star weapon, determine which one it is
						count4weapAny++;
						feat4Miss = false;
						
						randVal = getRandVal(1000);
						if (randVal >= 801) { //Featured 4-star weapon 1
							count4weapFeat1++;
							
							if (flagWeap4Feat1) {
								simProgress++;
							}
						}
						else if (randVal >= 601) { //Featured 4-star weapon 2
							count4weapFeat2++;
							
							if (flagWeap4Feat2) {
								simProgress++;
							}
						}
						else if (randVal >= 401) { //Featured 4-star weapon 3
							count4weapFeat3++;
							
							if (flagWeap4Feat3) {
								simProgress++;
							}
						}
						else if (randVal >= 201) { //Featured 4-star weapon 4
							count4weapFeat4++;
							
							if (flagWeap4Feat4) {
								simProgress++;
							}
						}
						else { //Featured 4-star weapon 5
							count4weapFeat5++;
							
							if (flagWeap4Feat5) {
								simProgress++;
							}
						}
					}
					else { //Non-featured 4-star, check to see if it's a weapon or character
						feat4Miss = true;
						
						randVal = getRandVal(1000);
						if (randVal > nonFeat4Threshold) { //Non-featured 4-star weapon
							count4weapAny++;
						}
						else { //4-star character
							count4charAny++;
						}
					}
				}
				
				//Resolve the 5-star guarantee
				wishCount++;
				count5weapAny++;
				pity5 = 0;
				pity4++;
				
				//Check for featured weapon
				randVal = getRandVal(1000);
				if (fateCount == 2) { //Forced featured 5-star weapon via Epitomized Path
					fateCount = 0;
					feat5Miss = false;
					
					if (fateActive == 1) {
						count5weapFeat1++;
						
						if (flagWeap5Feat1) {
							simProgress++;
						}
					}
					else {
						count5weapFeat2++;
						
						if (flagWeap5Feat2) {
							simProgress++;
						}
					}
				}
				else if (feat5Miss || randVal >= 251) { //Featured 5-star weapon, determine which one it is
					feat5Miss = false;
					
					randVal = getRandVal(1000);
					if (randVal >= 501) { //Featured 5-star weapon 1 hit
						count5weapFeat1++;
						
						if (fateActive == 2) { //If Epitomized Path is focused on featured 5-star weapon 2, add a Fate Point
							fateCount++;
						}
						else { //Epitomized Path is either disabled or focused on featured 5-star weapon 1 - set Fate Points to 0
							fateCount = 0;
						}
						
						if (flagWeap5Feat1) {
							simProgress++;
						}
					}
					else { //Featured 5-star weapon 2 hit
						count5weapFeat2++;
						
						if (fateActive == 1) { //If Epitomized Path is focused on featured 5-star weapon 1, add a Fate Point
							fateCount++;
						}
						else { //Epitomized Path is either disabled or focused on featured 5-star weapon 2 - set Fate Points to 0
							fateCount = 0;
						}
						
						if (flagWeap5Feat2) {
							simProgress++;
						}
					}
				}
				else { //Non-featured 5-star weapon
					feat5Miss = true;
					
					if (fateActive != 0) {
						fateCount++;
					}
				}
			}
			else {
				randVal = getRandVal(1000);
				
				if (randVal >= 994) { //5-star weapon
					wishCount++;
					count5weapAny++;
					pity5 = 0;
					
					//Check to see if this happened on a 4-star guarantee
					if (pity4 >= 9) {
						pity4 = 0;
					}
					else {
						pity4++;
					}
					
					//Check to see if a featured weapon was hit
					randVal = getRandVal(1000);
					if (fateCount == 2) { //Epitomized Path forcing featured 5-star weapon hit
					    fateCount = 0;
						feat5Miss = false;
						
						if (fateActive == 1) {
						    count5weapFeat1++;
							
							if (flagWeap5Feat1) {
								simProgress++;
							}
					    }
					    else {
						    count5weapFeat2++;
							
							if (flagWeap5Feat2) {
								simProgress++;
							}
					    }
					}
					else if (feat5Miss || randVal >= 251) { //Featured 5-star weapon hit, determine which one
						feat5Miss = false;
						
						randVal = getRandVal(1000);
					    if (randVal >= 501) { //Featured 5-star weapon 1 hit
						    count5weapFeat1++;
						
						    if (fateActive == 2) { //If Epitomized Path is focused on featured 5-star weapon 2, add a Fate Point
							    fateCount++;
						    }
						    else { //Epitomized Path is either disabled or focused on featured 5-star weapon 1 - set Fate Points to 0
							    fateCount = 0;
						    }
							
							if (flagWeap5Feat1) {
								simProgress++;
							}
					    }
					    else { //Featured 5-star weapon 2 hit
						    count5weapFeat2++;
						
						    if (fateActive == 1) { //If Epitomized Path is focused on featured 5-star weapon 1, add a Fate Point
							    fateCount++;
						    }
						    else { //Epitomized Path is either disabled or focused on featured 5-star weapon 2 - set Fate Points to 0
							    fateCount = 0;
						    }
							
							if (flagWeap5Feat2) {
								simProgress++;
							}
					    }
					}
					else { //Non-featured 5-star weapon hit
						feat5Miss = true;
						
						if (fateActive != 0) {
							fateCount++;
						}
					}
				}
				else if (pity4 >= 9 || randVal >= 934) { //4-star roll, determine if it's a character or weapon
				    wishCount++;
				    count4any++;
					pity5++;
					pity4 = 0;
				
					//Check for featured weapon hit
					randVal = getRandVal(1000);
					
					if (feat4Miss || randVal >= 251) { //Featured 4-star weapon hit, determine which one
						feat4Miss = false;
						count4weapAny++;
						
						randVal = getRandVal(1000);
						if (randVal >= 801) { //Featured 4-star weapon 1
							count4weapFeat1++;
							
							if (flagWeap4Feat1) {
								simProgress++;
							}
						}
						else if (randVal >= 601) { //Featured 4-star weapon 2
							count4weapFeat2++;
							
							if (flagWeap4Feat2) {
								simProgress++;
							}
						}
						else if (randVal >= 401) { //Featured 4-star weapon 3
							count4weapFeat3++;
							
							if (flagWeap4Feat3) {
								simProgress++;
							}
						}
						else if (randVal >= 201) { //Featured 4-star weapon 4
							count4weapFeat4++;
							
							if (flagWeap4Feat4) {
								simProgress++;
							}
						}
						else { //Featured 4-star weapon 5
							count4weapFeat5++;
							
							if (flagWeap4Feat5) {
								simProgress++;
							}
						}
						
					}
					else { //Non-featured 4-star hit, determine if it's a weapon or character
						feat4Miss = true;
						
						randVal = getRandVal(1000);
						if (randVal > nonFeat4Threshold) { //Non-featured 4-star weapon
							count4weapAny++;
						}
						else { //4-star character
							count4charAny++;
						}
					}
				}
				else { //3-star weapon
					wishCount++;
					count3++;
					pity5++;
					pity4++;
				}
			}
		}
		
		//Goal value reached, output results
		resultContent = "Total wishes simulated: " + wishCount + "<br /><br />";
		
		resultContent += "5-star weapons: " + count5weapAny + "<br />";
		resultContent += "- 5-star featured weapon 1 rolls: " + count5weapFeat1 + "<br />";
		resultContent += "- 5-star featured weapon 2 rolls: " + count5weapFeat2 + "<br /><br />";
		
		resultContent += "4-star rolls: " + count4any + "<br />";
		resultContent += "4-star weapon rolls: " + count4weapAny + "<br />";
		resultContent += "- 4-star featured weapon 1 rolls: " + count4weapFeat1 + "<br />";
		resultContent += "- 4-star featured weapon 2 rolls: " + count4weapFeat2 + "<br />";
		resultContent += "- 4-star featured weapon 3 rolls: " + count4weapFeat3 + "<br />";
		resultContent += "- 4-star featured weapon 4 rolls: " + count4weapFeat4 + "<br />";
		resultContent += "- 4-star featured weapon 5 rolls: " + count4weapFeat5 + "<br />";
		resultContent += "4-star character rolls: " + count4charAny + "<br /><br />";
		
		resultContent += "3-star weapon rolls: " + count3 + "<br /><br />";
		
		resultContent += "Current 5-star pity count: " + pity5 + "<br />";
	    resultContent += "Current 4-star pity count: " + pity4 + "<br />";
		
		if (fateCount == 2) {
			resultContent += "Next 5-star weapon will be the weapon chosen through Epitomized Path<br />";
		}
		else if (feat5Miss) {
			resultContent += "Next 5-star weapon will be featured<br />";
		}
		else {
			resultContent += "Next 5-star weapon is not guaranteed to be featured<br />";
		}
		
		if (feat4Miss) {
			resultContent += "Next 4-star roll will be a featured weapon<br /><br />";
		} else {
			resultContent += "Next 4-star roll is not guaranteed to be a featured weapon<br /><br />";
		}
		
		if (fateActive == 1) {
		  if (fateCount != 1) {
			  resultContent += "There are currently " + fateCount + " Fate Points active for featured weapon 1<br />";	
		  }
		  else {
			  resultContent += "There is currently " + fateCount + " Fate Point active for featured weapon 1<br />";	
		  }
		}
		else if (fateActive == 2) {
		  if (fateCount != 1) {
			resultContent += "There are currently " + fateCount + " Fate Points active for featured weapon 2<br />";	
		  }
		  else {
			resultContent += "There is currently " + fateCount + " Fate Point active for featured weapon 2<br />";	
		  }
		}
		
		resultContainer.innerHTML = resultContent;
	}
}
