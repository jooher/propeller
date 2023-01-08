const

el = id => document.getElementById(id),
num	= n => Math.round(n*100)/100,
d2r	= degrees => degrees * Math.PI / 180

Q = 200,	// angular speed, 1/s
V = 20,	// axial velocity, m/s
R = 650,	// length, mm

S = V * 1000 / Q / R / 2 / Math.PI,	// step module, mm/mm
alpha = d2r(12), // incidence

W = 100,	// width, mm
H = 20,	// root thickness, mm
h = 6,	// tip thickness, mm

section = propeller({ S, alpha, W, H, h, F:0 }),

rootAngle = d2r(18),
hubShare = S/Math.tan(rootAngle-alpha), // dead blade

bladeTip = R,
bladeRoot = R*hubShare,

hubHeight = 50,
hubRadius = 60,
hubR2 = hubRadius*hubRadius,

morph = (p,stump) =>{
	const 
	dx = Math.sqrt( hubR2 - p.x*p.x ) - bladeRoot, // from blade to hub
	dy = stump - p.y, // from blade to hub
	r = (dx*dx + dy*dy)/dy/2,
	a = Math.asin(-dx/r);
		
	return {dx,dy,r,a, cx:bladeRoot, cy:p.y+r};
},

fromPoints = {

	fromBeziers	: (points,n) => Array
			.from({length:points.length/3})
			.map( (v,i) => 
				new THREE.CubicBezierCurve( ...points.slice(i*3,i*3+4).map( p => new THREE.Vector2( ...p )) ).getPoints(n||5) 
		).flat(),
		
	fromSpline	: (points,n) => 
			new THREE.SplineCurve(points.map ( p => new THREE.Vector2(...p)) ).getPoints(n||20)

}.fromBeziers;
	
let

bladeShare = 1.0 - hubShare,
percents = [hubShare, 1.0],//Array.from({length:count}).map((v,i)=>hubShare+(i+1)*bladeShare/count),
sections = percents.map( percent => fromPoints(section(percent))),
rootClimb = - sections.at(0).at(-1).y,

stumpBack = 2,
stumpFront = hubHeight - stumpBack - rootClimb
;
	
const
	
three = target => {
			
	const	

	lineMaterial = new THREE.LineBasicMaterial( { color: 0x0000ff } ),
	chordMaterial = new THREE.LineBasicMaterial( { color: 0x000088 } ),
	//phongMaterial = new THREE.MeshPhongMaterial( { color: 0x666688 } ),

	// aCube = size => new THREE.Mesh( new THREE.BoxGeometry( size, size, size ), phongMaterial ),

	longitudal = (a,b) => 
		a.map( (p,i) => [ new THREE.Vector3( bladeRoot, ...p), new THREE.Vector3( bladeTip,...b[i])] ),


	hubL = p =>[
		p,
		new THREE.Vector3(
			p.x,
			hubHeight,
			Math.sqrt(hubR2-p.x*p.x)
		)
	],

	hubR = (p,stump) => {
			const {dx,dy,r,a,cx,cy} = morph(p,stump),			
				points = new THREE.EllipseCurve( cx, cy, r, r, 3*Math.PI/2-a, 3*Math.PI/2).getPoints();
				
			return points.map( c => new THREE.Vector3(c.x,p.x,c.y) );

	},

	aPropeller = R => {

		const 
			
			model = new THREE.Group(),
			blade = new THREE.Group(),
			hub	= new THREE.Group();
		

		//lat
		blade.add( ...sections.map( (s,i) => new THREE.LineLoop( 
			new THREE.BufferGeometry().setFromPoints(
				s.map( ([x,y]) => new THREE.Vector3( percents[i]*R,x,y) )
			)
			,lineMaterial
		)));

		//lon
		blade.add( 
			...longitudal(fromPoints(section(hubShare)),fromPoints((section(1))))
			.map( l =>
				new THREE.Line(
					new THREE.BufferGeometry().setFromPoints(l)
					,lineMaterial
				)
			)
		);
		
				
		//hub
		blade.add(...fromPoints(section(hubShare))
			.map( p =>  new THREE.Line(
				new THREE.BufferGeometry().setFromPoints(hubR(p,stumpFront))
				,lineMaterial
			))
		);
/*		
*/		
		
		model.add(
			hub,
			blade,
			blade.clone()
		);
		
		blade.rotation.z+=Math.PI;
		
		return model;
		
	};
			
	const
		scene = new THREE.Scene(),
		renderer = new THREE.WebGLRenderer(),
		observer = new THREE.Group(),
		
		width = target.clientWidth,
		height = target.clientHeight
		camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 100000 );
		
	// lights
	const
		ambLight = new THREE.HemisphereLight( 0xaaaaff, 0x002200, .75 ),
		dirLight = new THREE.DirectionalLight( 0xffffff, 0.75 ),
		aProp = aPropeller(R);

	renderer.setSize( width, height );
	target.appendChild( renderer.domElement );



	camera.position.set( 0, 0, 1000 );
	camera.lookAt( 0, 0, 0 );

	dirLight.position.set( 50, 50, 100 );
	dirLight.lookAt( 0, 0, 0 );

	observer.add(camera,dirLight);

	scene.add( 
		aProp,
		ambLight,
		observer
	);

	/*
	function animate() {
		requestAnimationFrame( animate );
	}
	animate();
	*/

	renderer.render( scene, camera );


	target.addEventListener("mousemove", e => {
		if (!e.buttons) return;
		aProp.rotation.z += e.movementX*0.005;
		aProp.rotation.x += e.movementY*0.005;
		renderer.render( scene, camera );
	});

	target.addEventListener("wheel", e => {
		camera.zoom += camera.zoom * e.deltaY*.0005 ;
		camera.updateProjectionMatrix();
		renderer.render( scene, camera );
	});

};


const

gcode = ( params => {

	const	
	
	feeds=`
#<_raw> = 2400
#<_fine> = 1200
`,

	epilog =`
G53 G0 Z0
M2`,

	
	clearance = 2, //raw pass clearance
	ballR = 4,	//mill ball radius
	ballRC = ballR+clearance,
	prec = 50,
	
	
	root	= fromPoints(section(hubShare),prec),
	tip	= fromPoints((section(1)),prec),
	
	O	= n => a => "O"+n+" CALL	" + a.map( n => "["+num(n)+"]" ).join("")
	
	chord = s => {
		const a = s.at(0),
			b = s.at(-1),
			n = s.length-1,
			dx = (b.x-a.x)/n,
			dy = (b.y-a.y)/n;
			
		return s.map((p,i)=>({
			x: a.x+dx*i,
			y: a.y+dy*i
		}))
	},
	
	clinch = s =>{
		
		const 
		a = s.at(0),
		b = s.at(-1),
		w = b.x-a.x,
		h = b.y-a.y,
		l = Math.sqrt(w*w+h*h),
		t = H*l/w,
		Oy = (a.y+b.y-t)/2,
		up = stumpBack+rootClimb+t+ballR,
		p = chord(s).reverse().map( ({x,y}) => [x, up+((x<ballR||y<Oy) ? y : (Oy+Oy-y))] );
		
		console.log("Root angle "+num(Math.atan(h/w)*180/Math.PI));
		
		return [`
#<_span>=${num(bladeRoot)}
#<_rough>=${clearance}

${feeds}


O1	SUB (x=>Y,y=>Z)

F#<_raw>
G1	Y#1 Z[#2+#<_rough>]
	X[#<_span>]
	
F#<_fine>
G1	Z#2
	X[-#<_span>]
	
O1	ENDSUB

`,	
			...p.map(O(1)),			
`
G0	Z100
	X0
`,
			O(1)([ballR,up+Oy-t/2+ballR/2]),
`G1	Z${num(up+Oy-t/2)}
	X0
`,
			epilog
		
		].join("\n");

	},
/*
*/	
	
	face = (root,tip,stump) => [
`	
#<_stumpZ>=${num(stump)}
#<_hubHeight>=${hubHeight}	
#<_bladeRoot>=${bladeRoot}
#<_bladeTip>=${bladeTip}
#<_ballR>=${ballR}
#<_ballRC>=${ballRC}

${feeds}

G18 T1

G53G0 Z0
G1 X0Y0Z[#<_hubHeight>+50]
G92 Z[#<_stumpZ>+50]

O2	SUB	( [#<hX>][#<hY>][#<rZ>][#<R>][#<tY>][#<tZ>] ) 
	G0	X#1 Y#2 Z[#<_stumpZ>+#<_ballRC>]
	F#<_raw>
	G2	X#<_bladeRoot> Z[#3+#<_ballRC>] R#4
	G1	X#<_bladeTip> Y#5 Z[#6+#<_ballRC>]
	F#<_fine>
	G1	Z[#6+#<_ballR>]
	G1	X#<_bladeRoot> Y#2 Z[#3+#<_ballR>]
	G3	X#1 Z[#<_stumpZ>+#<_ballR>] R#4
O2	ENDSUB

`	,
	
	...root.map ( (s,i) => {
	
		const rs = root[i],
			ts = tip[i],
			{dx,dy,r,a,cx,cy} = morph(rs,stump),
			rx = rs.x,
			ry = rs.y,
			tx = ts.x,
			ty = ts.y
			;
			
			return O(2)([ bladeRoot+dx, rx, ry, r, tx, ty ]);
		}
	),
	
	epilog
	
	].join("\n");
	
	return {
		clinch: clinch(root),
		front	: face(root,tip,stumpFront),
		back	: face(chord(root),chord(tip),stumpBack)
	}
})();


const

plan = svg => {
	proto = svg.removeChild(svg.firstElementChild),
	xy = ([x,y,z]) => x+" "+y;
		
	sections.forEach( section => {
		const	shape = proto.cloneNode();
		shape.setAttribute("points", section.map( xy ).join(" ")); //.setAttribute("d", "M "+ xy(section.shift()) + " C "+section.map( xy ).join(" ")); //
		return svg.appendChild(shape);
	} );
};