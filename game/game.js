//level properties

//Sprites
var background;
var balloon;
var betterBalloon;

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

// var to compensate for center shifted from balloon to boy+balloon sprite
var translationFromSpriteCenterToBalloonCenter;

// temp crap
var icaruspos = new Point();

//game parameters
var windpower = -2;
var resistance = 0.9;
var downpos = null;
var buoyancy = -0.15;
var sideScrollSpeed = 0.05;
var squaredMaxItemDistance = 1000*1000;
var quotes = [];

var score = 0;

var soundOn = true;

var poorDialogue = ["02", "04", "06"].map(createDialogueSprite);
var richDialogue = ["25", "29"].map(createDialogueSprite);
var activeDialogue = null;

var currentLevel = 0;
var stashedLevel = undefined;

function begin()
{
    Game.run();
    mainMenu();
}

function startFirstLevel()
{
    currentLevel = 0;
    buoyancy = -0.3;
    startLevel(levels[currentLevel]);
}

function startLevel(level)
{
    var loading = new TextElement("loading level ...", new Point(canvas.width/2, canvas.height/2));

    Game.behaviours = [];
    Game.hudElements = { loading: loading };
    Game.sprites = [];
    mouseclick = function() {};
    Game.clear();
    createBalloon(currentLevel+1);
    setTimeout(function () { LevelLoader.load(level, initialize); }, 100);
}

function initialize()
{  
    Game.hudElements = createHudElements();
    Game.addSprite(Level.background);
    Game.addSprites(Level.staticSprites);
    setQuotes();
    Game.addSprite(balloon);
    balloon.place(Level.startPoint[0], Level.startPoint[1]);

    setBehaviours();
    SideScroll.enableWrap();
    onResize();
    window.onresize = onResize;
    score = 0;
    Level.Scripts.initialize();
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
    altitudeslider.setImg("assets/altitude_slider.png");
    
    var cursor = new Sprite();
    cursor.setImg("assets/cursor.png");
    cursor.behave(Behaviours.rotateToFaceBalloon);
    cursor.behave(Behaviours.followMouseCenter);
    
//    scoreElement = new TextElement("0", new Point(720, 558));

    soundButton = new Sprite();
    soundButton.setImg("assets/interface/sound-on-button.png");
    soundButton.onclick = toggleSound;

    pauseButton = new Sprite();
    pauseButton.setImg("assets/interface/pause-button.png");
    pauseButton.onclick = togglePause;

    quitButton = new Sprite();
    quitButton.setImg("assets/interface/exit.png");
    quitButton.onclick = quitToMenu;
    
    return{  
	score: score, 
	    menu: menu, 
	    altitudemeter: altitudemeter,
	    pauseButton: pauseButton, 
	    altitudeslider: altitudeslider, 
	    cursor: cursor, 
	    soundButton: soundButton,
	    quitButton: quitButton,
	    };
}

function createBalloon(level)
{
    var path = "assets/level"+level+"/boy/";
    balloon = new Sprite();
    balloon.scale = 1;

    balloon.dangerHeight01 = -1500;
    balloon.dangerHeight02 = -1650;
    balloon.dangerHeight03 = -1800;
    balloon.deathHeight = -1900;

    translationFromSpriteCenterToBalloonCenter = 127;

    betterBalloon = new Sprite();
    betterBalloon.setImg(path+"02boy-normal01.png");
    betterBalloon.scale=1;

    // Normal balloon
    var normalImg = new Image();
    normalImg.src = path+"01_.png";
    var normalFrames = [new Frame(normalImg,1000)];
    balloon.normalAnimation = new Animation(normalFrames);
    balloon.normalAnimation.looping = true;

    // Gefahrstufe 01
    var danger01 = new Image();
    danger01.src = path+"01_.png";
    var danger02 = new Image();
    danger02.src = path+"01_warning.png";
    var danger01Frames = [new Frame(danger01, 500), new Frame(danger02,500)];
    balloon.dangerAnimation01 = new Animation(danger01Frames);
    balloon.dangerAnimation01.looping = true;
    balloon.dangerAnimation01.play();
    
    // Gefahrstufe 02
    var dangerImg01 = new Image();
    dangerImg01.src = path+"02_.png";
    var dangerImg02 = new Image();
    dangerImg02.src = path+"02_warning.png";
    var dangerFrames = [new Frame(dangerImg01, 500), new Frame(dangerImg02,500)];
    balloon.dangerAnimation02 = new Animation(dangerFrames);
    balloon.dangerAnimation02.looping = true;
    balloon.dangerAnimation02.play();
    
    // Gefahrstufe 03
    var moreDangerImg01 = new Image();
    moreDangerImg01.src = path+"03_.png";
    var moreDangerImg02 = new Image();
    moreDangerImg02.src = path+"03_warning.png";
    var moreDangerFrames = [new Frame(moreDangerImg01, 500), new Frame(moreDangerImg02,500)];
    balloon.dangerAnimation03 = new Animation(moreDangerFrames);
    balloon.dangerAnimation03.looping = true;
    balloon.dangerAnimation03.play();

    // Todesstufe
    var boom = new Image();
    boom.src = path+"04_balloon.png";
    var gone = new Image();
    gone.src = path+"05_balloon.png";
    var boomFrames = [new Frame(boom, 1000), new Frame(gone, 1000)];
    balloon.boomAnimation = new Animation(boomFrames);
    balloon.boomAnimation.looping = false;
    balloon.boomAnimation.onEnd = function()
    {
        balloon.behaviours = [Behaviours.falling];        
        balloon.animation = balloon.burstAnimation;
    }

    // Ballonkind, Ballonkind, alles ist vorbei. Ein Tipp: Lass dich den Ballon mit Pressluft auff�llen!
    var burst = new Image();
    burst.src = path+"05_balloon.png";
    var burstFrames = [new Frame(burst, 500)];
    balloon.burstAnimation = new Animation(burstFrames);
    balloon.burstAnimation.looping = false;

    var img1 = new Image();
    img1.src = path+"boy_up_01.png";
    var img2 = new Image();
    img2.src = path+"boy_up_02.png";
    var boyFrames = [new Frame(img1, 5000), new Frame(img2, 666)];
    balloon.startAnimation = new Animation(boyFrames);
    balloon.startAnimation.looping=false;
    balloon.startAnimation.play();

    balloon.startAnimation.onEnd = function()
    {
        balloon.animation = balloon.normalAnimation;
        balloon.behave(Behaviours.buoyant);
        setBalloonBehaviours();
        bindMouseEvents();
        createTriggers();
    }
    balloon.animation = balloon.startAnimation;    
}

function createTriggers()
{
    //    bbox = Level.balloonStand;
    //    trigger = new Trigger(balloon, bbox, girlSpeak, hoverBalloon, girlShutup);
    for(var i in Level.triggers) {
	Game.triggers.push(Level.triggers[i]);
    }
}

function playWinSequence()
{
    betterBalloon.pos = balloon.pos;
    Game.removeSprite(balloon);
    Game.sprites.push(betterBalloon);
}

function girlShutup()
{
    buoyancy = -0.3;
    unsetDialogue();
}

function hoverBalloon()
{
    balloon.pos[2] = balloon.pos[2].add(new Point(0, -buoyancy));
}

function setDialogue(dialogue)
{
    dialogue.animation.play();
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
    position = Level.balloonStandPosition;
    dialogueSprite = new Sprite();
    dialogueSprite.setImg("assets/dialogue/"+dialogueNumber+".png");
    dialogueSprite.pos[0] = position;
    return dialogueSprite;
}

function pickAtRandom(array) 
{
    index = Math.floor(Math.random()*array.length);
    return array[index];
};

function setQuotes()
{
    quotes.push(" Blackness swims toward you like a school \nof eels who have just seen something\n that eels like a lot.");
    quotes.push("What really is the point of trying to \nteach anything to anybody?");
    quotes.push("Nothing matters more to a child than \na place to call home.");
    quotes.push("It is entirely seemly for a young man \nkilled in battle to lie mangled by the bronze spear. \nIn his death all things appear fair.");
    quotes.push("In all things of nature there is \nsomething of the marvelous.");
    quotes.push("Time crumbles things; everything grows \nold under the power of Time \nand is forgotten through the lapse of Time.");
    quotes.push("But truly, Ananda, it is nothing strange \nthat human beings should die.");
    quotes.push("Life is like riding a bicycle. \nTo keep your balance you must keep moving.");
    quotes.push("Why not?");
    quotes.push("Man is free at the instant he wants to be.");
}

function getQuote()
{
    var quote = quotes[Math.floor(Math.random()*quotes.length)];
    return quote;
}

function die()
{
    var wisdom = new TextElement(getQuote(), new Point(canvas.width*0.2, canvas.height*0.4));

    Game.hudElements.wisdom = wisdom;

    setTimeout(function () {
	    Game.addBehaviour(sideScrollAfterBalloon);
	    balloon.pos[0] = Level.balloonStandPosition;
	    balloon.behaviours = [];
	    balloon.setImg(obj.normalImage);
	    delete Game.hudElements.wisdom;
	    
	    balloon.behave(Behaviours.heightVulnerable);
	    balloon.behave(Behaviours.hasMinimumHeight);
	    balloon.behave(Behaviours.buoyant);
	    balloon.behave(Behaviours.resisting);
        buoyancy = -0.3;
        
	}, 3000);
}

function setBehaviours()
{
    Game.behaviours.push(sideScrollAfterBalloon);
    Game.behaviours.push(spawnObjectsAtRandomTimes);
    Game.behaviours.push(Behaviours.placeAltitudeSlider);
}

function setBalloonBehaviours()
{
    //sprite behaviours
    balloon.behave(Behaviours.resisting);
    balloon.behave(Behaviours.hasMinimumHeight);
    balloon.behave(Behaviours.heightVulnerable);

    betterBalloon.behave(Behaviours.buoyant);
    betterBalloon.behave(Behaviours.resisting);

    //global behaviours
    mouseisdown = blowAtBalloon;
}

function distToBalloon(point)
{
    return point.sub(new Point(balloon.pos[0].x , balloon.pos[0].y - translationFromSpriteCenterToBalloonCenter ) );
}

function pushForce(point)
{ 
    d = distToBalloon(point); 
    d2 = Math.sqrt(d.dot(d)); 
    pushforce = d.mult(windpower/d2);
    return new Point(pushforce.x, pushforce.y*0.2);
}

function blowAtBalloon(point)
{
    balloon.pos[1] = balloon.pos[1].add( pushForce(point) );
}

function createFollowBehaviour(object, offset) {
    return function(obj) {
	obj.pos[0] = object.pos[0].add(offset);
    }
}

function sideScrollAfterBalloon()
{
    SideScroll.followSprite(balloon);
//    SideScroll.followPoint(icaruspos);
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
    Game.hudElements.menu.place(100, 50);
    Game.hudElements.quitButton.place(60, 50);
    Game.hudElements.pauseButton.place(100, 50);
    Game.hudElements.soundButton.place(140, 50);
    Game.hudElements.altitudemeter.place(canvas.width - 120, canvas.height/2);
    Game.hudElements.altitudemeter.scale = canvas.height/1000;  
}

function quitToMenu()
{
    stashLevel();
    Game.behaviours = [];
    Game.sprites = [];
    Game.hudElements = {};
    mainMenu();
}

function resume()
{
    Game.triggers = stashedLevel.triggers;
    Game.sprites = stashedLevel.sprites;
    Game.hudElements = stashedLevel.hudElements;
    Game.behaviours = stashedLevel.behaviours;
}

function stashLevel()
{
    stashedLevel = {};
    stashedLevel.triggers = arrayCopy(Game.triggers);
    stashedLevel.sprites = arrayCopy(Game.sprites);
    stashedLevel.hudElements = shallowCopy(Game.hudElements);
    stashedLevel.behaviours = shallowCopy(Game.behaviours);
}

function nextLevel()
{
    currentLevel++;
    if(currentLevel >= levels.length) {
        ending();
        return;
    }
    startLevel(levels[currentLevel]);
}
