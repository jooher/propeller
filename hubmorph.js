const hubmorph = (HR,HY) => {
	
	const HR2=HR*HR;
	
	return p =>{
	
		const hz = Math.sqrt( HR2 - p.x*p.x ),
			dz = p.z - hz,
			dy = HY - p.y,
			r = (dz*dz + dy*dy)/dy/2;

		return {
			x	:p.x,
			y	:p.y+r,
			r	:r,
			a	:Math.acos(dz/r)
		};
	}
}