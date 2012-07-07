function Reversibility(){
	this.dataHandler = new DataHandler();
	this.data = {};
	this.data.t = [];
	this.data.pInt = [];
	this.data.pExt = [];
	this.data.v = [];
	this.data.e = [];
	this.eUnits = 'kJ';
	this.bgCol = Col(5, 17, 26);
	this.wallCol = Col(255,255,255);
	this.numUpdates = 0;
	walls = new WallHandler([[P(40,75), P(510,75), P(510,440), P(40,440)]])
	
	this.extPressurePts = [walls.pts[0][0], walls.pts[0][1]];
	this.SAPExt = getLen(this.extPressurePts);
	this.forceInternal = 0;
	this.wallV = 0;
	this.updateListeners = {listeners:{}, save:{}};
	this.dataListeners = {listeners:{}, save:{}};
	this.wallImpactListeners = {listeners:{}, save:{}};
	this.dotImpactListeners = {listeners:{}, save:{}};
	this.mousedownListeners = {listeners:{}, save:{}};
	this.mouseupListeners = {listeners:{}, save:{}};
	this.mousemoveListeners = {listeners:{}, save:{}};
	this.resetListeners = {listeners:{}, save:{}};
	this.initListeners = {listeners:{}, save:{}};
	this.readout = new Readout(15, myCanvas.width-130, 25, '13pt calibri', Col(255,255,255), this);
	this.graphs = {}
	this.promptIdx = -1;
	this.curBlock=-1;
	this.prompts=[
		{block:0, title: "Current step", 		text:"Okay, let�s get oriented!  Here we have a container filled with a gas that follows the <a href = http://en.wikipedia.org/wiki/Hard_spheres>hard sphere model</a>, which is like the ideal gas model but the molecules take up some space.  There are some weights in bins below the container.  You can drag the weights on top of or off of the container to compress or expand it."},
		{block:0, title: "Current step", 		text:"Imagine that the energy to lift a block comes from a battery.  When lifting a block, the battery is drained.  When dropping a block, the battery is replenished.  The energy changes correspond to the potential energies gained or lost by the block.  This energy is shown in the E Added dialog.  In a reversible cycle, you could compress and expand as long as you like and the battery will always have the same amount of charge at given volume.  In an irreversible cycle, your battery will gradually drain and the system will gradually gain energy.  Take a minute now to figure out how everything works. "},
		{block:1,  title: "Current step", 		text:"Say you want to compress this container but you only have a couple of big blocks.  Try it.  You�ll notice you have to put a lot of energy into lifting those.  Make a note of that amount for later.  Now for the compression to be reversible, you need to be able to get all of that energy back out of the system for a net work of zero.  Do you think that�s possible?  Test your idea!  What does this say about the reversibility of the process?"},
		{block:1,  title: "Current step",		text:"Hopefully you found that with the large blocks, you couldn�t get all of the energy back out, making this an <i>irreversible</i> compression and expansion cycle.  From the graphs, I think there are two ways we can verify of this.  What might they be?"},
		{block:2,  title: "Current step", 		text:"Each bin has the same total weight in it.  Try to compress the container with one bin�s worth of weight, but using less energy than you did to compress with the largest blocks."},
		{block:2, title: "Current step",		text:"If you found a way, why did it take less energy this time?  If you didn�t, try harder.  This is a key question to understanding reversibility, so give it some thought.  Thinking about potential energy may be helpful."},
		{block:2,  title: "Current step",		text:"If you take all of the weight back off, how does the total energy added in this cycle compare to the energy added in the cycle using the big blocks?  Why is it different?"},
		{block:3,  title: "Current step",		text:"Now that you�ve found a way to add less energy than you had to with the big blocks, try to compress with one bin�s worth of weight using the <i>least</i> energy that you can.  You may have done this in the previous experiment.  If you did, well done, but do verify that you did by trying something else."},
		{block:3, title: "Current step", 		text:"If you take all of the weight back off, how does the total energy added in <i>this</i> cycle compare to the energy added in the cycle using the big blocks.  Also, consider the pressure vs. volume graph.  Looks less �steppy�, doesn�t it?  How might we relate this to the condition for reversibility, P<sub>int</sub> = P<sub>ext</sub>?"},
	]
	
	this.g = 1.75;
	this.dragWeights = this.makeDragWeights();
	this.mass = function(){return this.dragWeights.pistonMass};
	//this.heater = new Heater(heaterX, heaterY, heaterWidth, heaterHeight, 50, 300)
	walls.setup();
	var self = this;
	this.workTracker = new WorkTracker(function(){return walls.area(0)},
										function(){return self.mass()},
										function(){return self.g},
										function(){return getLen([walls.pts[0][0], walls.pts[0][1]])},
										{readout:this.readout, idx:1},
										this
										)
	this.minY = 60;
	this.maxY = walls.pts[0][2].y-75;
	addSpecies(['spc1', 'spc3']);
	collide.setup();
	addListener(this, 'update', 'run', this.updateRun, this);
	addListener(this, 'data', 'run', this.dataRun, this);
	addListener(this, 'wallImpact', 'moving', this.onWallImpact, this);
	addListener(this, 'dotImpact', 'std', collide.impactStd, collide);

}

Reversibility.prototype = {
	init: function(){
		this.addDots();
		this.hideDash();
		this.hideText();
		this.hideBase();
		this.startIntro();
		for (var initListenerName in this.initListeners.listeners){
			var func = this.initListeners.listeners[initListenerName].func;
			var obj = this.initListeners.listeners[initListenerName].obj;
			func.apply(obj);
		}
		var self = this;
		this.graphs.pVSv = new GraphScatter('pVSv', 400,300, "Volume (L)", "Pressure (atm)",
							{x:{min:0, step:4}, y:{min:0, step:3}});
		this.graphs.tVSv = new GraphScatter('tVSv', 400, 300,"Volume (L)", "Temperature (K)",
							{x:{min:0, step:4}, y:{min:200, step:60}});
		this.graphs.pVSv.addSet('pInt', 'P Int.', Col(0,0,255), Col(200,200,255),
								{data:this.data, x:'v', y:'pInt'});
		this.graphs.pVSv.addSet('pExt', 'P Ext.', Col(0,255,0), Col(200,255,200),
								{data:this.data, x:'v', y:'pExt'});
		this.graphs.tVSv.addSet('t', 'Sys\nTemp', Col(255,0,0), Col(255,200,200),
								{data:this.data, x:'v', y:'t'});		
		
		
		$('#myCanvas').show();
		
	},
	startIntro: function(){
		var ptsToBorder = this.getPtsToBorder();
		border(ptsToBorder, 5, this.wallCol.copy().adjust(-100,-100,-100), 'container', c);
		saveListener(this, 'update');
		saveListener(this, 'data');
		saveListener(this, 'wallImpact');
		saveListener(this, 'dotImpact');
		emptyListener(this, "update");
		emptyListener(this, "data");
		this.hideDash();
		this.hideText();
		this.hideBase();
		$('#canvasDiv').hide()
		$('#graphs').hide()
		$('#display').show();
		$('#textIntro').show();
		$('#dashIntro').show();
		
		
	},
	block0Start: function(){
		this.addDots();

		this.numUpdates = 0;
		walls = undefined;
		walls = new WallHandler([[P(40,75), P(510,75), P(510,440), P(40,440)]])
		walls.setup();
		this.extPressurePts = [walls.pts[0][0], walls.pts[0][1]];
		this.forceInternal = 0;
		for (resetListenerName in this.resetListeners.listeners){
			var func = this.resetListeners.listeners[resetListenerName].func;
			var obj = this.resetListeners.listeners[resetListenerName].obj;
			func.apply(obj);
		}	
		//HEY - RESET HAPPENS TWICE (here and 
		this.readout.show();
	},	
	block1Start: function(){this.block0Start();},	
	block2Start: function(){this.block0Start();},
	block3Start: function(){this.block0Start();},
	startSim: function(){

		this.hideDash();
		this.hideText();
		$('#graphs').show()
		$('#canvasDiv').show()
		$('#display').hide();
		$('#dashRun').show();
		$('#base').show();
		loadListener(this, 'update');
		loadListener(this, 'data');		
		loadListener(this, 'wallImpact');
		loadListener(this, 'dotImpact');
		
		
		
	},
	startOutro: function(){
		saveListener(this, 'update');
		saveListener(this, 'data');
		emptyListener(this, 'update');
		emptyListener(this, 'data');
		this.hideDash();
		this.hideText();
		this.hideBase();
		$('#canvasDiv').hide()
		$('#display').show();
		$('#textOutro').show();	
		$('#dashOutro').show();

	},
	toSim: function(){
		this.startSim();
		nextPrompt();
	},
	backToSim: function(){
		this.promptIdx = this.prompts.length-1;
		this.hideDash();
		this.hideText();
		$('#graphs').show()
		$('#canvasDiv').show()
		$('#display').hide();
		$('#dashRun').show();
		$('#base').show();	
		loadListener(this, 'update');
		loadListener(this, 'data');
	},
	getPtsToBorder: function(){
		var pts = [];
		var wallPts = walls.pts[0];
		pts.push(wallPts[1].copy().position({y:this.minY}))
		pts.push(wallPts[2].copy());
		pts.push(wallPts[3].copy());
		pts.push(wallPts[4].copy().position({y:this.minY}));
		return pts;
	},
	makeDragWeights: function(){
		var dragWeights = new DragWeights([{name:'sml', count:12, mass:5}, 
									{name:'med', count:6, mass:10}, 
									{name:'lrg', count:2, mass:30}
									],
									walls.pts[0][2].y,
									function(){return walls.pts[0][0].y},
									myCanvas.height-15,
									20,
									Col(218, 187, 41),
									Col(150, 150, 150),
									function(){return curLevel.g},
									25,
									this.readout,
									this
									);
		return dragWeights;
	},
	update: function(){
		this.numUpdates++;
		for (var updateListener in this.updateListeners.listeners){
			var listener = this.updateListeners.listeners[updateListener]
			listener.func.apply(listener.obj);
		}
	},
	addData: function(){
		for (var dataListener in this.dataListeners.listeners){
			var listener = this.dataListeners.listeners[dataListener];
			listener.func.apply(listener.obj);
		}
		this.numUpdates = 0;
	},
	updateRun: function(){
		move();
		this.moveWalls();
		this.addGravity();	
		this.checkDotHits(); 
		this.checkWallHits();
		this.dragWeights.moveWeightsOnPiston();
		this.drawRun();
	},
	addGravity: function(){
		this.wallV += this.g;
	},
	drawRun: function(){
		draw.clear(this.bgCol);
		draw.dots();
		draw.walls(walls, this.wallCol);
		//draw.fillPts(walls.pts[1], this.heater.col, c);
		this.dragWeights.draw();
	},
	checkDotHits: function(){
		collide.check();
	},
	checkWallHits: function(){
		walls.check();
	},
	onWallImpact: function(dot, line, wallUV, perpV){
		/*
		To dampen wall speed , doing:
		1 = dot
		2 = wall
		m1vo1^2 + m2vo2^2 = m1v1^2 + m2v2^2
		m1vo1 + m2vo2 = m1v1 + A*m2v2
		where A = (abs(wallV)+1)^(const, maybe .1 to .3)
		leads to
		a = m1 + m1^2/(A^2m2)
		b = -2*vo1*m1^2/(A^2m2) - 2*vo2*m1/A^2
		c = m1^2*vo1^2/(A^2*m2) + 2*m1*vo2*vo1/A^2 + m2*(vo2/A)^2 - m1*vo1^2 - m2*vo2^2
		I recommend grouping squared terms in each block for faster computation
		v1 = (-b + (b^2 - 4*a*c)^.5)/2a
		v2 = (m1*vo1 + m2*vo2 - m1*v1)/(m2*A)
		*/
		if(line[0]==0 && line[1]==0){
			
			if(Math.abs(this.wallV)>1.0){
				var vo1 = dot.v.dy;
				var vo2 = this.wallV;
				var m1 = dot.m;
				var m2 = this.mass();
				var vo1Sqr = vo1*vo1;
				var vo2Sqr = vo2*vo2;
				
				var scalar = Math.pow(Math.abs(vo2)+.1, .2);
				var scalarSqr = scalar*scalar
				
				var a = m1*(1 + m1/(scalarSqr*m2));
				var b = -2*m1*(vo1*m1/(m2) + vo2)/scalarSqr;
				var c = (m1*(m1*vo1Sqr/m2 + 2*vo2*vo1) + m2*vo2Sqr)/scalarSqr - m1*vo1Sqr - m2*vo2Sqr;
				
				dot.v.dy = (-b + Math.pow(b*b - 4*a*c,.5))/(2*a);
				dot.y = dot.y+dot.r;
				this.wallV = (m1*vo1 + m2*vo2 - m1*dot.v.dy)/(m2*scalar);
			}else{
				var pt = walls.pts[line[0]][line[1]];
				var dotVo = dot.v.dy;
				var wallVo = this.wallV;
				dot.v.dy = (dotVo*(dot.m-this.mass())+2*this.mass()*wallVo)/(dot.m+this.mass());
				this.wallV = (wallVo*(this.mass()-dot.m)+2*dot.m*dotVo)/(this.mass()+dot.m);
				dot.y = pt.y+dot.r;			
			}
		}else{
			walls.impactStd(dot, wallUV, perpV);
			this.forceInternal += 2*dot.m*Math.abs(perpV);
		}
	},
	addDots: function(){
		populate("spc1", P(35, 80), V(460, 350), 800, 230);
		populate("spc3", P(35, 80), V(460, 350), 600, 230);		
	},
	dataRun: function(){
		var SAPInt = getLen([walls.pts[0][1], walls.pts[0][2], walls.pts[0][3], walls.pts[0][4]])
		this.data.pInt.push(this.dataHandler.pressureInt(this.forceInternal, this.numUpdates, SAPInt));
		this.data.pExt.push(this.dataHandler.pressureExt(this.mass(), this.g, this.SAPExt));
		this.data.t.push(this.dataHandler.temp());
		this.data.v.push(this.dataHandler.volOneWall());
		this.forceInternal = 0;
		for(var graphName in this.graphs){
			this.graphs[graphName].addLast();
		}
		
	},
	vol: function(){
		return walls.area(0);// - walls.area(1);
	},
	moveWalls: function(){
		var wall = walls.pts[0];
		var lastY = wall[0].y
		var unboundedY = lastY + this.wallV + .5*this.g;
		var dyWeight = null;
		if(unboundedY>this.maxY || unboundedY<this.minY){
			var boundedY = Math.max(this.minY, Math.min(this.maxY, unboundedY));
			var tHit = null;
			if (boundedY==this.maxY){
				var tHit = (-this.wallV + Math.sqrt(this.wallV*this.wallV + 2*this.g*(boundedY-lastY)))/this.g;
			}else if (boundedY==this.minY){
				var tHit = (-this.wallV - Math.sqrt(this.wallV*this.wallV + 2*this.g*(boundedY-lastY)))/this.g;
			}
			var vRebound = -(this.wallV + this.g*tHit);
			var tLeft = 1 - tHit;
			var nextY = boundedY + vRebound*tLeft + .5*this.g*tLeft*tLeft;
			this.wallV += 2*this.g*tHit;
			this.wallV = -this.wallV;
			wall[0].y = nextY;
			wall[1].y = nextY;
			wall[wall.length-1].y = nextY;
			dyWeight = nextY - lastY;
		}else{
			wall[0].y = unboundedY;
			wall[1].y = unboundedY;
			wall[wall.length-1].y = unboundedY;
			dyWeight = unboundedY - lastY;
		}
		walls.setupWall(0);
	},
	reset: function(){
		
		var curPrompt = this.prompts[this.promptIdx];
		if(this['block'+this.blockIdx+'CleanUp']){
			this['block'+this.blockIdx+'CleanUp']()
		}
		if(curPrompt.cleanUp){
			curPrompt.cleanUp();
		}	
		for (var spcName in spcs){
			depopulate(spcName);
		}		
		this.numUpdates = 0;
		this.extPressurePts = [walls.pts[0][0], walls.pts[0][1]];
		this.forceInternal = 0;
		emptyListener(this, 'update');
		emptyListener(this, 'wallImpact');
		emptyListener(this, 'dotImpact');
		emptyListener(this, 'data');
		this.startSim();
		
		for (resetListenerName in this.resetListeners.listeners){
			var func = this.resetListeners.listeners[resetListenerName].func;
			var obj = this.resetListeners.listeners[resetListenerName].obj;
			func.apply(obj);
		}
		
		if(this['block'+this.blockIdx+'Start']){
			this['block'+this.blockIdx+'Start']()
		}		

		
	},
	clearGraphs: function(){
		for (var graphName in this.graphs){
			this.graphs[graphName].clear();
		}
	},
	hideDash: function(){
		$('#dashIntro').hide();
		$('#dashRun').hide();
		$('#dashOutro').hide();
	},
	hideText: function(){
		$('#textIntro').hide();
		$('#textOutro').hide();
	},
	hideBase: function(){
		$('#base').hide();
	},

}
