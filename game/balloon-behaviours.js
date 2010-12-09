Behaviours.resisting = function(obj) {
    obj.pos[1] = obj.pos[1].mult(resistance);
};

Behaviours.buoyant = function(obj) {
    obj.acc(0,buoyancy);
};

Behaviours.swinging = function(obj)
{
	obj.angle[2] = -gravity*Math.sin(obj.angle[0]);
};

Behaviours.dampened = function(obj)
{
	obj.angle[0] *= dampening;
	obj.angle[1] *= dampening;
	obj.angle[2] *= dampening;

};

Behaviours.heightVulnerable = function(obj) {
    height = obj.pos[0].y;
    if(height < obj.dangerHeight + 100) obj.setImg(obj.normalImage);
    if(height < obj.dangerHeight)  obj.setImg(obj.dangerImage);
    if(height < obj.deathHeight)   {
	obj.setImg(obj.kablouieImage);
	setTimeout(function () {
		obj.setImg(obj.blowUpImage);
		obj.behaviours = [Behaviours.falling];
		Game.removeBehaviour(sideScrollAfterBalloon);
	    }, 500);
	setTimeout(function () {
		Game.addBehaviour(sideScrollAfterBalloon);
		obj.pos[0] = girlPosition;
		obj.behaviours = [];
		obj.setImg(obj.normalImage);
		obj.behave(Behaviours.resisting);
		obj.behave(Behaviours.heightVulnerable);

		obj.behave(Behaviours.buoyant);
		obj.behave(Behaviours.resisting);
	    }, 3000);
    }
};

Behaviours.ancorAt = function(point)
{
    return function(obj) {
	obj.pos[1] = obj.pos[1].add(point.sub(obj.pos[0]).mult(0.001));
    }
};

Behaviours.falling = function(obj)
{
    obj.acc(0, 0.5);
}