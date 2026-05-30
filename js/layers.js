addLayer("p", {
    name: "prestige", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "P", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
    }},
    color: "#3f93e2",
    requires: new Decimal(10), // Can be a function that takes requirement increases into account
    resource: "prestige points", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.5, // Prestige currency exponent
    passiveGeneration() {
        if (hasUpgrade('s', 21)) return 1
        return 0
    },
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)

        // Prestige upgrade 15
	    let extraU15 = new Decimal(0)
	    extraU15 = extraU15.add(buyableEffect('p', 12))
        let U15Base = new Decimal(2)
	    if (hasChallenge('a', 22)) U15Base = new Decimal(2.5)
	    if (hasUpgrade('p', 15)) mult = mult.times(U15Base)
	    mult = mult.times(new Decimal(U15Base).pow(extraU15))

        // Prestige upgrades
        if (hasUpgrade('p', 14)) mult = mult.times(upgradeEffect('p', 14))
        if (hasUpgrade('p', 21)) mult = mult.times(3)
        if (hasUpgrade('p', 24)) mult = mult.times(5)
        if (hasUpgrade('p', 25)) mult = mult.times(upgradeEffect('p', 25))

        // Knowledge boost
        if (hasMilestone('a', 1)) mult = mult.times(player.a.knowledge.pow(0.25).add(1))

        // Stars stuff
        mult = mult.times(player.s.energy[1].pow(2.5).add(1))
        if (hasUpgrade('s', 32)) mult = mult.times(upgradeEffect('s', 32))

        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        exp = new Decimal(1)
        if (inChallenge('a', 22) || inChallenge('s', 22)) exp = new Decimal(0.1)
        if (inChallenge('s', 11)) exp = new Decimal(0.5)
        return exp
    },
    row: 0, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "p", description: "P: Reset for prestige points", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){return true},
    doReset(prestige){
        if (layers[prestige].row <= this.row) return;

        keptUpgrades = []
        if ((hasMilestone('a', 1)) && hasUpgrade(this.layer, 15) && !hasMilestone('a', 3)) keptUpgrades.push(15)

        keep = []
        if (hasMilestone('a', 3)) keep.push("upgrades")

        layerDataReset(this.layer, keep);
        
        player[this.layer].upgrades.push(...keptUpgrades)
    },
    automate(){
        if (hasMilestone('a', 7)) {
			if (layers[this.layer].buyables[11].canAfford()) {
				layers[this.layer].buyables[11].buyMax();
			}
            if (layers[this.layer].buyables[12].canAfford()) {
				layers[this.layer].buyables[12].buyMax();
			}
            if (layers[this.layer].buyables[13].canAfford()) {
				layers[this.layer].buyables[13].buyMax();
			}
		}
    },
    tabFormat: [
    "main-display",
    "prestige-button",
    "blank",
    "upgrades",
    "blank",
    "buyables",
    ],
    upgrades: {
        11: {
            title: "The First One",
            description: "Double point gain.",
            cost: new Decimal(1),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
        },
        12: {
            title: "At least the formula is not a square root",
            description: "Prestige points boost points.",
            cost: new Decimal(3),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            effect() {
                upgradetemp = new Decimal(2)
                if (hasUpgrade('p', 22)) upgradetemp = upgradetemp.add(1)
                return player[this.layer].points.add(1).log(10).pow(upgradetemp).add(1)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, 
        },
        13: {
            title: "Replication",
            description: "Points boost points.",
            cost: new Decimal(10),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            effect() {
            return player.points.add(1).pow(0.2)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, 
        },
        14: {
            title: "Replication II",
            description: "Prestige points boost prestige points.",
            cost: new Decimal(25),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            effect() {
            return player[this.layer].points.add(1).pow(0.15)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, 
        },
        15: {
            title: "This upgrade is Buy Able",
            description: "Double prestige point gain, unlock 2 buyables and a row of upgrades.",
            cost: new Decimal(50),
        },
        21: {
            title: "I love generic boosts",
            description: "Triple prestige point gain.",
            cost: new Decimal(1000), 
            canAfford() {
                return !inChallenge('a', 21)
            },  
            unlocked() {
                return hasUpgrade('p', 15)
            }, 
        },
        22: {
            title: "Formula 2",
            description: "Upgrade 12's formula is better.",
            cost: new Decimal(10000),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            unlocked() {
                return hasUpgrade('p', 15)
            }, 
        },
        23: {
            title: "Can we speed up?",
            description: "Multiply point gain by 10.",
            cost: new Decimal(50000),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            unlocked() {
                return hasUpgrade('p', 15)
            },
        },
        24: {
            title: "Can we speed up 2?",
            description: "Multiply prestige point gain by 5.",
            cost: new Decimal(20000000),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            unlocked() {
                return hasUpgrade('p', 15)
            },
        },
        25: {
            title: "Replication Ultimate",
            description: "Points and prestige points are boosted by points and prestige points.",
            cost: new Decimal(1e9),
            canAfford() {
                return !inChallenge('a', 21)
            }, 
            effect() {
                upgradetemp = player[this.layer].points.add(1).pow(player.points).log(10).add(1).log(10).add(1)
                if (hasMilestone('a', 7)) upgradetemp = upgradetemp.pow(player.a.knowledge.add(1).log(10).div(5).add(1).pow(0.65))
                return upgradetemp
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
            unlocked() {
                return hasUpgrade('p', 15)
            },
        },
    },
    buyables: {
        11: {
            title: "More First Ones",
            cost(x) {
                cost = new Decimal(3).add(x).pow(x).times(100)
                if (hasMilestone('a', 1)) cost = cost.div(player.a.knowledge.pow(0.3).add(1))
                return cost 
            },
            display() { return "Increase amount of effective upgrade 11 by 1.<br>Cost: "+format(this.cost())+" prestige points.<br>Bought: "+getBuyableAmount(this.layer, this.id)+"<br>Effect: +"+buyableEffect(this.layer, this.id)},
            canAfford() {
                return player[this.layer].points.gte(this.cost()) && !inChallenge('a', 12) && !inChallenge('s', 22)
            },
            buy() {
                if (!hasUpgrade('s', 12)) {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                }
                else {
                    factor = new Decimal(1)
                    if (hasMilestone('a', 1)) factor = player.a.knowledge.pow(0.3).add(1)

                    points = player[this.layer].points.mul(factor)
                    logPoints = points.ln().sub(new Decimal(100).ln())

                    amount = logPoints.div(new Decimal(3).ln())

                    amount = amount.floor()

                    low = new Decimal(0)
                    high = amount
                    while (low.lt(high)) {
                        mid = low.add(high).div(2).floor()
                        logCost = mid.mul(mid.add(3).ln()).add(new Decimal(100).ln())
                        if (logCost.lte(points.ln())) {
                            low = mid.add(1)
                        } else {
                            high = mid
                        }
                    }
                    amount = low

                    if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                        setBuyableAmount(this.layer, this.id, amount)
                    }
                }
            },
            effect() {
                return getBuyableAmount(this.layer, this.id)
            },
            unlocked() {
                return hasUpgrade('p', 15)
            },
            buyMax() {
                factor = new Decimal(1)
                if (hasMilestone('a', 1)) factor = player.a.knowledge.pow(0.3).add(1)

                points = player[this.layer].points.mul(factor)
                logPoints = points.ln().sub(new Decimal(100).ln())

                amount = logPoints.div(new Decimal(3).ln())

                amount = amount.floor()

                low = new Decimal(0)
                high = amount
                while (low.lt(high)) {
                    mid = low.add(high).div(2).floor()
                    logCost = mid.mul(mid.add(3).ln()).add(new Decimal(100).ln())
                    if (logCost.lte(points.ln())) {
                        low = mid.add(1)
                    } else {
                        high = mid
                    }
                }
                amount = low

                if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                    setBuyableAmount(this.layer, this.id, amount)
                }
            },
        },
        12: {
            title: "More Prestiges",
            cost(x) {
                cost = new Decimal(5).add(x).pow(x).times(500)
                if (hasMilestone('a', 1)) cost = cost.div(player.a.knowledge.pow(0.3).add(1))
                return cost
            },
            display() { return "Increase amount of effective upgrade 15 by 1.<br>Cost: "+format(this.cost())+" prestige points.<br>Bought: "+getBuyableAmount(this.layer, this.id)+"<br>Effect: +"+buyableEffect(this.layer, this.id)},
            canAfford() {
                return player[this.layer].points.gte(this.cost()) && !inChallenge('a', 12) && !inChallenge('s', 22)
            },
            buy() {
                if (!hasUpgrade('s', 12)) {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                }
                else {
                    factor = new Decimal(1)
                    if (hasMilestone('a', 1)) factor = player.a.knowledge.pow(0.3).add(1)

                    points = player[this.layer].points.mul(factor)
                    logPoints = points.ln().sub(new Decimal(500).ln())

                    amount = logPoints.div(new Decimal(5).ln())

                    amount = amount.floor()

                    low = new Decimal(0)
                    high = amount
                    while (low.lt(high)) {
                        mid = low.add(high).div(2).floor()
                        logCost = mid.mul(mid.add(5).ln()).add(new Decimal(500).ln())
                        if (logCost.lte(points.ln())) {
                            low = mid.add(1)
                        } else {
                            high = mid
                        }
                    }
                    amount = low

                    if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                        setBuyableAmount(this.layer, this.id, amount)
                    }
                }
            },
            effect() {
                return getBuyableAmount(this.layer, this.id)
            },
            unlocked() {
                return hasUpgrade('p', 15)
            },
            buyMax() {
                factor = new Decimal(1)
                if (hasMilestone('a', 1)) factor = player.a.knowledge.pow(0.3).add(1)

                points = player[this.layer].points.mul(factor)
                logPoints = points.ln().sub(new Decimal(500).ln())

                amount = logPoints.div(new Decimal(5).ln())

                amount = amount.floor()

                low = new Decimal(0)
                high = amount
                while (low.lt(high)) {
                    mid = low.add(high).div(2).floor()
                    logCost = mid.mul(mid.add(5).ln()).add(new Decimal(500).ln())
                    if (logCost.lte(points.ln())) {
                        low = mid.add(1)
                    } else {
                        high = mid
                    }
                }
                amount = low

                if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                    setBuyableAmount(this.layer, this.id, amount)
                }
            },
        },
        13: {
            title: "We CAN speed up",
            cost(x) {
                cost = new Decimal(2).pow(x).mul(1e3).pow(x).times(1e20)
                if (hasUpgrade('s', 23)) cost = cost.div(player.a.knowledge.pow(0.3).add(1))
                return cost
            },
            display() { return "Increase amount of effective upgrade 23 by 1.<br>Cost: "+format(this.cost())+" prestige points.<br>Bought: "+getBuyableAmount(this.layer, this.id)+"<br>Effect: +"+buyableEffect(this.layer, this.id)},
            canAfford() {
                return player[this.layer].points.gte(this.cost()) && !inChallenge('a', 12) && !inChallenge('s', 22)
            },
            buy() {
                if (!hasUpgrade('s', 12)) {
                player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
                }
                else {
                    points = player[this.layer].points
                    if (hasUpgrade('s', 23)) points = points.mul(player.a.knowledge.pow(0.3).add(1))
                    logPoints = points.ln().sub(new Decimal(20).mul(new Decimal(10).ln()))

                    templn = new Decimal(2).ln()
                    templn2 = new Decimal(1000).ln()

                    discriminant = templn2.pow(2).add(templn.mul(4).mul(logPoints))
                    amount = discriminant.sqrt().sub(templn2).div(templn.mul(2))

                    amount = amount.floor()

                    low = new Decimal(0)
                    high = amount
                    while (low.lt(high)) {
                        mid = low.add(high).div(2).floor()
                        logCost = mid.mul(templn2.add(mid.mul(templn))).add(new Decimal(20).mul(new Decimal(10).ln()))
                        if (logCost.lte(points.ln())) {
                            low = mid.add(1)
                        } else {
                            high = mid
                        }
                    }
                    amount = low.add(1)

                    if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                        setBuyableAmount(this.layer, this.id, amount)
                    }
                }
            },
            effect() {
                return getBuyableAmount(this.layer, this.id)
            },
            unlocked() {
                return hasMilestone('a', 2)
            },
            buyMax() {
                points = player[this.layer].points
                if (hasUpgrade('s', 23)) points = points.mul(player.a.knowledge.pow(0.3).add(1))
                logPoints = points.ln().sub(new Decimal(20).mul(new Decimal(10).ln()))

                templn = new Decimal(2).ln()
                templn2 = new Decimal(1000).ln()

                discriminant = templn2.pow(2).add(templn.mul(4).mul(logPoints))
                amount = discriminant.sqrt().sub(templn2).div(templn.mul(2))

                amount = amount.floor()

                low = new Decimal(0)
                high = amount
                while (low.lt(high)) {
                    mid = low.add(high).div(2).floor()
                    logCost = mid.mul(templn2.add(mid.mul(templn))).add(new Decimal(20).mul(new Decimal(10).ln()))
                    if (logCost.lte(points.ln())) {
                        low = mid.add(1)
                    } else {
                        high = mid
                    }
                }
                amount = low.add(1)

                if (amount.gt(getBuyableAmount(this.layer, this.id))) {
                    setBuyableAmount(this.layer, this.id, amount)
                }
            }
        },
    },
})
addLayer("a", {
    name: "ascension", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "A", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
		points: new Decimal(0),
        knowledge: new Decimal(0),
    }},
    color: "#f88323",
    requires: new Decimal(1e12), // Can be a function that takes requirement increases into account
    resource: "ascensions", // Name of prestige currency
    baseResource: "points", // Name of resource prestige is based on
    baseAmount() {return player.points}, // Get the current amount of baseResource
    type: "static", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 2, // Prestige currency exponent
    base: 2,
    canBuyMax() { return hasUpgrade('s', 11) },
    resetsNothing() { return hasMilestone('s', 2) },
    autoPrestige() { return hasMilestone('s', 2) },
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new Decimal(1)
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    effect(){
        if (player[this.layer].points.eq(0)) return new Decimal(0)
        
        // Alternated formula
        if (inChallenge('s', 21)) return new Decimal(1.1).pow(player[this.layer].points.pow(2))

        // Base formula
        effectiveAscensions = player[this.layer].points
        if (hasMilestone('a', 5)) effectiveAscensions = effectiveAscensions.add(player[this.layer].knowledge.add(1).log(10).add(1).sqrt())
        knowledgeGain = effectiveAscensions.pow(effectiveAscensions)

        if (inChallenge('s', 12)) knowledgeGain = new Decimal(1)

        // Knowledge self-boost
        if (hasMilestone('a', 4) && hasUpgrade('s', 22)) knowledgeGain = knowledgeGain.times(new Decimal(10).pow(player[this.layer].knowledge.add(1).log(10).add(1).pow(0.5)))
        if (hasMilestone('a', 4) && !hasUpgrade('s', 22)) knowledgeGain = knowledgeGain.times(player[this.layer].knowledge.add(1).log(10).add(1).pow(2))
        if (hasChallenge('a', 12)) knowledgeGain = knowledgeGain.times(upgradeEffect('p', 25))
        if (hasChallenge('a', 11)) knowledgeGain = knowledgeGain.pow(1.05)

        // Stars stuff
        knowledgeGain = knowledgeGain.times(player.s.energy[2].pow(2).add(1))
        if (hasUpgrade('s', 33)) knowledgeGain = knowledgeGain.times(upgradeEffect('s', 33))

        if (inChallenge('s', 11)) knowledgeGain = knowledgeGain.pow(0.5)
        return knowledgeGain
    },
    effectDescription(){
        return "which is generating "+format(tmp[this.layer].effect)+" knowledge/sec."
    },
    branches: ['p'],
    row: 1, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "a", description: "A: Ascend", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){
        return hasUpgrade('p', 25) || player[this.layer].points.gt(0) || player.s.total.gt(0)
    },
    doReset(prestige){
        player[this.layer].knowledge = new Decimal(0)

        if (layers[prestige].row <= this.row) return;

        keep = []

        if (hasMilestone('s', 0)) keep.push("challenges")
        if (hasMilestone('s', 1)) keep.push("milestones")

        layerDataReset(this.layer, keep)
    },
    update(diff){
		if (player[this.layer].points.gt(0) && !inChallenge('a', 11)) player[this.layer].knowledge = player[this.layer].knowledge.add(tmp[this.layer].effect.times(diff));
	},
    tabFormat: [
    "main-display",
    "prestige-button",
    "blank",
    [
        "display-text",
        function() { return "<h3>You have </h3><span style='color: orange;'><h3>"+format(player[this.layer].knowledge)+"</h3></span><h3> knowledge, which:</h3>" }
    ],
    [
        "display-text",
        function() { 
            if (hasMilestone('a', 0)) return "Multiply point gain by x"+format(player[this.layer].knowledge.pow(0.5).add(1))
            return ""
        }
    ],
    [
        "display-text",
        function() { 
            if (hasMilestone('a', 1)) return "Divide prestige buyable 11 and 12's costs by /"+format(player[this.layer].knowledge.pow(0.3).add(1))
            return ""
        }
    ],
    [
        "display-text",
        function() { 
            if (hasMilestone('a', 3)) return "Increase the base of prestige upgrade 23 by +"+format(player[this.layer].knowledge.add(1).log(10))
            return ""
        }
    ],
    [
        "display-text",
        function() {
            if (hasMilestone('a', 4) && hasUpgrade('s', 22)) return "Multiply knowledge gain by x"+format(new Decimal(10).pow(player[this.layer].knowledge.add(1).log(10).add(1).pow(0.5)))
            if (hasMilestone('a', 4)) return "Multiply knowledge gain by x"+format(player[this.layer].knowledge.add(1).log(10).add(1).pow(2))
            return ""
        }
    ],
    [
        "display-text",
        function() { 
            if (hasMilestone('a', 5)) return "Increase the amount of effective ascensions in the knowledge generation formula by +"+format(player[this.layer].knowledge.add(1).log(10).add(1).sqrt())
            return ""
        }
    ],
    [
        "display-text",
        function() { 
            if (hasMilestone('a', 7)) return "Raises prestige upgrade 25 by ^"+format(player[this.layer].knowledge.add(1).log(10).div(5).add(1).pow(0.65))
            return ""
        }
    ],
    "blank",
    "milestones",
    "challenges",
        ],
    milestones: {
        0: {
            requirementDescription: "1 ascension",
            effectDescription: "Start generating knowledge and unlock the first effect of it.",
            done() { return player[this.layer].points.gte(1) }
        },
        1: {
            requirementDescription: "3 ascensions",
            effectDescription: "Unlock the second effect of knowledge and keep prestige upgrade 15 on ascension.",
            done() { return player[this.layer].points.gte(3) }
        },
        2: {
            requirementDescription: "5 ascensions",
            effectDescription: "Unlock the third prestige buyable.",
            done() { return player[this.layer].points.gte(5) }
        },
        3: {
            requirementDescription: "8 ascensions",
            effectDescription: "Unlock the third effect of knowledge and keep prestige upgrades on ascension.",
            done() { return player[this.layer].points.gte(8) }
        },
        4: {
            requirementDescription: "10 ascensions",
            effectDescription: "Unlock challenges and the fourth effect of knowledge.",
            done() { return player[this.layer].points.gte(10) }
        },
        5: {
            requirementDescription: "13 ascensions",
            effectDescription: "Unlock the fifth effect of knowledge.",
            done() { return player[this.layer].points.gte(13) }
        },
        6: {
            requirementDescription: "17 ascensions",
            effectDescription: "Unlock 2 more challenges.",
            done() { return player[this.layer].points.gte(17) }
        },
        7: {
            requirementDescription: "20 ascensions",
            effectDescription: "Automatically buy prestige buyables and unlock the sixth effect of knowledge.",
            done() { return player[this.layer].points.gte(20) }
        },
        8: {
            requirementDescription: "26 ascensions",
            effectDescription: "Unlock a new layer.",
            done() { return player[this.layer].points.gte(26) }
        },
    },
    challenges: {
        11: {
            name: "Unknowledgeable",
            currencyDisplayName: "points",
            challengeDescription() { 
                return "You cannot gain any knowledge."
            },
            goal(){
                return new Decimal("1e12");
            },
            unlocked() { 
                return hasMilestone('a', 4) 
            },
            rewardDescription() {
                return "Raises knowledge gain by ^1.05."
            },
        },
        12: {
            name: "Not Buyable",
            currencyDisplayName: "points",
            challengeDescription() { 
                return "You cannot buy prestige buyables."
            },
            goal(){
                return new Decimal("1e25");
            },
            unlocked() { 
                return hasMilestone('a', 4) 
            },
            rewardDescription() {
                return "Prestige upgrade 25 applies to knowledge gain."
            },
        },
        21: {
            name: "Downgrading",
            currencyDisplayName: "points",
            challengeDescription() { 
                return "You cannot buy prestige upgrades. Entering this challenge resets them, except for upgrade 15."
            },
            goal(){
                return new Decimal("1e48");
            },
            unlocked() { 
                return hasMilestone('a', 6) 
            },
            rewardDescription() {
                return "Prestige upgrade 11 multiplies point gain by x2.5 instead of x2."
            },
            onEnter() {
                player.p.upgrades = [15]
            },
        },
        22: {
            name: "Crippled Prestiges",
            currencyDisplayName: "points",
            challengeDescription() { 
                return "Prestige point gain is raised by ^0.1."
            },
            goal(){
                return new Decimal("1e55");
            },
            unlocked() { 
                return hasMilestone('a', 6) 
            },
            rewardDescription() {
                return "Prestige upgrade 15 multiplies prestige point gain by x2.5 instead of x2."
            },
        },
    },
})
addLayer("s", {
    name: "stars", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "S", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: true,
        shownextgain: true,
		points: new Decimal(0),
        stars: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
        energygain: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
        energy: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
        score: [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
        cscore: new Decimal(0)
    }},
    color: "#bd38ff",
    requires: new Decimal(0.001), // Can be a function that takes requirement increases into account
    resource: "stardust", // Name of prestige currency
    baseResource: "knowledge", // Name of resource prestige is based on
    baseAmount() {return player.a.knowledge}, // Get the current amount of baseResource
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0,
    prestigeButtonText() {
        nextat = new Decimal(10).pow(getResetGain(this.layer).add(1).log(3).add(3.75).mul(20))
        if (!canReset(this.layer) && player[this.layer].shownextgain) return "Use your knowledge to manifest <b>0</b> stardust.<br><br>Next at E75 knowledge"
        if (!canReset(this.layer)) return "Use your knowledge to manifest <b>0</b> stardust."
        if (player[this.layer].shownextgain) return "Use your knowledge to manifest <b>"+format(getResetGain(this.layer))+"</b> stardust.<br><br>Next at "+format(nextat)+" knowledge"
        return "Use your knowledge to manifest <b>"+format(getResetGain(this.layer))+"</b> stardust."
    },
    canReset() {
        return player.a.knowledge.gte(1e75)
    },
    gainMult() { // Calculate the multiplier for main currency from bonuses
        // Main formula
        base = new Decimal(3).pow(player.a.knowledge.log(10).div(20).sub(3.75))
        mult = new Decimal(1)

        // Upgrades
        if (hasUpgrade('s', 13)) mult = mult.times(3)
        if (hasUpgrade('s', 14)) mult = mult.times(upgradeEffect('s', 14))
        if (hasUpgrade('s', 34)) mult = mult.times(upgradeEffect('s', 34))

        // F-Energy boost
        mult = mult.times(player[this.layer].energy[3].add(1).pow(0.1))

        if (mult.gt(1)) player[this.layer].shownextgain = false
        else player[this.layer].shownextgain = true

        base = base.times(mult).floor()
        return base
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        return new Decimal(1)
    },
    branches: ['a'],
    row: 2, // Row the layer is in on the tree (0 is the first row)
    hotkeys: [
        {key: "s", description: "S: Manifest stardust", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    layerShown(){
        return hasMilestone('a', 8) || player[this.layer].total.gt(0)
    },
    doReset(prestige){
        player[this.layer].energy = [new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)]
    },
    update(diff){
        // Energy gain calculation
        player[this.layer].energygain[0] = player[this.layer].stars[0].pow(2).times(player[this.layer].score[0].add(1).pow(2))
        if (hasMilestone('s', 4)) player[this.layer].energygain[0] = player[this.layer].stars[0].log(10).pow(player[this.layer].stars[0].log(10).times(2)).times(player[this.layer].score[0].add(1).pow(2))
        player[this.layer].energygain[1] = player[this.layer].stars[1].pow(2).times(player[this.layer].score[1].add(1).pow(2))
        if (hasMilestone('s', 4)) player[this.layer].energygain[1] = player[this.layer].stars[1].log(10).pow(player[this.layer].stars[1].log(10).times(2)).times(player[this.layer].score[1].add(1).pow(2))
        player[this.layer].energygain[2] = player[this.layer].stars[2].pow(2).times(player[this.layer].score[2].add(1).pow(2))
        if (hasMilestone('s', 4)) player[this.layer].energygain[2] = player[this.layer].stars[2].log(10).pow(player[this.layer].stars[2].log(10).times(2)).times(player[this.layer].score[2].add(1).pow(2))
        player[this.layer].energygain[3] = player[this.layer].stars[3].pow(2).times(player[this.layer].score[3].add(1).pow(2))
        if (hasMilestone('s', 4)) player[this.layer].energygain[3] = player[this.layer].stars[3].log(10).pow(player[this.layer].stars[3].log(10).times(2)).times(player[this.layer].score[3].add(1).pow(2))
        player[this.layer].energygain[4] = player[this.layer].stars[4].pow(2).times(player[this.layer].score[4].add(1).pow(2))
        if (hasMilestone('s', 4)) player[this.layer].energygain[4] = player[this.layer].stars[4].log(10).pow(player[this.layer].stars[4].log(10).times(2)).times(player[this.layer].score[4].add(1).pow(2))

        // Energy gain
        player[this.layer].energy[0] = player[this.layer].energy[0].add(player[this.layer].energygain[0].mul(diff))
        player[this.layer].energy[1] = player[this.layer].energy[1].add(player[this.layer].energygain[1].mul(diff))
        player[this.layer].energy[2] = player[this.layer].energy[2].add(player[this.layer].energygain[2].mul(diff))
        player[this.layer].energy[3] = player[this.layer].energy[3].add(player[this.layer].energygain[3].mul(diff))
        player[this.layer].energy[4] = player[this.layer].energy[4].add(player[this.layer].energygain[4].mul(diff))

        // Cosmic score calculation
        player[this.layer].cscore = player[this.layer].score[0]
        player[this.layer].cscore = player[this.layer].cscore.add(player[this.layer].score[1])
        player[this.layer].cscore = player[this.layer].cscore.add(player[this.layer].score[2])
        player[this.layer].cscore = player[this.layer].cscore.add(player[this.layer].score[3])
        player[this.layer].cscore = player[this.layer].cscore.add(player[this.layer].score[4])
        player[this.layer].cscore = player[this.layer].cscore.add(player[this.layer].energy[4].add(1).log(10).mul(2))
        if (hasUpgrade('s', 35)) player[this.layer].cscore = player[this.layer].cscore.mul(1.2)
        if (hasUpgrade('s', 41)) player[this.layer].cscore = player[this.layer].cscore.add(upgradeEffect('s', 41))
        if (hasUpgrade('s', 42)) player[this.layer].cscore = player[this.layer].cscore.add(upgradeEffect('s', 42))
        if (hasUpgrade('s', 43)) player[this.layer].cscore = player[this.layer].cscore.add(upgradeEffect('s', 43))
        if (hasUpgrade('s', 44)) player[this.layer].cscore = player[this.layer].cscore.add(upgradeEffect('s', 44))
        if (inChallenge('s', 31)) player[this.layer].cscore = new Decimal(0)
    },
    tabFormat: {
        "Upgrades": {
            content: [
                "main-display",
                "prestige-button",
                "blank",
                [
                    "display-text",
                    function() {
                        return "Who knows what can be achieved with the power of starlight..."
                    }
                ],
                "blank",
                "upgrades",
            ],
        },
        "Stars": {
            content: [
                "main-display",
                "clickables",
                "blank",
                [
                    "display-text",
                    function() {
                        return "You have assigned <b>"+format(player[this.layer].stars[0])+"</b> stardust into M-Star type, which generates <b>"+format(player[this.layer].energygain[0])+"</b> M-Energy per second."
                    }
                ],
                [
                    "display-text",
                    function() {
                        return "You have assigned <b>"+format(player[this.layer].stars[1])+"</b> stardust into K-Star type, which generates <b>"+format(player[this.layer].energygain[1])+"</b> K-Energy per second."
                    }
                ],
                [
                    "display-text",
                    function() {
                        return "You have assigned <b>"+format(player[this.layer].stars[2])+"</b> stardust into G-Star type, which generates <b>"+format(player[this.layer].energygain[2])+"</b> G-Energy per second."
                    }
                ],
                [
                    "display-text",
                    function() {
                        if (!hasUpgrade('s', 15)) return
                        return "You have assigned <b>"+format(player[this.layer].stars[3])+"</b> stardust into F-Star type, which generates <b>"+format(player[this.layer].energygain[3])+"</b> F-Energy per second."
                    }
                ],
                [
                    "display-text",
                    function() {
                        if (!hasUpgrade('s', 25)) return
                        return "You have assigned <b>"+format(player[this.layer].stars[4])+"</b> stardust into A-Star type, which generates <b>"+format(player[this.layer].energygain[4])+"</b> A-Energy per second."
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        return "<h3>You have <span style='color: red;'><h3>"+format(player[this.layer].energy[0])+"</h3></span> M-Energy, which multiplies point gain by x"+format(player[this.layer].energy[0].pow(3).add(1))+"<h3>"
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        return "<h3>You have <span style='color: orange;'><h3>"+format(player[this.layer].energy[1])+"</h3></span> K-Energy, which multiplies prestige point gain by x"+format(player[this.layer].energy[1].pow(2.5).add(1))+"<h3>"
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        return "<h3>You have <span style='color: yellow;'><h3>"+format(player[this.layer].energy[2])+"</h3></span> G-Energy, which multiplies knowledge gain by x"+format(player[this.layer].energy[2].pow(2).add(1))+"<h3>"
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        if (!hasUpgrade('s', 15)) return
                        return "<h3>You have <span style='color: white;'><h3>"+format(player[this.layer].energy[3])+"</h3></span> F-Energy, which multiplies stardust gain by x"+format(player[this.layer].energy[3].add(1).pow(0.1))+"<h3>"
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        if (!hasUpgrade('s', 25)) return
                        return "<h3>You have <span style='color: cyan;'><h3>"+format(player[this.layer].energy[4])+"</h3></span> A-Energy, which increases the cosmic score by +"+format(player[this.layer].energy[4].add(1).log(10).mul(2))+"<h3>"
                    }
                ],
            ],
            unlocked() {
                return player.s.total.gt(0)
            },
        },
        "Cosmic": {
            content: [
                "main-display",
                "blank",
                [
                    "display-text",
                    function() {
                        return "<h3>You have <span style='color: white;'><h3>"+format(player[this.layer].cscore)+"</h3></span> cosmic score, which is the total score of all challenges.<h3>"
                    }
                ],
                "blank",
                [
                    "display-text",
                    function() {
                        return "When exiting a challenge, gain score based on the specified resource."
                    }
                ],
                "blank",
                "challenges",
                "blank",
                "milestones",
            ],
            unlocked() {
                return hasUpgrade('s', 25)
            },
        },
    },
    upgrades: {
        11: {
            title: "Third layer's the charm",
            description: "Allows you to buy max ascensions.",
            cost: new Decimal(0),
            unlocked() {
                return player[this.layer].total.gt(0)
            },
        },
        12: {
            title: "Q2oL",
            description: "Allows you to buy max buyables manually.",
            cost: new Decimal(3),
            unlocked() {
                return player[this.layer].total.gt(0)
            },
        },
        13: {
            title: "Knowledge Conservation",
            description: "Triple stardust gain.",
            cost: new Decimal(5),
            unlocked() {
                return player[this.layer].total.gt(0)
            },
        },
        14: {
            title: "Ascending Stars",
            description: "Every ascension past 26 increases stardust gain by +x1.",
            cost: new Decimal(20),
            unlocked() {
                return player[this.layer].total.gt(0)
            },
            effect() {
                return player.a.points.max(26).sub(25)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" }, 
        },
        15: {
            title: "Getting Heated",
            description: "Unlock a new star type.",
            cost: new Decimal(100),
            unlocked() {
                return player[this.layer].total.gt(0)
            },
        },
        21: {
            title: "Prestigious Passivity",
            description: "Gain the amount of prestige points you would gain from resetting each second.",
            cost: new Decimal(1000),
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        22: {
            title: "Stronger Self-Boost",
            description: "The fourth knowledge effect uses a better formula.",
            cost: new Decimal(3000),
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        23: {
            title: "More Discounts",
            description: "The second knowledge effect applies to prestige buyable 13.",
            cost: new Decimal(7500),
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        24: {
            title: "Stronger Speeds",
            description: "Prestige upgrade 23's base is squared.",
            cost: new Decimal(10000),
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        25: {
            title: "Getting Heated II",
            description: "Unlock a new star type and feature.",
            cost: new Decimal(200000),
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        31: {
            title: "Cosmical Points",
            description: "Cosmic score boosts points.",
            cost: new Decimal(15000000),
            unlocked() {
                return hasUpgrade('s', 25)
            },
            effect() {
                return new Decimal(3).pow(player[this.layer].cscore)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        32: {
            title: "Cosmical Prestige",
            description: "Cosmic score boosts prestige points.",
            cost: new Decimal(100000000),
            unlocked() {
                return hasUpgrade('s', 25)
            },
            effect() {
                return new Decimal(2).pow(player[this.layer].cscore)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        33: {
            title: "Cosmical Knowledge",
            description: "Cosmic score boosts knowledge.",
            cost: new Decimal(500000000),
            unlocked() {
                return hasUpgrade('s', 25)
            },
            effect() {
                return new Decimal(1.3).pow(player[this.layer].cscore)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        34: {
            title: "Cosmical Stardust",
            description: "Cosmic score boosts stardust.",
            cost: new Decimal(1e11),
            unlocked() {
                return hasUpgrade('s', 25)
            },
            effect() {
                return player[this.layer].cscore.add(1)
            },
            effectDisplay() { return format(upgradeEffect(this.layer, this.id))+"x" },
        },
        35: {
            title: "Cosmical Expansion",
            description: "Cosmic score is multiplied by x1.2.",
            cost: new Decimal(1e15),
            unlocked() {
                return hasUpgrade('s', 25)
            },
        },
        41: {
            title: "Payback",
            description: "Points increases cosmic score.",
            cost: new Decimal(1e27),
            unlocked() {
                return hasMilestone('s', 5)
            },
            effect() {
                return player.points.add(1).log(10).pow(0.5)
            },
            effectDisplay() { return "+"+format(upgradeEffect(this.layer, this.id)) },
        },
        42: {
            title: "Payback II",
            description: "Prestige points increases cosmic score.",
            cost: new Decimal(1e28),
            unlocked() {
                return hasMilestone('s', 5)
            },
            effect() {
                return player.p.points.add(1).log(10).pow(0.5)
            },
            effectDisplay() { return "+"+format(upgradeEffect(this.layer, this.id)) },
        },
        43: {
            title: "Payback III",
            description: "Knowledge increases cosmic score.",
            cost: new Decimal(1e30),
            unlocked() {
                return hasMilestone('s', 5)
            },
            effect() {
                return player.a.knowledge.add(1).log(10).pow(0.5).times(2)
            },
            effectDisplay() { return "+"+format(upgradeEffect(this.layer, this.id)) },
        },
        44: {
            title: "Payback IV",
            description: "Stardust increases cosmic score.",
            cost: new Decimal(1e32),
            unlocked() {
                return hasMilestone('s', 5)
            },
            effect() {
                return player.s.points.add(1).log(10)
            },
            effectDisplay() { return "+"+format(upgradeEffect(this.layer, this.id)) },
        },
        45: {
            title: "?????????",
            description: "The end (for now)",
            cost: new Decimal(2.5e33),
            unlocked() {
                return hasMilestone('s', 5)
            },
        },
    },
    clickables: {
        11: {
            display() {return "Assign 1 stardust to M-Star type"},
            canClick() {
                return player[this.layer].points.gt(0)
            },
            onClick() {
                player[this.layer].points = player[this.layer].points.sub(1)
                player[this.layer].stars[0] = player[this.layer].stars[0].add(1)
            },
        },
        12: {
            display() {return "Assign 1 stardust to K-Star type"},
            canClick() {
                return player[this.layer].points.gt(0)
            },
            onClick() {
                player[this.layer].points = player[this.layer].points.sub(1)
                player[this.layer].stars[1] = player[this.layer].stars[1].add(1)
            },
        },
        13: {
            display() {return "Assign 1 stardust to G-Star type"},
            canClick() {
                return player[this.layer].points.gt(0)
            },
            onClick() {
                player[this.layer].points = player[this.layer].points.sub(1)
                player[this.layer].stars[2] = player[this.layer].stars[2].add(1)
            },
        },
        14: {
            display() {return "Assign 1 stardust to F-Star type"},
            canClick() {
                return player[this.layer].points.gt(0)
            },
            onClick() {
                player[this.layer].points = player[this.layer].points.sub(1)
                player[this.layer].stars[3] = player[this.layer].stars[3].add(1)
            },
            unlocked() {
                return hasUpgrade('s', 15)
            },
        },
        15: {
            display() {return "Assign 1 stardust to A-Star type"},
            canClick() {
                return player[this.layer].points.gt(0)
            },
            onClick() {
                player[this.layer].points = player[this.layer].points.sub(1)
                player[this.layer].stars[4] = player[this.layer].stars[4].add(1)
            },
            unlocked() {
                return hasUpgrade('s', 25)
            },
        },
        masterButtonText: "Distribute",
        masterButtonPress() {
            startypes = 3
            if (hasUpgrade('s', 15)) startypes = 4
            if (hasUpgrade('s', 25)) startypes = 5
            distributeamount = player[this.layer].points.div(startypes).floor()
            player[this.layer].stars[0] = player[this.layer].stars[0].add(distributeamount)
            player[this.layer].stars[1] = player[this.layer].stars[1].add(distributeamount)
            player[this.layer].stars[2] = player[this.layer].stars[2].add(distributeamount)
            if (hasUpgrade('s', 15)) player[this.layer].stars[3] = player[this.layer].stars[3].add(distributeamount)
            if (hasUpgrade('s', 25)) player[this.layer].stars[4] = player[this.layer].stars[4].add(distributeamount)
            player[this.layer].points = player[this.layer].points.sub(distributeamount.mul(startypes))            
        },
    },
    challenges: {
        11: {
            name: "Rough Red",
            fullDisplay() {
                return "Prestige point and knowledge gain is raised by ^0.5.<br><br>Gain score based on points.<br><br>Score: "+format(player[this.layer].score[0])+"<br><br>Effect: x"+format(player[this.layer].score[0].add(1).pow(2))+" M-Energy."
            },
            goal() {
                return new Decimal(1).div(0);
            },
            onExit() {
                score = player.points.log(10).div(5).pow(0.8)
                if (score.gt(player[this.layer].score[0])) player[this.layer].score[0] = score
            }
        },
        12: {   
            name: "Whimsical Orange",
            fullDisplay() {
                return "Base knowledge gain is always 1.<br><br>Gain score based on prestige points.<br><br>Score: "+format(player[this.layer].score[1])+"<br><br>Effect: x"+format(player[this.layer].score[1].add(1).pow(2))+" K-Energy."
            },
            goal() {
                return new Decimal(1).div(0);
            },
            onExit() {
                score = player.p.points.log(2).pow(0.5)
                if (score.gt(player[this.layer].score[1])) player[this.layer].score[1] = score
            }
        },
        21: {
            name: "Elegant Yellow",
            fullDisplay() {
                return "Base knowledge formula is stronger, but knowledge gain can't be boosted in any other way.<br><br>Gain score based on knowledge.<br><br>Score: "+format(player[this.layer].score[2])+"<br><br>Effect: x"+format(player[this.layer].score[2].add(1).pow(2))+" G-Energy."
            },
            goal() {
                return new Decimal(1).div(0);
            },
            onExit() {
                score = player.a.knowledge.log(10).div(2)
                if (score.gt(player[this.layer].score[2])) player[this.layer].score[2] = score
            }
        },
        22: {
            name: "Pure White",
            fullDisplay() {
                return "You are trapped in ascension challenges 2 and 4.<br><br>Gain score based on stardust gained on reset.<br><br>Score: "+format(player[this.layer].score[3])+"<br><br>Effect: x"+format(player[this.layer].score[3].add(1).pow(2))+" F-Energy."
            },
            goal() {
                return new Decimal(1).div(0);
            },
            onExit() {
                score = getResetGain(this.layer).log(10).times(5)
                if (score.gt(player[this.layer].score[3])) player[this.layer].score[3] = score
            }
        },
        31: {
            name: "Classic Cyan",
            fullDisplay() {
                return "Cosmic score is always 0.<br><br>Gain score based on overall progress.<br><br>Score: "+format(player[this.layer].score[4])+"<br><br>Effect: x"+format(player[this.layer].score[4].add(1).pow(2))+" A-Energy."
            },
            goal() {
                return new Decimal(1).div(0);
            },
            unlocked() {
                return hasMilestone('s', 3)
            },
            onExit() {
                score = player.points.log(10).div(5).pow(0.8).add(player.p.points.log(2).pow(0.5).add(player.a.knowledge.log(10).div(2).add(getResetGain(this.layer).log(10).times(5)))).div(4)
                if (score.gt(player[this.layer].score[4])) player[this.layer].score[4] = score
            }
        },
    },
    milestones: {
        0: {
            requirementDescription: "50 cosmic score",
            effectDescription: "Keep ascension challenges on reset.",
            done() { return player[this.layer].cscore.gte(50) }
        },
        1: {
            requirementDescription: "125 cosmic score",
            effectDescription: "Keep ascension milestones on reset.",
            done() { return player[this.layer].cscore.gte(125) }
        },
        2: {
            requirementDescription: "200 cosmic score",
            effectDescription: "Ascension resets nothing and you also automatically ascend.",
            done() { return player[this.layer].cscore.gte(200) }
        },
        3: {
            requirementDescription: "400 cosmic score",
            effectDescription: "Unlock a new challenge.",
            done() { return player[this.layer].cscore.gte(400) }
        },
        4: {
            requirementDescription: "550 cosmic score",
            effectDescription: "Star energy generation formula is better.",
            done() { return player[this.layer].cscore.gte(550) }
        },
        5: {
            requirementDescription: "875 cosmic score",
            effectDescription: "Unlock a new row of upgrades.",
            done() { return player[this.layer].cscore.gte(875) }
        },
    },
})