const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const horizontalCells = 8;
const verticalCells = 6;

const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / horizontalCells;
const unitLengthY = height / verticalCells

const engine = Engine.create();
const { world } = engine;
engine.world.gravity.y = 0;
const render = Render.create({
	element : document.body,
	engine  : engine,
	options : {
		wireframes : false,
		width,
		height
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze generation
const shuffle = (arr) => {
	let counter = arr.length;

	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp
	}
		return arr;
}

const grid = Array(verticalCells).fill(null).map(() => Array(horizontalCells).fill(false))

const verticals = Array(verticalCells).fill(null).map(() => Array(horizontalCells - 1).fill(false))
const horizontals = Array(verticalCells - 1).fill(null).map(() => Array(horizontalCells).fill(false))

const startRow = Math.floor(Math.random() * verticalCells)
const startColumn = Math.floor(Math.random() * horizontalCells)
const eachCell = ((row, column) => {
	// If I have visited the cell at [row, column], then return
	if (grid[row][column]) {
		return;
	}
	// Mark this cell as being visited
	grid[row][column] = true;
	// Assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[row -1, column, 'above'],
		[row, column + 1, 'right'],
		[row + 1, column, 'down'],
		[row, column - 1, 'left']
	]);
	// For each neighbor... 
	for (let neighbor of neighbors) {
		const [nextRow, nextColumn, direction] = neighbor;
	// See if that neighbor is out of bounds
		if (nextRow < 0 || nextRow >= verticalCells|| 
			nextColumn < 0 || nextColumn >= horizontalCells){
			continue;
		}
	// If we have visited that neighbor, continue to next neighbor
		if (grid[nextRow][nextColumn]) continue;
	// Remove a wall from either horizontals or verticals 
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} if (direction === 'above') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
	// Visit next cell 
		eachCell(nextRow, nextColumn);
	}
});

eachCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			5,
			{isStatic: true,
			 label: 'wall',
			 render: {
				 fillStyle: 'black'
			 }
			}
		);
		World.add(world, wall);
	});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) return;

		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			5,
			unitLengthY,
			{isStatic: true,
			 label: 'wall',
			 render: {
				 fillStyle: 'black'
			 }
			}
		);
		World.add(world,wall)
		});
	});
});

const goal = Bodies.rectangle(
	width - unitLengthX /2,
	height - unitLengthY / 2,
	unitLengthX * .7,
	unitLengthY * .7,
	{isStatic: true,
		label: 'goal',
		render: {
			fillStyle: 'white'
		}
	}
);
World.add(world, goal);

const ballRadius = Math.min(unitLengthX, unitLengthY) * .3;
const ball = Bodies.circle(
	unitLengthX / 2,
	unitLengthY / 2,
	ballRadius,
	{label: 'ball',
	 render: {
		 fillStyle: 'orange'
	 }
	}
);
World.add(world, ball);

document.addEventListener('keydown', (event) => {
	const { x , y } = ball.velocity;
	if (event.keyCode === 87 || event.key === 'ArrowUp') {
		Body.setVelocity(ball, { x, y: y - 5});
	};
	if (event.keyCode === 68 || event.key === 'ArrowRight') { 
		Body.setVelocity(ball, { x: x + 5, y });
	};
	if (event.keyCode === 83 || event.key === 'ArrowDown') { 
		Body.setVelocity(ball, { x, y: y + 5});
	};
	if (event.keyCode === 65 || event.key === 'ArrowLeft') { 
		Body.setVelocity(ball, { x: x - 5, y });

	};
});

// Prevent the arrow keys to move the browser
window.addEventListener("keydown", (event) => {
    if([ 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
        event.preventDefault();
    }
}, false);

// Win Condition
Events.on(engine, 'collisionStart', event => {
	event.pairs.forEach((collision) => {
		const labels = ['ball', 'goal'];
		if (labels.includes(collision.bodyA.label) && 
				labels.includes(collision.bodyB.label)) {						
					world.gravity.y = 1;
					document.querySelector('.winner').classList.remove('hidden');
					window.addEventListener('keypress', (event) => {
						if (event.keyCode === 32) {
						location.reload();
						};
					});
					world.bodies.forEach(body => {
						if (body.label === 'wall') {
							Body.setStatic(body, false);
						};
					});
		};
	});
});
