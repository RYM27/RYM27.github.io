
var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var indexBuffer;

var mvMatrix = mat4.create();

var projectionMatrix = mat4.create();

var normalmatrix = mat4.create();

var rotAngle = 0.0;

var lastTime = 0;

var posLighting = 2.0;

var naik = false;

function degToRad(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
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

    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.projectionMatrixUniform = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");

     // retrieve the location of the UNIFORM variables of the shader

    shaderProgram.normalLoc = gl.getAttribLocation(shaderProgram, "normal");
    gl.enableVertexAttribArray(shaderProgram.normalLoc);
    shaderProgram.normalMatrixLoc = gl.getUniformLocation(shaderProgram, "normalMat");
    shaderProgram.lightPosLoc = gl.getUniformLocation(shaderProgram, "lightPos");
    shaderProgram.ambientColorLoc = gl.getUniformLocation(shaderProgram, "ambientColor");
    shaderProgram.diffuseColorLoc = gl.getUniformLocation(shaderProgram, "diffuseColor");
    shaderProgram.specularColorLoc = gl.getUniformLocation(shaderProgram, "specularColor");
    shaderProgram.shininessLoc = gl.getUniformLocation(shaderProgram, "shininessVal");
    shaderProgram.kaLoc = gl.getUniformLocation(shaderProgram, "Ka");
    shaderProgram.kdLoc = gl.getUniformLocation(shaderProgram, "Kd");
    shaderProgram.ksLoc = gl.getUniformLocation(shaderProgram, "Ks");
}

/* Setup buffers dengan data */
function setupBuffers() {
    vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    var positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
    
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
    
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
    
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
    
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
    
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];    
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    var indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
}


/* Fungsi Draw */
function draw() { 
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    if(lastTime == 0)
    {
        mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -6.0]);
    }
    mat4.rotate(mvMatrix, mvMatrix, degToRad(1), [0, 0, 1]);       
    mat4.rotate(mvMatrix, mvMatrix, degToRad(1) * 0.7, [0, 1, 0]);       
   
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    gl.uniformMatrix4fv(shaderProgram.projectionMatrixUniform, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    //phong
    gl.vertexAttribPointer(shaderProgram.normalLoc, 3, gl.FLOAT, false, (3+2+3)*Float32Array.BYTES_PER_ELEMENT, 0 + (3+2)*Float32Array.BYTES_PER_ELEMENT);

    gl.uniformMatrix4fv(shaderProgram.normalMatrixLoc, false, normalmatrix);
    gl.uniform1f(shaderProgram.kaLoc, 1.0);
    gl.uniform1f(shaderProgram.kdLoc, 1.0);
    gl.uniform1f(shaderProgram.ksLoc, 1.0);
    gl.uniform1f(shaderProgram.shininessLoc, 100.0);
    gl.uniform3fv(shaderProgram.lightPosLoc, [posLighting, 2.0, -6.0]);
    gl.uniform3fv(shaderProgram.ambientColorLoc, [0.2, 0.1, 0.0]);
    gl.uniform3fv(shaderProgram.diffuseColorLoc, [0.8, 0.4, 0.0]);
    gl.uniform3fv(shaderProgram.specularColorLoc, [1.0, 1.0, 1.0]);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function tick() {
    requestAnimFrame(tick);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setupBuffers();
    draw();
    animate();
}

function animate() {
    var timeNow = new Date().getTime();
    if(lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
    }
    lastTime = timeNow;

    if(posLighting >= 2.0)
    {
        naik = false;
    }
    else if(posLighting <= -2.0)
    {
        naik = true;
    }

    if(!naik)
    {
        posLighting -= 0.01;
    }
    else
    {
        posLighting += 0.01;
    }
    console.log(posLighting);
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    setupShaders(); 
    gl.clearColor(1.0/255.0, 56.0/255.0, 128.0/255.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    tick();
}


