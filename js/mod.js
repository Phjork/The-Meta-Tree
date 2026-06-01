let modInfo = {
	name: "The Meta Tree",
	author: "Coolppl_idk",
	pointsName: "points",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal (0), // Used for hard resets and new players
	offlineLimit: 1,  // In hours
}

// Set your version in num and name
let VERSION = {
	num: "0.2",
	name: "Event Horizon",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.2 - Event Horizon</h3><br>
		- BLACK HOLE<br>
		- 2 new star types!<br>
		- 2 new rows of star upgrades!<br>
		- Endgame : E92000 points<br>
	<h3>v0.1 - The Generic Tree</h3><br>
		- PRESTIGE<br>
		- ASCENSION<br>
		- STARS<br>
		- Cosmic challenges, star energy and 4 rows of star upgrades!<br>
		- Endgame : E3360 points`

let winText = `Congratulations! You have reached the end and beaten this game, but for now...`

// If you add new functions anywhere inside of a layer, and those functions have an effect when called, add them here.
// (The ones here are examples, all official functions are already taken care of)
var doNotCallTheseFunctionsEveryTick = ["blowUpEverything"]

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

// Determines if it should show points/sec
function canGenPoints(){
	return true
}

// Calculate points/sec!
function getPointGen() {
	if(!canGenPoints())
		return new Decimal(0)

	let gain = new Decimal(1)

	// Prestige upgrade 11
	let extraU11 = new Decimal(0)
	extraU11 = extraU11.add(buyableEffect('p', 11))
	let U11Base = new Decimal(2)
	if (hasChallenge('a', 21)) U11Base = new Decimal(2.5)
	if (hasMilestone('a', 2)) extraU11 = extraU11.add(player.a.knowledge.add(1).log(10).div(2).floor())
	if (hasUpgrade('p', 11)) gain = gain.times(U11Base)
	gain = gain.times(new Decimal(U11Base).pow(extraU11))

	// Prestige upgrade 23
	let extraU23 = new Decimal(0)
	extraU23 = extraU23.add(buyableEffect('p', 13))
	let U23Base = new Decimal(10)
	if (hasMilestone('a', 3)) U23Base = U23Base.add(player.a.knowledge.add(1).log(10))
	if (hasUpgrade('s', 24)) U23Base = U23Base.pow(2)
	if (hasUpgrade('p', 23)) gain = gain.times(U23Base)
	gain = gain.times(new Decimal(U23Base).pow(extraU23))

	// Prestige upgrades
	if (hasUpgrade('p', 12)) gain = gain.times(upgradeEffect('p', 12))
	if (hasUpgrade('p', 13)) gain = gain.times(upgradeEffect('p', 13))
	if (hasUpgrade('p', 25)) gain = gain.times(upgradeEffect('p', 25))

	// Knowledge boost
	if (hasMilestone('a', 0)) gain = gain.times(player.a.knowledge.pow(0.5).add(1))

	// Stars stuff
	gain = gain.times(player.s.energy[0].pow(3).add(1))
    if (hasUpgrade('s', 31)) gain = gain.times(upgradeEffect('s', 31))

	return gain
}

// You can add non-layer related variables that should to into "player" and be saved here, along with default values
function addedPlayerData() { return {
}}

// Display extra things at the top of the page
var displayThings = [
]

// Determines when the game "ends"
function isEndgame() {
	return false
}



// Less important things beyond this point!

// Style for the background, can be a function
var backgroundStyle = {

}

// You can change this if you have things that can be messed up by long tick lengths
function maxTickLength() {
	return(3600) // Default is 1 hour which is just arbitrarily large
}

// Use this if you need to undo inflation from an older version. If the version is older than the version that fixed the issue,
// you can cap their current resources with this.
function fixOldSave(oldVersion){
}