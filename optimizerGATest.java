package gaoptimizetest;

import java.util.Scanner;
import java.util.Random;

class UserStats
{
	double weapBasePow = 0;
	double weapMinPow = 0;
	double weapMaxPow = 0;
	
	double baseAP = 0;
	double percDmg = 0;
	double critMod = 0;
	double defPrc = 0;
	int userPrc = 0;
	double baseDmg = 0;
	
	public UserStats()
	{
		Scanner in = new Scanner(System.in);
		
		System.out.println("Enter your weapon's base attack power, after passives: ");
		weapBasePow = in.nextDouble();
		
		System.out.println("Enter your weapon's minimum attack power, after passives: ");
		weapMinPow = in.nextDouble();
		
		System.out.println("Enter your weapon's maximum attack power, after passives: ");
		weapMaxPow = in.nextDouble();
		
		System.out.println("Enter your overall base attack power: ");
		baseAP = in.nextDouble();
		
		System.out.println("Enter the percent damage of your attack: ");
		percDmg = in.nextDouble();
		
		System.out.println("Enter your critical damage modifier: ");
		critMod = in.nextDouble();
		
		System.out.println("Enter your target's % defense: ");
		defPrc = in.nextDouble();
		
		System.out.println("Enter the % stats you want to distribute, to the nearest whole percent: ");
		userPrc = in.nextInt();
		
		in.close();
		
		
		
		baseDmg = baseAP * (percDmg / 100.0) * (1 - (defPrc / 100.0));
	}
	
	public double getWeapBasePow()
	{
		return weapBasePow;
	}
	
	public double getWeapMinPow()
	{
		return weapMinPow;
	}
	
	public double getWeapMaxPow()
	{
		return weapMaxPow;
	}
	
	public double getBaseAP()
	{
		return baseAP;
	}
	
	public double getPercDmg()
	{
		return percDmg;
	}
	
	public double getCritMod()
	{
		return critMod;
	}
	
	public double getDefPerc()
	{
		return defPrc;
	}
	
	public int getUserPrc()
	{
		return userPrc;
	}
	
	public double getBaseDamage()
	{
		return baseDmg;
	}
}

class Individual
{
	double fitness = 0;
	int maxPerc = 0;
	int critPerc = 0;
	int addPerc = 0;
	String binaryString = "";
	
	String maxString = "";
	String critString = "";
	String addString = "";
	
	double normMax, normCrit, normAdd;
	double maxIncrease, critIncrease, addIncrease;
	
	public Individual(UserStats givenStats)
	{
		Random rn = new Random();
                int percLimit = givenStats.getUserPrc();
                
		if(percLimit > 160)
                    maxPerc = rn.nextInt(161);
                else
                    maxPerc = rn.nextInt(percLimit + 1);
                
                if(percLimit > 140)
                    critPerc = rn.nextInt(141);
                else
                    critPerc = rn.nextInt(percLimit + 1);
                
                if(percLimit > 155)
                    addPerc = rn.nextInt(156);
                else
                    addPerc = rn.nextInt(percLimit + 1);
		fitness = 0;
		
		buildBinaryString();
                calcFitness(givenStats);
	}
	
	public void buildBinaryString()
	{
		maxString = Integer.toBinaryString(maxPerc);
		maxString = forceBinaryLength(maxString);
		
		critString = Integer.toBinaryString(critPerc);
		critString = forceBinaryLength(critString);
		
		addString = Integer.toBinaryString(addPerc);
		addString = forceBinaryLength(addString);
		
		binaryString = maxString + critString + addString;
	}
	
	public String forceBinaryLength(String givenString)
	{
		while(givenString.length() < 8)
			givenString = "0" + givenString;
                
                return givenString;
	}
	
	public String getBinaryString()
	{
		return binaryString;
	}
	
	public void setBinaryString(String newString)
	{
		binaryString = newString;
		updateValues();
	}
	
	public void updateValues() //Only binary string directly changed via GA - stat percents must be updated as well
	{
		maxString = binaryString.substring(0, 8);
		critString = binaryString.substring(8, 16);
		addString = binaryString.substring(16, 24);
		
		maxPerc = Integer.parseInt(maxString, 2);
		critPerc = Integer.parseInt(critString, 2);
		addPerc = Integer.parseInt(addString, 2);
	}
	
	public double normalizeMax(int givenMax)
	{
		double normalizedResult = 0;
		
		if(givenMax <= 40)
		{
			normalizedResult = givenMax;
		}
		else if(givenMax > 40 && givenMax <= 80) //75% efficiency
		{
			normalizedResult = 40 + ((givenMax - 40) * .75);
		}
		else if(givenMax > 80 && givenMax <= 120) //50% efficiency
		{
			normalizedResult = 70 + ((givenMax - 80) * .5);
		}
		else if(givenMax > 120 && givenMax <= 160) //25% efficiency
		{
			normalizedResult = 90 + ((givenMax - 120) * .25);
		}
		else //0% efficiency reached - 100% maximized
		{
			normalizedResult = 100;
		}
	
		return normalizedResult;
	}
	
	public double normalizeCrit(int givenCrit)
	{
		double normalizedResult = 0;
		
		if(givenCrit <= 40)
		{
			normalizedResult = givenCrit;
		}
		else if(givenCrit > 40 && givenCrit <= 75) //80% efficiency
		{
			normalizedResult = 40 + ((givenCrit - 40) * .8);
		}
		else if(givenCrit > 75 && givenCrit <= 105) //60% efficiency
		{
			normalizedResult = 68 + ((givenCrit - 75) * .6);
		}
		else if(givenCrit > 105 && givenCrit <= 140) //40% efficiency
		{
			normalizedResult = 86 + ((givenCrit - 105) * .4);
		}
		else //0% efficiency reached - 100% critical rate
		{
			normalizedResult = 100;
		}
	
		return normalizedResult;
	}
	
	public double normalizeAdd(int givenAdd)
	{
		double normalizedResult = 0;
		
		if(givenAdd <= 40)
		{
			normalizedResult = givenAdd;
		}
		else if(givenAdd > 40 && givenAdd <= 80) //75% efficiency
		{
			normalizedResult = 40 + ((givenAdd - 40) * .75);
		}
		else if(givenAdd > 80 && givenAdd <= 125) //50% efficiency
		{
			normalizedResult = 70 + ((givenAdd - 80) * .5);
		}
		else if(givenAdd > 125 && givenAdd <= 155) //25% efficiency
		{
			normalizedResult = 90 + ((givenAdd - 125) * .25);
		}
		else //0% efficiency reached - 100% maximized
		{
			normalizedResult = 100;
		}
	
		return normalizedResult;
	}
	
	public void repairIndividual(UserStats givenStats)
	{
		int userPrc = givenStats.getUserPrc();
		
		//Stat investments under 0% efficiency are redundant and can be removed
		//These can occur due to crossovers or mutations
		
		if(maxPerc > 160)
			maxPerc = 160;
		
		if(critPerc > 140)
			critPerc = 140;
		
		if(addPerc > 155)
			addPerc = 155;
		
		int statSum = maxPerc + critPerc + addPerc;
		Random rn = new Random();
		int decisionVal;
		
		//Randomly decrement stats until user requirement is met
                //Disallow decrements of stats if they would result in negative values
		
		while(statSum > userPrc)
		{
			decisionVal = rn.nextInt(3);
			if(decisionVal == 0 && maxPerc != 0)
                        {
                            maxPerc--;
                            statSum--;
                        }
			else if(decisionVal == 1 && critPerc != 0)
			{
                            critPerc--;
                            statSum--;
                        }
                        else if(addPerc != 0)
			{
                            addPerc--;
                            statSum--;
                        }
		}
		
		//Binary string must adjust to the new values
		
		buildBinaryString();
	}
	
	public void calcFitness(UserStats givenStats)
	{
		//Find increase provided by normalized maximize
		normMax = normalizeMax(maxPerc);
		maxIncrease = (givenStats.getPercDmg() / 100.0) * (1 - (givenStats.getDefPerc() / 100));
		maxIncrease *= (givenStats.getWeapBasePow() + (.5 * (normMax / 100) * (givenStats.getWeapMaxPow() - givenStats.getWeapMinPow()))
			+  (givenStats.getBaseAP() - givenStats.getWeapBasePow()));
		
		
		//Find increase provided by normalized critical hit rate
		normCrit = normalizeCrit(critPerc);
		critIncrease = (givenStats.getBaseAP() * (1 - (normCrit / 100) + ((normCrit / 100) * (givenStats.getCritMod() / 100))) - givenStats.getBaseAP());
		critIncrease += ((.5 * (normMax / 100) * (givenStats.getWeapMaxPow() - givenStats.getWeapMinPow()))
			* (1 - (normCrit / 100) + ((normCrit / 100) * (givenStats.getCritMod() / 100))));
		critIncrease = critIncrease * (givenStats.getPercDmg() / 100.0) * (1 - (givenStats.getDefPerc() / 100));
		
		//Find increase provided by normalized additional damage
		normAdd = normalizeAdd(addPerc);
		addIncrease = givenStats.getBaseAP() * (9.0 / 16.0) * (normAdd / 100) * Math.pow((givenStats.getPercDmg() / 100), 0.65);
		
		//Sum together to find total damage increase - the fitness
		fitness = maxIncrease + critIncrease + addIncrease - givenStats.getBaseDamage();
	}
	
	public int getMax()
	{
		return maxPerc;
	}
	
	public int getCrit()
	{
		return critPerc;
	}
	
	public int getAdd()
	{
		return addPerc;
	}
	
	public double getFitness()
	{
		return fitness;
	}
}

class Population
{
	Individual[] individualArray;
	UserStats userStats;
	double crossoverRate = 0.7;
	double mutationRate = 0.01;
	Random rn;
	
	double genBestFitness = 0;
	double overallBestFitness = 0;
	Individual genBestIndividual;
        int overallBestMax = 0;
        int overallBestCrit = 0;
        int overallBestAdd = 0;
	int generationCount = 0;
	int optimumUnchanged = 0;
	
	public Population(int count, UserStats givenStats)
	{
		individualArray = new Individual[count];
		userStats = givenStats;
		
		for(int i = 0; i < count; i++)
			individualArray[i] = new Individual(givenStats);
		
		rn = new Random();
	}
	
	public boolean makeNextGen()
	{
			generationCount++;

			//Select 5 pairs, selection weighted by fitness
			individualArray = pairSelection();
			
			//Perform crossovers
			crossover();
			
			//Perform mutations
			mutate();
			
			//Check for improper individuals, and repair if needed
			repair();
			
			//Find the best individual in the new generation
                        for(int i = 0; i < individualArray.length; i++)
                            individualArray[i].calcFitness(userStats);
			genBestFitness = 0;
			
			for(int i = 0; i < 10; i++)
			{
				if(individualArray[i].getFitness() > genBestFitness)
				{
					genBestFitness = individualArray[i].getFitness();
					genBestIndividual = individualArray[i];
				}
			}
			
			//Check for new optimum set of values
			if(genBestFitness > overallBestFitness)
			{
				overallBestFitness = genBestFitness;
				overallBestCrit = genBestIndividual.getCrit();
                                overallBestMax = genBestIndividual.getMax();
                                overallBestAdd = genBestIndividual.getAdd();
				optimumUnchanged = 0;
			}
			else
				optimumUnchanged++;
			
			//Return state
			if(optimumUnchanged >= 200000)
				return false;
			else
				return true;
			
	}
	
	public Individual[] pairSelection()
	{
		//Sum up fitness of group, then divide each fitness by total fitness to get probabilities
		
		Individual[] nextPop = new Individual[10];
		Individual firstSelection, secondSelection;
		int firstIndex = -1;
		int secondIndex = -1;
		int referIndex = 0;
		double totalFitness = 0;
		double[] selectionProbs = new double[10];
		double randomVal;
		
		for(int i = 0; i < 10; i++)
		{
			totalFitness += individualArray[i].getFitness();
		}
		
		for(int i = 0; i < 10; i++)
		{
			selectionProbs[i] = individualArray[i].getFitness() / totalFitness;
		}
		
		//Select 5 pairs of individuals
		//The same individual can't be selected twice for one pair - if this happens, reselect the second individual
		
		double prob1 = 0;
		double prob2 = selectionProbs[0];
		
		for(int i = 0; i < 10; i += 2)
		{
                        firstIndex = -1;
                        secondIndex = -1;
			//Select first individual
			
			randomVal = rn.nextDouble();
			while(firstIndex == -1)
			{
				if(randomVal >= prob1 && randomVal <= prob2) //RNG accepts the current individual
				{
					firstIndex = referIndex;
					break;
				}
				else if(referIndex != 9)//Check the next individual instead - increase probabilities and move reference index
				{
					prob1 = prob2;
					referIndex++;
					prob2 += selectionProbs[referIndex];
				}
				else //The last individual in the population is being selected
				{
					firstIndex = referIndex;
				}
			}
			
			//Select second individual
			
			while(secondIndex == -1) //Select an individual, but no repeating
			{
				randomVal = rn.nextDouble();
				referIndex = 0;
				prob1 = 0;
				prob2 = selectionProbs[0];
				
				while(secondIndex == -1)
				{
					if(randomVal >= prob1 && randomVal <= prob2) //RNG accepts the current individual
					{
						secondIndex = referIndex;
						break;
					}
					else if(referIndex != 9)//Check the next individual instead - increase probabilities and move reference index
					{
						prob1 = prob2;
						referIndex++;
						prob2 += selectionProbs[referIndex];
					}
					else //The last individual in the population is being selected
					{
						secondIndex = referIndex;
					}
				}
                                
                                if(firstIndex == secondIndex)
                                    secondIndex = -1;
			}
			
			//Selections made; assign
			firstSelection = individualArray[firstIndex];
			secondSelection = individualArray[secondIndex];
			
			nextPop[i] = firstSelection;
			nextPop[i+1] = secondSelection;
		}
		return nextPop;
	}
	
	public void crossover()
	{
		double randomVal;
		int count = individualArray.length;
		String oldString1, oldString2;
		String newString1, newString2;
		
		for(int i = 0; i < count; i += 2)
		{
			randomVal = rn.nextDouble();
			if(randomVal < crossoverRate)
			{
				oldString1 = individualArray[i].getBinaryString();
				oldString2 = individualArray[i+1].getBinaryString();
				
				newString1 = oldString1.substring(0, 5);
				newString2 = oldString2.substring(0, 5);
				
				//Crossover for maximize
				newString1 = newString1 + oldString2.substring(5, 8);
				newString2 = newString2 + oldString1.substring(5, 8);
				
				newString1 = newString1 + oldString1.substring(8, 13);
				newString2 = newString2 + oldString2.substring(8, 13);
				
				//Crossover for critical
				newString1 = newString1 + oldString2.substring(13, 16);
				newString2 = newString2 + oldString1.substring(13, 16);
				
				newString1 = newString1 + oldString1.substring(16, 21);
				newString2 = newString2 + oldString2.substring(16, 21);
				
				//Crossover for additional damage
				newString1 = newString1 + oldString2.substring(21, 24);
				newString2 = newString2 + oldString1.substring(21, 24);
				
				//Crossovers complete - assign new binary strings
				individualArray[i].setBinaryString(newString1);
				individualArray[i+1].setBinaryString(newString2);				
			}
		}
	}
	
	public void mutate()
	{
		double randomVal;
		int count = individualArray.length;
		String currentString;
		
		for(int i = 0; i < count; i++)
		{
			for(int j = 0; j < 24; j++)
			{
				randomVal = rn.nextDouble();
				if(randomVal < mutationRate)
				{
					currentString = individualArray[i].getBinaryString();
					if(currentString.charAt(j) == '0')
					{
						currentString = currentString.substring(0, j) + "1" + currentString.substring(j, 24);
					}
					else
					{
						currentString = currentString.substring(0, j) + "0" + currentString.substring(j, 24);
					}
					
					individualArray[i].setBinaryString(currentString);
				}
			}
		}
	}
	
	public void repair()
	{
		for(int i = 0; i < 10; i++)
			individualArray[i].repairIndividual(userStats);
	}
	
	public void printGenResults()
	{
		System.out.print("Generation " + generationCount + ": best fitness " + overallBestFitness + "( ");
		System.out.println(overallBestMax + ", " + overallBestCrit + ", " + overallBestAdd + ")");
	}
}

public class GAOptimizeTest
{
	public static void main(String[] args)
	{
		UserStats givenStats = new UserStats();
		Population population = new Population(10, givenStats);
		boolean running = true;
		
		while(running)
		{
			running = population.makeNextGen();
			population.printGenResults();
		}
	}
}