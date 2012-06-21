function Graph(name, width, height, xLabel, yLabel){
	this.name = name;
	this.dims = V(width, height);
	this.xLabel = xLabel;
	this.yLabel = yLabel;
	this.labelFontSize = 15;
	this.legendFontSize = 12;
	this.axisValFontSize = 11;
	this.labelFont = this.labelFontSize+ 'pt calibri';
	this.legendFont = this.legendFontSize+ 'pt calibri';
	this.axisValFont = this.axisValFontSize+ 'pt calibri';
	this.borderSpacing = 70;
	this.xStart = this.borderSpacing/width;
	this.yStart = 1-this.borderSpacing/height;
	this.legendWidth = 80;
	this.xEnd = (this.dims.dx - (this.legendWidth+8))/this.dims.dx;
	this.yEnd = .05;
	this.gridSpacing = 40;
	this.hashMarkLen = 10;
	this.numXGridLines = Math.ceil(this.dims.dx*(Math.abs(this.xEnd-this.xStart))/this.gridSpacing);
	this.numYGridLines = Math.ceil(this.dims.dy*(Math.abs(this.yEnd-this.yStart))/this.gridSpacing);
	this.axisVals = [];
	this.data = {};
	this.legend = {};
	this.resetRanges();
	this.stepSize = {x:0, y:0};
	this.bgCol = Col(5, 17, 26);
	this.gridCol = Col(72,72,72);
	this.textCol = Col(255, 255, 255);
	this.flashMult = 1.5;
	this.flashRate = .1;
	this.graphBoundCol = Col(255,255,255);
	this.ptStroke = Col(0,0,0);
	this.rectSideLen = 8;
	this.triSideLen = Math.sqrt(Math.pow(this.rectSideLen, 2)/2);

	this.makeCanvas(this.name);
	this.drawAllBG();

}
Graph.prototype = {
	makeCanvas: function(name){
		var str = "<div class='graphSpacer'></div><div id = '" + name + "div'><canvas id ='" + name + "Graph' width=" + this.dims.dx + " height=" + this.dims.dy+ "></canvas></div>"
		var canvasDiv = $(str);
		$('#graphs').append(canvasDiv);
		var graphCanvas = document.getElementById(name+'Graph');
		this.graph = graphCanvas.getContext('2d');
		
		
	},	
	addSet: function(address, label, pointCol, flashCol){
		var set = {};
		set.label = label;
		set.x = [];
		set.y = [];
		set.pointCol = pointCol;
		set.flashCol = flashCol;
		this.makeLegendEntry(set, address);
		this.data[address] = set;
		this.drawAllBG();
	},
	makeLegendEntry: function(set, address){
		var x = this.dims.dx-this.legendWidth+5;
		var y = 30;
		for (var entryIdx in this.legend){
			y+=30;
		}
		var legendEntry = {};
		legendEntry.text = {text:set.label, x:x+10, y:y+this.legendFontSize/2};
		
		legendEntry.pt = {x:x, y:y, col:set.pointCol}
		this.legend[address] = legendEntry;
		this.drawAllBG();
	},
	drawAllBG: function(){
		this.drawBGRect();
		this.drawGrid();
		this.drawBounds();
		this.drawLegend();
		this.drawLabels(this.xLabel, this.yLabel);
		this.bg = this.graph.getImageData(0, 0, this.dims.dx, this.dims.dy);
	},
	drawAllData: function(){
		this.graph.putImageData(this.bg, 0, 0);
		this.drawAxisVals();
		this.graphPts();
	},
	drawLegend: function(){
		for (var legendName in this.legend){
			var legend = this.legend[legendName];
			var text = legend.text;
			var pt = legend.pt;
			var font = this.legendFont
			draw.text(text.text, P(text.x, text.y),  this.legendFont, this.textCol, 'left', 0, this.graph);
			this.drawPt(pt.x, pt.y, pt.col, this.triSideLen);
		}
	},
	drawBGRect: function(){
		draw.roundedRect(P(0,0), V(this.dims.dx, this.dims.dy), 20, this.bgCol, this.graph); 
	},
	drawBounds: function(){
		var ptOrigin = P(this.xStart*this.dims.dx, this.yStart*this.dims.dy);
		var width = this.dims.dx*(this.xEnd-this.xStart);
		var height = this.dims.dy*(this.yEnd - this.yStart);
		var dims = V(width, height);
		draw.strokeRect(ptOrigin, dims, this.graphBoundCol, this.graph);
	},
	removeBounds: function(){
		this.graphBounds.remove();
	},
	drawGrid: function(){
		for (var xGridIdx=0; xGridIdx<this.numXGridLines; xGridIdx++){
			var x = this.xStart*this.dims.dx + this.gridSpacing*xGridIdx;
			var yEnd = this.yEnd*this.dims.dy;
			var yAxis = this.yStart*this.dims.dy + this.hashMarkLen;
			var p1 = P(x, yAxis);
			var p2 = P(x, yEnd);
			draw.line(p1, p2, this.gridCol, this.graph);
		}
		for (var yGridIdx=0; yGridIdx<this.numYGridLines; yGridIdx++){
			var y = this.yStart*this.dims.dy - this.gridSpacing*yGridIdx;
			var xEnd = this.xEnd*this.dims.dx;
			var xAxis = this.xStart*this.dims.dx - this.hashMarkLen;
			var p1 = P(xAxis, y);
			var p2 = P(xEnd, y);			
			draw.line(p1, p2, this.gridCol, this.graph);
		}
		
	},
	drawLabels: function(xLabel, yLabel){
		var xLabelPos = P(this.dims.dx*(this.xStart+this.xEnd)/2, Math.min(this.dims.dy*this.yStart+50, this.dims.dy-20))
		var yLabelPos = P(Math.max(this.dims.dx*this.xStart-50, 20),this.dims.dy*(this.yStart+this.yEnd)/2)
		xLabelPos.y+=this.labelFontSize/2;
		yLabelPos.y+=this.labelFontSize/2;
		draw.text(xLabel, xLabelPos, this.labelFont, this.textCol, 'center',  0, this.graph);
		draw.text(yLabel, yLabelPos, this.labelFont, this.textCol, 'center', -Math.PI/2, this.graph);
	},
	addPts: function(toAdd){
		var mustRedraw = new Boolean;
		mustRedraw = false;
		for (var addIdx=0; addIdx<toAdd.length; addIdx++){
			var address = toAdd[addIdx].address;
			var x = toAdd[addIdx].x;
			var y = toAdd[addIdx].y;
			var data = this.data[address]
			data.x.push(x);
			data.y.push(y);
			var oldRange = {x:{min:this.valRange.x.min, max:this.valRange.x.max}, y:{min:this.valRange.y.min, max:this.valRange.y.max}};
			this.valRange.x.max = Math.max(this.valRange.x.max, x);
			this.valRange.x.min = Math.min(this.valRange.x.min, x);		
			this.valRange.y.max = Math.max(this.valRange.y.max, y);
			this.valRange.y.min = Math.min(this.valRange.y.min, y);
			var mustRedrawMe = !this.rangeIsSame(oldRange, this.valRange);
			if(mustRedrawMe){
				mustRedraw = true;
			}
		}	
		if(mustRedraw){
			this.valRange.x = this.getRange('x');
			this.valRange.y = this.getRange('y');
			this.getAxisBounds();
			this.drawAllData();
		} else{
			for (var addIdx=0; addIdx<toAdd.length; addIdx++){
				var data = this.data[toAdd[addIdx].address];
				var xPt = data.x[data.x.length-1]
				var yPt = data.y[data.y.length-1]
				var pointCol = data.pointCol
				this.graphPt(xPt, yPt, pointCol);
			}
		}
		
		this.flashInit(toAdd);
		
	},
	rangeIsSame: function(a, b){
		return !(a.x.max!=b.x.max || a.x.min!=b.x.min || a.y.max!=b.y.max || a.y.min!=b.y.min);
	},
	plotData: function(xVals, yVals, address){
		if (xVals.length==yVals.length && xVals.length>1){
			this.data[address].x = xVals;
			this.data[address].y = yVals;
			this.valRange.x = this.getRange('x');
			this.valRange.y = this.getRange('y');
			this.getAxisBounds();
			this.drawAllData();
		} else if (xVals.length!=yVals.length){
			console.log("xVals has ", xVals.length, "entries");
			console.log("yVals has ", yVals.length, "entries");
			console.log("UH-OH");
		};
	},
	getAxisBounds: function(){		
		var rangeX = this.valRange.x.max-this.valRange.x.min;
		if(rangeX!=0){
			var unroundStepX = rangeX/(this.numXGridLines-1);
			var expStepX = Math.pow(10, Math.floor(log10(unroundStepX)))
			this.stepSize.x = Math.ceil(unroundStepX/expStepX)*expStepX;
			this.axisRange.x.min = Math.floor(this.valRange.x.min/this.stepSize.x)*this.stepSize.x;
			this.axisRange.x.max = this.axisRange.x.min + this.numXGridLines*this.stepSize.x;
		}else{
			this.axisRange.x.min = Math.floor(this.valRange.x.min);
			this.stepSize.x = .2;
			this.axisRange.x.max = this.axisRange.x.min + this.stepSize.x*this.numXGridLines;	
		}
		
		var rangeY = Math.abs(this.valRange.y.max-this.valRange.y.min);
		if(rangeY!=0){
			var unroundStepY = rangeY/(this.numYGridLines-1);
			var expStepY = Math.pow(10, Math.floor(log10(unroundStepY)))
			this.stepSize.y = Math.ceil(unroundStepY/expStepY)*expStepY;
			this.axisRange.y.min = Math.floor(this.valRange.y.min/this.stepSize.y)*this.stepSize.y;
			this.axisRange.y.max = this.axisRange.y.min + this.numYGridLines*this.stepSize.y;
		}else{
			this.axisRange.y.min = Math.floor(this.valRange.y.min);
			this.stepSize.y = .2;
			this.axisRange.y.max = this.axisRange.y.min + this.stepSize.y*this.numYGridLines;	
			
		}
	},
	drawAxisVals: function(){
		for (var xGridIdx=0; xGridIdx<this.numXGridLines; xGridIdx++){
			var xPos = this.xStart*this.dims.dx + this.gridSpacing*xGridIdx;
			var yPos = this.yStart*this.dims.dy + this.hashMarkLen + 10 + this.axisValFontSize/2;
			var text = String(round(this.axisRange.x.min + this.stepSize.x*xGridIdx, 1));
			draw.text(text, P(xPos,yPos), this.axisValFont, this.textCol, 'center', 0, this.graph);
		}
		for (var yGridIdx=0; yGridIdx<this.numYGridLines; yGridIdx++){
			var yPos = this.yStart*this.dims.dy - this.gridSpacing*yGridIdx;
			var xPos = this.xStart*this.dims.dx - this.hashMarkLen - 10;
			var text = String(round(this.axisRange.y.min + this.stepSize.y*yGridIdx,1));
			draw.text(text, P(xPos,yPos), this.axisValFont, this.textCol, 'center', -Math.PI/2, this.graph);
		}		
		
	},
	graphPts: function(){
		for (var set in this.data){
			var data = this.data[set];
			var col = data.pointCol;
			for (var ptIdx=0; ptIdx<data.x.length; ptIdx++){
				var xVal = data.x[ptIdx];
				var yVal = data.y[ptIdx];
				this.graphPt(xVal, yVal, col);
			}
		}
	},
	graphPt: function(xVal, yVal, col){
		var xPt = this.translateValToCoord(xVal, 'x');
		var yPt = this.translateValToCoord(yVal, 'y');
		this.drawPt(xPt, yPt, col, this.triSideLen);
	},
	translateValToCoord: function(val, axis){
		var range = this.axisRange[axis].max - this.axisRange[axis].min;
		var coord;
		if(axis=='x'){
			coord = Math.abs(this.xEnd-this.xStart)*this.dims.dx*(val-this.axisRange.x.min)/range + this.xStart*this.dims.dx;
		}else if(axis=='y'){
			coord = this.dims.dy - (1-this.yStart)*this.dims.dy - Math.abs(this.yEnd-this.yStart)*this.dims.dy*(val-this.axisRange.y.min)/range;
		}
		return coord;
	},	
	drawPt: function(x, y, col, triSideLen){
		var len = triSideLen;
		var pt1 = P(x-len, y);
		var pt2 = P(x, y-len);
		var pt3 = P(x+len, y);
		var pt4 = P(x, y+len);
		var pts = [pt1, pt2, pt3, pt4];
		draw.fillPtsStroke(pts, col, this.ptStroke, this.graph);
	},
	flashInit: function(pts){
		this.flashers = new Array(pts.length);
		for (var flashIdx=0; flashIdx<this.flashers.length; flashIdx++){
			var pt = pts[flashIdx];
			var x = this.translateValToCoord(pt.x, 'x');
			var y = this.translateValToCoord(pt.y, 'y');
			var pos = P(x, y);
			var pointCol = this.data[pt.address].pointCol;
			var flashCol = this.data[pt.address].flashCol;
			var curCol = Col(flashCol.r, flashCol.g, flashCol.b);
			var imagePos = P(x - this.triSideLen*this.flashMult-1, y - this.triSideLen*this.flashMult-1);
			var len = this.triSideLen*2*this.flashMult+2;
			var curTriSideLen = this.triSideLen*this.flashMult;
			var imageData = this.graph.getImageData(imagePos.x, imagePos.y, len, len);
			this.flashers[flashIdx] = {pos:pos, pointCol:pointCol, flashCol:flashCol, curCol:curCol, curTriSideLen:curTriSideLen, imagePos:imagePos, imageData:imageData};
		}
		addListener(curLevel, 'update', 'flash'+this.name, this.flashRun, this);
	},
	flashRun: function(){
		this.eraseFlashers();

		for (var flasherIdx=0; flasherIdx<this.flashers.length; flasherIdx++){
			var flasher = this.flashers[flasherIdx];
			this.drawPt(flasher.pos.x, flasher.pos.y, flasher.curCol, flasher.curTriSideLen);
			this.flasherNextStep(flasher);
		}
		if(this.doneFlashing()){
			removeListener(curLevel, 'update', 'flash'+this.name);
			this.eraseFlashers();
			this.flashers = undefined;
		}
	},
	eraseFlashers: function(){
		for (var flasherIdx=0; flasherIdx<this.flashers.length; flasherIdx++){
			var flasher = this.flashers[flasherIdx];
			this.graph.putImageData(flasher.imageData, flasher.imagePos.x, flasher.imagePos.y);
		}
	},
	flasherNextStep: function(flasher){
		flasher.curTriSideLen = Math.max(this.triSideLen, flasher.curTriSideLen*(1-this.flashRate));
		var col = flasher.curCol;
		for (var valName in col){
			var val = col[valName];
			var init = flasher.flashCol[valName];
			var setPt = flasher.pointCol[valName];
			var diff = setPt - init;
			var sign;
			if(diff!=0){
				sign = diff/Math.abs(diff);
			}else{
				sign=1;
			}
			val*=sign;
			setPt*=sign;
			diff*=sign;
			val = Math.min(val + diff*this.flashRate, setPt);
			val*=sign;
			col[valName] = val;
		}	
	},
	doneFlashing: function(){
		var amDone = new Boolean();
		amDone = true;
		for (var flasherIdx=0; flasherIdx<this.flashers.length; flasherIdx++){
			var flasher = this.flashers[flasherIdx];
			var la = flasher.curTriSideLen;
			var lb = this.triSideLen;
			var ra = flasher.curCol.r;
			var rb = flasher.pointCol.r;		
			var ga = flasher.curCol.g;
			var gb = flasher.pointCol.g;		
			var ba = flasher.curCol.b;
			var bb = flasher.pointCol.b;
			if(la!=lb || ra!=rb || ga!=gb || ba!=bb){
				amDone = false;
			}
		}
		return amDone;
	},
	getRange: function(axis){
		var min = Number.MAX_VALUE;
		var max = -Number.MAX_VALUE;
		for (var set in this.data){
			var data = this.data[set][axis];
			for (var dataIdx=0; dataIdx<data.length; dataIdx++){
				var datum = data[dataIdx];
				min = Math.min(min, datum);
				max = Math.max(max, datum);
			}
		}
		return {min:min, max:max};
	},
	resetRanges: function(){
		this.axisRange = {x:{min:Number.MAX_VALUE, max:-Number.MAX_VALUE}, y:{min:Number.MAX_VALUE, max:-Number.MAX_VALUE}};
		this.valRange = {x:{min:Number.MAX_VALUE, max:-Number.MAX_VALUE}, y:{min:Number.MAX_VALUE, max:-Number.MAX_VALUE}};
	},
	clear: function(){
		for (var set in this.data){
			var data = this.data[set];
			data.x = [];
			data.y = [];
			
		}
		this.graph.putImageData(this.bg, 0, 0);
		this.resetRanges();
	},
}