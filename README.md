tf.js
A lightweight JavaScript library for 2D transformations
Modify CSS transform properties through Transform Matrix Calculation

API:
----

**tf( String selector )**

Create a tf object using CSS Selectors

**tfObj.each( Function callback )**

Iterate elements in the tfObj, passing each element as the first argument of the callback function, and also set `this` to each element

**tfObj.transform( [String cssTransformProperty] )**

A getter & setter method will call either `setTranform` or `getTransform`

**tfObj.getTransform( [String cssTransformProperty] )**

Return an array contains transform property of each DOM element

**tfObj.setTransform( String cssTransformProperty )**

Set transform property for each element

**tfObj.addTransform( String cssTransformProperty )**
Apply the passed in transform before the transforms that elements already have

**tfObj.insertTransform( String cssTransformProperty )** 
Apply the passed in transform after the transforms that elements already have


Also, for each transform type below, there are some shorthand methods 
rotate | translate | translateX | translateY | scale | scaleX | scaleY | skew | skewX | skewY

For example:

`tfObj.rotate( 45 )` equals to `tfObj.setTransform('rotate(45deg)')` 
`tfObj.addTranslateX( 45 )` equals to `tfObj.addTransform('translateX(45px)')` 
`tfObj.insertScale( 1.2, 1.5 )` equals to `tfObj.insertTransform('scale(1.2, 1.5)')`


**tfObj2.learn(tfObj1), tfObj1.teach(tfObj2)**
Both two methods achieve the same result, make elements in tfObj2 have the same transform property with elements in tfOjb1








