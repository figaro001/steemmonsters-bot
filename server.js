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



    //Know  which is the current ruleset
    switch(currentRuleset){
      case "Lost Legendaries":
              battleArray= whiteRules.noLegendaries[manaCap].white;
      break;
  
      case "Standard":
              battleArray= whiteRules.Standard[manaCap].white;
  
      break;
  
      case "Back to Basics":
               battleArray= whiteRules.backToBasics[manaCap].white;
      break;
  
      case "Melee Mayhem":
               battleArray= whiteRules.meleeMayhem[manaCap].white;
  
  
      break;
  
      case "Taking Sides":
           battleArray= whiteRules.takinSides[manaCap].white;
  
      break;

      case "Silenced Summoners":
           battleArray= whiteRules.silencedSummoners[manaCap].white;
  
      break;


      
      case "Rise of the Commons":
        battleArray= whiteRules.riseOfTheCommons[manaCap].white;

   break;


   case "Aim True":
    battleArray= whiteRules.aimTrue[manaCap].white;

break;


case "Super Sneak":
  battleArray= whiteRules.superSneak[manaCap].white;

break;


case "Weak Magic":
  battleArray= whiteRules.weakMagic[manaCap].white;

break;


case "Unprotected":
  battleArray= whiteRules.unprotected[manaCap].white;

break;


case "Target Practice":
  battleArray= whiteRules.targetPractice[manaCap].white;

break;


case "Up Close & Personal":
  battleArray= whiteRules.upClose[manaCap].white;

break;

case "Reverse Speed":
  battleArray= whiteRules.reverseSpeed[manaCap].white;

break;

case "Broken Arrows":
  battleArray= whiteRules.brokenArrows[manaCap].white;

break;

case "Fog of War":
  battleArray= whiteRules.fogOfWar[manaCap].white;

break;

case "Little League":
  battleArray= whiteRules.littleLeague[manaCap].white;

break;

case "Earthquake":
  battleArray= whiteRules.earthquake[manaCap].white;

break;

case "Healed Out":
  battleArray= whiteRules.healedOut[manaCap].white;

break;

case "Armored Up":
  battleArray= whiteRules.armoredUp[manaCap].white;

break;


case "Keep Your Distance":
  battleArray= whiteRules.keepYourDistance[manaCap].white;

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




