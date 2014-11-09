/***************  tf.js  *****************
 *
 * A lightweight javascript transform library
 * By Fan Sai KUOK  fskuok@yahoo.com
 * 
 * Liscense under MIT
 *
 ****************************************/

;(function(){
	'use strict'

	var version = "0.1.1",

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
		},
		//inspired by Modernizr http://www.modernizr.com/
		_pfx = (function () {
        
	        var browserStyle = document.createElement('pfx').style,
	            prefixes = 'Webkit Moz O ms Khtml'.split(' '),
	            memory = {};
	        
	        return function ( prop ) {
	        	var i;

	            if ( typeof memory[ prop ] === "undefined" ) {
	                

	                var ucProp = prop.charAt(0).toUpperCase() + prop.substr(1),
	                    props = (prop + ' ' + prefixes.join(ucProp + ' ') + ucProp).split(' ');
	                

	                memory[ prop ] = null;

	                for ( i in props ) {
	                    if ( browserStyle[ props[i] ] !== undefined ) {
	                        memory[ prop ] = props[i];
	                        break;
	                    }
	                }
	            
	            }
	            
	            return memory[ prop ];
	        };
	    
	    })();

	var float_RE = /\-?[0-9]+(\.[0-9]*)?/g,
		tfMatrix_RE = /^matrix\(.*\)$/,
		tfDirectiveType_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?/g,
		tfDirective_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?\([^\)]*\)/g,
		_noTransformTM = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
		//transform directives fragments
		_transforms = 'rotate|rotate3d|rotateX|rotateY|rotateZ|translate|translate3d|translateX|translateY|translateZ|scale|scaleX|scaleY|scaleZ|skew|skewX|skewY|skewZ'.split('|'),
		_TDF = {
			r: 'rotate',
			r3d: 'rotate3d',
			rx: 'rotateX',
			ry: 'rotateY',
			rz: 'rotateZ',
			t: 'translate',
			t3d: 'translate3d',
			tx: 'translateX',
			ty: 'translateY',
			tz: 'translateZ',
			s: 'scale',
			s3d: 'scale3d',
			sx: 'scaleX',
			sy: 'scaleY',
			sz: 'scaleZ',
			sk: 'skew',
			skx: 'skewX',
			sky: 'skewY',
			skz: 'skewZ',
			px: 'px',
			deg: 'deg',
			LB: '(',
			RB: ')',
			CM: ','
		},
		_PI = Math.PI,
		_isArr = function(a){ return typeof a === 'object' ? (a.slice ? true : false) : false },
		_dg2Rd = function(d){ return d*_PI/180; },
		_rd2Dg = function(r){ return r/_PI*180; },
		_TDValue2TM = {
				translate3d: function(t3d){
					return	[[1, 0, 0, +t3d[0]],
							 [0, 1, 0, +t3d[1]],
							 [0, 0, 1, +t3d[2]],
							 [0, 0, 0, 1]];
				},

				translate: function(t){
					t.push(0);
					return _TDValue2TM.translate3d(t);
				}
				
				translateX: function(tx){
					return _TDValue2TM.translate([tx, 0, 0]);
				},

				translateY: function(ty){
					return _TDValue2TM.translate([0, ty, 0]);
				},

				translateZ: function(tz){
					return _TDValue2TM.translate([0, 0, tz]);
				},

				scale3d: function(s){
					return	[[+s[0], 0,     0,     0],
							 [0,     +s[1], 0,     0],
							 [0,     0,     +s[2], 0],
							 [0,     0,     0,     1]];
				},

				scale: function(s){
					s.push(0);
					return _TDValue2TM.scale3d(s);
				}

				scaleX: function(sx){
					return _TDValue2TM.scale([sx, 0, 0]);
				},

				scaleY: function(sy){
					return _TDValue2TM.scale([0, sy, 0]);
				},

				scaleZ: function(sz){
					return _TDValue2TM.scale([0, 0, sz]);
				},

				rotate3d: function(r){
					var x= r[0], y = r[1], z = r[2], a=r[3],
						sc=Math.sin(_dg2Rd((+a)/2))*Math.cos(_dg2Rd((+a)/2)),
						sq=Math.sin(_dg2Rd((+a)/2));

					return	[[1-2*(y*y+z*z)*sq, 2*(x*y*sq-z*sc),  2*(x*z*sq+y*sc),  0],
							 [2*(x*y*sq+z*sc),  1-2*(x*x+z*z)*sq, 2*(y*z*sq-x*sc),  0],
							 [2*(x*z*sq-y*sc),  2*(y*z*sq+x*sc),  1-2*(y*y+x*x)*sq, 0],
							 [0, 				0, 				  0, 				1]];
				},

				rotate: function(){
					return _TDValue2TM.rotate3d([0,0,1,rz]);
				},

				rotateX: function(rx){
					return	_TDValue2TM.rotate3d([1,0,0,rx]);
				},

				rotateY: function(rx){
					return	_TDValue2TM.rotate3d([0,1,0,ry]);
				},

				rotateZ: function(rx){
					return	_TDValue2TM.rotate3d([0,0,1,rz]);
				},

				skew: function(skx, sky){
					return	[[1,                      Math.tan(_dg2Rd(+skx)), 0, 0],
							 [Math.tan(_dg2Rd(+sky)), 1,                      0, 0],
							 [0,                      0,                      1, 0]
							 [0,                      0,                      0, 1]];
				},

				skewX: function(skx){
					return	[[1, Math.tan(_dg2Rd(+skx)), 0, 0],
							 [0, 1,                      0, 0],
							 [0, 0,                      1, 0],
							 [0, 0,                      0, 1]];
				},

				skewY: function(sky){
					return	[[1,                      0, 0, 0],
							 [Math.tan(_dg2Rd(+sky)), 1, 0, 0],
							 [0,                      0, 1, 0],
							 [0,                      0, 0, 1]];
				},

				matrix: function(matrix){
					return _to2dTM(matrix);
				},

				matrix3d: function(matrix){
					return _to3dTM(matrix);
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

						j = a[0].length;
						for ( i=1, l=a.length; i<l; i++ ){

							if( !( _isArr(a[i] ) && a[i].length === j) ) 
								return false;

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
			},

		_2dTMTo3dTM = function(2dTM){
				if(!_is2dTM(2dTM)) 
					throw new Error('Input Error: _2dTMto3dTM');

				return [[2dTM[0][0], 2dTM[0][1], 0, 2dTM[0][2]],
						[2dTM[1][0], 2dTM[1][1], 0, 2dTM[1][2]],
						[0, 0, 1, 0],
						[0, 0, 0, 1]];
			},

		_2dVectorTo3dVector = function(2dVector){
				if(!(_isArr(2dVector) && 2dVector.length === 6)) 
					throw new Error('Input Error: _2dTMto3dTM');

				return [2dVector[0], 2dVector[1], 0, 0, 
						2dVector[2], 2dVector[3], 0, 0, 
						0,0,1,0,
						2dVector[4], 2dVector[5], 0, 1];
			};

	
	

	//Return: Array | Number
	function _dot(){
		var a = arguments[0], b = arguments[1],
			aDms = _getDms(a), bDms = _getDms(b),
			argLength = arguments.length;
		//Handle vector dot
		if(aDms[0] === 1 && bDms[0] === 1 && aDms[1] === bDms[1]){
			return _dotVV(a, b);
		//Handle Matrix dot
		}else if(aDms[0] === bDms[1]){
			return _dotMM(a, b);
		}else{
			throw new Error('Matrix multiply failed: _dot');
		}
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

					//elinminate inaccuracy
					//eg. if rotate 45deg twice, result will be wrong without elinminating the very small error
					if(Math.abs(result[row][column])<0.0000001){
						result[row][column] = 0;
					}
				}
			}

			return result;
		}
	}

	//return 3d matrix(n,n,n,n,n,n,n,n,n,n,n,n,n,n,n,n)
	function _toTDMatrixVector(input){
		if(_isArr(input)){
			//return if input is already a 6 vector
			if(_getDms(input)[0] === 1 && _getDms(input)[1] === 16) 
				return input;

			if(_getDms(input)[0] === 1 && _getDms(input)[1] === 6) 
				return _toTDMatrixVector( _2dVectorTo3dVector(input) );

			//throw error, if its not a 2d transform matrix
			if(!_is2dTM(input))
				throw new Error('Input Error: _toTDMatrixVector')

			//go to the return at the end

		}else if(typeof input === 'string'){

			if (tfMatrix_RE.exec(input) && (input.match(float_RE).length !== 6 || input.match(float_RE).length !== 16) 
				throw new Error('Input Error: _toTDMatrixVector')

			//turn matix string into 3x3 matrix
			if(input.match(float_RE).length === 6)
			input = _2dTMTo3dTM(_to2dTM(input));

			//turn matix string into 3x3 matrix
			if(input.match(float_RE).length === 16)
			input = _to3dTM(input);

		}

		return [input[0][0], input[1][0], input[2][0], input[3][0], 
				input[0][1], input[1][1], input[2][1], input[3][1], 
				input[0][2], input[1][2], input[2][2], input[3][2],
				input[0][3], input[1][3], input[2][3], input[3][3]];
	}


	//Decompose transform directives string,
	//Arg: String like 'translateX(40px) rotate(30deg)'
	//Return: Array ['translateX(40px)', 'rotate(30deg)']
	function _splitTDStr(input){
		return input.match(tfDirective_RE);
	}

	//Translate a Transform Matrix into transform matrix string
	//@parameters: Array [3x3 Transform Matrix] | [4x4 Transform Matrix]
	//@return: String 'matrix(n{15,15})'
	function _toTDMatrix(input){
		var type;
		if(typeof input === 'string'){
			if (tfMatrix_RE.exec(input) && (input.match(float_RE).length !== 6 || input.match(float_RE).length !== 16) 
				throw new Error('Input Error: _toTDMatrix');

			//Handle transform matrix string;
			if(input.match(float_RE).length === 6)
				//MODIFY END
				return _toTDMatrix(_TDTo2dTM(input));

			if(input.match(float_RE).length === 16)


		}else if(_isArr(input)){

			//Handle 3x3 matrix: turn into 1x6 vector
			if(_is2dTM(input)){
				type = 'matrix('
				input = [input[0][0], input[1][0], input[0][1], input[1][1], input[0][2], input[1][2]];
			}

			return type + input.join(', ') + ')'
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
		//return if input is already a 2D Transform Matrix 
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
				//NEED FIXED
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

		//@parameter: String like 'rotate( 45deg ) transform(100px, 32px)'
		addTransform: function(input){
			this.setTransform( _dot(
				_to2dTM( this.getTransform() ), _to2dTM(input)
			));
		},

		insertTransform : function(input){
			this.setTransform( _dot(
				_to2dTM(input), _to2dTM( this.getTransform() )
			));
		},

		learn : function(teacher){
			return this.setTransform( teacher.getTransform() );
		},

		teach : function(learner){
			learner.setTransform( this.getTransform() );
			return this;
		},
	};

	(function dynamicAddMethods(){
		var i, type, uppercasedType;

		for(i in _transforms){

			type = _transforms[i];
			
			tf.init.prototype[type] = (function(type){
				return function(){
					this.setTransform(
							type + '(' + Array.prototype.join.call(arguments, ',') + ')'
						);
					return this;
				}
			})(type);

			uppercasedType = type.charAt(0).toUpperCase() + type.substr(1);

			tf.init.prototype['add'+uppercasedType] = (function(type){
				return function(){
					this.addTransform(
							type + '(' + Array.prototype.join.call(arguments, ',') + ')'
						);
					return this;
				}
			})(type);

			tf.init.prototype['insert'+uppercasedType] = (function(type){
				return function(){
					this.insertTransform(
							type + '(' + Array.prototype.join.call(arguments, ',') + ')'
						);
					return this;
				}
			})(type);
		}
	})();
	
})();


/********  Features Tring to add  ********
 *
 * Set css style
 * 3D compatibility
 * em compatibility
 * Transition & Animation
 *
 ****************************************/

