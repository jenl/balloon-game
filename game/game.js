//level properties
//Sprites
var background;
var balloon;
var betterBalloon;
var boy;

var spawnZones;

var scoreElement;
var pauseButton;
var soundButton;
var cursor;

//vars for rotating cursor
var vectorXaxis = new Point(-1,0);
var vectorYaxis = new Point(1,1);
var cursorInWorld = new Point();
var cursorToBalloon = new Point();

//game parameters
var windpower = -100;
var resistance = 0.9;
var downpos = null;
var buoyancy = -0.3;
var sideScrollSpeed = 0.05;
var squaredMaxItemDistance = 1000*1000;

var score = 0;

var soundOn = true;

var girlPosition = new Point(-1000, -927);

var poorDialogue = ["02", "04", "06"].map(createDialogueSprite);
var richDialogue = ["25", "29"].map(createDialogueSprite);
var activeDialogue = null;

function begin()
{
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
    context.font = "bold 20px sans-serif";
    context.fillText("loading ...", canvas.width/2, canvas.height/2);
    LevelLoader.load(level, initialize);
}

function initialize()
{  
    Game.hudElements = createHudElements();
    Game.addSprite(Level.background);
    Game.addSprites(Level.staticSprites);
    createBalloon();
    Game.addSprites([balloon, boy]);
    setBehaviours();
    SideScroll.enableWrap();
    createTriggers();
    onResize();
    window.onresize = onResize;
    Game.run();
}

function createHudElements()
{
    var menu = new Sprite();
    menu.setImg("assets/interface/HUD_element_menu.png");
    var score = new Sprite();
    score.setImg("assets/interface/HUD_element_score.png");
    var altitudemeter = new Sprite();
    altitudemeter.setImg("assets/interface/HUD_element_altitudemeter.png");

    canvas = document.getElementById("canvas");

    var altitudeslider = new Sprite();
    altitudeslider.image.src = ("assets/altitude_slider.png");
    
    var cursor = new Sprite();
    cursor.image.src=("assets/cursor.png");
    cursor.behave(Behaviours.rotateToFaceBalloon);
    
    scoreElement = new TextElement("0", new Point(720, 558));

    soundButton = new Sprite();
    soundButton.image.src = "assets/interface/sound-on-button.png";
    soundButton.onclick = toggleSound;

    pauseButton = new Sprite();
    pauseButton.image.src = "assets/interface/pause-button.png";
    pauseButton.onclick = togglePause;
    
    return {  
	score: score, 
	    menu: menu, 
	    altitudemeter: altitudemeter,
	    pauseButton: pauseButton, 
	    altitudeslider: altitudeslider, 
	    cursor: cursor, 
	    scoreElement: scoreElement, 
	    soundButton: soundButton
	    };
}

function createBalloon()
{
    balloon = new Sprite();
    balloon.setImg("assets/balloon.png");
    balloon.scale = 0.5;
    balloon.place(Level.startPoint[0], Level.startPoint[1]);
    balloon.dangerHeight = -3000/2;
    balloon.deathHeight = -4000/2;
    balloon.normalImage = createImage("assets/balloon.png");
    balloon.dangerImage = createImage("assets/balloon-danger2.png");
    balloon.kablouieImage = createImage("assets/balloon-kablouie.png");
    balloon.blowUpImage = createImage("assets/balloon-blown.png");

    betterBalloon = new Sprite();
    betterBalloon.setImg("assets/better-balloon.png");
    betterBalloon.scale=0.5;

    boy = new Sprite();
    boy.setImg("assets/boy.png");
    boy.scale=0.5;
}

function createTriggers()
{
    bbox = Level.balloonStand;
    trigger = new Trigger(balloon, bbox, girlSpeak, hoverBalloon, girlShutup);
    Game.triggers.push(trigger);
}

function girlSpeak()
{
    //pick a scenario: Does player have enough points to win?
    win = score >= 30;
    //pick a line of dialogue
    if(win) dialogueLines = richDialogue;
    else dialogueLines = poorDialogue;
    dialogue = pickAtRandom(dialogueLines);
    //say it. Play the win sequence if the player has enough
    //points to buy a better balloon
    if(win) {	
	setDialogue(pickAtRandom(richDialogue));
	balloon.behave(Behaviours.ancorAt(girlPosition));
	setTimeout(playWinSequence, 5000);
    }
    else {
	setDialogue(poorDialogue[0]);
	setTimeout(function () { 
		girlShutup();
		setDialogue(poorDialogue[1]); }, 2000);
    }
    setTimeout(girlShutup, 5000);
}

function playWinSequence()
{
    betterBalloon.pos = balloon.pos;
    Game.removeSprite(balloon);
    Game.sprites.push(betterBalloon);
    followNewBalloon = function(obj) {
	obj.pos[0] = betterBalloon.pos[0].add(new Point(0, 100));
    }
    boy.behaviours = [createFollowBehaviour(betterBalloon, new Point(0, 60))];
}

function girlShutup()
{
    unsetDialogue();
}

function hoverBalloon()
{
    balloon.pos[2] = balloon.pos[2].add(new Point(0, 0.3));
}

function setDialogue(dialogue)
{
    Game.sprites.push(dialogue);
    activeDialogue = dialogue;
}

function unsetDialogue()
{
    if(activeDialogue)
	{
	    Game.removeSprite(activeDialogue);
	    activeDialogue = null;
	}
}

function createDialogueSprite(dialogueNumber)
{
    position = girlPosition;
    img = new Image();
    img.src = "assets/dialogue/"+dialogueNumber+".png";
    dialogueSprite = new Sprite();
    dialogueSprite.image = img;
    dialogueSprite.pos[0] = position;
    return dialogueSprite;
}

function pickAtRandom(array) 
{
    index = Math.floor(Math.random()*array.length);
    return array[index];
};

function setBehaviours()
{
    //sprite behaviours
    balloon.behave(Behaviours.resisting);
    balloon.behave(Behaviours.buoyant);
    balloon.behave(Behaviours.heightVulnerable);

    betterBalloon.behave(Behaviours.buoyant);
    betterBalloon.behave(Behaviours.resisting);

    boy.behave(createFollowBehaviour(balloon, new Point(0, 60)));
	
    //global behaviours
    mouseisdown = blowAtBalloon;
    Game.behaviours.push(sideScrollAfterBalloon);
    Game.behaviours.push(spawnObjectsAtRandomTimes);
    Game.behaviours.push(Behaviours.placeAltitudeSlider);

}

function distToBalloon(point)
{
    return point.sub(balloon.pos[0]);
}

function pushForce(point) { 
    d = distToBalloon(point); 
    d2 = d.dot(d); 
    pushforce = d.mult(windpower/d2);
    return new Point(pushforce.x, pushforce.y*0.2);
}

function blowAtBalloon(point) {
    balloon.pos[1] = balloon.pos[1].add(pushForce(point));
}

function createFollowBehaviour(object, offset) {
    return function(obj) {
	obj.pos[0] = object.pos[0].add(offset);
    }
}

function sideScrollAfterBalloon() {
    SideScroll.followSprite(balloon);
}

function randomSpawnPoint()
{
    spawnEdge = Math.floor(Math.random()*3);
    if(spawnEdge>=2) {
	x = Math.random()*canvas.width;
	y = 0;
    }
    if(spawnEdge<2) {
	x = canvas.width*(spawnEdge%2);
	y = Math.random()*canvas.height;
    }
    return (new Point(x, y)).add(SideScroll.scrollPoint);
}

function spawnObjectsAtRandomTimes() {
    spawnZones = Level.spawnZones;
    for(i in spawnZones) {
	if(!spawnZones[i].inZone()) continue;
	chanceOfObjThisSecond = spawnZones[i].spawnsPerSecond * 1.0/Game.framerate;
	if(Math.random()<chanceOfObjThisSecond)
	    Game.sprites.push(spawnZones[i].spawn(randomSpawnPoint()));
    }
}

function togglePause()
{
    Game.paused = !Game.paused;
    if(Game.paused) pauseButton.setImg("assets/interface/play-button.png");
    if(!Game.paused) pauseButton.setImg("assets/interface/pause-button.png");
}

function toggleSound()
{
    soundOn = !soundOn;
    soundElm = document.getElementById("audio");
    if(soundOn) {
	soundElm.play();
	soundButton.setImg("assets/interface/sound-on-button.png");
    }
    if(!soundOn) {
	soundElm.pause();
	soundButton.setImg("assets/interface/sound-off-button.png");
    }
}

//When resizing window, place hud elements according to window dimensions
function onResize()
{
    canvas.height = document.documentElement.clientHeight-40;
    canvas.width = document.documentElement.clientWidth-20;

    Game.hudElements.score.place(canvas.width - 130, canvas.height - 80);
    Game.hudElements.scoreElement.pos.x = canvas.width-130;
    Game.hudElements.scoreElement.pos.y = canvas.height-75;
    Game.hudElements.menu.place(100, 50);
    Game.hudElements.pauseButton.place(50, 50);
    Game.hudElements.soundButton.place(100, 50);
    Game.hudElements.altitudemeter.place(canvas.width - 50, canvas.height/2);
    Game.hudElements.altitudemeter.scale = canvas.height/1000;  
}