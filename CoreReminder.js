var Discord = require('discord.js');
var fs = require('fs');
var client = new Discord.Client();
var token;
const variables = new Map();
const { Raid } = require('./database/db')
const { exec } = require('child_process');

const channels = new Map();
var alertChannelId;
var chatChannelId;
var adminRole;
var BirdRole;
var tpsChannelId;
var BotOnId;
var SlackersId;
var prefix;
var PointHomesId;
let dev = false;
//---------------------------------------
variables.set("cooldown", [])
var countdown = 120;
variables.set("MembersOnline", [])
var WallsThreshHold = 8
var BuffersThreshHold = 12
var NotCheckingTax = false;
var NotCheckingTaxPlayerOnline = false;
var Threshold = true;
var HomeToggle = false
var HomeSpawnToggle = false
var HomeTpingStep1 = false
var HomeTpingStep2 = false
var AutomaticPointHomeTerminate = false
var AutomaticPointHomeTerminateToggle = false
var SethomePointRaidToggle = false
var AutomaticSethomePointRaidTerminate
var SethomeSpawnToggle = false
var SethomeTpingStep1 = false
var SethomeTpingStep2 = false
var SethomeTpingStep3 = false
var SethomeError = false
if (dev) { // Used for testing on Test server
    token = "*********************************************" // Your discord token, you can find it at the Discord Developer Portal
    alertChannelId = "824477359980806205";
    chatChannelId = "824468618120265752";
    adminRole = "824468872009613352"
    BirdRole = "807495378253119548"
    tpsChannelId = "828506986236739604";
    BotOnId = "829067203189014559";
    SlackersId = "834490174011473930";
    PointHomesId = "837627765057912892"
    prefix = "!"
} else { // Main server
    token = '*********************************************'; // Your discord token
    alertChannelId = "824502576619192390";
    chatChannelId = "808090980175052861";
    adminRole = "807495378991710228"
    BirdRole = "807495378253119548"
    tpsChannelId = "828506216115994665";
    BotOnId = "829066599163101234";
    SlackersId = "834489951159976006";
    PointHomesId = "837821529899008010";
    prefix = "!"
}

let planet = "dungeon"; // The planet you are playing on ( Made for the server : CosmicPvp)
let factionName = "Sabbath" // Your faction name

const mineflayer = require('mineflayer');
//const { count } = require('node:console');
//const { array } = require('yargs');
//-----------------------------------------------------------------------------

client.on('ready', () => {
    console.log('SABBATH Point Reminders');
    console.log(adminRole)
    const alertChannel = client.channels.cache.get(alertChannelId);
    const tpschannel = client.channels.cache.get(tpsChannelId);
    const BotOn = client.channels.cache.get(BotOnId);
    const SlackersChannel = client.channels.cache.get(SlackersId);
    const PointHomesChannel = client.channels.cache.get(PointHomesId)
    channels.set('BotOn', BotOn)
    channels.set('tpschannel', tpschannel)
    channels.set("alertChannel", alertChannel)
    channels.set("SlackersChannel", SlackersChannel)
    channels.set("PointHomesChannel", PointHomesChannel)
    variables.set('tpstoggled', true);
});

var options = ({
    host: "cosmicpvp.com",
    port: 25565,
    username: "********", //Minecraft Email
    password: "******", //Minecraft Password
    checkTimeoutInterval: 5 * 60 * 1000,
    version: "1.8",
    plugins: {
        skyLightSent: false,
        blocks: false,
        physics: false,
        block_actions: false,
        //"ChatLogging": require('mineflayer-dashboard')
    },
    logErrors: false
});


var mcuser = mineflayer.createBot(options);
//global.console.log = mcuser.dashboard.log
bindEvents(mcuser);
function bindEvents(mcuser) {
    mcuser.on('login', () => {
        console.log("Bot is ONLINE");
        let length = planet.length

        capital = planet.split("")[0].toUpperCase().toString()
        setTimeout(function () {
            mcuser.chat(`/server ` + planet + `planet`)
            console.log(`Online on ` + (capital + planet.substring(1, length)) + ` Planet on the account ` + `` + mcuser.username + ` `)
            pingFunction();
        }, 5000);

        let minecraftAccount = mcuser.username
    });
};

function pingFunction() {
    setInterval(function () {
        mcuser.chat(`/server ` + planet + `planet`)
    }, 5000);
}

mcuser.on('kicked', reason => console.log(`Bot Kicked: ${reason.text}`))

//---------------------------------------------------------------------------------

async function addHours(h) {
    let raidTime = new Date();
    raidTime.setHours(raidTime.getHours() + h);
    return raidTime.valueOf();
}

async function setNewTime(data = {}) {
    let raidTime = new Date().valueOf();
    let newTime = (data.hours * 60 * 60 * 1000) + (data.minutes * 60 * 1000) + (data.seconds * 1000)
    raidTime = raidTime + newTime;
    return raidTime;
}


const getTimeString = (ms) => {
    const sign = ms < 0 ? '-' : '';
    const absMs = Math.abs(~~ms);
    const [h, m, s] = [1000 * 60 * 60, 1000 * 60, 1000].map(calcMs => ('0' + ~~((absMs / calcMs) % 60)).substr(-2));
    return `${sign}${parseInt(h, 10) ? `${h} Hrs ` : ''}${m} Mins ${s} Secs`;
}

client.on('message', async message => {

    if (message.channel.id == chatChannelId) {
        let line = message.content.split("\n")
        line.forEach(async c => {
            if (c.startsWith("(!) You have breached")) {
                let faction = c.split(" ")[4]
                faction = faction.substring(0, faction.length - 2);
                let current = await addHours(8)
                console.log(current)
                let currentInfo = await Raid.findOne({ where: { faction } })
                if (!currentInfo || currentInfo == null) {
                    Raid.create({ faction, raidTime: current })
                } else {
                    currentInfo.update({ raidTime: current, lastAlert: null })
                }
            }
        });
    }

    if (message.content.startsWith(prefix + "add")) {
        let args = message.content.split(" ")
        if (message.member.roles.cache.has(adminRole)) {
            let faction = args[1]

            let current = await addHours(8)

            let currentInfo = await Raid.findOne({ where: { faction } })

            if (!currentInfo || currentInfo == null) {
                Raid.create({ faction, raidTime: current })
            } else {
                currentInfo.update({ raidTime: current, lastAlert: null })
            }
        }
    }

    if (message.content.startsWith(prefix + "StatusCheck")) {
        if (message.member.roles.cache.has(adminRole)) {
            console.log(SethomeSpawnToggle)
            console.log(SethomeTpingStep1)
            console.log(SethomeTpingStep2)
            console.log(SethomeTpingStep3)
            console.log(SethomeError)
            console.log(SethomePointRaidToggle)
        }
    }

    if (message.content.startsWith(prefix + "refresh")) {
        if (message.member.roles.cache.has(BirdRole)) {
            HomeSpawnToggle = false
            HomeTpingStep1 = false
            HomeTpingStep1 = false
            SethomePointRaidToggle = false
            SethomeError = false
            SethomeSpawnToggle = false
            SethomeTpingStep1 = false
            SethomeTpingStep2 = false
            SethomeTpingStep3 = false
        }
    }

    if (message.content.startsWith(prefix + "showhomes")) {
        if (message.member.roles.cache.has(BirdRole)) {
            HomeToggle = true
            mcuser.chat("/home abcdefg")
        }
    }

    if (message.content.startsWith(prefix + "home")) {
        if (message.member.roles.cache.has(BirdRole)) {
            if (HomeSpawnToggle == false && HomeTpingStep1 == false && HomeTpingStep2 == false) {
                let args = message.content.split(" ")
                let home = args[1];
                AutomaticPointHomeTerminate = true
                HomeSpawnToggle = true
                let HomeMessage1 = new Discord.MessageEmbed()
                    .setTitle("Initalizing PointRaidHome Feature, Please wait 10 seconds until the bot has confirmed that the home is in a tpable area")
                channels.get("PointHomesChannel").send(HomeMessage1)
                mcuser.chat("/spawn")
                await WaitTime(8)
                mcuser.chat("/f map")
                await TwoSeconds()
                if (HomeTpingStep1 == true) {
                    channels.get("PointHomesChannel").send("```" + "The bot is now tping to the PointHome Please wait 10 for the notification to tp to the bot" + "```")
                    await WaitTime(5)
                    mcuser.chat("/home " + home + "")
                    await WaitTime(8)
                    mcuser.chat("/f map")
                }
            }
            else {
                channels.get("PointHomesChannel").send("```" + "PointHome command is already running, do !refresh to stop the current request and restart." + "```")
            }
        }
    }

    if (message.content.startsWith(prefix + "sethome")) {
        if (message.member.roles.cache.has(BirdRole)) {
            if (SethomePointRaidToggle == false) {
                let args = message.content.split(" ")
                let home = args[1];
                variables.set('SethomeName', home)
                SethomePointRaidToggle = true
                SethomeSpawnToggle = true
                let HomeMessage1 = new Discord.MessageEmbed()
                    .setTitle("Initalizing PointRaid Set Home Feature, Please wait 10 seconds until the bot has confirmed that the home is in a tpable area")
                channels.get("PointHomesChannel").send(HomeMessage1)
                mcuser.chat("/spawn")
                SethomeSpawnToggle == true
                await WaitTime(8)
                mcuser.chat("/f map")
                await WaitTime(2)
                channels.get("PointHomesChannel").send("```" + "The bot is ready to be tped, please send Infernoed a /tpahere" + "```")
            } else {
                channels.get("PointHomesChannel").send("```" + "Point SetHome Command already running, do !refresh to stop the current request and restart." + "```")
            }
        }
    }

    if (message.content.startsWith(prefix + "delhome")) {
        if (message.member.roles.cache.has(BirdRole)) {
            let args = message.content.split(" ")
            let home = args[1];
            mcuser.chat("/delhome " + home)
            channels.get("PointHomesChannel").send("```" + "The PointHome " + home + " has been deleted" + "```")
        }
    }


    if (message.content.startsWith(prefix + "toggle")) {
        let args = message.content.split(" ")
        if (message.member.roles.cache.has(adminRole)) {
            if (args[1] == "tps") {

                if (variables.get('tpstoggled') == true) {
                    variables.set('tpstoggled', false)
                    console.log("off")
                } else {
                    variables.set('tpstoggled', true)
                    console.log("on")
                }

                message.reply("Set Toggled to : " + variables.get('tpstoggled'))

            }
        }
    }

    if (message.content.startsWith(prefix + "stop")) {
        if (message.member.roles.cache.has(BirdRole)) {
            let args = message.content.split(" ")
            if (args[1]) {
                Raid.destroy({ where: { faction: args[1] } }).then(c => {
                    message.reply("If the faction " + args[1] + " existed in the alerts, it has been stopped")
                })

            } else {
                message.reply("Invalid use of this command, try doing /stop factionname")
            }
        }

    }

    if (message.content.startsWith(prefix + "make")) {
        let args = message.content.split(" ")
        let faction = args[1];

        let data = await Raid.findOne({ where: { faction } })
        if (!data || data == null) {
            message.reply("This faction doesn't exist.")
        } else {
            let hours = (args[2].includes("h")) ? parseInt(args[2]) : 0
            let minutes = (args[2].includes("m")) ? parseInt(args[2]) : (typeof args[3] !== 'undefined' && args[3].includes("m")) ? parseInt(args[3]) : 0
            let seconds = (args[2].includes("s")) ? parseInt(args[2]) : (typeof args[3] !== 'undefined' && args[3].includes("s")) ? parseInt(args[3]) : (typeof args[4] !== 'undefined' && args[4].includes("s")) ? parseInt(args[4]) : 0

            console.log(hours)
            console.log(minutes)
            console.log(seconds)

            let time = await setNewTime({ hours, minutes, seconds })
            console.log(time)
            data.update({ raidTime: time, lastAlert: null })
            message.reply("Cooldown has been updated.")
        }
    }


    if (message.content.startsWith(prefix + "message")) {
        if (message.member.roles.cache.has(adminRole)) {
            let content = message.content.slice(9);
            mcuser.chat(content)

        }
    }

    if (message.content.startsWith(prefix + "autotest")) {
        if (message.member.roles.cache.has(adminRole)) {
            let AutoUpdatefactions = []
            Raid.findAll().then(c => {
                //[ 
                //{ "id": 4, "faction": "iconic", "raidTime": "1618195148790.0", "lastAlert": null, "createdAt": "2021-04-09T10:28:26.227Z", "updatedAt": "2021-04-11T18:39:08.796Z" },
                //{ "id": 5, "faction": "Sabbath", "raidTime": "No Active Time", "lastAlert": 4, "createdAt": "2021-04-09T10:28:55.635Z", "updatedAt": "2021-04-09T10:28:55.635Z" }
                //]
                //for each array element
                c.map(d => {
                    //d = {dataValues: { faction: "sabbath", raidTime: 12352512515221, lastAlert: 3 } }

                    d = d.dataValues;
                    // d = { faction: "sabbath", raidTime: 12352512515221, lastAlert: 3 }
                    AutoUpdatefactions.push(d.faction)
                    // d.faction = "sabbath"
                })


                console.log(AutoUpdatefactions)
                // ["sabbath", "iconic"]
                // "sabbath, iconic"
                message.reply(AutoUpdatefactions.join(", "))
            })
        }
    }

    if (message.content.startsWith(prefix + "clear")) {
        if (message.member.roles.cache.has(adminRole)) {
            let c = await Raid.findAll()
            c.forEach(d => {
                d.destroy();
            })
        }
    }

    if (message.content.startsWith(prefix + "countdown")) {
        if (message.member.roles.cache.has(adminRole)) {
            let args = message.content.split(" ")
            let countdownTime = args[1];
            console.log(countdownTime)
            countdown = countdownTime
        }
    }

    if (message.content.startsWith(prefix + "update")) {
        if (message.member.roles.cache.has(BirdRole)) {
            let args = message.content.split(" ")
            let faction = args[1];

            variables.set("factionupdate", faction);

            mcuser.chat("/f who " + faction)

            //let time = await setNewTime({ hours, minutes, seconds })
            //data.update({ raidTime: time, lastAlert: null })
            message.reply("Cooldown has been updated.")

        }
    }

    if (message.content.startsWith(prefix + "list")) {
        if (message.member.roles.cache.has(BirdRole)) {

            Raid.findAll().then(c => {

                console.log(c.length)

                let factions = [''];

                let cooldown = [];

                let raidable = [];

                c.map(d => {
                    if (d.dataValues.lastAlert == 4) {
                        cooldown.push(d.dataValues);
                    } else {
                        raidable.push(d.dataValues)
                    }
                })

                raidable.sort((a, b) => {
                    return a.raidTime > b.raidTime
                })

                let cd = [];

                raidable.map(d => {

                    let raidTime = d.raidTime;

                    let currentTime = Date.now();

                    let time = new Date(raidTime - currentTime);
                    let hours = getTimeString(time)

                    if (factions.length == 0) {
                        factions.push("")
                    }

                    if (factions[factions.length - 1].split("").length >= 950) {
                        factions.push("")
                    }

                    var index;
                    factions.map((value, number) => {

                        if (value.split("").length < 950) {
                            index = number;
                        }
                    })
                    factions[index] += d.faction + " - " + hours + "\n"
                })

                cooldown.map(c => {
                    let raidTime = c.raidTime;

                    if (c.lastAlert == 4) {

                        if (cd.length == 0) {
                            cd.push("")
                        }

                        if (cd[cd.length - 1].split("").length >= 950) {
                            cd.push("")
                        }

                        var index2;
                        cd.map((value, number) => {

                            if (value.split("").length < 950) {
                                index2 = number;
                            }
                        })
                        cd[index2] += c.faction + " - " + raidTime + "\n"
                    }

                })
                var embeds = []
                // this is embed

                for (let i = 0; i < factions.length; i++) {
                    try {
                        if (typeof embeds[i] == 'undefined') {
                            embeds.push(new Discord.MessageEmbed().setTitle("Factions"))
                        }
                    }
                    catch (err) {
                        console.log(err)
                    }

                    embeds[i].addField("Raidable", factions[i], true)
                }

                for (let i = 0; i < cd.length; i++) {
                    try {
                        if (typeof embeds[i] == 'undefined') {
                            embeds.push(new Discord.MessageEmbed().setTitle("Factions"))
                        }
                    }
                    catch (err) {
                        console.log(err)
                    }

                    embeds[i].addField("Raidable", cd[i], true)

                }

                embeds.map(c => {
                    message.channel.send(c)
                })
            })
        }
    }
})


setInterval(function () {
    mcuser.chat("/find PradaBelt")
    if (variables.get('tpstoggled') == true) {
        console.log("running")
        variables.set("tps", true);
        mcuser.chat("/tps")

    } else {
        console.log(variables.get('tpstoggled'))

    }
}, 1 * 60 * 1000)

setInterval(async function () {
    if (countdown > 0) {
        countdown = countdown - 1;
        console.log(countdown)
    } else if (countdown <= 0) {
        exec("pm2 restart CoreReminder");
    }

}, 1000)

mcuser.on('message', async (jsonMsg) => {
    cat = jsonMsg.toString();
    console.log(cat)
    if (cat.startsWith('Server "TPS" = ')) {
        if (variables.get("tpstoggled") == true) {
            let tps = cat.split(" ")[3]
            let tpsnumber = Number(tps);
            let tpsMessage = new Discord.MessageEmbed()
                .setColor('#ff5722')
                .setTitle("*Dungeon TPS: " + tpsnumber + "*")
                .setAuthor('Sabbath', 'https://media0.giphy.com/media/a6pzK009rlCak/giphy.gif?cid=ecf05e479qnsl1i8m7hwwfrsrd0uuhqavkrbjhvxblxljkic&rid=giphy.gif')
                .setDescription(tpsnumber + " is below the threshold (16), **full buffer check required**");

            if (tpsnumber < 17) {
                mcuser.chat('❋❋❋ Server TPS : ' + tpsnumber + ' is below threshold (17), full check required ❋❋❋')
                channels.get("tpschannel").send(tpsMessage)
            }
        }
    }

    if (cat.startsWith("You are already on /server dungeonplanet!")) {
        countdown = 120
    } else {
        // Something
    }


    if (cat.startsWith('(!) PradaBelt is in YOUR game, dungeonplanet')) {
        //Bot is currently online and no action is needed
    } else if (cat.startsWith('No online player found for')) {
        channels.get('BotOn').send("The Bot is Offline, Attempting to bring it back on now")
        exec("taskkill /IM MinecraftClient.exe");
        setTimeout(function () {
            exec('cd "C:/Users/Administrator/Desktop/Spirit Bot" && start MinecraftClient.exe')
        }, 1000);
    }

    if ("on planet planet dadadad") {
        if (variables.get("onlinecheck") == true) {
            variables.get("botoffline", false)
        }

    }

    if (HomeToggle == true) {
        if (cat.startsWith("Homes:")) {
            let Homes = cat
            channels.get("PointHomesChannel").send("```" + Homes + "```")
            HomeToggle = false
        }
    }

    if (HomeSpawnToggle == true) {
        if (cat.startsWith(".[ (-6,-2) WarZone [0x spawners] [0x custom blocks] ].")) {
            channels.get("PointHomesChannel").send("```" + "The bot has confirmed it being in a tpable area" + "```")
            HomeSpawnToggle = false
            HomeTpingStep1 = true
        }
    }

    if (HomeTpingStep1 == true) {
        if (cat.startsWith("(!) You cannot teleport to")) {
            channels.get("PointHomesChannel").send("```" + "The home is claimed by an enemy. Please message one of the leaders to reset the home" + "```")
            HomeTpingStep1 = false
            HomeTpingStep2 = false
            AutomaticPointHomeTerminate = false
        } else if (cat.startsWith(".[ ")) {
            if (cat !== (".[ (-6,-2) WarZone [0x spawners] [0x custom blocks] ].")) {
                HomeTpingStep1 = false
                channels.get("PointHomesChannel").send("```" + "The bot has tped to the PointHome, You now have 10 seconds to /tpa Infernoed" + "```")
                HomeTpingStep2 = true
                await WaitTime()
            }
        }
    }

    if (HomeTpingStep2 == true) {
        if (cat.startsWith("[/TPA] ")) {
            mcuser.chat("/tpaccept")
            channels.get("PointHomesChannel").send("```" + "The bot has accepted the TP, PointHome Feature Completed. Please make sure you hit the Points!" + "```")
            HomeTpingStep2 = false
            AutomaticPointHomeTerminate = false
            mcuser.chat("/spawn")
        }
    }

    //----------------------------------------------------------------------------------------------------

    if (SethomeSpawnToggle == true) {
        if (cat.startsWith(".[ (-6,-2) WarZone [0x spawners] [0x custom blocks] ].")) {
            channels.get("PointHomesChannel").send("```" + "The bot has confirmed it being in a tpable area" + "```")
            SethomeSpawnToggle = false
            SethomeTpingStep1 = true
        }
    }

    if (SethomeTpingStep1 == true) {
        if (cat.startsWith("[/TPAHERE] ")) {
            channels.get("PointHomesChannel").send("```" + " The Tpahere has been recieved, Tping now!" + "```")
            mcuser.chat("/tpaccept")
            SethomeTpingStep1 = false
            SethomeTpingStep2 = true
            await WaitTime(8)
            mcuser.chat("/f map")

        }
    }

    if (SethomeTpingStep2 == true) {
        if (cat.startsWith("(!) You cannot teleport to")) {
            channels.get("PointHomesChannel").send("```" + "You are attempting to tp the bot in neutral / enemy / truce territory, please check your location and try again" + "```")
            SethomeTpingStep2 = false
            SethomePointRaidToggle == false

        }
        else if (cat.startsWith(".[ ")) {
            if (cat !== (".[ (-6,-2) WarZone [0x spawners] [0x custom blocks] ].")) {
                SethomeTpingStep2 = false
                channels.get("PointHomesChannel").send("```" + "The bot has successfully tped, setting a PointsHome now" + "```")
                SethomeError = true
                let home = variables.get('SethomeName')
                mcuser.chat("/sethome " + home)
            }
        }
    }

    if (SethomeError == true) {
        if (cat.startsWith("Error: You cannot set more than ")) {
            channels.get("PointHomesChannel").send("```" + "The bot has reached its home limit, please donate home upgrades, and contact Computerwolf / Cxlle to apply them, then try again" + "```")
            SethomeError = false
            mcuser.chat("/spawn")
            SethomePointRaidToggle == false
        } else if (cat.startsWith("Home set to current location.")) {
            channels.get("PointHomesChannel").send("```" + "PointHome has been set, thank you." + "```")
            SethomeError = false
            SethomePointRaidToggle == false
        }
    }


    if (cat.includes("Raid Cooldown:")) {
        let c = [];
        c.push(cat)
        variables.set('cooldown', c)
    }

    if (cat.includes("Bank Balance: ")) {
        let IsItOnCoolDown = variables.get('cooldown')
        let faction = variables.get("factionupdate")
        console.log(IsItOnCoolDown)
        console.log(faction)

        if (IsItOnCoolDown.length > 0) {
            let args = IsItOnCoolDown[0].split(" ")
            console.log(args[2])
            let hours = (args[2].includes("h")) ? parseInt(args[2]) : 0
            let minutes = (args[2].includes("m")) ? parseInt(args[2]) : (typeof args[3] !== 'undefined' && args[3].includes("m")) ? parseInt(args[3]) : 0
            let seconds = (args[2].includes("s")) ? parseInt(args[2]) : (typeof args[3] !== 'undefined' && args[3].includes("s")) ? parseInt(args[3]) : (typeof args[4] !== 'undefined' && args[4].includes("s")) ? parseInt(args[4]) : 0

            console.log(hours)
            variables.set("cooldown", []);

            let data = await Raid.findOne({ where: { faction } });

            if (!data || data == null) {
                let time = await setNewTime({ hours, minutes, seconds })
                console.log(time)
                Raid.create({ faction, raidTime: time, lastAlert: null })
            } else {
                let time = await setNewTime({ hours, minutes, seconds })
                console.log(time)

                data.update({ raidTime: time, lastAlert: null })
            }
        } else {
            let time = "No Active Time"
            let data = await Raid.findOne({ where: { faction } });

            if (!data || data == null) {

                Raid.create({ faction, raidTime: time, lastAlert: 4 })
            } else {
                data.update({ raidTime: time, lastAlert: 4 })
            }
        }
    }

    // if (Threshold == true) {
    //     if (cat.includes("Check buffers and /msg PradaBelt buffers | Minutes since last check: " + BuffersThreshHold)) {
    //         NotCheckingTax = true
    //         Threshold = false
    //         let ChecksOverThresholdMessage = new Discord.MessageEmbed()
    //             .setColor('#ff5722')
    //             .setTitle("The Buffers Have gone above the allowed Threshold. Noting down all online players that failed to check")
    //             .setTimestamp()
    //         channels.get("SlackersChannel").send(ChecksOverThresholdMessage)
    //         mcuser.chat("/f f Sabbath")
    //         await WaitTime()
    //         mcuser.chat("/f f Creed")
    //         await WaitTime()
    //         mcuser.chat("/f f Mercy")
    //         await WaitTime()
    //         NotCheckingTax = false
    //         NotCheckingTaxPlayerOnline = false
    //         Threshold = true
    //     }
    // }

    // if (Threshold == true) {
    //     if (cat.includes("Check walls and /msg PradaBelt walls | Minutes since last check: " + WallsThreshHold)) {
    //         NotCheckingTax = true
    //         Threshold = false
    //         let ChecksOverThresholdMessage = new Discord.MessageEmbed()
    //             .setColor('#ff5722')
    //             .setTitle("The Walls Have gone above the allowed Threshold. Noting down all online players that failed to check")
    //             .setTimestamp()
    //         channels.get("SlackersChannel").send(ChecksOverThresholdMessage)
    //         mcuser.chat("/f f Sabbath")
    //         await WaitTime()
    //         mcuser.chat("/f f Creed")
    //         await WaitTime()
    //         mcuser.chat("/f f Mercy")
    //         await WaitTime()
    //         NotCheckingTax = false
    //         NotCheckingTaxPlayerOnline = false
    //         Threshold = true
    //     }
    // }


    if (NotCheckingTax == true) {
        if (cat.includes("__________________")) {
            console.log(cat)
            if (cat == "____________________.[ Creed ].______________________" || cat == "___________________.[ Sabbath ]._____________________" || cat == "____________________.[ Mercy ].______________________") {
                variables.set('CheckTaxFaction', cat)
                NotCheckingTaxPlayerOnline = true
            }
        }
    }
    if (NotCheckingTaxPlayerOnline == true) {
        if (cat.includes("Members online (")) {
            let PODH = cat;
            variables.set("PODHC", cat)
            channels.get("SlackerChannel").send("```" + PODH + "```")
        }
    }


});

async function FinalCountdown() {
    // ITS THE FINAL COUNTDOWNNNNNNNNNNNNNNN



}
// wait 1 second to execute
// setInterval(async function () {
//     // get database data
//     let factions = await Raid.findAll({ raw: true });

//     //for loops which allow await
//     for (let i = 0; i < factions.length; i++) {
//         // get data
//         let d = factions[i];
//         // wait for WaitTime
//         console.log("currently Waiting")

//         variables.set("factionupdate", d.faction)
//         mcuser.chat("/f who " + d.faction)

//         await WaitTime()
//     }

// }, 60 * 60 * 1000)

// WaitTime function
async function WaitTime(s = 10) {
    // return Promise which gets handled after 10 seconds
    return new Promise(r => setTimeout(r, s * 1000));

}

async function FullMinute() {
    // return Promise which gets handled after 10 seconds
    return new Promise(r => setTimeout(r, 60000));

}

async function TwoSeconds() {
    // return Promise which gets handled after 10 seconds
    return new Promise(r => setTimeout(r, 2000));

}


setInterval(async function () {
    let raids = await Raid.findAll();

    raids.forEach(async c => {
        c = c.dataValues;

        let currentTime = new Date().valueOf();

        if (c.raidTime == "No Active Time") {

        } else {

            let raidTime = c.raidTime;
            let newMs = raidTime - currentTime
            console.log(newMs)

            let time = getTimeString(newMs);

            let raidMessage = new Discord.MessageEmbed()
                .setTitle(`${c.faction}`)
            console.log(c.lastAlert)
            if (c.lastAlert == 0) {
                console.log(newMs)
                if (newMs <= 0) {
                    let current = await addHours(8)

                    Raid.findOne({ where: { faction: c.faction } }).then(c => {

                        variables.set("factionupdate", c.faction)
                        c.destroy()
                        mcuser.chat("/f who " + c.faction)
                        //{ lastAlert: null, raidTime: current }
                    })
                } else {
                    // Something
                }
            } else
                if (c.lastAlert == 1) {
                    if (newMs <= 5 * 1000 * 60) {

                        raidMessage.setDescription(`There is less than ${time} remaining until cooldown is up`)
                        mcuser.chat("There is less than " + time + " until you can steal " + c.faction + "'s point")
                        channels.get("alertChannel").send('@PointGrinder ', raidMessage)
                        Raid.findOne({ where: { faction: c.faction } }).then(c => {
                            c.update({ lastAlert: 0 })
                        })
                    } else {
                        //Something
                    }
                } else
                    //second alert - 15 mins before raidable
                    if (c.lastAlert == 2) {
                        if (newMs <= 15 * 1000 * 60) {

                            raidMessage.setDescription(`There is less than ${time} remaining until cooldown is up`)
                            mcuser.chat("There is less than " + time + " until you can steal " + c.faction + "'s point")
                            channels.get("alertChannel").send('@PointGrinder ', raidMessage)
                            Raid.findOne({ where: { faction: c.faction } }).then(c => {
                                c.update({ lastAlert: 1 })
                            })
                        } else {
                            // Something
                        }
                    } else
                        // first alert - 30 mins before raidable
                        if (!c.lastAlert || c.lastAlert == null) {
                            if (newMs <= 30 * 1000 * 60) {

                                raidMessage.setDescription(`There is less than ${time} remaining until cooldown is up`)
                                mcuser.chat("There is less than " + time + " until you can steal " + c.faction + "'s point")
                                channels.get("alertChannel").send('@PointGrinder ', raidMessage)
                                Raid.findOne({ where: { faction: c.faction } }).then(c => {
                                    c.update({ lastAlert: 2 })
                                })
                            } else {
                                // Something
                            }
                        }
        }
    })
}, 1 * 60 * 1000)

client.login(token)