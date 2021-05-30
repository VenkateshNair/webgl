var canvas = null;
var gl = null; 
var canvasOriginalWidth;
var canvasOriginalHeight;
var bFullScreen = false;

//declaring an enum
const WebGLMacros = 
{
	VMN_ATTRIBUTE_VERTEX:0,
	VMN_ATTRIBUTE_COLOR:1,
	VMN_ATTRIBUTE_NORMAL:2,
	VMN_ATTRIBUTE_TEXTURE0:3,
};

//declaring shader objects
var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;

//declaring vertex objects
var vao_cube;
var vao_pyramid;
var vbo_position;
var vbo_color;
var vbo_texture;
var angle = 0.0;
//uniforms
var mvpUniform;

var stone_texture;
var kunali_texture;

var textureSamplerUniform;

//matrix
var perspectiveProjectionMatrix;


var requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame ||
							window.oRequestAnimationFrame ||
							window.msRequestAnimationFrame;

function main() 
{
	//step-1 get canvas from DOM
		canvas = document.getElementById("VMN");
		//document in in build variable
		//error checking
		if(!canvas)
		{
			console.log("CANVAS NOT FOUND");
		}
		else
		{
			console.log("CANVAS  FOUND");
			console.log("CANVAS  WIDTH  = " + canvas.width);
			console.log("CANVAS  HEIGHT = " + canvas.height);
		}

		canvasOriginalWidth = canvas.width;
		canvasOriginalHeight = canvas.height;

	//step-2 window is inbuild variable , setting events 
		//first param is inbuilt registered event , second param is function name 
		window.addEventListener("keydown",keyDown,false);
		window.addEventListener("click",mouseDown,false);
		window.addEventListener("resize",resize,false);

		initialize();
		resize();		//warm up resize
		draw();			//warm up draw

}

function initialize()
{
	//step-1 get drawing context from the canvas
		gl = canvas.getContext("webgl2");
		//error checking
		if(!gl)
		{
			console.log("WebGL2 Context Not Found"); 
		}
		else
		{
			console.log("WebGL2 Context Found");
		}

		gl.viewportWidth = canvasOriginalWidth;
		gl.viewportHeight = canvasOriginalHeight;


		//vertex shader
		var vertexShaderSourceCode = 
		"#version 300 es                              \n"+
		"in vec4 vPosition;							  \n"+
		"in vec2 vTextCord;							  \n"+
		"in vec4 vColor;							  \n"+
		"out vec2 out_vTexCord;						  \n"+
		"uniform mat4 u_mvp_matrix;					  \n"+
		"void main(void)							  \n"+
		"{											  \n"+
		"	gl_Position = u_mvp_matrix*vPosition;	  \n"+
		"	out_vTexCord = vTextCord;                 \n"+
		"}											  \n";


		vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vertexShaderObject,vertexShaderSourceCode);
		gl.compileShader(vertexShaderObject);

		if(gl.getShaderParameter(vertexShaderObject,gl.COMPILE_STATUS)==false)
		{
			var error = gl.getShaderInfoLog(vertexShaderObject);
			if(error.length>0)
			{
				alert(error);
				uninitialize();
			}
		}
		else
		{
			console.log("Vertex shader successfully compiled");
		}

		//fragment shader
		var fragmentShaderSourceCode = 
		"#version 300 es                                         \n"+
		"precision highp float;							         \n"+
		"in vec2 out_vTexCord;							         \n"+
		"uniform sampler2D u_texture_sampler;			         \n"+
		"out vec4 FragColor;							         \n"+
		"void main(void)								         \n"+
		"{												         \n"+
		"	FragColor = texture(u_texture_sampler,out_vTexCord); \n"+
		"}												         \n";


		fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fragmentShaderObject,fragmentShaderSourceCode);
		gl.compileShader(fragmentShaderObject);
		if(gl.getShaderParameter(fragmentShaderObject,gl.COMPILE_STATUS)==false)
		{
			var error = gl.getShaderInfoLog(fragmentShaderObject);
			if(error.length>0)
			{
				alert(error);
				uninitialize();
			}
		}
		else
		{
			console.log("Fragment shader successfully compiled");
		}

		//shader program object
		shaderProgramObject = gl.createProgram();
		gl.attachShader(shaderProgramObject,vertexShaderObject);
		gl.attachShader(shaderProgramObject,fragmentShaderObject);

		gl.bindAttribLocation(shaderProgramObject,WebGLMacros.VMN_ATTRIBUTE_VERTEX,"vPosition");
		gl.bindAttribLocation(shaderProgramObject,WebGLMacros.VMN_ATTRIBUTE_TEXTURE0,"vTextCord");

		//linking
		gl.linkProgram(shaderProgramObject);
		if(gl.getProgramParameter(shaderProgramObject,gl.LINK_STATUS) == false)
		{
			var error = gl.getProgramInfoLog(shaderProgramObject);
			if(error.length>0)
			{
				alert(error);
				uninitialize();
			}
		}
		else
		{
			console.log("Program Object Linked Succcessfully");
		}
		
		mvpUniform = gl.getUniformLocation(shaderProgramObject,"u_mvp_matrix");
		textureSamplerUniform = gl.getUniformLocation(shaderProgramObject,"u_texture_sampler");

		
		var cubeVertices = new Float32Array([
		1.0,1.0,1.0,
		-1.0,1.0,1.0,
		-1.0,-1.0,1.0,
		1.0,-1.0,1.0,
		1.0,1.0,-1.0,
		1.0,1.0,1.0,
		1.0,-1.0,1.0,
		1.0,-1.0,-1.0,
		-1.0,1.0,-1.0,
		1.0,1.0,-1.0,
		1.0,-1.0,-1.0,
		-1.0,-1.0,-1.0,
		-1.0,1.0,1.0,
		-1.0,1.0,-1.0,
		-1.0,-1.0,-1.0,
		-1.0,-1.0,1.0,
		-1.0,1.0,1.0,
		1.0,1.0,1.0,
		1.0,1.0,-1.0,
		-1.0,1.0,-1.0,
		-1.0,-1.0,1.0,
		1.0,-1.0,1.0,
		1.0,-1.0,-1.0,
		-1.0,-1.0,-1.0
		]);

		var cubeTextures = new Float32Array([
		1.0,1.0,
        0.0,1.0,
        0.0,0.0,
        1.0,0.0,
        1.0,1.0,
        0.0,1.0,
        0.0,0.0,
        1.0,0.0,
        1.0,1.0,
        0.0,1.0,
        0.0,0.0,
        1.0,0.0,
        1.0,1.0,
        0.0,1.0,
        0.0,0.0,
        1.0,0.0,
        0.0,0.0,
        1.0,0.0,
        1.0,1.0,
        0.0,1.0,
        0.0,0.0,
        1.0,0.0,
        1.0,1.0,
        0.0,1.0
		]);
		
		var pyramidVertices = new Float32Array([
		0.0,1.0,0.0,
		-1.0,-1.0,1.0,
		1.0,-1.0,1.0,

		0.0,1.0,0.0,
		1.0,-1.0,1.0,
		1.0,-1.0,-1.0,

		0.0,1.0,0.0,
		1.0,-1.0,-1.0,
		-1.0,-1.0,-1.0,

		0.0,1.0,0.0,
		-1.0,-1.0,-1.0,
		-1.0,-1.0,1.0
		]);

	  var pyramidTexture = new Float32Array([
	  0.5,1.0,
      1.0,0.0,
      0.0,0.0,

      0.5,1.0,
      0.0,0.0,
      1.0,0.0,

      0.5,1.0,
      0.0,0.0,
      1.0,0.0,

      0.5,1.0,
      0.0,0.0,
      1.0,0.0
		]);
			
		//pyramid
		vao_pyramid = gl.createVertexArray();
		gl.bindVertexArray(vao_pyramid);
		
		//vertices
		vbo_position = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo_position);
		gl.bufferData(gl.ARRAY_BUFFER,pyramidVertices,gl.STATIC_DRAW);
		gl.vertexAttribPointer(WebGLMacros.VMN_ATTRIBUTE_VERTEX,3,gl.FLOAT,false,0,0);
		gl.enableVertexAttribArray(WebGLMacros.VMN_ATTRIBUTE_VERTEX);
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		//texture
		vbo_texture = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo_texture);
		gl.bufferData(gl.ARRAY_BUFFER,pyramidTexture,gl.STATIC_DRAW);
		gl.vertexAttribPointer(WebGLMacros.VMN_ATTRIBUTE_TEXTURE0,2,gl.FLOAT,false,0,0);
		gl.enableVertexAttribArray(WebGLMacros.VMN_ATTRIBUTE_TEXTURE0);
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		gl.bindVertexArray(null);

		//cube
		vao_cube = gl.createVertexArray();
		gl.bindVertexArray(vao_cube);
		
		//vertices
		vbo_position = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo_position);
		gl.bufferData(gl.ARRAY_BUFFER,cubeVertices,gl.STATIC_DRAW);
		gl.vertexAttribPointer(WebGLMacros.VMN_ATTRIBUTE_VERTEX,3,gl.FLOAT,false,0,0);
		gl.enableVertexAttribArray(WebGLMacros.VMN_ATTRIBUTE_VERTEX);
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		//texture
		vbo_texture = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,vbo_texture);
		gl.bufferData(gl.ARRAY_BUFFER,cubeTextures,gl.STATIC_DRAW);
		gl.vertexAttribPointer(WebGLMacros.VMN_ATTRIBUTE_TEXTURE0,2,gl.FLOAT,false,0,0);
		gl.enableVertexAttribArray(WebGLMacros.VMN_ATTRIBUTE_TEXTURE0);
		gl.bindBuffer(gl.ARRAY_BUFFER,null);

		gl.bindVertexArray(null);
		
		gl.clearDepth(1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);

		gl.clearColor(0.0,0.0,0.0,1.0);			//setting blue color


		//loading texture 
		//stone
		stone_texture = gl.createTexture();
		stone_texture.image = new Image();
		stone_texture.image.src = "Stone.png";
		stone_texture.image.onload = function(){
			gl.bindTexture(gl.TEXTURE_2D,stone_texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, stone_texture.image);
			gl.bindTexture(gl.TEXTURE_2D, null);
		};

		//kundali
		kunali_texture = gl.createTexture();
		kunali_texture.image = new Image();
		kunali_texture.image.src = "Kundali.png";
		kunali_texture.image.onload = function(){
			gl.bindTexture(gl.TEXTURE_2D,kunali_texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, kunali_texture.image);
			gl.bindTexture(gl.TEXTURE_2D, null);
		};

		perspectiveProjectionMatrix = mat4.create();
	
		resize();	
}

function resize()
{
	if(bFullScreen == true)
	{
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}
	else
	{
		canvas.width = canvasOriginalWidth;
		canvas.height = canvasOriginalHeight;
	}
	
		gl.viewport(0,0,canvas.width,canvas.height);
		mat4.perspective(perspectiveProjectionMatrix,45,parseFloat(canvas.width)/parseFloat(canvas.height),0.1,100);
	
}

function draw()
{
	//local variables
	var modelViewMatrix = mat4.create();
	var modelViewProjectionMatrix = mat4.create();
	var translateMatrix = mat4.create();
	var rotateMatrix = mat4.create();
	var scaleMatrix = mat4.create();

	gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
	
	gl.useProgram(shaderProgramObject);

	//triangle
	translateMatrix = mat4.create();
	mat4.translate(modelViewMatrix,translateMatrix,[-1.5,0.0,-6.0]);
	mat4.rotateY(rotateMatrix,rotateMatrix,degToRad(angle));
	mat4.multiply(modelViewMatrix,modelViewMatrix,rotateMatrix);
	mat4.multiply(modelViewProjectionMatrix,perspectiveProjectionMatrix,modelViewMatrix);
	gl.uniformMatrix4fv(mvpUniform,false,modelViewProjectionMatrix);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,stone_texture);
	gl.uniform1i(textureSamplerUniform,0);

	gl.bindVertexArray(vao_pyramid);
	gl.drawArrays(gl.TRIANGLES,0,12);
	gl.bindVertexArray(null);

	//cube
	
	translateMatrix = mat4.create();
	 rotateMatrix = mat4.create();
	mat4.translate(modelViewMatrix,translateMatrix,[1.5,0.0,-6.0]);
	mat4.scale(scaleMatrix,scaleMatrix,[0.75,0.75,0.75]);
	mat4.multiply(modelViewMatrix,modelViewMatrix,scaleMatrix);
	mat4.rotateX(rotateMatrix,rotateMatrix,degToRad(angle));
	mat4.rotateY(rotateMatrix,rotateMatrix,degToRad(angle));
	mat4.rotateZ(rotateMatrix,rotateMatrix,degToRad(angle));
	mat4.multiply(modelViewMatrix,modelViewMatrix,rotateMatrix);
	mat4.multiply(modelViewProjectionMatrix,perspectiveProjectionMatrix,modelViewMatrix);
	gl.uniformMatrix4fv(mvpUniform,false,modelViewProjectionMatrix);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D,kunali_texture);
	gl.uniform1i(textureSamplerUniform,0);


	gl.bindVertexArray(vao_cube);
	gl.drawArrays(gl.TRIANGLE_FAN,0,4);
	gl.drawArrays(gl.TRIANGLE_FAN,4,4);
	gl.drawArrays(gl.TRIANGLE_FAN,8,4);
	gl.drawArrays(gl.TRIANGLE_FAN,12,4);
	gl.drawArrays(gl.TRIANGLE_FAN,16,4);
	gl.drawArrays(gl.TRIANGLE_FAN,20,4);
	gl.bindVertexArray(null);
	
	
	gl.useProgram(null);

	//update
	angle = angle + 1.0;
	if(angle >= 360.0)
		angle = 0.0;

	requestAnimationFrame(draw,canvas);

	
}

function toogleFullScreen()
{
	var fullScreenElement = document.fullscreenElement ||			//chrome or opera
							document.webkitFullScreenElement ||		//apple - safari
							document.mozFullScreenElement ||		//mozilla firefox
							document.msFullscreenElement ||			//internet explorer
							null;

	//if not fullscreen
	if(fullScreenElement == null)
	{
		if(canvas.requestFullscreen)		//checking if function exits
		{
			canvas.requestFullscreen();
		}
		else if(canvas.webkitRequestFullscreen)
		{
			canvas.webkitRequestFullscreen();
		}
		else if(canvas.mozRequestFullScreen)
		{
			canvas.mozRequestFullScreen();
		}
		else if(canvas.msRequestFullscreen)
		{
			canvas.msRequestFullscreen();
		}

		bFullScreen = true;
	}//if already fullscreen
	else	
	{
		if(document.exitFullscreen)
		{
			document.exitFullscreen();
		}
		else if(document.webkitExitFullscreen)
		{
			document.webkitExitFullscreen();
		}
		else if(document.mozCancelFullScreen)
		{
			document.mozCancelFullScreen();
		}
		else if(document.msExitFullscreen)
		{
			document.msExitFullscreen();
		}

		bFullScreen = false;
	}

}

function keyDown(event)
{
	switch(event.keyCode)
	{
		case 27:
			uninitialize();
			window.close();
			break;
		case 70:
			toogleFullScreen();
			break;
	}
}

function mouseDown(event)
{
	
}

function degToRad(degree)
{
	var radian = degree*Math.PI/180.0;
	return radian;
}

function uninitialize()
{
	if(vao_cube)
	{
		gl.deleteVertexArray(vao_cube);
		vao_cube = null;
	}

	if(vao_pyramid)
	{
		gl.deleteVertexArray(vao_pyramid);
		vao_pyramid = null;
	}

	if(vbo_position)
	{
		gl.deleteBuffer(vbo_position);
		vbo_position = null;
	}

	if(vbo_texture)
	{
		gl.deleteBuffer(vbo_color);
		vbo_position = null;
	}

	if(stone_texture)
	{
		gl.deleteTexture(stone_texture);
		stone_texture = null;
	}

	if(kunali_texture)
	{
		gl.deleteTexture(kunali_texture);
		kunali_texture = null;
	}

	if(shaderProgramObject)
	{
		if(fragmentShaderObject)
		{
			gl.detachShader(shaderProgramObject,fragmentShaderObject);
			gl.deleteShader(fragmentShaderObject);
			fragmentShaderObject = null;
		}
		if(vertexShaderObject)
		{
			gl.detachShader(shaderProgramObject,vertexShaderObject);
			gl.deleteShader(vertexShaderObject);
			fragmentShaderObject = null;
		}
		gl.deleteProgram(shaderProgramObject);
		shaderProgramObject = null;
	}
}

