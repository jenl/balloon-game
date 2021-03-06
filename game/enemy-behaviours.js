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
    obj.image = obj.normalImage;
    if(height < obj.dangerHeight)  obj.image = obj.dangerImage;
    if(height < obj.deathHeight)   {
	obj.image = obj.kablouieImage;
	obj.scale=0.75;
	setTimeout(function () {
		obj.image = obj.blowUpImage;
		obj.behaviours = [Behaviours.falling];
		obj.scale=0.5;
	    }, 500);
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


Behaviours.wind = function(obj)
{
    if (Math.abs(obj.pos[0].x - balloon.pos[0].x) + Math.abs(obj.pos[0].y - balloon.pos[0].y) < 400)
    {
        blowHardAtBalloon(obj.pos[0]);
    }
}

Behaviours.blowHardAtBalloon = function(obj)
{
    balloon.pos[2] = balloon.pos[2].add(pushForce(obj.pos[0]));
    balloon.pos[2].x *= 1.5;
    balloon.pos[2].y *= 1.5;
}

Behaviours.verticalPatrolling = function(obj)
{
    if (obj.pos[0].x > 1400 || obj.pos[0].x < -1400)
    {
        obj.pos[1].x *= -1;
    }
}