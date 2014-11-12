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

	var version = "0.2.1",

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

		matrix_RE = /^matrix\(.*\)$/,

		matrix3d_RE = /^matrix3d\(.*\)$/,

		tfProp_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?\([^\)]*\)/g,

		tfProp3d_RE = /(rotate(X|Y|Z|3d)|translate(3d|Z)|scale(3d|Z)|matrix3d)\([^\)]*\)/g,

		tfPropType_RE = /(rotate|translate|skew|scale|matrix)([XYZ]|(3d))?/g,

		_initMatrix3dArr = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],

		_initVector3dArr = [[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]],

		_elinmination = 1e-10,

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

		_degToRad = function(d){ return d*_PI/180; },

		_rd2Dg = function(r){ return r/_PI*180; },

		_propValueToMatrix3dArr = {
				translate3d: function(t3d){
					return	[[1, 0, 0, +t3d[0]],
							 [0, 1, 0, +t3d[1]],
							 [0, 0, 1, +t3d[2]],
							 [0, 0, 0, 1]];
				},

				translate: function(t){
					t.push(0);
					return _propValueToMatrix3dArr.translate3d(t);
				},
				
				translateX: function(tx){
					return _propValueToMatrix3dArr.translate([tx, 0, 0]);
				},

				translateY: function(ty){
					return _propValueToMatrix3dArr.translate([0, ty, 0]);
				},

				translateZ: function(tz){
					return _propValueToMatrix3dArr.translate([0, 0, tz]);
				},

				scale3d: function(s){
					return	[[+s[0], 0,     0,     0],
							 [0,     +s[1], 0,     0],
							 [0,     0,     +s[2], 0],
							 [0,     0,     0,     1]];
				},

				scale: function(s){
					s.push(1);
					return _propValueToMatrix3dArr.scale3d(s);
				},

				scaleX: function(sx){
					return _propValueToMatrix3dArr.scale([sx, 1, 1]);
				},

				scaleY: function(sy){
					return _propValueToMatrix3dArr.scale([1, sy, 1]);
				},

				scaleZ: function(sz){
					return _propValueToMatrix3dArr.scale([1, 1, sz]);
				},

				rotate3d: function(r){
					var x= r[0], y = r[1], z = r[2], a=r[3],
						sc=Math.sin(_degToRad((+a)/2))*Math.cos(_degToRad((+a)/2)),
						sq=Math.sin(_degToRad((+a)/2))*Math.sin(_degToRad((+a)/2));

					return	[[1-2*(y*y+z*z)*sq, 2*(x*y*sq-z*sc),  2*(x*z*sq+y*sc),  0],
							 [2*(x*y*sq+z*sc),  1-2*(x*x+z*z)*sq, 2*(y*z*sq-x*sc),  0],
							 [2*(x*z*sq-y*sc),  2*(y*z*sq+x*sc),  1-2*(y*y+x*x)*sq, 0],
							 [0, 				0, 				  0, 				1]];
				},

				rotate: function(r){
					return _propValueToMatrix3dArr.rotateZ(r);
				},

				rotateX: function(rx){
					return	_propValueToMatrix3dArr.rotate3d([1,0,0,rx]);
				},

				rotateY: function(ry){
					return	_propValueToMatrix3dArr.rotate3d([0,1,0,ry]);
				},

				rotateZ: function(rz){
					return	_propValueToMatrix3dArr.rotate3d([0,0,1,rz]);
				},

				skew: function(skx, sky){
					return	[[1,                         Math.tan(_degToRad(+skx)), 0, 0],
							 [Math.tan(_degToRad(+sky)), 1,                         0, 0],
							 [0,                         0,                         1, 0]
							 [0,                         0,                         0, 1]];
				},

				skewX: function(skx){
					return	[[1, Math.tan(_degToRad(+skx)), 0, 0],
							 [0, 1,                         0, 0],
							 [0, 0,                         1, 0],
							 [0, 0,                         0, 1]];
				},

				skewY: function(sky){
					return	[[1,                         0, 0, 0],
							 [Math.tan(_degToRad(+sky)), 1, 0, 0],
							 [0,                         0, 1, 0],
							 [0,                         0, 0, 1]];
				},

				matrix: function(matrix){
					return __matrixArr(matrix);
				},

				matrix3d: function(matrix3d){
					return __matrix3dArr(matrix3d);
				}		
			},

		//-------------------------------Basic----------------------------------//

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

		//Multiply matrix or vectors
		//@parameter Array (Matrix or Vector)
		//@return: Array | Number
		_dot = function(){
				var a = arguments[0], b = arguments[1],
					aDms = _getDms(a), bDms = _getDms(b),
					argLen = arguments.length;

				//multiply two vector
				//@parameter: Array a, Array b
				//@return: number
				function _dotVV(a, b){

					var result = 0, i = 0, 
						n = _getDms(a)[1];

					for(; i<n; i++) result += a[i]*b[i];

					return result;	
				}

				//multiply two matrix, or matrix and vector
				//@return: Array Multiplied matrix
				function _dotM(a, b){

					var row, column, i, 
						aDms = _getDms(a), bDms = _getDms(b),
						result = _newMatrix(aDms[0]);


					for( row=0; row < aDms[0]; row++ ){
						for( column = 0; column < aDms[0]; column++ ){
							for( i = 0; i < aDms[0]; i++ ){

								result[row][column] += 
									(a[row][i] ? a[row][i] : 0) * ( b[i][column] ? b[i][column] : 0);

							}

							//elinminate inaccuracy
							//eg. if rotate 45deg twice, result will be wrong without elinminating the very small error
							if(Math.abs(result[row][column]) < _elinmination){
								result[row][column] = 0;
							}
						}
					}


					return result;
				}

				//Handle vector dot
				if(_isMOrV(a) === 'vector' && _isMOrV(b) === 'vector' && aDms[1] === bDms[1]){
					return _dotVV(a, b);

				//Handle Matrix dot
				}else if(aDms[0] === bDms[1]){
					return _dotM(a, b);

				}else{
					throw new Error('Matrix multiply failed: _dot');
				}
				
			},

		//Examine a data is a 2d transform matrix or not
		//@parameter: * data to be examined
		//@return Boolean
		_isMatrixArr = function(a){
				return _isMOrV(a) === 'matrix' && _getDms(a)[0]=== 3 && _getDms(a)[1] === 3;
			},

		//Examine a data is a 3d transform matrix or not
		//@parameter: * data to be examined
		//@return Boolean
		_isMatrix3dArr = function(a){
				return _isMOrV(a) === 'matrix' && _getDms(a)[0]=== 4 && _getDms(a)[1] === 4;
			},

		_isVectorArr = function(a){
				return _getDms(a)[0] === 1 && _getDms(a)[1] === 6;
			},

		_isVector3dArr = function(a){
				return _getDms(a)[0] === 1 && _getDms(a)[1] === 16;
			},

		_isMatrixStr = function(a){
				return matrix_RE.exec(a) && a.match(float_RE).length === 6;
			},

		_isMatrix3dStr = function(a){
				//length is 17 because 3 in matrix3d() will also be matched
				return matrix3d_RE.exec(a) && a.match(float_RE).length === 17;
			},
		_is_ = function(a){
				if(_isArr(a)){
					if(_isMatrix3dArr(a)) return 'matrix3dArr';
					if(_isMatrixArr(a)) return 'matrixArr';
					if(_isVector3dArr(a)) return 'vector3dArr';
					if(_isVectorArr(a)) return 'vectorArr';
				}else if(typeof a ==='string'){
					if(_isMatrix3dStr(a)) return 'matrix3dStr';
					if(_isMatrixStr(a)) return 'matrixStr';
					if( a === 'none' ) return 'none';
				}else{
					return undefined;
				}
			},
		//Decompose transform directives string,
		//@parameters: String like 'translateX(40px) rotate(30deg)'
		//@return: Array ['translateX(40px)', 'rotate(30deg)']
		_splitPropsStr = function(input){
				return input.match(tfProp_RE);
			},


		//-------------------------------3dfy----------------------------------//

		//Turn a 2d transform matrix into a 3d transform matrix
		//@parameter: Array[3][3] 2d transform matrix
		//@return: Array[4][4] 3d transform matrix
		_matrixArr3dfy = function(m){
				if(!_isMatrixArr(TM)) 
					throw new Error('Input Error: _matrixArr3dfy');

				return [[m[0][0], m[0][1], 0, m[0][2]],
						[m[1][0], m[1][1], 0, m[1][2]],
						[0      , 0      , 1, 0      ],
						[0      , 0      , 0, 1      ]];
			},

		//Turn a 2d transform vector into a 3d transform vector
		//@parameter: Array[6] 2d vector
		//@return: Array[16] 3d vector
		_vectorArr3dfy = function(v){
				if(!(_isArr(v) && v.length === 6)) 
					throw new Error('Input Error: _matrixArr3dfy');

				return [
						v[0], v[1], 0, 0, 
						v[2], v[3], 0, 0, 
						0,    0,    1, 0,
						v[4], v[5], 0, 1
						];
			},

	//-------------------------------Types Interchange------------------------------//
		//@parameter: Array 3d vector
		//@return: Array 3d matrix
		_vector3dArr_matrix3dArr = function(input){
				return [
						[input[0], input[4], input[8] , input[12]], 
						[input[1], input[5], input[9] , input[13]], 
						[input[2], input[6], input[10], input[14]],
						[input[3], input[7], input[11], input[15]]
						];
			},
		_vectorArr_matrixArr = function(input){
				return [
						[input[0], input[2], input[4]], 
						[input[1], input[3], input[5]], 
						[0       , 0       , 1       ]
						];
			},
		//@parameter: Array 3d matrix
		//@return: Array 3d vector
		_matrix3dArr_vector3dArr = function(input){
				return [
						input[0][0], input[1][0], input[2][0], input[3][0], 
						input[0][1], input[1][1], input[2][1], input[3][1], 
						input[0][2], input[1][2], input[2][2], input[3][2],
						input[0][3], input[1][3], input[2][3], input[3][3]
						];
			},
		_matrixArr_vectorArr = function(input){
				return [
						input[0][0], input[1][0], input[2][0],
						input[0][1], input[1][1], input[2][1]
						];
			},

		//@parameters: Array (2d Vector|Matrix) | String
		//@return: Array[6] 2d vector
		__vectorArr = function(input){
				switch(_is_(input)){
					case 'matrixStr':
						return input.match(float_RE);

					case 'matrixArr':
						break;

					case 'vectorArr':
						return input;

					case 'none':
						input = _initMatrixArr.slice();
						break;

					default:
						throw new Error('__vectorArr can not handle: ' + input);
				}
				//Convert input into a 2d matrix array first


				return _matrixArr_vectorArr(input);
			},

		//@parameters: Array (2d|3d Vector|Matrix) | String
		//@return:Array[16] 3d vector
		__vector3dArr = function(input){

				switch(_is_(input)){
					case 'matrixStr':
						return _vectorArr3dfy( input.match(float_RE) );

					case 'matrix3dStr':
						return input.match(float_RE);

					case 'matrixArr':
						input = _matrixArr3dfy( input );
						break;

					case 'matrix3dArr':
						break;

					case 'vectorArr':
						return _vectorArr3dfy(input);

					case 'vector3dArr':
						return input;

					case 'none':
						return  _initVector3dArr.slice();

					default:
						throw new Error('__vector3dArr can not handle: ' + input);
				}

				return _matrix3dArr_vector3dArr(input);
			},

		__matrixArr = function(input){

				//Convert input into a vector array
				switch(_is_(input)){
					case 'matrixStr':
						input = input.match(float_RE);
						break;

					case 'matrixArr':
						return input;
					
					case 'vectorArr':
						break;

					case 'none':
						return  _initMatrixArr.slice();

					default:
						throw new Error('__matrixArr can not handle: ' + input);
				}
				
				//Input comes to here should be a vector array
				return _vectorArr_matrixArr(input);
			},

		__matrix3dArr = function(input){
			console.log(_is_(input));

				switch(_is_(input)){
					case 'matrixStr':
						input = _vectorArr3dfy( input.match(float_RE) );
						break;

					case 'matrix3dStr':
						input = input.match( float_RE );
						break;

					case 'matrixArr':
						return _matrixArr3dfy( input );

					case 'matrix3dArr':
						return input;

					case 'vectorArr':
						input = _vectorArr3dfy( input );
						break;

					case 'vector3dArr':
						break;

					case 'none':
						return  _initMatrix3dArr.slice();

					default:
						throw new Error('__matrix3dArr can not handle: ' + input);
				}

				//Input comes to here should be a 3d vector array
				return _vector3dArr_matrix3dArr(input);
			},
		
		//@return: String 'matrix(n{16})'
		__matrix3dStr = function(input){
				return "matrix3d(" + __vector3dArr(input).join(',') + ")";
			},

		//@return: String 'matrix(a,b,c,d,e,f)'
		__matrixStr = function(input){
				return "matrix(" + __vectorArr(input).join(',') + ")";
			},

		//Calculate a series of 3d transform,
		//@paratmer: String like 'translateX(40px) rotateX(30deg)'
		//@return: Array [4x4 Transform Matrix]
		_computeMatrix3dArr = function(input){
				var stack, i, l, type, value, output;

				if(_isMatrix3dArr(input)) return input;

				//Seperate each transform directive
				stack = ( typeof input === 'string' ) ? _splitPropsStr(input) : null;

				//If input is 'none' or something else
				if( !stack ) {

					if( input.match('none') ) {
						output = _initMatrix3dArr;
					}else{
						throw new Error('Input error _TfPropsTo2dTfMatrix: not a valid transform string')
					}
			
				//Turn input into matrix
				}else{
					//Handle each transform directive
					for( i = 0, l = stack.length; i<l; i++ ){
						//Get transform type and value
						type = stack[i].match( tfPropType_RE );
						value = stack[i].match( float_RE );

						//Translate transform directive into matrix
						//and multiply exist matrix by it
						output = output ? 
									_dot(output, _propValueToMatrix3dArr[type](value)) : 
									_propValueToMatrix3dArr[type](value);
					}
				}

				return output;
			};


	//-------------------------External APIs----------------------------------//

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
			var matrixStr;

			duration = duration || 0;

			//get matrix() string
			matrixStr = __matrix3dStr( _computeMatrix3dArr(input) );

			//set transform property for each element
			if(duration === 0){
				this.each(function (){
					this.style.webkitTransform = matrixStr;
					//firefox using Uppercase for first letter
					this.style.MozTransform = matrixStr;
					this.style.transform = matrixStr;
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
				__matrix3dArr( this.getTransform() ), _computeMatrix3dArr(input)
			));
		},

		insertTransform : function(input){
			this.setTransform( _dot(
				_computeMatrix3dArr(input), __matrix3dArr( this.getTransform() )
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
 * em compatibility
 * Transition & Animation
 *
 ****************************************/

