const
profile = {
	raf6	: "0 0; .025 .26; .05 .44; .1 .64; .2 .81; .3 .86; .4 .85; .5 .82; .6 .74; .7 .61; .8 .65; .9 .23; 1 0"
}
.raf6
.split("; ").map(str => str.split(" ")),


Q = 200,	// angular speed, 1/s
V = 20,		// axial velocity, m/s
S = V / Q / 2 / Math.PI * 1000,	// step module, mm


R = 650,	// length, mm
H = 40,		// hub thickness, mm
h = 6,		// tip thickness, mm

W = 100,	// width, mm

alpha = 12 * Math.PI / 180, // incidence degrees to radians

thickness = r => h + (1-L/r) * H,
angle = r => alpha + Math.atan( S/r ),
width = r => W,
pos = r => null,


rotate = a => {
	const c=Math.cos(a), s=Math.sin(a);	
	return (...x,y) => [ c*x - s*y, s*x + c*y ]
},

scaleY = k => (...x,y) => [ x, y*k ],

scaleXY = k => (...x,y) => [ x*k, y*k ],

section = r => {
	const S = profile.map(scaleY(thick(r)));
	S.forEach(rotate(angle(r)));
	S.forEach(scaleXY( fit(r)/S[S.length-1][0] ));
},

sections = "25 50 75 100".split(" ").map(v => section(R*v*.01)),

svgs = sections.map( profile => {
	
	polyline = {};
	polyline.points = profile.map( point => point.join(" ") ).join(" ");
	
})