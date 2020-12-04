
var gl;

var canvas;

var shaderProgram;

var vertexPositionBuffer;

var indexBuffer;

var vertexColorBuffer;

var mvMatrix = mat4.create();

var projectionMatrix = mat4.create();

var lastTime = 0;

var posisiKamera = 0;

class Planet
{
    constructor(nama, x, y, z, r, rotAngle, warnaR, warnaG, warnaB) {
        this.nama = nama;
        this.x = x;
        this.y = y;
        this.z = z;
        this.r = r;
        this.rotAngle = rotAngle;
        this.warnaR = warnaR;
        this.warnaG = warnaG;
        this.warnaB = warnaB;
        this.vertices = []; 
        this.indices = [];
        this.load = 0;

        if(this.nama == "Bulan") {
            this.rotAngle2 = 0.0;
        }
    }

    setupBuffers() {
        vertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

        if(this.load == 0) {
            var SPHERE_DIV = 12;
            var i, ai, si, ci;
            var j, aj, sj, cj;
            var p1, p2;

            // Vertices
            for (j = 0; j <= SPHERE_DIV; j++) {
                aj = j * Math.PI / SPHERE_DIV;
                sj = Math.sin(aj);
                cj = Math.cos(aj);
                for (i = 0; i <= SPHERE_DIV; i++) {
                    ai = i * 2 * Math.PI / SPHERE_DIV;
                    si = Math.sin(ai);
                    ci = Math.cos(ai);

                    this.vertices.push(si * sj);  // X
                    this.vertices.push(cj);       // Y
                    this.vertices.push(ci * sj);  // Z
                } 
            }
        }
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        if(this.load == 0) {
            // Indices
            indexBuffer = gl.createBuffer(); 
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            for (j = 0; j < SPHERE_DIV; j++) {
                for (i = 0; i < SPHERE_DIV; i++) {
                p1 = j * (SPHERE_DIV+1) + i;
                p2 = p1 + (SPHERE_DIV+1);

                this.indices.push(p1);
                this.indices.push(p2);
                this.indices.push(p1 + 1);

                this.indices.push(p1 + 1);
                this.indices.push(p2);
                this.indices.push(p2 + 1);
                }
            }
        }
        
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

        if(this.load == 0) {
            this.colors = [];
            for (i = 0; i <= 169; i++){
                this.colors.push(this.warnaR/255.0,  this.warnaG/255.0,  this.warnaB/255.0, 1.0); 
            }
            this.load = 1;
        }
        //color
        vertexColorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.STATIC_DRAW);
    }

    draw() {
        var numComponents = 3;
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
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        //model view matrix
        mat4.identity(mvMatrix);
        mat4.translate(mvMatrix, mvMatrix, [this.x/this.z, this.y/this.z, this.z/this.z]);
        mat4.scale(mvMatrix, mvMatrix, new Array(3).fill(this.r/26.0))
        //mat4.rotateZ(mvMatrix, mvMatrix, degToRad(90));
        //mat4.rotate(mvMatrix, mvMatrix, degToRad(45), [ 1.0, 0.0, 0.0 ]);
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    }
}

/* Deklarasi Object Planet */
var matahari = new Planet("Matahari", 0.0, 0.0, 25.0, 1.0, 0.0, 255.0, 165.0, 0.0);
var merkurius = new Planet("Merkurius", 0.1, -2.0, 25.0, 0.3, 0.0, 210.0, 105.0, 30.0);
var venus = new Planet("Venus", -2.5, 2.0, 25.0, 0.3, 180.0,  255.0, 0.0, 0.0);
var bumi = new Planet("Bumi", 0.0, -5.0, 25.0, 0.3, 0.0, 0.0, 0.0, 255.0);
var bulan = new Planet("Bulan", 0.0, -6.0, 25.0, 0.15, 0.0, 105.0, 105.0, 105.0);
var mars = new Planet("Mars", -6.0, 4.0, 25.0, 0.3, 180.0, 165.0, 42.0, 42.0);
var jupiter = new Planet("Jupiter", -8.0, 6.0, 25.0, 0.5, 180.0, 255.0, 255.0, 255.0);
var saturnus = new Planet("Saturnus", -10.0, 5.0, 25.0, 0.4, 180.0, 255.0, 228.0 ,196.0);
var uranus = new Planet("Uranus", 15.0, 5.0, 25.0, 0.35, 90.0, 95.0, 158.0, 160.0);
var neptunus = new Planet("Neptunus", 0.0, -25.0, 25.0, 0.35, 0.0, 123.0, 104.0, 238.0);

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

    shaderProgram.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");

}

function tick() {
    //setTimeout(() => { requestAnimFrame(tick) }, 45);
    requestAnimFrame(tick);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    projection();
    matahari.setupBuffers();
    matahari.draw();
    merkurius.setupBuffers();
    merkurius.draw();
    venus.setupBuffers();
    venus.draw();
    bumi.setupBuffers();
    bumi.draw();
    bulan.setupBuffers();
    bulan.draw();
    mars.setupBuffers();
    mars.draw();
    jupiter.setupBuffers();
    jupiter.draw();
    saturnus.setupBuffers();
    saturnus.draw();
    uranus.setupBuffers();
    uranus.draw();
    neptunus.setupBuffers();
    neptunus.draw();
    animate();
}

function animate() {
    var timeNow = new Date().getTime();
    if(lastTime != 0) {
        var elapsedTime = timeNow - lastTime;
        merkurius.rotAngle = merkurius.rotAngle + 0.05 % 360;
        venus.rotAngle = venus.rotAngle + 0.03 % 360;
        bumi.rotAngle = bumi.rotAngle +  0.019 % 360;
        bulan.rotAngle = bulan.rotAngle + 0.019 % 360;
        bulan.rotAngle2 = bulan.rotAngle2 + 0.1 % 360;
        mars.rotAngle = mars.rotAngle + 0.013 % 360;
        jupiter.rotAngle = jupiter.rotAngle + 0.01 % 360;
        saturnus.rotAngle = saturnus.rotAngle + 0.008 % 360;
        uranus.rotAngle = uranus.rotAngle + 0.006 % 360;
        neptunus.rotAngle = neptunus.rotAngle + 0.004 % 360;

        merkurius.x = merkurius.x + 0.1 * Math.cos(merkurius.rotAngle);
        merkurius.y = merkurius.y + 0.1 * Math.sin(merkurius.rotAngle);

        venus.x = venus.x + 0.1 * Math.cos(venus.rotAngle);
        venus.y = venus.y + 0.1 * Math.sin(venus.rotAngle);

        bumi.x = bumi.x + 0.1 * Math.cos(bumi.rotAngle);
        bumi.y = bumi.y + 0.1 * Math.sin(bumi.rotAngle);

        bulan.x = bulan.x + 0.1 * Math.cos(bulan.rotAngle);
        bulan.y = bulan.y + 0.1 * Math.sin(bulan.rotAngle);

        bulan.x = bulan.x + 0.1 * Math.cos(bulan.rotAngle2);
        bulan.y = bulan.y + 0.1 * Math.sin(bulan.rotAngle2);

        mars.x = mars.x + 0.1 * Math.cos(mars.rotAngle);
        mars.y = mars.y + 0.1 * Math.sin(mars.rotAngle);

        jupiter.x = jupiter.x + 0.1 * Math.cos(jupiter.rotAngle);
        jupiter.y = jupiter.y + 0.1 * Math.sin(jupiter.rotAngle);

        saturnus.x = saturnus.x + 0.1 * Math.cos(saturnus.rotAngle);
        saturnus.y = saturnus.y + 0.1 * Math.sin(saturnus.rotAngle);

        uranus.x = uranus.x + 0.1 * Math.cos(uranus.rotAngle);
        uranus.y = uranus.y + 0.1 * Math.sin(uranus.rotAngle);

        neptunus.x = neptunus.x + 0.1 * Math.cos(neptunus.rotAngle);
        neptunus.y = neptunus.y + 0.1 * Math.sin(neptunus.rotAngle);
    }
    lastTime = timeNow;
}

function projection() {
    canvas.addEventListener("mousedown", function(event){
        if(posisiKamera == 0) {
            posisiKamera = 1;
        }
        else if(posisiKamera == 1) {
            posisiKamera = 0;
        }
    });
    //projection matrix
    mat4.identity(projectionMatrix);
    if(posisiKamera == 0) {
        mat4.translate(projectionMatrix, projectionMatrix, [0.0, 0.0, 0.0]);
        mat4.rotateX(projectionMatrix, projectionMatrix, degToRad(0));
        document.getElementById("posisiKamera").innerText = "Posisi Kamera: Top Down (Dari Atas)";
    }
    else if(posisiKamera == 1) {
        mat4.translate(projectionMatrix, projectionMatrix, [0.0, 1.0, 0.0]);
        mat4.rotateX(projectionMatrix, projectionMatrix, degToRad(90));
        document.getElementById("posisiKamera").innerText = "Posisi Kamera: Dari Samping";
    }
    //mat4.perspective(projectionMatrix, degToRad(150), gl.canvas.clientWidth / gl.canvas.clientHeight, 0.0, 40000000000000000.0);
    //mat4.lookAt(projectionMatrix, [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]);
    //mat4.rotate(projectionMatrix, projectionMatrix, degToRad(45), [0.0, 1.0, 0.0 ]);
    gl.uniformMatrix4fv(shaderProgram.projectionMatrix, false, projectionMatrix);
}

/* Fungsi yang dipanggil setelah page diload */
function startup() {
    canvas = document.getElementById("myCanvas");
    gl = createGLContext(canvas);
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    setupShaders();
    tick();
}