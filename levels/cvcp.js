function cvcp(){
	this.setStds();
	this.wallSpeed = 1;
	this.readout = new Readout('mainReadout', 30, myCanvas.width-130, 25, '13pt calibri', Col(255,255,255),this, 'left');
	this.compMode = 'Isothermal';//is this used?

	
	addSpecies(['spc1', 'spc3', 'spc4', 'spc5']);
	this.yMin = 30;
	this.yMax = 350;
}
_.extend(cvcp.prototype, 
			LevelTools, 
{
	init: function() {
		$('#mainHeader').html('c<sub>v</sub> vs. c<sub>P</sub');
		showPrompt(0, 0, true);
	},
	blocks: [
		{//B0
			setup:undefined,
			prompts:[
				{//P0
					setup:undefined,
					cutScene:true,
					text:"<p>It's time to look at heat capacities!</p><p>For an ideal monatomic gas, which of these is correct?  c<sub>V</sub> means heat capacity at constant volume, c<sub>P</sub> means heat capacity at constant pressure.",
					quiz:[
						{	
							type:'multChoice', 
							options:
								[
								{text:"||EQ1|| and ||EQ3||", isCorrect: false, message:"That's not correct"},
								{text:"||EQ2|| and ||EQ3||", isCorrect: false, message:"That's not correct"},
								{text:"||EQ1|| and ||EQ4||", isCorrect: true},
								{text:"||EQ2|| and ||EQ5||", isCorrect: false, message:"That's not correct"}
							]
						}
					],
				},
				{//P1
					setup:undefined,
					cutScene:true,
					text:"<p>Right.</p><p>So an ideal gas has a higher heat capacity under constant pressure than under constant volume.  We're going to investigate these processes to figure out why that is.</p><p>First, what does it mean in terms of energy required to heat a given system that c<sub>P</sub> is greater than c<sub>v</sub>?</p>",
					quiz:[
						{	
						type:'text',
						text:'Type your answer here.',
						},
					]
				}
			]
		},
		{//B1
			setup:
				function() {
					currentSetupType = 'block';
					walls = WallHandler({pts:[[P(40,190), P(255,190), P(255,425), P(40,425)], [P(295,190), P(510,190), P(510,425), P(295,425)]], handlers:'staticAdiabatic', handles:['left', 'right'], bounds:[undefined, {yMin:50, yMax:275}], vols:[5,5]});
					this.borderStd({wallInfo:'left', min:50});
					this.borderStd({wallInfo:'right', min:50});
					spcs['spc1'].populate(P(45,200), V(200, 200), 350, 185, 'left', 'left');
					spcs['spc3'].populate(P(45,200), V(200, 200), 250, 185, 'left', 'left');	

					spcs['spc1'].populate(P(300,200), V(200, 200), 350, 185, 'right', 'right');
					spcs['spc3'].populate(P(300,200), V(200, 200), 250, 185, 'right', 'right');	


					this.piston = new Piston({wallInfo:'right', min:2, init:2, max:2, makeSlider:false})
					this.heaterLeft = new Heater({handle:'heaterLeft', wallInfo:'left'});
					this.heaterRight = new Heater({handle:'heaterRight', wallInfo:'right'});

					walls[1].setDefaultReadout(this.readout);
					walls[0].displayTempSmooth().displayQ();
					walls[1].displayTempSmooth().displayQ();
				},
			prompts:[
				{//P0
					setup: 
						function(){
							currentSetupType = 'prompt1';
							walls[1].setDefaultReadout(this.piston.readout);
							walls[1].displayPExt();
							this.leftTemp250 = new StateListener({dataList:walls[0].data.t, is:'equalTo', targetVal:250, alertUnsatisfied:"Bring the containers to 250 K", priorityUnsatisfied:1, checkOn:'conditions'});
							this.rightTemp250 = new StateListener({dataList:walls[1].data.t, is:'equalTo', targetVal:250, alertUnsatisfied:"Bring the containers to 250 K", priorityUnsatisfied:1, checkOn:'conditions'});
						},
					title:"Current step",
					text:"Okay, here�s a constant volume and a constant pressure container.  Both are adiabatic and contain 0.6 moles of an ideal monatomic gas.  Heat the two containers to 250 K.  How do the energies used compare?",
					quiz:[
						{	
						type:'text',
						text:'Type your answer here.',
						},
					]
				},
				{//P1
					setup:undefined,
					text:"<p>It took 0.5 kJ to bring the constant volume container to 250K while the constant pressure container took 0.8 kJ.</p>Do you have any theories about why that is?<br>",
					quiz:[
						{	
						type:'text',
						text:'Type your answer here.',
						},
					]
				},
				{//P2
					setup:undefined,
					cutScene:true,
					text:"<p>Let's think about those systems.  When you heated the constant volume container, where did the added energy go?</p>",
					quiz:[
						{	
							type:'multChoice', 
							options:
								[
								{text:"To the molecules, to speed them up, and to the surroundings by expanding the system.", isCorrect: false, message:"That's not correct.  Did the system expand?"},
								{text:"To the molecules, to speed them up", isCorrect: true},
								{text:"To the surroundings through work", isCorrect: false, message:"That's not correct.  Did the system expand?"}
							]
						}
					],
				},
				{//P3
					setup:undefined,
					cutScene:true,
					text:"<p>Good.  When you heated the constant <i>pressure</i> container, where did the added energy go?</p>",
					quiz:[
						{	
							type:'multChoice', 
							options:
								[
								{text:"To the molecules, to speed them up, and to the surroundings by expanding the system.", isCorrect: true},
								{text:"To the molecules, to speed them up", isCorrect: false},
								{text:"To the surroundings through work", isCorrect: false, message:"That's not correct.  Didn't the molecules also speed up?"}
							]
						}
					],
				}
			]

		},
		{//B2
			setup:
				function() {
					this.blocks[1].setup.apply(this);
					walls[1].setDefaultReadout(this.piston.readout);
					walls[1].displayWork();

				},
			prompts:[
				{//P0
					setup:
						function() {
							this.leftTemp250 = new StateListener({dataList:walls[0].data.t, is:'equalTo', targetVal:250, alertUnsatisfied:"Bring the containers to 250 K", priorityUnsatisfied:1, checkOn:'conditions'});
							this.rightTemp250 = new StateListener({dataList:walls[1].data.t, is:'equalTo', targetVal:250, alertUnsatisfied:"Bring the containers to 250 K", priorityUnsatisfied:1, checkOn:'conditions'});							

						},
					text:"Try heating the containers to 250 K again.  This time the work done by the constant pressure container is displayed.  Is your theory consistant with the data from this heating?",
					quiz:[
						{	
						type:'text',
						text:'Type your answer here.',
						},
					]
				}

			]
		},
		{//B3
			setup:undefined,
			prompts:[
				{
					setup:undefined,
					cutScene:true,
					text:"<p>End of simulation.</p>",
				}
			]
		}

	]
	





}
)