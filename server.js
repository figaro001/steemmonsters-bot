const steem = require("steem");
const fetch = require("node-fetch");
const md5 = require("md5");
const KEYS = require("./keys.json");
const whiteRules = require("./whiteRules.json");


class Battle {

  constructor(callback, appName = "steemmonsters/0.6.2", matchType = "Ranked") {
    this.callback = callback;
    this.status = {};
    this.submittedTeam = false;

    //broadcast sm_find_match
    steem.broadcast.customJson(KEYS.posting, [], [KEYS.username], "sm_find_match", JSON.stringify({
      match_type: matchType,
      app: appName
    }), (err, result) => {
      if (err) throw err;
      console.log("Broadcasted sm_find_match");
      this.findMatchId = result.id;

        });
    //start /battle/status check loop
    this._checkInterval = setInterval(() => {
      this._checkBattleStatus();
    }, 2500);
  }


  end() {
    this.ended = true;
    clearInterval(this._checkInterval);
  }

  setTeam(team) {
    this.team = team;
  }


  //surrender if isn't your splinter
  surrender(){
    let dataSurrender= {
      battle_queue_id: this.findMatchId,
      app: this.appName
    }
    steem.broadcast.customJson(KEYS.posting, [], [KEYS.username], "sm_surrender",JSON.stringify(dataSurrender))
  }


  

  broadcastTeam(summoner, monsters, skipReveal = false) {
    const secret = Battle.generatePassword();
    const teamHash = md5(summoner + "," + monsters.join() + "," + secret)
    const team = {
      summoner,
      monsters,
      secret
    };

    this.submittedTeam = true;
    var data = {
      trx_id: this.findMatchId,
      team_hash: teamHash,
      app: this.appName
    };
    if (skipReveal) {
      data.summoner = summoner;
      data.monsters = monsters;
      data.secret = secret;
    }


    //submit team into blockchain
    steem.broadcast.customJson(KEYS.posting, [], [KEYS.username], "sm_submit_team", JSON.stringify(data), async (err, result) => {
      if (err) throw err;
      console.log("Broadcasted sm_submit_team");
      this.findMatchId = result.id;
      if (!skipReveal) {
        await new Promise(resolve => setTimeout(resolve, 3300));
        console.log("Revealing team...");
        steem.broadcast.customJson(KEYS.posting, [], [KEYS.username], "sm_team_reveal", JSON.stringify({
          ...data,
          summoner: summoner,
          monsters: monsters,
          secret: secret
        }), (err, result) => {
          console.log("Revealed team!");
        });
      }
    });
  }

  _revealTeam() {

  }
  async _checkBattleStatus() {
    if (!this.findMatchId) return;
    const rawResponse = await fetch("https://api.steemmonsters.io/battle/status?id=" + this.findMatchId);
    const json = await rawResponse.json();
    this.status.data = json;
    this.mana=json.mana_cap;
    this.ruleset= json.ruleset;
    this.inactive= json.inactive;




    if ((typeof json) === "string") {
      console.log(json);
      this.status.statusName = "battleTxProcessing";
      this.callback(this.status);
      return;
    }

    if (json.error) {
      this.status.statusName = "error";
    } else if (json.status === 0) {
      this.status.statusName = "searchingForEnemy";
    } else if (json.status === 1) {
      this.status.statusName = "enemyFound";
    } else if (json.status === 3) {
      this.status.statusName = "noEnemyFound";
    }
    this.callback(this.status);
  }
  _checkBattleTrxStatus() {

  }
  static generatePassword(length = 10) {
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }
}


// create an infinite loop of battles
async function repeat(){
  
  setInterval(async()=>{
      start();
   }, 180000)

  }
async function start() {
  let submittedTeam = false;


  const battle = new Battle(async status => {
    console.log(status.statusName);
    let battleArray;
    let manaCap= await battle.mana;
    let currentRuleset= await battle.ruleset;
    let inactive= await battle.inactive;
    let regEx= /\bWhite/g;



       switch (currentRuleset) {
      //++++++++++++++++++++++++++++++++++INDIVIDUALS and doubles equivalent++++++++++++++++++++++++++++++++++
  
      //----------------------------------------Primaries-----------------------------------
  
  
      case "Standard":
       battleArray = blackRules.Standard[manaCap].black;
  
          break;
      case "Back to Basics|Lost Legendaries":
      case "Back to Basics":
         battleArray = blackRules.backToBasics[manaCap].black;
          break;
  
  
      case "Silenced Summoners|Lost Legendaries":
      case "Silenced Summoners":
         battleArray = blackRules.silencedSummoners[manaCap].black;
  
          break;
      case "Aim True|Lost Legendaries":
      case "Aim True":
         battleArray = blackRules.aimTrue[manaCap].black;
  
          break;
  
      case "Super Sneak|Lost Legendaries":
      case "Super Sneak":
  
         battleArray = blackRules.superSneak[manaCap].black;
  
          break;
      case "Weak Magic|Lost Legendaries":
      case "Weak Magic":
         battleArray = blackRules.weakMagic[manaCap].black;
  
          break;
      case "Unprotected|Lost Legendaries":
      case "Unprotected":
         battleArray = blackRules.unprotected[manaCap].black;
  
          break;
  
      case "Target Practice|Lost Legendaries":
      case "Target Practice":
         battleArray = blackRules.targetPractice[manaCap].black;
  
          break;
  
      case "Fog of War|Lost Legendaries":
      case "Fog of War":
         battleArray = blackRules.fogOfWar[manaCap].black;
  
          break;
      case "Armored Up|Lost Legendaries":
      case "Armored Up":
         battleArray = blackRules.armoredUp[manaCap].black;
  
          break;
          //----------------------------------------any-----------------------------------
  
      case "Reverse Speed|Lost Legendaries":
        case "Earthquake|Reverse Speed":
          case "Healed Out|Reverse Speed":
          case "Armored Up|Reverse Speed":
          case "Fog of War|Reverse Speed":
          case "Target Practice|Reverse Speed":
          case "Unprotected|Reverse Speed":
          case "Weak Magic|Reverse Speed":
          case "Super Sneak|Reverse Speed":
          case "Aim True|Reverse Speed":
          case "Back to Basics|Reverse Speed":
          case "Silenced Summoners|Reverse Speed":
      case "Reverse Speed":
         battleArray = blackRules.reverseSpeed[manaCap].black;
  
          break;
      case "Earthquake|Lost Legendaries":

      case "Reverse Speed|Earthquake":
          case "Healed Out|Earthquake":
          case "Armored Up|Earthquake":
          case "Fog of War|Earthquake":
          case "Target Practice|Earthquake":
          case "Unprotected|Earthquake":
          case "Weak Magic|Earthquake":
          case "Super Sneak|Earthquake":
          case "Aim True|Earthquake":
          case "Back to Basics|Earthquake":
          case "Silenced Summoners|Earthquake":
      case "Earthquake":
         battleArray = blackRules.earthquake[manaCap].black;
  
          break;


          case "Earthquake|Healed Out":
            case "Reverse Speed|Healed Out":
            case "Armored Up|Healed Out":
            case "Fog of War|Healed Out":
            case "Target Practice|Healed Out":
            case "Unprotected|Healed Out":
            case "Weak Magic|Healed Out":
            case "Super Sneak|Healed Out":
            case "Aim True|Healed Out":
            case "Back to Basics|Healed Out":
            case "Silenced Summoners|Healed Out":
      case "Healed Out|Lost Legendaries":
      case "Healed Out":
         battleArray = blackRules.healedOut[manaCap].black;
  
          break;
  
          //----------------------------------------secondaries-----------------------------------
  
  
  
  
  
  
  
  
      case "Lost Legendaries":
         battleArray = blackRules.noLegendaries[manaCap].black;
          break;
  
  
      case "Earthquake|Melee Mayhem":
      case "Reverse Speed|Melee Mayhem":
      case "Healed Out|Melee Mayhem":
      case "Armored Up|Melee Mayhem":
      case "Fog of War|Melee Mayhem":
      case "Target Practice|Melee Mayhem":
      case "Unprotected|Melee Mayhem":
      case "Weak Magic|Melee Mayhem":
      case "Super Sneak|Melee Mayhem":
      case "Aim True|Melee Mayhem":
      case "Back to Basics|Melee Mayhem":
      case "Silenced Summoners|Melee Mayhem":
      case "Melee Mayhem":
         battleArray = blackRules.meleeMayhem[manaCap].black;
  
  
          break;
  
  
  
  
      case "Healed Out|Taking Sides":
      case "Reverse Speed|Taking Sides":
      case "Earthquake|Taking Sides":
      case "Armored Up|Taking Sides":
      case "Fog of War|Taking Sides":
      case "Target Practice|Taking Sides":
      case "Unprotected|Taking Sides":
      case "Weak Magic|Taking Sides":
      case "Super Sneak|Taking Sides":
      case "Aim True|Taking Sides":
      case "Back to Basics|Taking Sides":
      case "Silenced Summoners|Taking Sides":
      case "Taking Sides":
         battleArray = blackRules.takinSides[manaCap].black;
  
          break;
  
  
  
      case "Healed Out|Rise of the Commons":
      case "Reverse Speed|Rise of the Commons":
      case "Earthquake|Rise of the Commons":
      case "Armored Up|Rise of the Commons":
      case "Fog of War|Rise of the Commons":
      case "Target Practice|Rise of the Commons":
      case "Unprotected|Rise of the Commons":
      case "Weak Magic|Rise of the Commons":
      case "Super Sneak|Rise of the Commons":
      case "Aim True|Rise of the Commons":
      case "Back to Basics|Rise of the Commons":
      case "Silenced Summoners|Rise of the Commons":
  
      case "Rise of the Commons":
         battleArray = blackRules.riseOfTheCommons[manaCap].black;
  
          break;
  
  
  
  
  
      case "Healed Out|Up Close & Personal":
      case "Reverse Speed|Up Close & Personal":
      case "Earthquake|Up Close & Personal":
      case "Armored Up|Up Close & Personal":
      case "Fog of War|Up Close & Personal":
      case "Target Practice|Up Close & Personal":
      case "Unprotected|Up Close & Personal":
      case "Weak Magic|Up Close & Personal":
      case "Super Sneak|Up Close & Personal":
      case "Aim True|Up Close & Personal":
      case "Back to Basics|Up Close & Personal":
      case "Silenced Summoners|Up Close & Personal":
      case "Up Close & Personal":
         battleArray = blackRules.upClose[manaCap].black;
  
          break;
  
  
  
  
      case "Healed Out|Broken Arrows":
      case "Reverse Speed|Broken Arrows":
      case "Earthquake|Broken Arrows":
      case "Armored Up|Broken Arrows":
      case "Fog of War|Broken Arrows":
      case "Target Practice|Broken Arrows":
      case "Unprotected|Broken Arrows":
      case "Weak Magic|Broken Arrows":
      case "Super Sneak|Broken Arrows":
      case "Aim True|Broken Arrows":
      case "Back to Basics|Broken Arrows":
      case "Silenced Summoners|Broken Arrows":
      case "Broken Arrows":
         battleArray = blackRules.brokenArrows[manaCap].black;
  
          break;
  
  
  
  
      case "Healed Out|Little League":
      case "Reverse Speed|Little League":
      case "Earthquake|Little League":
      case "Armored Up|Little League":
      case "Fog of War|Little League":
      case "Target Practice|Little League":
      case "Unprotected|Little League":
      case "Weak Magic|Little League":
      case "Super Sneak|Little League":
      case "Aim True|Little League":
      case "Back to Basics|Little League":
      case "Silenced Summoners|Little League":
      case "Little League":
         battleArray = blackRules.littleLeague[manaCap].black;
  
          break;
  
  
  
      case "Healed Out|Keep Your Distance":
      case "Reverse Speed|Keep Your Distance":
      case "Earthquake|Keep Your Distance":
      case "Armored Up|Keep Your Distance":
      case "Fog of War|Keep Your Distance":
      case "Target Practice|Keep Your Distance":
      case "Unprotected|Keep Your Distance":
      case "Weak Magic|Keep Your Distance":
      case "Super Sneak|Keep Your Distance":
      case "Aim True|Keep Your Distance":
      case "Back to Basics|Keep Your Distance":
      case "Silenced Summoners|Keep Your Distance":
      case "Keep Your Distance":
         battleArray = blackRules.keepYourDistance[manaCap].black;
  
          break;
  
  
  
  }


  //Check if your splinter is available and chose the right strategy
try{
    if (inactive.match(regEx)) {
      battle.surrender();
      battle.end();
      console.log("Sorry boss, I'm surrendered :(")

    } else if (!submittedTeam && (status.statusName === "enemyFound") ){
      battle.broadcastTeam("C1-38-1PQQEY75TC", battleArray);
      submittedTeam = true;
      battle.end();   
    }
} catch(error){
console.log(error)
}

  });



}



//Start the loop
repeat();




