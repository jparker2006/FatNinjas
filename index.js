var g_objData = {};
g_objData.nID = 0;
g_objData.UserName = "";
g_objData.PlayerColor = "blue";
g_objData.nGameID = 0;
g_objData.credits = 0;
g_objData.LobbyWindowShowing = "Setup";
g_objData.state = 0;
g_objData.economy = {presicion: 1, speed: 1, damage: 1};
var coords = [0.0, 0.0];
var player;
var v_players = [];
var g_Sounds = null;

class Player {
    constructor(fx, fy, frad, nid) { // color
        this.fx = fx;
        this.fy = fy;
        this.frad = frad;
        this.v_velocity = [0, 0];
        this.v_accel = [0, 0];
        this.fspeed = document.documentElement.clientWidth / 700;
        this.fspeedM = 700;
        this.fpresision = document.documentElement.clientWidth / 10;
        this.fpresisionM = 10;
        this.fsworddamage = 0.97;
        this.sword = new Sword(this.fx, this.fy, this.frad * 1.95);
        this.nid = nid;
        this.sw = document.documentElement.clientWidth;
        this.color = "white";
        this.name = "";
        this.invincible = false;
        this.image = document.createElement("img");
        this.image.src = "sprites/ninjaMask.png";
        this.bShooting = false;
        this.bullet = null;
        this.score = 0;
    }
    move(p) { // [0] == mpx [1] == mpy
        // player movement
        let force = [(p[0] - this.frad * 0.75) - this.fx, (p[1] - this.frad * 0.75) - this.fy];
        let distance = Math.sqrt(Math.pow(force[0], 2) + Math.pow(force[1], 2));
        let fcurrspeed = this.fspeed;
        if (distance < this.fpresision)
            fcurrspeed = map(distance, 0, this.fpresision, 0, fcurrspeed);
        let mag = Math.sqrt(Math.pow(force[0], 2)  + Math.pow(force[1], 2));
        if (0 != mag && 1 != mag) {
            force[0] = force[0] / mag;
            force[1] = force[1] / mag;
        }
        force[0] *= fcurrspeed;
        force[1] *= fcurrspeed;
        force[0] -= this.v_velocity[0];
        force[1] -= this.v_velocity[1];
        this.v_accel[0] += force[0];
        this.v_accel[1] += force[1];
        this.v_velocity[0] += this.v_accel[0];
        this.v_velocity[1] += this.v_accel[1];
        this.fx += this.v_velocity[0];
        this.fy += this.v_velocity[1];
        this.v_accel = [0, 0];

        // sword movement
        this.sword.update(this.fx, this.fy);
        this.sword.follow(p[0] - 2.5, p[1] - 2.5);

        // bullet movement
        if (this.bShooting) {
            this.bullet.move();
            this.bullet.oscilate();
            if (this.bullet.fx > document.documentElement.clientWidth || this.bullet.fx < 0 || this.bullet.fy < 0 || this.bullet.fy > (document.documentElement.clientWidth / 2.5)) {
                this.bShooting = false;
                this.bullet = null;
            }
        }
    }
    display() {
        var canvas = document.getElementById("canvas");
        var context = canvas.getContext("2d");
        context.beginPath();
        context.arc(this.fx, this.fy, this.frad, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
        context.closePath();
        context.beginPath();
        context.moveTo(this.sword.v_a[0], this.sword.v_a[1]);
        context.lineTo(this.sword.v_b[0], this.sword.v_b[1]);
        context.strokeStyle = this.color;
        context.lineWidth = 5;
        context.stroke();
        context.font = "12px sans-serif";
        context.fillText(this.name, this.fx - (this.name.length * 3), this.fy - (1.2 * this.frad));
        context.closePath();
        context.drawImage(this.image, this.fx - this.frad, this.fy - this.frad / 2, this.frad * 2.02, this.frad);
        if (this.bShooting) {
            context.beginPath();
            context.arc(this.bullet.fx, this.bullet.fy, this.bullet.frad, 0, 2 * Math.PI);
            context.fillStyle = this.color;
            context.fill();
            context.closePath();
        }
    }
    resize() {
        let sw = document.documentElement.clientWidth;
        this.frad = (sw / this.sw) * this.frad;
        this.sword.flen = this.frad * 1.95;
        this.fx *= (sw / this.sw);
        this.fy *= ((sw / 2.5) / (this.sw / 2.5));
        this.fpresision = sw / 10;
        this.fspeed = sw / 700;
        this.sw = sw;
        if (this.bShooting) { // test this
            this.bullet.fx *= (sw / this.sw);
            this.bullet.fy *= ((sw / 2.5) / (this.sw / 2.5));
            this.bullet.frad = (sw / this.sw) * this.bullet.frad;
            this.bullet.fspeed = document.documentElement.clientWidth / 300;
        }
    }
    collide(damage) {
        if (g_objData.nID == this.nid) {
            if (this.frad < document.documentElement.clientWidth * 0.0135) {
                BroadcastDeath();
                BackToLobby();
            }
        }
        this.frad *= damage;
        this.invincible = true;
        setTimeout(() => {this.invincible = false;}, 1000);
    }
    grow() {
        this.frad *= 1.025;
        this.sword.flen = this.frad * 1.95;
    }
    calc_power_ups() {
        this.fpresision = document.documentElement.clientWidth / this.fpresisionM;
        this.fspeed = document.documentElement.clientWidth / this.fspeedM;
    }
    knockback() {
        this.image.src = "sprites/ninjaAngrySprite.png";
        setTimeout(() => {this.image.src = "sprites/ninjaMask.png";}, 1000);
    }
    shootGun(index) {
        if (!this.bShooting) {
            this.bullet = new Bullet(this.sword.v_b[0], this.sword.v_b[1], index);
            this.bShooting = true;
            g_Sounds.PlayShot();
        }
    }
}

class Sword {
    constructor(fx, fy, flen) { // color
        this.v_a = [fx, fy];
        this.v_b = [0.0, 0.0];
        this.flen = flen;
        this.ftheta = 0.0;
    }
    calcb() {
        let fdx = this.flen * Math.cos(this.ftheta);
        let fdy = this.flen * Math.sin(this.ftheta);
        this.v_b[0] = this.v_a[0] + fdx
        this.v_b[1] = this.v_a[1] + fdy;
    }
    follow(tx, ty) {
        let v_dir = [];
        v_dir.push(tx - this.v_a[0]);
        v_dir.push(ty - this.v_a[1]);
        this.ftheta = Math.atan2(v_dir[1], v_dir[0]);
    }
    update(x, y) {
        this.calcb();
        this.v_a[0] = x;
        this.v_a[1] = y;
    }
}

class Particle {
    constructor(fx, fy) {
        this.fx = fx;
        this.fy = fy;
        this.v_acc = [0, 0];
        this.theta = getRandomInt(0, 150) * Math.PI * 2;
        this.multiple = [getRandomInt(40, 80) / 100, getRandomInt(40, 80) / 100];
        this.v_vel = [Math.sin(this.theta) * this.multiple[0], Math.cos(this.theta) * this.multiple[1]];
        this.force = [getRandomInt(-80, 80) / 100, getRandomInt(-80, 80) / 100];
        this.alpha = 1.0;
        this.color = {};
    }
    move() {
        this.applyForce();
        this.updatePosition();
        this.alpha -= 0.02;
    }
    applyForce() {
        this.v_acc[0] += this.force[0];
        this.v_acc[1] += this.force[1];
    }
    updatePosition() {
        this.v_vel[0] *= this.multiple[0];
        this.v_vel[1] *= this.multiple[1];
        this.fx += this.v_vel[0];
        this.fy += this.v_vel[1];
        this.v_vel[0] += this.v_acc[0];
        this.v_vel[1] += this.v_acc[1];
        this.v_acc = [0, 0];
    }
    display() {
        let canvas = document.getElementById('canvas');
        var context = canvas.getContext("2d");
        context.beginPath();
        context.arc(this.fx, this.fy, 3, 0, 2 * Math.PI);
        context.fillStyle = "rgba(" + this.color.r + ", " + this.color.g + ", " + this.color.b + ", " + this.alpha + ")";
        context.fill();
        context.closePath();
    }
}

class Rain {
    constructor() {
        this.fx = getRandomInt(0, canvas.width);
        this.fy = getRandomInt(-700, -200);
        this.fz = getRandomInt(0, 20);
        this.flen = map(this.fz, 5, 35, 10, 20);
        this.fySpeed = map(this.fz, 5, 35, 1, 9);
        this.fxSpeed = 0;
        this.nCount = 0;
        this.theta = getRandomInt(-35, 35) / 100;
    }
    build() {
        let canvas = document.getElementById('canvas');
        this.fx = getRandomInt(0, canvas.width);
        this.fy = getRandomInt(-700, -200);
        this.fz = getRandomInt(0, 20);
        this.flen = map(this.fz, 5, 35, 10, 20);
        this.fySpeed = map(this.fz, 5, 35, 1, 9);
        this.fxSpeed = 0;
        this.nCount = 0;
        this.theta = getRandomInt(-30, 30) / 100;
    }
    descend() {
        this.fy += this.fySpeed;
        this.fySpeed += map(this.fz, 5, 35, 0.04, 0.1); // y grav
        this.fxSpeed = Math.sin(this.nCount);
        this.fx += this.fxSpeed;

        if (this.fy > canvas.height) // height
            this.build();
        this.nCount += this.theta;
    }
    calcWidth() {
        return map(this.fz, 0, 20, 0.5, 2);
    }
    display() {
        var canvas = document.getElementById("canvas");
        var context = canvas.getContext("2d");
        context.beginPath();
        context.moveTo(this.fx, this.fy);
        context.lineTo(this.fx, this.fy + this.flen);
        context.strokeStyle = "blue";
        context.lineWidth = this.calcWidth();
        context.stroke();
    }
}

class Bullet {
    constructor(fx, fy, i=0) {
        this.fx = fx;
        this.fy = fy;
        this.ftheta = v_players[i].sword.ftheta;
        this.v_velocity = [0, 0];
        this.v_accel = [0, 0];
        this.theta = 0;
        this.frad = 0.005 * document.documentElement.clientWidth;
        this.color = "black";
        this.p = [0, 0];
        this.fspeed = document.documentElement.clientWidth / 300;
        this.calcendpoint();
    }
    move() {
        let force = [(this.p[0] - this.frad * 0.75) - this.fx, (this.p[1] - this.frad * 0.75) - this.fy];
        let distance = Math.sqrt(Math.pow(force[0], 2) + Math.pow(force[1], 2));
        let mag = Math.sqrt(Math.pow(force[0], 2)  + Math.pow(force[1], 2));
        if (0 != mag && 1 != mag) {
            force[0] = force[0] / mag;
            force[1] = force[1] / mag;
        }
        force[0] *= this.fspeed;
        force[1] *= this.fspeed;
        force[0] -= this.v_velocity[0];
        force[1] -= this.v_velocity[1];
        this.v_accel[0] += force[0];
        this.v_accel[1] += force[1];
        this.v_velocity[0] += this.v_accel[0];
        this.v_velocity[1] += this.v_accel[1];
        this.fx += this.v_velocity[0];
        this.fy += this.v_velocity[1];
        this.v_accel = [0, 0];
    }
    calcendpoint() {
        let mult = 2000 / document.documentElement.clientWidth; // for if they expand while bullet going
        let fdx = (document.documentElement.clientWidth * mult) * Math.cos(this.ftheta);
        let fdy = (document.documentElement.clientWidth * mult) * Math.sin(this.ftheta);
        this.p[0] = this.fx + fdx;
        this.p[1] = this.fy + fdy;
    }
    oscilate() {
        this.frad = map(Math.sin(this.theta), -1, 1, 0.003, 0.017) * document.documentElement.clientWidth;
        this.theta += 0.06;
    }
}

class Sounds {
    constructor() {
        this.pop = new Audio("sfx/Pop01.mp3");
        this.pop.load();
        this.grunts = [];
        for (let i=1; i<=5; i++) {
            this.grunts.push(new Audio("sfx/Grunt0"+i+".mp3"));
            this.grunts[i-1].load();
        }
        this.shot = new Audio("sfx/Shot.mp3");
        this.shot.load();
        this.shothit = new Audio("sfx/ShotHit.mp3");
        this.shothit.load();
        this.music = [];
        for (let i=1; i<=3; i++) {
            this.music.push(new Audio("sfx/MusicBed0"+i+".mp3"));
            this.music[i-1].load();
        }
        this.rain = new Audio("sfx/Rain.mp3");
        this.rain.load();
    }
    PlayPop() {
        this.pop.play();
    }
    PlayGrunt() {
        this.grunts[getRandomInt(0, this.grunts.length)].play();
    }
    PlayShot() {
        this.shot.play();
    }
    PlayShotHit() {
        this.shothit.play();
    }
    PlaySong() {
        let nRand = getRandomInt(0, this.music.length);
        this.music[nRand].play();
        this.music[nRand].loop = true;
    }
    StopMusic() {
        this.music[0].pause();
        this.music[0].currentTime = 0;
        this.music[1].pause();
        this.music[1].currentTime = 0;
        this.music[2].pause();
        this.music[2].currentTime = 0;
    }
    PlayRain() {
        this.rain.play();
    }
    StopRain() {
        this.rain.pause();
        this.rain.currentTime = 0;
    }
}

onload = () => {
    LobbyFrame();
    initWebSocket();
    window.addEventListener("resize", onWindowReSize);
    setTimeout(function() {
        g_Sounds = new Sounds();
    }, 750);
}

function onWindowReSize() {
    if (0 == g_objData.state) { // lobby
        if (document.documentElement.clientWidth > 768) {
            document.getElementById('ChatPanel').style.display = 'inline-block';
            document.getElementById('SetupPanel').style.display = 'inline-block';
            document.getElementById('GamesPanel').style.display = 'inline-block';
        }
        else {
            document.getElementById('ChatPanel').style.display = 'none';
            document.getElementById('SetupPanel').style.display = 'none';
            document.getElementById('GamesPanel').style.display = 'none';
            if ('Chat' == g_objData.LobbyWindowShowing)
                document.getElementById('ChatPanel').style.display = 'inline-block';
            else if ('Setup' == g_objData.LobbyWindowShowing)
                document.getElementById('SetupPanel').style.display = 'inline-block';
            else
                document.getElementById('GamesPanel').style.display = 'inline-block';
        }
    }
    else { // game
        let canvas = document.getElementById('canvas');
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientWidth / 2.5;
        for (let i=0; i<v_players.length; i++) {
            v_players[i].resize();
        }
    }
}

function BroadcastMovement() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Movement";
    objData.x = player.fx;
    objData.y = player.fy;
    objData.mpx = coords[0];
    objData.mpy = coords[1];
    objData.ID = g_objData.nID;
    objData.sw = document.documentElement.clientWidth;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function BroadcastData() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Data";
    objData.ID = g_objData.nID;
    objData.frad = player.frad;
    objData.name = g_objData.UserName;
    objData.color = g_objData.PlayerColor;
    objData.sw = document.documentElement.clientWidth;
    objData.swordDam = player.fsworddamage;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function BroadcastShot() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Bullet";
    objData.ID = g_objData.nID;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function BroadcastDeath() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Death";
    objData.fx = player.fx;
    objData.fy = player.fy;
    objData.color = g_objData.PlayerColor;
    objData.ID = g_objData.nID;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function BroadcastGiveMeYourData() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "GiveMeYourData";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function LobbyFrame() {
    let sPage = "";

    sPage += "<div class='title'>";
    sPage += "<div class='title_ani' style='font-size: 35px;'><b>Fat Ninjas</b></div>";
    sPage += "</div>";

    sPage += "<div class='lobby_main'>";

    sPage += "<div class='ChatPanel' id='ChatPanel'>"; // chat
    sPage += "<div id='chats' class='lobby_chat_container'></div>"; // chat displays
    sPage += "<div class='lobby_chat_composer' style='height: 100px;'>";
    sPage += "<input id='chatData' class='chat_box' type='text' placeholder='Chat' maxlength='144' onkeypress='clickEnter(event)'/>";
    sPage += "<button id='chat_button' class='chat_button' onclick='BroadcastChat()'></button>";
    sPage += "</div>";
    sPage += "</div>";

    sPage += "<div class='SetupPanel' id='SetupPanel'>"; // main
    sPage += "<div class='HelpText'>Enter a user name and pick a color for your player</div>"; // take out?
    sPage += "<input id='username' class='user_name_box' onfocus='OnFocusGameName()' onblur='OnBlurUserName()' type='text' placeholder='Username' maxlength='15' /><br><br>";
    sPage += "<div class='player_model_container' onclick='ClickPlayerModel()'>";
    sPage += "<div class='player_ellipse' id='player_model' tooltip='Color picker'></div>";
    sPage += "</div>";
    sPage += "<div class='ColorPickerContainer' style='display: none;'>";
    sPage += "<input id='playerColor' class='ColorPicker' type='color' value='#ffffff' onChange='editPlayerModel()' tooltip='Color picker'/>";
    sPage += "</div>";

    sPage += "</div>";

    sPage += "<div class='GamesPanel' id='GamesPanel'>"; // games avail
    sPage += "<div class='HelpText'>Join a game</div>";

    sPage += "<div id='GamesContainer' class='GamesContainer'></div>";

    sPage += "<div class='HelpText' style='margin-top: 15px;' >Create a new game</div>";
    sPage += "<input id='gameName' class='play_input' maxlength='20' onfocus='OnFocusGameName()' onblur='OnBlurGameName()' placeholder='Game Name' />";
    sPage += "<button class='play_button' onclick='newgame()'>Create</button>";
    sPage += "</div>";

    sPage += "</div>"; // whole main

    sPage += "<div id='LobbyScreenSwitcher' class='LobbyScreenSwitcher'>";
    sPage += "<div class='LobbySwitcherButtons' onclick='ShowChat()'>Chat</div> ";
    sPage += "<div class='LobbySwitcherButtons' onclick='ShowSetup()'>Setup</div> ";
    sPage += "<div class='LobbySwitcherButtons' onclick='ShowGames()'>Games</div>";
    sPage += "</div>";

    sPage += "<div id='Toast' class='Toast'</div>";

    document.getElementById("Main").innerHTML = sPage;
    document.getElementById('chat_button').innerHTML = "<img id='chat_button_img' class='chat_button_img' src='img/PaperAirplane.png'/>";
    pullGames();
    LoadLobbyData();
    g_objData.state = 0;
}

function OnBlurGameName() {
    if (768 > document.documentElement.clientWidth)
        document.getElementById('LobbyScreenSwitcher').style.display = 'block';
}

function OnFocusGameName() {
    if (768 > document.documentElement.clientWidth)
        document.getElementById('LobbyScreenSwitcher').style.display = 'none';
}

function ShowChat() {
    if (!UsernameCheck())
        return;
    g_objData.LobbyWindowShowing = "Chat";
    document.getElementById('ChatPanel').style.display = 'inline-block';
    document.getElementById('SetupPanel').style.display = 'none';
    document.getElementById('GamesPanel').style.display = 'none';
}

function ShowSetup() {
    g_objData.LobbyWindowShowing = "Setup";
    document.getElementById('ChatPanel').style.display = 'none';
    document.getElementById('SetupPanel').style.display = 'inline-block';
    document.getElementById('GamesPanel').style.display = 'none';
}

function ShowGames() {
    if (!UsernameCheck())
        return;
    g_objData.LobbyWindowShowing = "Games";
    document.getElementById('ChatPanel').style.display = 'none';
    document.getElementById('SetupPanel').style.display = 'none';
    document.getElementById('GamesPanel').style.display = 'inline-block';
}

function ClickPlayerModel() {
    document.getElementById('playerColor').click();
}

function editPlayerModel() {
    let color = document.getElementById('playerColor').value;
    if (color == "#123123")
        return;
    document.getElementById("player_model").style.backgroundColor = color;
    setCookie("PlayerColor", color, 999);
    g_objData.PlayerColor = color;
}

function LoadLobbyData() {
    let un = getCookie("Username");
    if (un) {
        document.getElementById('username').value = un;
        g_objData.UserName = un;
    }
    else {
        let aNames = ["Dragon", "Simpson", "Flintstone", "Griffin", "Hulk", "Chewbacca", "Wizard", "Taco"];
        let nRand = getRandomInt(0, aNames.length -1);
        g_objData.UserName = aNames[nRand];
        document.getElementById('username').value = aNames[nRand];
        setCookie("Username", aNames[nRand], 999);
    }
    let PlayerColor = getCookie("PlayerColor");
    if (PlayerColor) {
        document.getElementById('playerColor').value = PlayerColor;
        document.getElementById('player_model').style.background = PlayerColor;
        g_objData.PlayerColor = PlayerColor;
    }
    else { // Starter colors
        let aColors = ["#5F9EA0", "#008B8B", "#006400", "#8B008B", "#8B0000", "#483D8B", "#2F4F4F", "#228B22", "#4B0082", "#778899", "#0000CD", "#191970", "#6B8E23", "#6A5ACD"];
        let nRand = getRandomInt(0, aColors.length -1);
        g_objData.PlayerColor = aColors[nRand];
        document.getElementById('playerColor').value = aColors[nRand];
        document.getElementById('player_model').style.background = aColors[nRand];
        setCookie("PlayerColor", aColors[nRand], 999);
    }
}

function getRandomInt(min, max) {
	var rval = 0;
	var range = max - min;
	var bits_needed = Math.ceil(Math.log2(range));
	if (bits_needed > 53) {
		throw new Exception("We cannot generate numbers larger than 53 bits.");
	}
	var bytes_needed = Math.ceil(bits_needed / 8);
	var mask = Math.pow(2, bits_needed) - 1;
	// 7776 -> (2^13 = 8192) -1 == 8191 or 0x00001111 11111111

	// Create byte array and fill with N random numbers
	var byteArray = new Uint8Array(bytes_needed);
	window.crypto.getRandomValues(byteArray);
	var p = (bytes_needed - 1) * 8;
	for(var i = 0; i < bytes_needed; i++ ) {
		rval += byteArray[i] * Math.pow(2, p);
		p -= 8;
	}
	// Use & to apply the mask and reduce the number of recursive lookups
	rval = rval & mask;
	if (rval >= range) {
		// Integer out of acceptable range
		return getRandomInt(min, max);
	}
	// Return an integer that falls within the range
	return min + rval;
}

function OnBlurUserName() {
    if (768 > document.documentElement.clientWidth)
        document.getElementById('LobbyScreenSwitcher').style.display = 'block';
    let un = document.getElementById('username').value.trim();
    g_objData.UserName = un;
    setCookie("Username", un, 999);
    g_objData.nID = 0;
    initWebSocket();
    SetGameID(0);
}

function newgame() {
    if (!UsernameCheck())
        return;
    let objGame = {};
    objGame.name = document.getElementById('gameName').value.trim();
    if ("" == objGame.name) {
        Toast("Your game needs a name");
        return;
    }
    objGame.color = g_objData.PlayerColor;
    let jsonGame = JSON.stringify(objGame);
    postFileFromServer("main.php", "AddToLobbyTable=" + encodeURIComponent(jsonGame), newGameCallback);
    function newGameCallback(data) {
        if (!data) {
            Toast("Failed to Connect");
            return;
        }
        document.getElementById('gameName').value = "";
        pullGamesCallback(data);
        BroadcastGameChange();
    }
}

function BroadcastGameChange() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.Message = "BCast2Game";
    objData.Event = "GameListChange";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function UsernameCheck() {
    if (!g_objData.UserName) {
        Toast("Please fill in a user name.");
        return false;
    }
    else
        return true;
}

function pullGames() {
    postFileFromServer("main.php", "PullLobbyTable=" + encodeURIComponent(1), pullGamesCallback);
}

function pullGamesCallback(data) {
    g_objData.objGames = JSON.parse(data);
    let sPage = "";
    for (let i=0; i<g_objData.objGames.length; i++) {
        sPage += "<div class='game_to_join' style='background:"+g_objData.objGames[i].color+";' onClick='CheckGamePlayerCount("+g_objData.objGames[i].id+")'>";
        sPage += g_objData.objGames[i].name;
        sPage += "</div>";
    }
    document.getElementById('GamesContainer').innerHTML = sPage;
}

function CheckGamePlayerCount(nGameID) {
    if (!UsernameCheck())
        return;
    for (let i=0; i<g_objData.objGames.length; i++) {
        if (g_objData.objGames[i].id == nGameID) {
            let objData = {};
            objData.Type = "Jake";
            objData.Message = "SetGameID";
            objData.Event = "CheckPlayerCount";
            objData.GameID = parseInt(nGameID);
            objData.GameListIndex = parseInt(nGameID);
            objData.GameName = g_objData.objGames[i].name;
            let jsonData = JSON.stringify(objData);
            sendMessage(jsonData);
        }
    }
}

var wsUri = "ws://jakehenryparker.com:58007";
if (window.location.protocol === 'https:') {
    wsUri = "wss://jakehenryparker.com:57007/wss";
}
var wSocket = null;
function initWebSocket() {
    try {
        if (typeof MozWebSocket == 'function')
            WebSocket = MozWebSocket;
        if (wSocket && wSocket.readyState == 1) // OPEN
            wSocket.close();
        wSocket = new WebSocket(wsUri);
        wSocket.onopen = function (evt) {
            SendMyID();
            SetGameID(0);
            console.log("Connection established.");
        };
        wSocket.onclose = function (evt) {
            console.log("Connection closed");
        };
        wSocket.onmessage = function (evt) {
            let objData = JSON.parse(evt.data);
            let sType = objData.Type;
            if ("Jake" == sType) {
                if ("BCast2Game" == objData.Message) {
                    if ("Movement" == objData.Event) {
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.ID == v_players[i].nid) {
                                let nClientWidth = document.documentElement.clientWidth;
                                v_players[i].sword.follow (
                                    objData.mpx * nClientWidth / objData.sw,
                                    objData.mpy * ((nClientWidth / 2.5) / (objData.sw / 2.5))
                                );
                                v_players[i].sword.update(v_players[i].fx, v_players[i].fy);
                                v_players[i].fx = objData.x * (nClientWidth / objData.sw);
                                v_players[i].fy = objData.y * ((nClientWidth / 2.5) / (objData.sw / 2.5));
                                if (v_players[i].bShooting) {
                                    v_players[i].bullet.move();
                                    v_players[i].bullet.oscilate();
                                    if (v_players[i].bullet.fx > document.documentElement.clientWidth || v_players[i].bullet.fx < 0 || v_players[i].bullet.fy < 0 || v_players[i].bullet.fy > (document.documentElement.clientWidth / 2.5)) {
                                        v_players[i].bShooting = false;
                                        v_players[i].bullet = null;
                                    }
                                }
                                break;
                            }
                        }
                    }
                    else if ("Bullet" == objData.Event) {
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.ID == v_players[i].nid) {
                                v_players[i].shootGun(i);
                                break;
                            }
                        }
                    }
                    else if ("Collision" == objData.Event) {
                        let i_hitter, i_got_hit;
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.GotHitID == v_players[i].nid)
                                i_got_hit = i;
                            else if (objData.HitterID == v_players[i].nid)
                                i_hitter = i;
                        }
                        if (1 == objData.shot) {
                            v_players[i_got_hit].collide(1 - ((1 - v_players[i_hitter].fsworddamage) * 2));
                            v_players[i_hitter].bullet = null;
                            v_players[i_hitter].bShooting = false;
                        }
                        else
                            v_players[i_got_hit].collide(v_players[i_hitter].fsworddamage);
                        v_players[i_got_hit].knockback();
                    }
                    else if ("Data" == objData.Event) {
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.ID == v_players[i].nid) {
                                v_players[i].color = objData.color;
                                v_players[i].name = objData.name;
                                let fnormrad = objData.frad * (document.documentElement.clientWidth / objData.sw);
                                v_players[i].frad = fnormrad;
                                v_players[i].sword.flen = fnormrad * 1.95;
                                v_players[i].fspeed = (document.documentElement.clientWidth / 700) * (document.documentElement.clientWidth / objData.sw);
                                v_players[i].fpresision = (document.documentElement.clientWidth / 10) * (document.documentElement.clientWidth / objData.sw);
                                v_players[i].fsworddamage = objData.swordDam;
                                return;
                            }
                        }
                    }
                    else if ("GiveMeYourData" == objData.Event) {
                        BroadcastData();
                    }
                    else if ("Score" == objData.Event) {
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.ID == v_players[i].nid) {
                                v_players[i].score = objData.score;
                            }
                        }
                        let sPage = "";
                        for (let i=0; i<v_players.length; i++) {
                            sPage += "<div class='scoreboardElement'>"+v_players[i].name+": "+v_players[i].score+" Points</div>";
                        }
                        document.getElementById("scoreboardContainer").innerHTML = sPage;
                    }
                    else if ("Death" == objData.Event) {
                        for (let i=0; i<v_players.length; i++) {
                            if (objData.ID == v_players[i].nid) {
                                v_players.splice(i, 1);
                                break;
                            }
                        }
                        explode(objData.fx, objData.fy, objData.color);
                    }
                    else if ("Chat" == objData.Event) {
                        if (objData.Chat.length > 144)
                            return;
                        MakeChatBubble(objData.From, objData.Chat, objData.Color);
                    }
                    else if ("GameListChange" == objData.Event) {
                        pullGames();
                    }
                }
                else if ("WhoAmI" == objData.Message && "CheckPlayerCount" == objData.Event) {
                    let aPlayersIDs = objData.PlayersIDHere.split(',');
                    if (aPlayersIDs.length < 7) // Let this player in
                        connect(objData.GameListIndex);
                    else {
                        SetGameID(0);  // Set player back to lobby
                        Toast(objData.GameName + " is full. Please try another game");
                    }
                }
                else if ("WhoAmI" == objData.Message) {
                    g_objData.nID = objData.ID;
                    if (0 == g_objData.nGameID)
                        return;
                    v_players = [];
                    player.color = g_objData.PlayerColor;
                    player.name = g_objData.UserName;
                    v_players.push(player);
                    let v_playersIDs = objData.PlayersIDHere.split(",");
                    for (let i=0; i<v_playersIDs.length; i++) {
                        let bAlreadyThere = false;
                        for (let j=0; j<v_players.length; j++) {
                            if (v_players[j].nid == v_playersIDs[i])
                                bAlreadyThere = true;
                        }
                        if (bAlreadyThere || v_playersIDs[i] == g_objData.nID)
                            continue;

                        let p = new Player(0, 0, document.documentElement.clientWidth * 0.025, v_playersIDs[i]);
                        v_players.push(p);
                    }
                    BroadcastGiveMeYourData();
                    BroadcastData();
                }
                else if ("PlayerEnteringGame" == objData.Message) {
                    if (g_objData.nGameID == 0)
                        return;
                    v_players.push(new Player(0, 0, document.documentElement.clientWidth * 0.025, objData.ID));
                }
                else if ("PlayerExitingGame" == objData.Message) {
                    for (let i=0; i<v_players.length; i++) {
                        if (objData.ID == v_players[i].nid) {
                            v_players.splice(i, 1);
                            break;
                        }
                    }
                }
            }
        }
    }
    catch (exception) {
        console.log('ERROR: ' + exception);
    }
}

function BroadcastScore() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Score";
    objData.score = v_players[0].score;
    objData.ID = g_objData.nID;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function connect(nID) {
    for (let i=0; i<g_objData.objGames.length; i++) {
        if (g_objData.objGames[i].id == nID) {
            GameFrame(g_objData.objGames[i].name, g_objData.objGames[i].color);
            SetGameID(nID);
            break;
        }
    }
}

var bExplosion = false;
var v_explosions = [], v_droplets = [];
function explode(x, y, color) {
    let objColor = hexToRgb(color);
    let v_particles = [];
    for (let i=0; i<250; i++) {
        v_particles.push(new Particle(x, y));
        v_particles[i].color = objColor;
    }
    v_explosions.push(v_particles);
    bExplosion = true;
}

var t_paint, t_update, t_grow;
function GameFrame(sName, Color) {
    g_objData.Chat = document.getElementById('chats').innerHTML;
    let sPage = "";
    sPage += "<div style='background-color: #123123;'>"
    sPage += "<canvas id='canvas' style='background-color: #123123;' onmousemove='updateCoords()' onclick='updateCoords()'></canvas>";
    sPage += "</div>"

    sPage += "<div class='gameUtilContainer'>";

    sPage += "<div id='shootaCont' class='shoota_container'>";
    sPage += "<button class='shoot_button' onClick='localShot()'>Shoot</button>";
    sPage += "</div>";

    sPage += "<div>";
    sPage += "<button id='pwrPrecision' class='powerup' onClick='PowerUp(0)'>Precision: 1</button>";
    sPage += "<button id='pwrSpeed' class='powerup' onClick='PowerUp(1)'>Speed: 1</button>";
    sPage += "<button id='pwrDamage' class='powerup' onClick='PowerUp(2)'>Damage: 1</button>";
    sPage += "</div>";

    sPage += "<div class='CreditContainer'>";
    sPage += "<div id='CreditsDisplay' style='cursor: default; padding-top: 9px;' class='CreditsDisplay'>0 Tokens</div>";
    sPage += "<button class='CreditsDisplay BackToLobby' onClick='BackToLobby()'>Back to Lobby</button>";
    sPage += "</div>";

    sPage += "<div id='scoreboardContainer' class='scoreboardContainer'>";
    sPage += "</div>";

    sPage += "</div>";


    document.getElementById("Main").innerHTML = sPage;

    let canvas = document.getElementById('canvas');
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientWidth / 2.5;
    player = new Player(getRandomInt(0, document.documentElement.clientWidth), getRandomInt(0, document.documentElement.clientWidth / 2.5), document.documentElement.clientWidth * 0.025, g_objData.nID);
    t_paint = setInterval(paint_player_vector, 1000/60);
    t_update = setInterval(updatePlayer, 1000/60);
    t_grow = setInterval(growPlayer, 5000);
    g_objData.state = 1;
    for (let i=0; i<60; i++) {
        v_droplets.push(new Rain());
    }
    window.onkeypress = function(event) {
        if (g_objData.state != 1) return;
        if ("1" == event.key) PowerUp(0);
        else if ("2" == event.key) PowerUp(1);
        else if ("3" == event.key) PowerUp(2);
        else if ("w" == event.key) localShot();
    }
    g_Sounds.PlaySong();
    g_Sounds.PlayRain();
}

function localShot() {
    BroadcastShot();
    v_players[0].shootGun();
}

function PowerUp(type) {
    if (0 == type) { // Precision
        if (g_objData.credits < g_objData.economy.presicion || 5 == g_objData.economy.presicion)
            return;

        g_objData.credits -= g_objData.economy.presicion;
        document.getElementById("pwrPrecision").innerHTML = "Precision: " + ++g_objData.economy.presicion;
        player.fpresisionM += 15;
    }
    else if (1 == type) { // Speed
        if (g_objData.credits < g_objData.economy.speed || 5 == g_objData.economy.speed)
            return;

        g_objData.credits -= g_objData.economy.speed;
        document.getElementById("pwrSpeed").innerHTML = "Speed: " + ++g_objData.economy.speed;
        player.fspeedM -= 100;
    }
    else if (2 == type) { // Damage (bcast)
        if (g_objData.credits < g_objData.economy.damage || 5 == g_objData.economy.damage)
            return;

        g_objData.credits -= g_objData.economy.damage;
        document.getElementById("pwrDamage").innerHTML = "Damage: " + ++g_objData.economy.damage;
        player.fsworddamage -= 0.025;
        BroadcastData();
    }
    player.calc_power_ups();
    document.getElementById("CreditsDisplay").innerHTML = g_objData.credits + " Tokens";
}

function growPlayer() {
    ++g_objData.credits;
    document.getElementById("CreditsDisplay").innerHTML = g_objData.credits  + " Tokens";
    v_players[0].score++;
    BroadcastScore();
    let sPage = "";
    for (let i=0; i<v_players.length; i++) {
        sPage += "<div class='scoreboardElement'>"+v_players[i].name+": "+v_players[i].score+" Points</div>";
    }
    document.getElementById("scoreboardContainer").innerHTML = sPage;
    if (player.frad >= document.documentElement.clientWidth * 0.065)
        return;
    player.grow();
    BroadcastData();
}

function BackToLobby() {
    v_players = [];
    v_droplets = [];
    player = null;
    g_objData.credits = 0;
    g_objData.economy = {presicion: 1, speed: 1, damage: 1};
    g_Sounds.StopMusic();
    g_Sounds.StopRain();
    SetGameID(0);
    LobbyFrame();
    clearInterval(t_paint);
    clearInterval(t_update);
    clearInterval(t_grow);
    document.getElementById('chats').innerHTML = g_objData.Chat;
    document.getElementById('chats').scroll(0, document.getElementById('chats').scrollHeight);
}

function updateCoords() {
    coords[0] = event.clientX;
    coords[1] = event.clientY;
}

function checkCollisions() {
    if (v_players.length < 1)
        return;
    let fx = player.sword.v_b[0];
    let fy = player.sword.v_b[1];
    for (let i=1; i<v_players.length; i++) {
        if (Math.pow(fx - v_players[i].fx, 2) + Math.pow(fy - v_players[i].fy, 2) <= Math.pow(v_players[i].frad, 2)) { // you hit somebody
            if (!v_players[i].invincible) {
                BroadcastCollision(v_players[i].nid);
                v_players[i].collide(player.fsworddamage);
                g_Sounds.PlayGrunt();
                v_players[i].knockback();
                g_objData.credits++;
                document.getElementById("CreditsDisplay").innerHTML = g_objData.credits + " Tokens";;
            }
        }
    }
    if (!v_players[0].bShooting)
        return;
    fx = v_players[0].bullet.fx;
    fy = v_players[0].bullet.fy;
    for (let i=0; i<v_players.length; i++) {
        if (Math.pow(fx - v_players[i].fx, 2) + Math.pow(fy - v_players[i].fy, 2) <= Math.pow(v_players[i].frad, 2)) {
            if (!v_players[i].invincible) {
                BroadcastCollision(v_players[i].nid, true);
                v_players[0].bullet = null;
                v_players[0].bShooting = false;
                v_players[i].collide(1 - ((1 - v_players[0].fsworddamage) * 2));
                g_Sounds.PlayShotHit();
                v_players[i].knockback();
                g_objData.credits++;
                document.getElementById("CreditsDisplay").innerHTML = g_objData.credits  + " Tokens";;
            }
        }
    }
}

function BroadcastCollision(nid, bgun = false) {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = g_objData.nGameID;
    objData.Message = "BCast2Game";
    objData.Event = "Collision";
    objData.HitterID = g_objData.nID;
    objData.GotHitID = nid;
    if (bgun)
        objData.shot = 1;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function updatePlayer() {
    player.move(coords);
    if (v_players.length > 1)
        BroadcastMovement();
}

function map(num, min1, max1, min2, max2) {
    return min2 + (max2 - min2) * ((num - min1) / (max1 - min1));
}

function paint_player_vector() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (let i=0; i<v_players.length; i++) {
        v_players[i].display();
    }
    checkCollisions();

    for (let i=0; i<v_droplets.length; i++) {
        v_droplets[i].descend();
        v_droplets[i].display();
    }

    if (!bExplosion) return;

    let z = 0;
    for (let x=0; x<v_explosions.length; x++) {
        for (let y=0; y<v_explosions[x].length; y++) {
            v_explosions[x][y].move();
            v_explosions[x][y].display();
        }
        if (0 > v_explosions[x][z++].alpha) {
            v_explosions.splice(x, 1);
        }
    }
    if (v_explosions.length < 1)
        bExplosion = false;
}

function BroadcastChat() {
    let sChat = document.getElementById('chatData').value.trim();
    let sUN = document.getElementById('username').value.trim();
    if (0 == sChat.length)
        return;
    if (0 == sUN.length) {
        document.getElementById('username').focus();
        Toast("Username Required To Chat");
        return;
    }
    if ("#Clear" == sChat) {
        document.getElementById("chats").innerHTML = "";
        document.getElementById('chatData').value = "";
        return;
    }
    MakeChatBubble("You", sChat);

    let objData = {};
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.Message = "BCast2Game";
    objData.Event = "Chat";
    objData.ID = g_objData.nID;
    objData.From = sUN;
    objData.Chat = sChat;
    objData.Color = g_objData.PlayerColor;
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
    document.getElementById('chatData').value = "";
    document.getElementById('chatData').focus();
}

function MakeChatBubble(sFrom, sChat, Color="black") {
    let newText = document.createElement('div');
    if ("You" == sFrom)
        newText.innerHTML = "<div class='mychat' style='background-color:"+g_objData.PlayerColor+";'>"+sChat+"</div><br><br>";
    else {
        newText.innerHTML = "<div class='otherchat' style='background-color: "+Color+";'><span class='otherchatName'>"+sFrom+"</span><br>"+sChat+"</div><br><br><br>";
    }
    document.getElementById("chats").appendChild(newText);
    document.getElementById('chats').scroll(0, document.getElementById('chats').scrollHeight);
    g_Sounds.PlayPop();
}

function stopWebSocket() {
    if (wSocket)
        wSocket.close(1000, "Deliberate disconnection");
}

function close_socket() {
    if (wSocket.readyState === WebSocket.OPEN)
        wSocket.close(1000, "Deliberate disconnection");
}

function CheckConnection() {
    if (!wSocket)
        initWebSocket();
    else if (wSocket.readyState == 3) { // Closed
        wSocket = null;
        initWebSocket();
    }
}

function sendMessage(jsonData) {
    if (wSocket != null && 1 == wSocket.readyState) {
        wSocket.send(jsonData);
    }
    else {
        console.log("ws error");
        CheckConnection();
        sendMessage.jsonData = jsonData;
        setTimeout(function(){wSocket.send(sendMessage.jsonData);}, 1500);
    }
}

function SendMyID() {
    let objData = {};
    objData.Type = "Jake";
    objData.GameID = 0;
    objData.ID = 0;
    objData.Name = g_objData.UserName ? g_objData.UserName : "Jake Parker";
    objData.Message = "MyID";
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

function SetGameID(nGameID) {
    g_objData.nGameID = nGameID;
    let objData = {};
    objData.Type = "Jake";
    objData.Message = "SetGameID";
    objData.GameID = parseInt(nGameID);
    let jsonData = JSON.stringify(objData);
    sendMessage(jsonData);
}

var hidden, visibilityChange;
VisiblitySetup();

function VisiblitySetup() {
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }
    document.addEventListener(visibilityChange, ShowVisibilityChange, false);
}

function ShowVisibilityChange() {
    //var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if ('visible' === document.visibilityState) {
        CheckConnection();
    }
}

function Toast(sMess) {
    if (document.getElementById('Toast')) {
        document.getElementById('Toast').innerHTML = "<div class='ToastMsg'>"+sMess+"</div>";
        setTimeout(function(){ document.getElementById('Toast').innerHTML = ''; }, 5000);
    }
}

function setCookie(c_name, value, exdays) {
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays===null) ? '' : '; expires='+exdate.toUTCString());
    document.cookie=c_name + '=' + c_value;
}

function getCookie(c_name) {
  var i,x,y,ARRcookies = document.cookie.split(';');
  for (i=0;i<ARRcookies.length;i++) {
    x=ARRcookies[i].substr(0,ARRcookies[i].indexOf('='));
    y=ARRcookies[i].substr(ARRcookies[i].indexOf('=')+1);
    x=x.replace(/^\s+|\s+$/g,'');
    if (x===c_name)
      return unescape(y);
  }
}

function clickEnter(event) {
    if (13 == event.keyCode)
        BroadcastChat();
}

function postFileFromServer(url, sData, doneCallback) {
    var xhr;
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = handleStateChange;
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(sData);
    function handleStateChange() {
        if (xhr.readyState === 4) {
            doneCallback(xhr.status == 200 ? xhr.responseText : null);
        }
    }
}
