function GraphHist(handle, width, height, xLabel, yLabel, axisInit, data){
	this.active = true;
	this.handle = handle;
	this.dims = V(width, height);
	this.xLabel = xLabel;
	this.yLabel = yLabel;
	this.labelFontSize = 15;
	this.axisValFontSize = 11;
	this.labelFont = this.labelFontSize+ 'pt calibri';
	this.axisValFont = this.axisValFontSize+ 'pt calibri';
	this.borderSpacing = 70;
	this.xStart = this.borderSpacing/width;
	this.yStart = 1-this.borderSpacing/height;
	this.legendWidth = 80;
	this.xEnd = .95;
	this.yEnd = .05;
	this.gridSpacing = 40;
	this.hashMarkLen = 10;
	this.numBins = 18;
	var numGridLinesX = Math.ceil(this.dims.dx*(Math.abs(this.xEnd-this.xStart))/this.gridSpacing);
	var numGridLinesY = Math.ceil(this.dims.dy*(Math.abs(this.yEnd-this.yStart))/this.gridSpacing);
	this.numGridLines = {x:numGridLinesX, y:numGridLinesY};
	this.axisInit = {x:{min:axisInit.x.min, max:axisInit.x.min+ axisInit.x.step*(this.numGridLines.x-1)}, y:{min:axisInit.y.min, max:axisInit.y.min + axisInit.y.step*(this.numGridLines.y-1)}};
	this.axisRange = {x:{min:0, max:0}, y:{min:0, max:0}};
	this.data = {};
	this.legend = {};
	this.resetRanges();
	this.stepSize = {x:0, y:0};
	
	var barCol = Col(255,100,0);
	this.setStds();
	var canvasData = this.makeCanvas(this.handle, this.dims);
	this.drawAllBG();
	this.addSet('only', barCol, data);
	addListener(curLevel, 'reset', 'clearGraph'+handle, this.clear, this);
}
/*
Good evening:  I am keeping histogram data in data.someName, not just data, even though there is only one for now.
Trying to make functions where base references data.someName as reusable as possible
and leaving open possibility of multiple sets (though that would probably look confusing)
*/
_.extend(GraphHist.prototype, GraphBase, 
	{
		addSet: function(address, barCol, data){
			var set = {};
			set.x = [];
			set.y = [];
			set.barCol = barCol;
			set.getLast = this.makeHistDataGrabFunc(data);
			this.data[address] = set;
			this.drawAllBG();
		},
		drawAllData: function(){
			this.graph.putImageData(this.bg, 0, 0);
			this.drawAxisVals();
			this.graphBins();
		},
		drawLastData: function(toAdd){
			for (var addIdx=0; addIdx<toAdd.length; addIdx++){
				var dataSet = this.data[toAdd[addIdx].address];
				if(dataSet.show){
					var xPt = dataSet.x[dataSet.x.length-1]
					var yPt = dataSet.y[dataSet.y.length-1]
					var pointCol = dataSet.pointCol
					this.graphPt(xPt, yPt, pointCol);
				}
			}	
		},
		addLast: function(){
			var toAdd = [];
			var theOnlyAddress = '';
			var last;
			for (var address in this.data){
				theOnlyAddress = address;
				last = this.data[theOnlyAddress].getLast();
			}
			this.data[theOnlyAddress].x = this.data[theOnlyAddress].x.concat(last.data);
			this.makeBins(theOnlyAddress);
		},
		plotData: function(vals){
			var theOnlyAddress = '';
			for(var address in this.data){
				theOnlyAddress = address;
			}
			this.data[theOnlyAddress].x = vals;
			this.makeBins(theOnlyAddress)
		},
		getAxisBounds: function(){
			this.getXBounds();
			this.getYBounds();
		},
		makeBins: function(theOnlyAddress){
			this.valRange.x = this.getRange('x');
			this.setAxisBoundsX();
			this.bins = this.makeBinBlanks(this.data[theOnlyAddress].x);
			this.populateBins(this.data[theOnlyAddress].x);
			this.setYAxis();
			this.drawAllData();
		},
		makeBinBlanks: function(data){
			var bins = {};
			this.binWidth = round((this.valRange.x.max - this.valRange.x.min)/(this.numBins-1),1);
			for(var binIdx=0; binIdx<this.numBins; binIdx++){
				min = this.valRange.x.min + this.binWidth*binIdx;
				bins[String(min)] = 0; // hey - if this has a decimal in it, it may break things
			}
			return bins;
		},
		populateBins: function(data){
			for (var dataIdx=0; dataIdx<data.length; dataIdx++){
				var min = this.valRange.x.min;
				var val = data[dataIdx];
				var binIdx = Math.floor((val-min)/this.binWidth)*this.binWidth + min;
				this.bins[String(binIdx)]++;
			}
		},
		setYAxis: function(){
			var maxCount = 0;
			for (var binName in this.bins){
				maxCount = Math.max(this.bins[binName], maxCount);
			}
			this.valRange.y.min=0;
			this.valRange.y.max = maxCount;
			this.setAxisBoundsY();
		},
		graphBins: function(){
			var theData = '';
			for (var dataName in this.data){
				theData = dataName;
			}
			var barCol = this.data[theData].barCol
			for (var binName in this.bins){
				var xULPt = parseFloat(binName);
				var yULPt = this.bins[binName];
				var xLRPt = parseFloat(binName) + this.binWidth;
				var yLRPt = 0;
				
				var ULCoord = this.translateValToCoord(P(xULPt,yULPt));
				var LRCoord = this.translateValToCoord(P(xLRPt,yLRPt));
				var dims = ULCoord.VTo(LRCoord);
				
				draw.fillStrokeRect(ULCoord, dims, barCol, this.bgCol, this.graph);
			}
		},
		clear: function(){
			this.clearStd()
		},
	}
)

