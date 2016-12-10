"use strict";
var width = window.innerWidth - 5;
var height = window.innerHeight - 5;

var canvas = document.getElementById("gameCanvas");
    canvas.width  = width;
    canvas.height = height;
var gl = canvas.getContext("webgl", {stencil: true, 'preserveDrawingBuffer': true, 'antialias': true, 'alpha': false});

var textCanvas = document.getElementById("textCanvas");
    textCanvas.width  = width - 100; //TODO: should it be some constant instead of magic numbers?
    textCanvas.height = height;
var textCtx = textCanvas.getContext("2d");
    textCtx.textAlign = "center";
    textCtx.fillStyle = "#ffffff";
    textCtx.font = "30pt Arial";

var vertexShader =
    "attribute vec4 a_position;" +
    "attribute vec4 aVertexColor;" +
    "uniform mat4 p_matrix;" +
    "varying lowp vec4 vColor;" +
    "void main() {" +
    "  gl_Position = p_matrix * vec4(a_position);" +
    "  vColor = aVertexColor; " +
    "}";
var fragmentShader =
    "varying lowp vec4 vColor;" +
    "void main() {" +
    "  gl_FragColor = vColor;" +
    "}";

function addShader(type, source) {
    var id = gl.createShader(type);
    gl.shaderSource(id, source);
    gl.compileShader(id);
    if (gl.getShaderParameter(id, gl.COMPILE_STATUS)) {
        gl.attachShader(program, id);
    } else {
        console.log("compileShader failed:", gl.getShaderInfoLog(id));
    }
}

var program = gl.createProgram();
addShader(gl.VERTEX_SHADER, vertexShader);
addShader(gl.FRAGMENT_SHADER, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log("linkProgram failed:", gl.getProgramInfoLog(program));
}
gl.useProgram(program);

var aVertexColor = gl.getAttribLocation(program, 'aVertexColor');
gl.enableVertexAttribArray(aVertexColor);

var aPosition = gl.getUniformLocation(program, "a_position");
var uMatrix = gl.getUniformLocation(program, "p_matrix");
var m = new Float32Array([2 / width, 0, 0, 0, 0, 2 / height, 0, 0, 0, 0, 1, 0, -1, -1, 0, 1]);
gl.uniformMatrix4fv(uMatrix, false, m);
var vertexBuffer = gl.createBuffer();

var paddle1X = 20;
var paddle1Y = height/3;
var paddle2X = width - 20;
var paddle2Y = height/3;
var ballX = width / 2;
var ballY = height/3;
var ballVX = (Math.random() < 0.5) ? 6 : -6;
var ballVY = Math.random() * 8 - 4;
var red = Math.random();
var green = Math.random();
var blue = Math.random();
var current = 0;

var pause = false;
var scoreTxt = "Score:";
var pl1Score = 0;
var pl2Score = 0;
var fail = false;
function update(timeStamp) {
    textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
    scoreTxt = "Score: " + pl1Score + "-" + pl2Score;
    textCtx.fillText(scoreTxt, (width - textCtx.measureText(scoreTxt).width)/2, 50);
    if (pause == true) {
        var txt = "Game Paused";
        textCtx.fillText(txt, (width - textCtx.measureText(txt).width)/2, textCtx.canvas.height/2);
        requestAnimationFrame(update);
        return;
    }
    ballX += ballVX;
    ballY += ballVY;
    if (ballY < 10 || ballY > height -10) {
        ballVY *= -1;
    }
    // TODO is this /too/ stupid to not be using the paddleX position here?
    if (Math.abs(ballY - paddle1Y) < 55 && (ballX <= paddle1X+10)) {
        ballVX *= -1.075;
        ballVY = (ballY - paddle1Y) / 5;
    }
    if (Math.abs(ballY - paddle2Y) < 55 && (ballX >= paddle2X)) {
        ballVX *= -1.075;
        ballVY = (ballY - paddle2Y) / 5;
    }

    if (ballX < 0) {
        ++pl2Score;
        fail = true;
    }

    if (ballX > width) {
        ++pl1Score;
        fail = true;
    }

    if (fail == true) {
        ballX = width / 2;
        ballY = height/3;
        ballVX = (Math.random() < 0.5) ? 6 : -6;
        ballVY = Math.random() * 8 - 4;
        fail = false;
    }

    var dy = ballY - paddle2Y;
    if (dy < -6) {
        dy = -6;
    }
    if (dy > 6) {
        dy = 6;
    }
    paddle2Y += dy;
    if (paddle2Y < 50) {
        paddle2Y = 50;
    }
    if (paddle2Y > height - 50) {
        paddle2Y = height - 50;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    
    gl.disableVertexAttribArray(aVertexColor);
    if (timeStamp - current >= 1000)
    {
        current = timeStamp;
        red = Math.random();
        green = Math.random();
        blue = Math.random();
        if (red == 0.0 && green == 0.0 && blue == 0.0)
        {
            red = green = blue = 1.0;
        }
    }
    gl.vertexAttrib4f(aVertexColor, red, green, blue, 1);

    drawRect(ballX, ballY, 10, 10);
    gl.vertexAttrib4f(aVertexColor, 1, 1, 1, 1);
    drawRect(paddle1X, paddle1Y, 10, 100);
    drawRect(paddle2X, paddle2Y, 10, 100);
    requestAnimationFrame(update);
}

function drawRect(x, y, w, h) {
    var x1 = x - w / 2;
    var x2 = x + w / 2;
    var y1 = y - h / 2;
    var y2 = y + h / 2;
    var verts = new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function onMouseMove(e) {
    paddle1Y = 800 - e.pageY;
    if (paddle1Y < 50) {
        paddle1Y = 50;
    }
    if (paddle1Y > height-50) {
        paddle1Y = height-50;
    }
}

function onKeyPress(e) {
    var char = e.which || e.keyCode;
    //let's pause on pressing space button
    if (char == 0x20) {
        pause = !pause;
    }
}

canvas.addEventListener("mousemove", onMouseMove, false);
textCanvas.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("keydown", onKeyPress, false ); 
update();
