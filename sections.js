const propeller = ({S,alpha,W,H,h,F}) =>{

	const
	profile = {
/*
		raf6p	: "0 0; .0 .05; .025 .26; .05 .44; .1 .64; .2 .81; .3 .86; .4 .85; .5 .82; .6 .74; .7 .61; .8 .45; .9 .23; 1 0",		
		raf6s : "0 0; 0 .1; .08 1; .52 1; 1 0",
		raf6c	: "0 0; 0 .1; .05 .3; .3 .9; .6 .75; 1 0",
*/		
		raf6	: "0 0; 0 .3; .10 1; .30 1; .50 1; .75 .7; 1 0" // cubic bezier
	}
	.raf6
	.split("; ").map(str => str.split(" ")),

/*
	S = .S,
	alpha = setup.alpha,
	
	
	W = setup.W || 100,	// width, mm
	H = setup.H || 22,	// hub thickness, mm
	h = setup.h || 3,		// tip thickness, mm
*/
	
	thick = r => h + (1-Math.pow(r,.5)) * H,
	angle = r => alpha + Math.atan( S/r ),
	lobe	= r => F+W/2,

	scaleY = k => ([x,y]) => [ x*W, y*k ],
	scaleXY = k => ([x,y]) => [ x*k, y*k ],
	rotate = a => ((c,s) => ([x,y]) => [ c*x - s*y, s*x + c*y ]	)(Math.cos(a),Math.sin(a)),
	moveX = (t,a) => ([x,y]) => [x-t,y+a];

	return r => profile
		.map(scaleY(thick(r)))
		.map(rotate(-angle(r)))
		.map(moveX(lobe(r),0));
		//.map(extrude(r));
		//.map(scaleXY(W/S[S.length-1][0]));

};