//Set css style
//3d compatibility
//em compatibility

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
		_noTransformTM = [[1,0,0],[0,1,0],[0,0,1]],
		//transform directives fragments
		_transforms = 'rotate|translate|translateX|translateY|scale|scaleX|scaleY|skew|skewX|skewY'.split('|'),
		_TDF = {
			r: 'rotate',
			t: 'translate',
			tx: 'translateX',
			ty: 'translateY',
			s: 'scale',
			sx: 'scaleX',
			sy: 'scaleY',
			sk: 'skew',
			skx: 'skewX',
			sky: 'skewY',
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
				skew: function(skx, sky){
					return	[[1, Math.tan(_dg2Rd(+skx)), 0],
							[Math.tan(_dg2Rd(+sky)), 1, 0],
							[0, 0, 1]];
				},
				skewX: function(skx){
					return	[[1, Math.tan(_dg2Rd(+skx)), 0],
							[0, 1, 0],
							[0, 0, 1]];
				},
				skewY: function(sky){
					return	[[1, 0, 0],
							[Math.tan(_dg2Rd(+sky)), 1, 0],
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

	function _toTDMatrixVector(input){
		if(_isArr(input)){
			//return if input is already a 6 vector
			if(_getDms(input)[0] === 1 && _getDms(input)[1] === 6) 
				return input;

			//throw error, if its not a 2d transform matrix
			if(!_is2dTM(input))
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


		insertTransform : function(input){
			this.setTransform( _dot(
				_to2dTM(input), _to2dTM( this.getTransform() )
			));
		},

		//Shortcuts for 2d translates inserttransforms
		insertRotate: function(r){
			this.insertTransform(_TDF.r + _TDF.LB + r + _TDF.deg + _TDF.RB);
		},
		//Shortcuts for 2d translates inserttransforms
		insertTranslate: function(tx, ty){
			//handle argument [tx, ty]
			if(_isArr(t)) {
				ty = tx[1];
				tx = tx[0];
			}
			this.insertTransform(_TDF.t + _TDF.LB + 
								tx + _TDF.px + _TDF.CM + 
								ty + _TDF.px + 
								_TDF.RB);
		},
		insertTranslateX: function(tx){
			this.insertTranslate(tx, 0);
		},
		insertTranslateY: function(ty){
			this.insertTranslate(0, ty);
		},
		//Shortcuts for 2d scales inserttransforms
		insertScale: function(sx, sy){
			//handle argument [sx, sy]
			if(_isArr(sx)) {
				sy = sx[1];
				sx = sx[0];
			}
			this.insertTransform(_TDF.s + _TDF.LB + 
								sx + _TDF.px + _TDF.CM + 
								sy + _TDF.px + 
								_TDF.RB);
		},
		insertScaleX: function(sx){
			this.insertScale(sx, 0);
		},
		insertScaleY: function(sy){
			this.insertScale(0, sy);
		},
		//Shortcuts for 2d scales inserttransforms
		insertSkew: function(skx, sky){
			//handle argument [skx, sky]
			if(_isArr(skx)) {
				sky = skx[1];
				skx = skx[0];
			}
			this.insertTransform(_TDF.sk + _TDF.LB + 
								skx + _TDF.deg + _TDF.CM + 
								sky + _TDF.deg + 
								_TDF.RB);
		},
		insertSkewX: function(skx){
			this.insertSkew(skx, 0);
		},
		insertSkewY: function(sky){
			this.insertSkew(0, sky);
		},

		//@parameter: String like 'rotate( 45deg ) transform(100px, 32px)'
		addTransform: function(input){
			console.log(_dot(
				_to2dTM( this.getTransform() ), _to2dTM(input)
			));
			this.setTransform( _dot(
				_to2dTM( this.getTransform() ), _to2dTM(input)
			));
		},
		//Shortcuts for 2d translates addtransforms
		addRotate: function(r){
			this.addTransform(_TDF.r + _TDF.LB + r + _TDF.deg + _TDF.RB);
		},
		//Shortcuts for 2d translates addtransforms
		addTranslate: function(tx, ty){
			//handle argument [tx, ty]
			if(_isArr(t)) {
				ty = tx[1];
				tx = tx[0];
			}
			this.addTransform(_TDF.t + _TDF.LB + 
								tx + _TDF.px + _TDF.CM + 
								ty + _TDF.px + 
								_TDF.RB);
		},
		addTranslateX: function(tx){
			this.addTranslate(tx, 0);
		},
		addTranslateY: function(ty){
			this.addTranslate(0, ty);
		},
		//Shortcuts for 2d scales addtransforms
		addScale: function(sx, sy){
			//handle argument [sx, sy]
			if(_isArr(sx)) {
				sy = sx[1];
				sx = sx[0];
			}
			this.addTransform(_TDF.s + _TDF.LB + 
								sx + _TDF.px + _TDF.CM + 
								sy + _TDF.px + 
								_TDF.RB);
		},
		addScaleX: function(sx){
			this.addScale(sx, 0);
		},
		addScaleY: function(sy){
			this.addScale(0, sy);
		},
		//Shortcuts for 2d scales addtransforms
		addSkew: function(skx, sky){
			//handle argument [skx, sky]
			if(_isArr(skx)) {
				sky = skx[1];
				skx = skx[0];
			}
			this.addTransform(_TDF.sk + _TDF.LB + 
								skx + _TDF.deg + _TDF.CM + 
								sky + _TDF.deg + 
								_TDF.RB);
		},
		addSkewX: function(skx){
			this.addSkew(skx, 0);
		},
		addSkewY: function(sky){
			this.addSkew(0, sky);
		},

		learn : function(teacher){
			return this.setTransform( teacher.getTransform() );
		},

		teach : function(learner){
			learner.setTransform( this.getTransform() );
			return this;
		},
	}
	
})();