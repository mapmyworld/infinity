
var MAP_BASE = '';
//var MAP_BASE = 'http://localhost:8080';

var mapId = '/id';

//mmw._common.setType('demo');
//mmw._common.setType('none');

var map = mmw.map;

var headerEl = mmw._overlay.headerEl;
var rightheaderEl = mmw._overlay.rightheaderEl;
var rightbarEl = mmw._overlay.rightbarEl;
var bottombarEl = mmw._overlay.bottombarEl;

function animateLogoAlongLine(coordinates) {
	if(coordinates.length < 2) return;

	const screenPoints = [];
	let distances = [];
	let totalDistance = 0;
	function updateScreenPath() {
		screenPoints.length = 0;
		distances = [0];
		totalDistance = 0;
		coordinates.forEach(coordinate => {
			const point = map.project(coordinate);
			screenPoints.push([point.x, point.y]);
		});
		for(let i = 1; i < screenPoints.length; i++) {
			const [previousX, previousY] = screenPoints[i - 1];
			const [x, y] = screenPoints[i];
			totalDistance += Math.hypot(x - previousX, y - previousY);
			distances.push(totalDistance);
		}
	}
	updateScreenPath();
	map.on('move', updateScreenPath);
	map.on('resize', updateScreenPath);
	if(totalDistance === 0) return;

	const logo = headerEl.children[0];
	const duration = 8000;
	let startTime;
	let lastX = 0, lastY = 0;
	function animate(timestamp) {
		if(startTime === undefined) startTime = timestamp;
		const distance = ((timestamp - startTime) % duration) / duration * totalDistance;
		let segment = 1;
		while(segment < distances.length - 1 && distances[segment] < distance) segment++;
		const segmentStart = distances[segment - 1];
		const segmentLength = distances[segment] - segmentStart;
		const progress = segmentLength ? (distance - segmentStart) / segmentLength : 0;
		const [startX, startY] = screenPoints[segment - 1];
		const [endX, endY] = screenPoints[segment];
		// Layout origin = current rect minus the transform applied last frame.
		const logoRect = logo.getBoundingClientRect();
		const mapRect = map.getContainer().getBoundingClientRect();
		const originX = logoRect.left - lastX - mapRect.left;
		const originY = logoRect.top - lastY - mapRect.top;
		const x = startX + (endX - startX) * progress - originX - logoRect.width / 2;
		const y = startY + (endY - startY) * progress - originY - logoRect.height / 2;
		lastX = x;
		lastY = y;
		logo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
		requestAnimationFrame(animate);
	}
	requestAnimationFrame(animate);
}

async function drawInfinity() {
		const response = await fetch(new URL('./infinity.topo.json', window.location.href).href);
		const topology = await response.json();
		const lines = topojson.feature(topology, topology.objects.lines);
		map.addSource('infinity', { type: 'geojson', data: lines });
		map.addLayer(newLineLayer('infinity','red', 2));
		animateLogoAlongLine(lines.features[0].geometry.coordinates);
}

if (map.isStyleLoaded()) {
	drawInfinity();
} else {
	map.once('load', drawInfinity);
}