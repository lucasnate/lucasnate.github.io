'use strict';

let FPS = 60.0;
let WIDTH = 600.0;
let HEIGHT = 600.0;

function square(x) { return x * x; }

function vectorSqDist(v1, v2) {
	return square(v2.x - v1.x) + square(v2.y - v1.y);
}

function makeVector(x0,y0) {
	return {x: x0, y: y0};
}

function makeThing(x0, y0) {
	return {pos: makeVector(x0, y0), vel: makeVector(0, 0), a: Math.PI, r: 30, m: 1};
}

function vectorAdd(v1, v2) {
	return makeVector(v1.x + v2.x, v1.y + v2.y);
}


function vectorSub(v1, v2) {
	return makeVector(v1.x - v2.x, v1.y - v2.y);
}

function vectorScalarMul(s, v) {
	return makeVector(s * v.x, s * v.y);
}

function vectorDotProd(v1, v2) {
	return v1.x * v2.x + v1.y * v2.y;
}

// Based on https://en.wikipedia.org/wiki/Elastic_collision
function collision(x1, x2, v1, v2, m1, m2) {
	let massCoef = 2 * m2 / (m1 + m2);
	let xDiff = vectorSub(x1, x2);
	let dotProd = vectorDotProd(vectorSub(v1, v2), xDiff);
	let otherCoef = dotProd / vectorSqDist(x1, x2);
	return vectorSub(v1, vectorScalarMul(massCoef * otherCoef, xDiff));
}

function fillSector(ctx, x, y, r, a1, a2, color) {
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.moveTo(x, y);
	ctx.arc(x, y, r, a1, a2);
	ctx.lineTo(x, y);
	ctx.fill();
	ctx.closePath();
}

function drawThing(ctx, thing, color, darkcolor) {
	fillSector(ctx, thing.pos.x, thing.pos.y, thing.r, thing.a - Math.PI / 10, thing.a + Math.PI / 10, color);
	fillSector(ctx, thing.pos.x, thing.pos.y, thing.r, thing.a + Math.PI / 10, thing.a - Math.PI / 10, darkcolor);
}

function overlap(thing1, thing2) {
	return vectorSqDist(thing1.pos, thing2.pos) < square(thing1.r + thing2.r);
}

function handleWallOverlap(thing) {
	if (thing.pos.x - thing.r < 0) {
		thing.pos.x = thing.r;
		if (thing.vel.x < 0) thing.vel.x = -thing.vel.x;
	}
	if (thing.pos.y - thing.r < 0) {
		thing.pos.y = thing.r;
		if (thing.vel.y < 0) thing.vel.y = -thing.vel.y;
	}
	if (thing.pos.x + thing.r > WIDTH) {
		thing.pos.x = WIDTH - thing.r;
		if (thing.vel.x > 0) thing.vel.x = -thing.vel.x;
	}
	if (thing.pos.y + thing.r > HEIGHT) {
		thing.pos.y = HEIGHT - thing.r;
		if (thing.vel.y > 0) thing.vel.y = -thing.vel.y;
	}
}

class SimpleGame extends netplayjs.Game {
	constructor() {
		super();
		this.players = [makeThing(50, 50), makeThing(200, 200)];
	}

	tick(playerInputs) {
		for (const [player, input] of playerInputs.entries()) {
			let playerId = player.getID();
			this.players[playerId].a -= (input.pressed.ArrowLeft ? Math.PI * 2 / FPS : 0);
			this.players[playerId].a += (input.pressed.ArrowRight ? Math.PI * 2 / FPS : 0);
			this.players[playerId].vel.x += (input.pressed.ArrowUp ? Math.cos(this.players[playerId].a) * 0.1 : 0);
			this.players[playerId].vel.y += (input.pressed.ArrowUp ? Math.sin(this.players[playerId].a) * 0.1 : 0);
		}
		for (let playerId = 0; playerId < 2; ++playerId) {
			this.players[playerId].pos.x += this.players[playerId].vel.x;
			this.players[playerId].pos.y += this.players[playerId].vel.y;
			handleWallOverlap(this.players[playerId]);
		}
		if (overlap(this.players[0], this.players[1])) {
			let newPlayer0Vel = collision(this.players[0].pos, this.players[1].pos, this.players[0].vel, this.players[1].vel, this.players[0].m, this.players[1].m);
			let newPlayer1Vel = collision(this.players[1].pos, this.players[0].pos, this.players[1].vel, this.players[0].vel, this.players[1].m, this.players[0].m);
			this.players[0].vel = newPlayer0Vel;
			this.players[1].vel = newPlayer1Vel;
			let mul = 1;
			do {
				this.players[0].pos = vectorAdd(this.players[0].pos, vectorScalarMul(mul, this.players[0].vel));
				this.players[1].pos = vectorAdd(this.players[1].pos, vectorScalarMul(mul, this.players[1].vel));
				mul *= 2;
			} while (overlap(this.players[0], this.players[1]));
		}
		
	}

	draw(canvas) {
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		drawThing(ctx, this.players[0], "red", "darkred");
		drawThing(ctx, this.players[1], "blue", "darkblue");
	}
}

SimpleGame.timestep = 1000 / FPS;
SimpleGame.canvasSize = {width: WIDTH, height: HEIGHT};

switch (window.location.protocol) {
case 'file:':
	let game = new SimpleGame();
	let canvas = document.createElement("canvas");
	canvas.width = SimpleGame.canvasSize.width;
	canvas.height = SimpleGame.canvasSize.height;
	document.body.appendChild(canvas);
	let pressed_keys = {}
    document.addEventListener("keydown", (event) => {
		// document.write("Pressed " + event.key);
        pressed_keys[event.key] = true;
    }, false);
    document.addEventListener("keyup", (event) => {
        pressed_keys[event.key] = false;
    }, false);
	window.setInterval(function() {
		game.tick({entries: function() { return [[{getID: function() { return 0; }},
												  {pressed: pressed_keys}]]; }});
		game.draw(canvas);
	}, SimpleGame.timestep);
	break;
default:
	new netplayjs.RollbackWrapper(SimpleGame).start();
	break;
}

