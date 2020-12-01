
var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var vertexColorBuffer;

var mvMatrix = mat4.create();

var lastTime = 0;


class Planet
{
    constructor(nama, x, y, r, rotAngle, warnaR, warnaG, warnaB, putihTengah) {
        this.nama = nama;
        this.x = x;
        this.y = y;
        this.r = r;
        this.rotAngle = rotAngle;
        this.warnaR = warnaR;
        this.warnaG = warnaG;
        this.warnaB = warnaB;
        this.putihTengah = putihTengah;

        if(this.nama == "Bulan") {
            this.rotAngle2 = 0.0;
        }
    }

    setupBuffers() {
        vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
        const positions = [
            this.x,  this.y // circle center vertex
        ];
        const stops = 100;
        
        for (var i = 0; i <= stops; i++){
            positions.push(this.x + this.r * Math.cos(i * 2 * Math.PI/stops)); // x coord
            positions.push(this.y + this.r * Math.sin(i * 2 * Math.PI/stops)); // y coord
        }
    
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);

        if(this.putihTengah){
            var colors = [
                1.0,  1.0,  1.0,  1.0, // rgba color
            ];
        }
        else {
            var colors = [
                this.warnaR/255.0,  this.warnaG/255.0,  this.warnaB/255.0,  1.0, // rgba color
            ];
        }
        
        for (i = 0; i <= 100; i++){
            colors.push(this.warnaR/255.0,  this.warnaG/255.0,  this.warnaB/255.0, 1.0); 
        }
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    }
}

/* Deklarasi Object Planet */
var matahari = new Planet("Matahari", 0.0, 0.0, 0.2, 0.0, 255.0, 165.0, 0.0, true);
var merkurius = new Planet("Merkurius", 0.4, 0.2, 0.06, 90.0, 210.0, 105.0, 30.0, false);
var venus = new Planet("Venus", -0.5, 0.2, 0.06, 180.0, 255.0, 0.0, 0.0, true);
var bumi = new Planet("Bumi", 0.05, -0.9, 0.08, 0.0, 0.0, 0.0, 255.0, true);
var bulan = new Planet("Bulan", 0.1, -1.2, 0.03, 0.0, 105.0, 105.0, 105.0, false);
var mars = new Planet("Mars", 1.2, 0.7, 0.06, 90.0, 165.0, 42.0, 42.0, true);

function degToRad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


/* Fungsi untuk membuat WebGL Context */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}


function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);
    
    if (!shaderScript) {
        return null;
    }
    
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { 
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }
    
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;
}

/* Setup untuk fragment and vertex shaders */
function setupShaders() {
    vertexShader = loadShaderFromDOM("vs-src");
    fragmentShader = loadShaderFromDOM("fs-src");
    
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }
    
    gl.useProgram(shaderProgram);
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

    shaderProgram.translation = gl.getUniformLocation(shaderProgram, "translation");

}


/* Fungsi Draw */
function draw() { 

    var numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(
        shaderProgram.vertexPositionAttribute,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    
    var numComponents = 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    gl.vertexAttribPointer(
        shaderProgram.vertexColorAttribute,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    
    
    mat4.identity(mvMatrix);

    //mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    gl.uniform4f(shaderProgram.translation, 0.0, 0.0, 0.0, 0.6);

    const vertexCount = 102;
    gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount);
}

function tick() {
    setTimeout(() => { requestAnimFrame(tick) }, 45);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    matahari.setupBuffers()
    draw();
    merkurius.setupBuffers()
    draw();
    venus.setupBuffers()
    draw();
    bumi.setupBuffers()
    draw();
    bulan.setupBuffers()
    draw();
    mars.setupBuffers()
    draw();
   animate();
}

function animate() {
    var timeNow = new Date().getTime();
    if(lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
        merkurius.rotAngle = merkurius.rotAngle + 0.1 % 360;
        venus.rotAngle = venus.rotAngle + 0.1 % 360;
        bumi.rotAngle = bumi.rotAngle + 0.1 % 360;
        bulan.rotAngle = bulan.rotAngle + 0.1 % 360;
        bulan.rotAngle2 = bulan.rotAngle2 + 0.3 % 360;
        mars.rotAngle = mars.rotAngle + 0.1 % 360;

        merkurius.x = merkurius.x + 0.04 * Math.cos(merkurius.rotAngle);
        merkurius.y = merkurius.y + 0.04 * Math.sin(merkurius.rotAngle);

        venus.x = venus.x + 0.06 * Math.cos(venus.rotAngle);
        venus.y = venus.y + 0.06 * Math.sin(venus.rotAngle);

        bumi.x = bumi.x + 0.09 * Math.cos(bumi.rotAngle);
        bumi.y = bumi.y + 0.09 * Math.sin(bumi.rotAngle);

        bulan.x = bulan.x + 0.09 * Math.cos(bulan.rotAngle);
        bulan.y = bulan.y + 0.09 * Math.sin(bulan.rotAngle);

        bulan.x = bulan.x + 0.09 * Math.cos(bulan.rotAngle2);
        bulan.y = bulan.y + 0.09 * Math.sin(bulan.rotAngle2);

        mars.x = mars.x + 0.14 * Math.cos(mars.rotAngle);
        mars.y = mars.y + 0.14 * Math.sin(mars.rotAngle);
        
    }
    lastTime = timeNow;

}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    setupShaders();
    tick();
}