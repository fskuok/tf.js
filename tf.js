//Set css style
//3d compatibility

;(function(){
	'use strict'

	var version = "0.1.0",

		tf = window.tf = function(selector){
			if(!selector) return version;
			return tf.init(selector);
		},

		_testInherit = function(){
			if(Object.setPrototypeOf){
				console.log('Inherit by Object.setPrototypeOf');
			}else if({}.__proto__){
				console.log('Inherit by __proto__');
			}else{
				console.log('Inherit by loop copy');
			}
		},
		//set heir object's prototype to prototype
		_setPrototype = function(heir, prototype){
			if(Object.setPrototypeOf){
				Object.setPrototypeOf( heir, prototype );
			}else if({}.__proto__){
				heir.__proto__ = prototype;
			}else{
				for(var key in prototype){
					heir[key] = prototype[key];
				}
			}
		}

	var float_RE = /\-?[0-9]+(\.[0-9]*)?/g,
		tfMatrix_RE = /^matrix\(.*\)$/,
		tfDirectiveType_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?/g,
		tfDirective_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?\([^\)]*\)/g,
		_noTransformTM = [[1,0,0],[0,1,0],[0,0,1]],
		_PI = Math.PI,
		_isArr = function(a){ return typeof a === 'object' ? (a.slice ? true : false) : false},
		_dg2Rd = function(d){ return d*_PI/180; },
		_rd2Dg = function(r){ return r/_PI*180; },
		_TDValue2TM = {
				translate: function(t){
					return	[[1, 0, +t[0]],
							[0, 1, +t[1]],
							[0, 0, 1]];
				},
				translateX: function(tx){
					return _TDValue2TM.translate([tx, 0]);
				},
				translateY: function(ty){
					return _TDValue2TM.translate([0, ty]);
				},
				scale: function(s){
					return	[[+s[0], 0, 0],
							 [0, +s[1], 0],
							 [0, 0, 1]];
				},
				scaleX: function(sx){
					return _TDValue2TM.scale([sx, 0]);
				},
				scaleY: function(sy){
					return _TDValue2TM.scale([0, sy]);
				},
				rotate: function(r){
					return	[[Math.cos(_dg2Rd(+r)), -Math.sin(_dg2Rd(+r)), 0],
							 [Math.sin(_dg2Rd(+r)), Math.cos(_dg2Rd(+r)), 0],
							 [0, 0, 1]];
				},
				skewX: function(skewX){
					return	[[1, Math.tan(+skewX), 0],
							[0, 1, 0],
							[0, 0, 1]];
				},
				skewY: function(skewY){
					return	[[1, 0, 0],
							[Math.tan(+skewY), 1, 0],
							[0, 0, 1]];
				},
				matrix: function(matrix){
					return _to2dTM(matrix);
				}
			},
		//create a (m,n) Matrix with values = 0
		//@parameter: Number m [, Number n]
		//@return Array: (m, m) or (m,n) Matrix
		_newMatrix = function(m,n){
				var i, j, 
					result = [],
					n = n || m;

				for( i=0; i < m; i++ ){
					result.push([]);
					for( j=0; j < n; j++ ){
						result[i].push(0);
					}
				}

				return result;
			},
		//Examine is a variable is a matrix, a vector or other types
		//@parameter: * data to be examined
		//@return String 'martix'| 'vector' | Boolean false
		_isMOrV = function(a){
				var i, l, j;
				if(_isArr(a)){
					if(typeof a[0] === 'object'){
						j=a[0].length;
						for (i=1, l=a.length; i<l; i++){
							if(!(_isArr(a[i]) && a[i].length === j)) return false;
						}
						return 'matrix';
					}else{
						return 'vector';
					}
				}else{
					return false;
				}
			},

		//Get the dimension of a Matrix or a Vector
		//@parameter Array
		//@return Array [m, n]
		_getDms = function(a){
				switch(_isMOrV(a)){
					case 'matrix':
						return [a.length, a[0].length];
					case 'vector':
						return [1, a.length];
					default: 
						throw new Error("Can't get dimension of non-array");
				}	
			},

		//Examine a data is a 2d transform matrix or not
		//@parameter: * data to be examined
		//@return Boolean
		_is2dTM = function(a){
				if(_isMOrV(a) === 'matrix' && _getDms(a)[0]===3 && _getDms(a)[1] === 3){
					return true;
				}else{
					return false;
				}
			},

		//Examine a data is a 3d transform matrix or not
		//@parameter: * data to be examined
		//@return Boolean
		_is3dTM = function(a){
				if(_isMOrV(a) === 'matrix' && _getDms(a)[0]===4 && _getDms(a)[1] === 4){
					return true;
				}else{
					return false;
				}
			};

	
	//multiply two vector
	//@parameter: Array a, Array b
	//@return: number
	function _dotVV(a, b){

		var result = 0, 
			i = 0,
			n = _getDms(a)[1];

		for(; i<n; i++){
			result += a[i]*b[i];
		}
		return result;	
	}

	//
	//@return: Array multiplied matrix
	function _dotMM(a, b){

		var row, column, i, 
			aDms = _getDms(a), bDms = _getDms(b),
			result = _newMatrix(aDms[0]);


		for( row=0; row < aDms[0]; row++ ){
			for( column=0; column < aDms[0]; column++ ){
				for( i=0; i<aDms[0]; i++ ){
					result[row][column] += 
						(a[row][i] ? a[row][i] : 0) * ( b[i][column] ? b[i][column] : 0);
				}
			}
		}

		return result;
	}

	//Return: Array | Number
	function _dot(){
		var a = arguments[0], b = arguments[1],
			aDms = _getDms(a), bDms = _getDms(b),
			argLength = arguments.length;
		console.log(aDms, bDms);
		//Handle vector dot
		if(aDms[0] === 1 && bDms[0] === 1 && aDms[1] === bDms[1]){
			return _dotVV(a, b);
		//Handle Matrix dot
		}else if(aDms[0] === bDms[1]){
			return _dotMM(a, b);
		}else{
			throw new Error('Matrix multiply failed: _dot');
		}
	}

	function _toTDMatrixVector(input){
		if(_isArr(input)){
			//return if input is already a 6 vector
			if(_getDms(input)[0] === 1 && _getDms(input)[1] === 6) 
				return input;

			//if its not 
			if(!(_getDms(input)[0] === 3 && _getDms(input)[1] === 3)) 
				throw new Error('Input Error: _toTDMatrixVector')

		}else if(typeof input === 'string'){
			if (tfMatrix_RE.exec(input) && input.match(float_RE).length !== 6) 
				throw new Error('Input Error: _toTDMatrixVector')
			//turn matix string into 3x3 matrix
			input = _to2dTM(input);
		}

		return [input[0][0], input[1][0], input[0][1], input[1][1], input[0][2], input[1][2]];
	}

	

	//Decompose transform directives string,
	//Arg: String like 'translateX(40px) rotate(30deg)'
	//Return: Array ['translateX(40px)', 'rotate(30deg)']
	function _splitTDStr(input){
		return input.match(tfDirective_RE);
	}

	//Translate a Transform Matrix into transform matrix string
	//@parameters: Array [3x3 Transform Matrix]
	//@return: String 'matrix(a,b,c,d,e,f)'
	function _toTDMatrix(input){
		if(typeof input === 'string'){
			if (tfMatrix_RE.exec(input) && input.match(float_RE).length !== 6) 
				throw new Error('Input Error: _toTDMatrix');

			//Handle transform matrix string;
			return _TDTo2dTM(input);

		}else if(_isArr(input)){

			//Handle 3x3 matrix: turn into 1x6 vector
			if(_is2dTM(input)){
				input = [input[0][0], input[1][0], input[0][1], input[1][1], input[0][2], input[1][2]];
			}

			return 'matrix(' + input.join(', ') + ')'
		}
	}


	//Translate a Transform Matrix into transform matrix string
	//@parameters: Array [3x3 Transform Matrix]
	//@return: String 'matrix(a,b,c,d,e,f)'
	function _to2dTM(input){
		if(_is2dTM(input)) return input;
		if(typeof input === 'string') return _TDTo2dTM(input); 
		if(!_isArr(input)) throw new Error('Input Error _to2dTM');

		//handle [a,b,c,d,e,f]
		if(input.length === 6){
			return [
				[+input[0], +input[2], +input[4]],
				[+input[1], +input[3], +input[5]],
				[0, 0, 1]
			];
		//return if it's already a 3x3 
		}else if(_is2dTM(input)){
			return input;
		}else{
			throw new Error('Input Error: _to2dTM')
		}
	}
	

	//Calculate a series of transform,
	//@paratmer: String like 'translateX(40px) rotate(30deg)'
	//@return: Array [3x3 Transform Matrix]
	function _TDTo2dTM(input){
		var stack, i, l, type, value, output;
		if(typeof input !== 'string') throw new Error('Input error _TDTo2dTM: not a valid transform string')

		//Seperate each transform directive
		stack = _splitTDStr(input);

		//If input is 'none' or something else
		if( !stack ) {

			if(input.match('matrix')){

			}else if( input.match('none') ) {
				output = _noTransformTM;
			}else{
				throw new Error('Input error _TDTo2dTM: not a valid transform string')
			}
	
		//Turn input into matrix
		}else{
			//Handle each transform directive
			for( i = 0, l = stack.length; i<l; i++ ){
				//Get transform type and value
				type = stack[i].match( tfDirectiveType_RE );
				value = stack[i].match( float_RE );

				//Translate transform directive into matrix, and dot to exist matrix
				output = output ? 
							_dot(output, _TDValue2TM[type](value)) : 
							_TDValue2TM[type](value);
			}
		}

		return output;
		
	}

	//@parameter: String css selector
	//@return tf object
	tf.init = function(selector){
		var elems = document.querySelectorAll(selector),
			key;

		_setPrototype(elems, tf.init.prototype);

		elems.each(function(each) {
			each.__tf__ = each.__tf__ || {

			};
		});

		return elems;
	}

	tf.init.prototype = {
		each: function(fn){
			for(var i = 0; i < this.length; i++){
				fn.call(this[i], this[i]);
			}
			return this;
		},

		//works for [DOM Elements]
		getTransform : function(){
			var i, result = [],
				getTransform = function(elem){
					var style = window.getComputedStyle(elem);
					//need fix
					return style.transform || style.webkitTransform || style.MozTransform;
				};

			if(this.length > 1){
				this.each(function(){	
					result.push(getTransform(this));
				});
			}else{
				result = getTransform(this[0]);
			}
				
			return result;
		},

		setTransform : function(input, duration){
			var tfMtxStr;

			duration = duration || 0;

			//get matrix() string
			tfMtxStr = _toTDMatrix( _to2dTM(input) );

			//set transform property for each element
			if(duration === 0){
				this.each(function (){
					this.style.webkitTransform = tfMtxStr;
					//firefox using Uppercase for first letter
					this.style.MozTransform = tfMtxStr;
					this.style.transform = tfMtxStr;
				})
			}else{

			}

			return this;
		},

		//syntax sugar for getTransform and setTransform
		transform : function(matrixStr, duration){
			return matrixStr ? 
				this.setTransform( matrixStr, duration ) 
				: this.getTransform();
		},

		learn : function(teacher){
			return this.setTransform( teacher.getTransform() );
		},

		teach : function(learner){
			learner.setTransform( this.getTransform() );
			return this;
		},

		insertTransform : function(input){
			this.setTransform( _dot(
				_to2dTM(input), _to2dTM( this.getTransform() )
			));
		},

		addTransform: function(input){
			this.setTransform( _dot(
				_to2dTM( this.getTransform() ), _to2dTM(input)
			));
		}
	}
	
	
})();