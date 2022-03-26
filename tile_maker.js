'use strict';

let canvas1 = document.getElementById("canvas1");
let canvas2 = document.getElementById("canvas2");
let canvas3 = document.getElementById("canvas3");
let firstClick = null;
let lines = [];
let rotations = [0,0,0,0,0,0,0,0,0];
function ensureNotZero(x) {
	if (x == 0) { return x + 0.000001; }
	return x;
}

function lineFromPoints(xy1, xy2) {
	let a = (xy2.y - xy1.y) / ensureNotZero(xy2.x - xy1.x);
	let b = xy1.y - a * xy1.x;
	return {a: a, b: b};
}

function drawCanvas1() {
	const ctx = canvas1.getContext("2d");
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas1.width, canvas1.height);
	const imageData = ctx.getImageData(0, 0, canvas1.width, canvas1.height);
	const data = imageData.data;
	let lineEdges = [];
	for (let y = 0; y < 600; ++y) {
		for (let x = 0; x < 600; ++x) {
			let color = 0;
			if ((0 <= x % 100 && x % 100 <= 1 ||
				 98 <= x % 100 && x % 100 <= 99) &&
				(0 <= y % 100 && y % 100 <= 1 ||
				 98 <= y % 100 && y % 100 <= 99)) {
				color = 255;
			} else {
				for (let i = 0; i < lines.length; ++i) {
					if (x * lines[i].a + lines[i].b > y)
						color = 200 - color;
				}
			}
			data[y * 600 * 4 + x * 4 + 0] = color;
			data[y * 600 * 4 + x * 4 + 1] = color;
			data[y * 600 * 4 + x * 4 + 2] = color;
			data[y * 600 * 4 + x * 4 + 3] = 255;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function drawCanvasRepeated(canvas2, partWidth) {
	const ctx = canvas2.getContext("2d");
	canvas2.fillStyle = "black";
	ctx.fillRect(0, 0, canvas2.width, canvas2.height);
	const imageData1 = canvas1.getContext("2d").getImageData(0, 0, canvas1.width, canvas1.height);
	const imageData2 = ctx.getImageData(0, 0, canvas2.width, canvas2.height);
	const data1 = imageData1.data;
	const data2 = imageData2.data;
	for (let y = 0; y < 600; ++y) {
		for (let x = 0; x < 600; ++x) {
			const part = getPart(x, y, partWidth);
			let x1 = (x - part.partX * (600 / partWidth)) * partWidth; 
			let y1 = (y - part.partY * (600 / partWidth)) * partWidth;
			let rx1 = x1;
			let ry1 = y1;
			for (let rot = 0; rot < rotations[part.partY * partWidth + part.partX]; ++rot) {
				let new_ry1 = rx1;
				let new_rx1 = (600 - ry1);
				rx1 = new_rx1;
				ry1 = new_ry1;
			}
			const color = data1[ry1 * 600 * 4 + rx1 * 4];
			data2[y * 600 * 4 + x * 4 + 0] = color;
			data2[y * 600 * 4 + x * 4 + 1] = color;
			data2[y * 600 * 4 + x * 4 + 2] = color;
			data2[y * 600 * 4 + x * 4 + 3] = 255;
		}
	}
	ctx.putImageData(imageData2, 0, 0);	
}

function drawCanvas2() {
	drawCanvasRepeated(canvas2, 2);
}

function drawCanvas3() {
	drawCanvasRepeated(canvas3, 3);
}

function draw() { drawCanvas1(); drawCanvas2(); drawCanvas3(); }

function canvas1ClickHandler(evt) {
    let rect = canvas1.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
	if (firstClick == null) {
		firstClick = {x: x, y: y};
	} else {
		let secondClick = {x: x, y: y};
		lines.push(lineFromPoints(firstClick, secondClick));
		firstClick = null;
		draw();
	}
}

function getPart(x,y,partWidth) {
	for (let partY = 0; partY < partWidth; ++partY) {
		for (let partX = 0; partX < partWidth; ++partX) {
			if (partX * (600 / partWidth) <= x && x < (partX + 1) * (600 / partWidth) &&
				partY * (600 / partWidth) <= y && y < (partY + 1) * (600 / partWidth))
			{
				return {partX: partX, partY: partY};
			}
		}
	}
	return null;
}

function canvasRepatedClickHandler(canvas2, evt, partWidth) {
    let rect = canvas2.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
	let part = getPart(x, y, partWidth);
	if (part == null) return;
	rotations[part.partY * partWidth + part.partX] = (rotations[part.partY * partWidth + part.partX] + 1) % 4;
	draw();
}

function canvas2ClickHandler(evt) {
	canvasRepatedClickHandler(canvas2, evt, 2);
}

function canvas3ClickHandler(evt) {
	canvasRepatedClickHandler(canvas3, evt, 3);
}


draw();
canvas1.addEventListener("click", canvas1ClickHandler);
canvas2.addEventListener("click", canvas2ClickHandler);
canvas3.addEventListener("click", canvas3ClickHandler);
