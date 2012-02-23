
   var dragger = function(){
      // this is when we first grab a shape. if we're coming from a machine, set the color of the machine to white
      if(!(this.MTCSystem.ticking)){
         this.MTCSystem.stopFlashing();
         }
      this.MTCSystem.setSelectedPart(this.MTCItem);
      if(this.MTCItem.Order.DueDate){}else{this.MTCItem.Order.setDueDate(40);}
      this.MTCSystem.statsDiv.innerHTML = this.MTCItem.getDivContent();
      if(this.dragEnabled===false){
      	return;
      }
   	this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
      this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
      this.animate({"fill-opacity": .2}, 500);
      // if part is at an inqueue, then highlight the machine by flashing green if the machine is available to take a part
      if(this.MTCItem.CurrLocation.Machine.InQueueObj===this.MTCItem.CurrLocation){
         var theMach = this.MTCItem.CurrLocation.Machine.MachineShape;
         var flashInterval = 350;
         var onFlashMult = 1.3;
      	if(this.MTCItem.CurrLocation.Machine.CurrPart){
      		// flash it red
      		theMach.oColor = theMach.attr('fill');
      		theMach.animate({fill: Raphael.color('red')},flashInterval*onFlashMult,function(){this.animate({fill: this.oColor},flashInterval);});
      	}else{
      	  // flash it green
      	  theMach.oColor = theMach.attr('fill');
      		theMach.animate({fill: Raphael.color('palegreen')},flashInterval*onFlashMult,function(){
      		    this.animate({fill: this.oColor},flashInterval);
      		    }
      		);
      	}
      }
      // if part is at a machine, then highlight the machine's out queue by flashing green
      if(this.MTCItem.CurrLocation.Machine===this.MTCItem.CurrLocation){
      	var theOutQueue = this.MTCItem.CurrLocation.Machine.OutQueue;
      	theOutQueue.animate(
      	  {fill: Raphael.color('palegreen')} ,
      	  300,
      	  function(){
      	  	  // turn it back white
      	  	  this.animate(
      	  	     {fill: Raphael.color('whitesmoke')},
      	  	     400
      	  	  );
      	  }
      	);
      }
      if(this.MTCSystem.ticking===false){
         this.MTCSystem.ordersDiv.innerHTML = this.MTCSystem.getOrdersHTML();
      	this.MTCSystem.ticking = true;
      	this.MTCSystem.tick();
      	this.MTCSystem.tickTimer = setInterval('mts.ActiveSystem.tick();',1000);
      }
   }

   var arrowDblClick = function(){
      this.MTCItem.restartMachineFromBreakdown();
   }

   var machineDblClick = function(){
   	this.MTCItem.PreemptProcess(true);
   }

   var inArrowDblClick = function(){
   	this.MTCItem.stopMachineForBreakdown();
   }

   var outQueueDblClick = function(){
      this.MTCItem.PreemptProcess(false);
   }

   var move = function (dx, dy) {
      if(this.dragEnabled===false){
      	return false;
      }
      var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
      this.attr(att);
      //r.safari();
   }

   var tapEnd = function(e){
   	// assigned to touchend on a raphael shape, to catch a double hit (i.e. arrowDblClick, etc...)
   	// when assigning tapEnd to a shape, also need to set onDblTap function to call (i.e. arrowDblClick)
   	var now = new Date().getTime();
   	var lastTouch = this.lastTouch || now + 1;
   	var delta = now - lastTouch;
      if(delta < 500 && delta > 0 ){
      	// second touch has occurred
      	if(this.onDblTap){
         	e.preventDefault();
         	e.stopPropagation();
      		this.onDblTap();
      	}
      }else{
         // log first touch time, and set to clear the time in 500 milliseconds
         this.lastTouch = now;
      }
      this.lastTouch = now;
   }

   var getRaphaelShapeBounds = function(shp){
   	return {x : shp.attr('x') , y : shp.attr('y') , wd : shp.attr('width') , ht : shp.attr('height')};
   }

   var isCoordInBounds = function(checkX,checkY,checkBounds){
   	var x = checkX; var y=checkY;
   	// need to modify this to check within the radius of a circle...
   	if( x <= (checkBounds.x+checkBounds.wd) && x >= checkBounds.x && y >= checkBounds.y && y<=(checkBounds.y+checkBounds.ht)){
   		return true;
   	}
   }

   var isShapeInBounds = function(checkX,checkY,checkBounds,r){
   	var x = checkX; var y=checkY;
   	return isCoordInBounds(x+r,y,checkBounds) || isCoordInBounds(x,y+r,checkBounds) ||
   	     isCoordInBounds(x,y-r,checkBounds) || isCoordInBounds(x-r,y,checkBounds);
   }

   var getDroppedOntoShape = function(droppedShape){
      var x = droppedShape.attr('cx'); var y = droppedShape.attr('cy');var r=droppedShape.attr('r');
      var thePart = droppedShape.MTCItem;
   	var syst = droppedShape.MTCSystem;
   	var found = false;
   	for(var i=0;i<syst.Devices.length;i++){
   		var machBounds = getRaphaelShapeBounds(syst.Devices[i].MachineShape);
   		var queueBounds = getRaphaelShapeBounds(syst.Devices[i].QueueShape);
   		var outQueueBounds = getRaphaelShapeBounds(syst.Devices[i].OutQueue);
   		
   		if(isShapeInBounds(x,y,machBounds,r)){
   			found = syst.Devices[i].partDropped(thePart);
   			//found = true;
   		}
   		if(isShapeInBounds(x,y,queueBounds,r)){
   			found = syst.Devices[i].partDroppedInQueue(thePart);
   		}
   		if(isShapeInBounds(x,y,outQueueBounds,r)){
   			syst.Devices[i].partDroppedOutQueue(thePart);
   			found = true;
   		}
   		if(found){
   			break;
   		}
   	}
   	return found;
   }

   var up = function (evt) {
      if(this.dragEnabled===false){
      	return false;
      }
         this.animate({"fill-opacity": 1}, 500);
         // maybe, figure out what shape this was dragged to?
         var droppedOnElement = getDroppedOntoShape(this);
         if(droppedOnElement===false){
         	// put it back where it came from?
         	if(this.MTCItem.CurrLocation){
         		if(this.MTCItem.CurrLocation===this.MTCItem.CurrLocation.Machine){
         			// put it back on the machine location
         			this.attr({cx: this.MTCItem.CurrLocation.Machine.FinishedPartX , cy: this.MTCItem.CurrLocation.Machine.FinishedPartY})
         		}else{
         		    // restack the queue it came from
         		    this.MTCItem.CurrLocation.Machine.arrangeQueueShapesHorizStacks();
         		}
         	}
         }
     }
   var formatSeconds = function(secs){
   	var numSecs = Math.floor(secs % 60);
   	var numMins = Math.floor(secs / 60);
   	var mins = numMins.toString(); if(mins.length<2){
   	  mins = '0' + mins;}
   	var secons = numSecs.toString(); if(secons.length<2){secons='0' + secons;}
   	return mins + ":" + secons;
   }

   var SelectedPartSearchLink = function(partID){
   	var prt = mts.ActiveSystem.Parts[partID];
   	if(prt){
   		mts.ActiveSystem.setSelectedPart(prt);
   	}
   }

   var randNorm = function(mean,stdev){
   	var rnd = (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
   	return Math.round(rnd*stdev+mean);
   }

	var mts = {};

   // System Simulation "class"
   mts.System = function(){
      this.Devices = new Array();
      this.Agents = new Array();
      this.Orders = new Array();
      this.PartTypes = new Array();
      this.Parts = new Array();
      this.ProcessDefs = new Array();
      this.statsDiv = null;
      this.tickDiv = null;
      this.CreateNewOrdersOnCompletion = false;

      this.PartRad = 30;

      // flash parts before we start ticking to clue users to move them around
      this.flashOn = false; // parts are original colors when false, flashed color when true
      this.flasherTimeoutObj = null;
      this.startFlashing = function(){
      	this.flasherTimeoutObj = setInterval('mts.ActiveSystem.flashParts();',1400);
      }
      this.stopFlashing = function(){
         this.flashOn = true;
      	this.flashParts();
      	clearInterval(this.flasherTimeoutObj);
      }
      this.flashParts = function(){
         for(var i=0;i<this.Devices.length;i++){
            var currDev = this.Devices[i];
            if(currDev.QueueParts.length>0){
               var thePart = currDev.QueueParts[0];
               if(this.flashOn){
                  //var color = thePart.PartType.color;
                  var color = Raphael.color('black');
                  var stkWd = 2;
               }else{var color = Raphael.color('purple');var stkWd = 10;}
               thePart.Shape.animate({stroke: color, 'stroke-width': stkWd},1000);
            }
         }
         this.flashOn = !(this.flashOn);
      }

      this.ticking = false;
      this.tickTimer = 0;
		this.ticks = 0;
		this.tick = function(){
			this.ticks = this.ticks + 1;
			this.tickDiv.innerHTML = '<h1>' + formatSeconds(this.ticks) + '</h1>';
			if(this.SelectedPart){
				this.statsDiv.innerHTML = this.SelectedPart.getDivContent();
			}
		}
		this.stopTicking = function(){
			this.ticking = false;
			clearInterval(this.tickTimer);
		}
		
		this.SelectedPart = null;
		this.setSelectedPart = function(thePart,numFlash){
		 document.getElementById('orderMore').disabled = false;
			if(this.SelectedPart){
			   if(this.SelectedPart===thePart){}else{
			   	//deselect it
			   	if(this.SelectedPart.onDeselect){
			   		this.SelectedPart.onDeselect();
			   	}
			   }
			}
			// set thePart as selected
			this.SelectedPart = thePart;
			var numFlashes = numFlash || 1;
			if(thePart.onSelect){
				thePart.onSelect(numFlash);
			}
		}
		
      this.NextPartID = 0;
      this.NextOrderID = 0;

      this.hasDoneMTUpdate = false; //flag to let us know if we've run an actual mt connect update yet.  on the first one, we need to initialize machines, queues

      this.paper = null;

      this.NewDevice = function(name,deviceID){
         var res = new mts.Device();
         res.name = name;
         res.deviceID = deviceID;
         this.Devices.push(res);
         res.parent = this;
         return res;
      }

      this.NewAgent = function(url){
         var res = new mts.Agent();
         res.url = url;
         this.Agents.push(res);
         return res;
      }

      this.OrderCompleted = function(theOrder){
      	// just create a new order
      	if(this.CreateNewOrdersOnCompletion===false){
         	// figure out if we are done with all our orders, then stop ticking
         	this.stopTicking();
      	}else{
      	  var currOrd = this.NewOrder(theOrder.PartType,theOrder.Parts.length);
         	for(var j=0;j<currOrd.Parts.length;j++){
         		var currPart = currOrd.Parts[j];
         		currPart.initializeShape(paper);
         	}
            // initialize queue displays
            for(var i=0;i<this.Devices.length;i++){
            	this.Devices[i].arrangeQueueShapes();
            }
            if(currOrd.Parts[0].CurrLocation){
               currOrd.Parts[0].CurrLocation.Machine.partDroppedInQueue(currOrd.Parts[0]);
            }
         }
      }

      this.NewOrder = function(partType,num){
         var res = new mts.Order();
         res.PartType = partType;
         res.parent = this;
         res.ID = this.NextOrderID;
         this.NextOrderID = this.NextOrderID + 1;
         for(var i=0;i<num;i++){
            var currPart = new mts.Part();
            currPart.Order = res;
            currPart.populateProcessesFromPartType(partType);
            currPart.ID = this.NextPartID;
            currPart.UID = currPart.PartType.name + '_' + currPart.ID;
            this.Parts[currPart.UID] = currPart;
            currPart.inOrderIdx = i+1;
            this.NextPartID = this.NextPartID + 1;
            res.Parts.push(currPart);
            currPart.initialize();
         }
         if(this.ordersDiv){
            this.ordersDiv.innerHTML = this.getOrdersHTML(); 	
         }
         this.Orders.push(res);
         return res;
      }

      this.NewPartType = function(name){
         var res = new mts.PartType();
         res.name = name;
         res.color = Raphael.getColor();
         this.PartTypes.push(res);
         return res;
      }

      this.NewProcessDef = function(name,inDur,inSetup){
         var res = new mts.ProcessDef();
         res.name = name;
         this.ProcessDefs.push(res);
         if(inDur){
         	res.Duration_ms = inDur;
         }else{res.Duration_ms=1000;}
         if(inSetup){
         	res.SetupDuration_ms=inSetup;
         }else{res.SetupDuration_ms=1000;}
         return res;
      }

      this.InitializeDrawing = function(paper,divWidth,divHeight,divLeft){
         this.statsDiv = document.getElementById('stats');
         this.tickDiv = document.getElementById('timer');
         this.ordersDiv = document.getElementById('partFinder');

         this.paper = paper;
         // divy up the paper across height
         var htPerDevice = paper.height / this.Devices.length;
         if(htPerDevice > 200 ){
         	htPerDevice = 200;
         }
         this.PartRad = htPerDevice / 8;
         var deviceShpHeight = htPerDevice * .8;
         var machWidth = ( paper.width / 3 );
         var machXStart = machWidth;
         // create horizontal lines for separating devices
         for(var i=0;i<this.Devices.length;i++){
            var currY = htPerDevice * i;
            var currDevice = this.Devices[i];
         	paper.path("M0," + currY + ",L" + paper.width + "," + currY);
         	// create arrows
         	var arrow = paper.path("M" + ((machWidth*.75)+15) + ',' + (currY+(htPerDevice*.35)) +',L' + ( machXStart - 30 ) + ',' + (currY+(htPerDevice*.35) )
         	  + 'L' + (machXStart -30) + ',' + (currY+(htPerDevice*.25)) + 'L' + (machXStart - 15) + ',' + (currY +(htPerDevice*.5))
         	  + 'L' + (machXStart -30) + ',' + (currY+(htPerDevice*.75)) + 'L' + (machXStart - 30) + ',' + (currY +(htPerDevice*.65))
         	  + 'L' + ((machWidth*.75)+15) + ',' + (currY+(htPerDevice*.65)) + 'L' + ((machWidth*.75)+15) + ',' + (currY+(htPerDevice*.35))
         	  );
         	arrow.dblclick(inArrowDblClick);
         	arrow.touchend(tapEnd);
         	arrow.onDblTap = inArrowDblClick;
         	arrow.MTCItem = currDevice;
         	arrow.attr({fill: Raphael.color('white')});
         	
         	var arrow = paper.path("M" + ((machXStart+machWidth)+15) + ',' + (currY+(htPerDevice*.35)) +',L' + ( paper.width-(machWidth*.65) - 30 ) + ',' + (currY+(htPerDevice*.35) )
         	  + 'L' + (paper.width-(machWidth*.65)-30) + ',' + (currY+(htPerDevice*.25)) + 'L' + (paper.width-(machWidth*.65) - 15) + ',' + (currY +(htPerDevice*.5))
         	  + 'L' + (paper.width-(machWidth*.65)-30) + ',' + (currY+(htPerDevice*.75)) + 'L' + (paper.width-(machWidth*.65) - 30) + ',' + (currY +(htPerDevice*.65))
         	  + 'L' + ((machXStart+machWidth)+15) + ',' + (currY+(htPerDevice*.65)) + 'L' + ((machXStart+machWidth)+15) + ',' + (currY+(htPerDevice*.35))
         	  );
         	
         	arrow.dblclick(arrowDblClick);
         	arrow.touchend(tapEnd);
         	arrow.onDblTap = arrowDblClick;
         	arrow.attr({fill: Raphael.color('white')});
         	// now create a rectangle for the current device, and a text box as well
         	arrow.MTCItem = currDevice;
         	currDevice.MachineShape = paper.rect(machXStart,currY+5,machWidth,deviceShpHeight,0.25);
         	currDevice.MachineShape.attr({fill: Raphael.color('yellow')}); //whitesmoke
         	currDevice.MachineShape.MTCItem = currDevice;
         	currDevice.MachineShape.MTCClass = 'Machine';
         	currDevice.MachineShape.dblclick(machineDblClick);
         	currDevice.MachineShape.touchend(tapEnd);
         	currDevice.MachineShape.onDblTap = machineDblClick;
         	currDevice.MachineShape.node.MTCObject = this;
         	currDevice.TimeShape = paper.rect(machXStart, currY+5,4,8);
         	currDevice.TimeShape.origWidth = 4;
         	currDevice.TimeShape.fullWidth = machWidth;
         	currDevice.TimeShape.attr({fill: Raphael.color('brown')});
         	var color = Raphael.color("black");
         	currDevice.TextShape = paper.text(machXStart+(machWidth/2),currY+5+(deviceShpHeight*.9),currDevice.name);
         	currDevice.TextShapeLabel = paper.text(machXStart+(machWidth/2),currY+(deviceShpHeight*.08),'Machine');
         	currDevice.ActivePartX = currDevice.TextShape.attr('x');
         	currDevice.ActivePartY = currDevice.MachineShape.attr('y') + (currDevice.MachineShape.attr('height')/2);
         	currDevice.FinishedPartX = currDevice.MachineShape.attr('x')+currDevice.MachineShape.attr('width');
         	currDevice.FinishedPartY = currDevice.MachineShape.attr('y') + (currDevice.MachineShape.attr('height')/2);
         	currDevice.TextShape.MTCClass = 'MachineText';
         	currDevice.TextShape.node.MTCObject = this;
         	
         	currDevice.QueueShape = paper.rect(5,currY+5,machWidth*.75,deviceShpHeight);
         	currDevice.QueueShape.attr({fill: Raphael.color('whitesmoke')});
         	currDevice.InQueueObj.xLoc = 5 + machWidth*.75;
         	currDevice.InQueueObj.yLoc = currY + 5 + deviceShpHeight - 20;
         	paper.text(currDevice.QueueShape.attr('x')+(currDevice.QueueShape.attr('width')/2),currDevice.QueueShape.attr('y')+(currDevice.QueueShape.attr('height')*.15),'In Queue').MTCClass='InQueue';
         	currDevice.OutQueue = paper.rect(paper.width-(machWidth*.65),currY+5,machWidth*.5,deviceShpHeight);
         	currDevice.OutQueue.attr({fill: Raphael.color('whitesmoke')});
         	currDevice.OutQueue.MTCItem = currDevice;
         	currDevice.OutQueue.dblclick(outQueueDblClick);
         	currDevice.OutQueue.touchend(tapEnd);
         	currDevice.OutQueue.onDblTap = outQueueDblClick;
         	paper.text(currDevice.OutQueue.attr('x')+(currDevice.OutQueue.attr('width')/2),currDevice.OutQueue.attr('y')+(currDevice.OutQueue.attr('height')*.15),'Out Queue').MTCClass='MH Queue';
         	
         	currDevice.SpindleBaseX = currDevice.MachineShape.attr('x') + currDevice.MachineShape.attr('width') - 10;
         	currDevice.SpindleBaseY = currDevice.MachineShape.attr('y') + currDevice.MachineShape.attr('height') - 10;
         	currDevice.Spindle = paper.circle(currDevice.SpindleBaseX,currDevice.SpindleBaseY,4);
         	currDevice.Spindle.attr({fill: Raphael.color('blue')});
         	currDevice.Spindle.MTCItem = currDevice;
         }
         // initialize process def colors (just pick any color)
         for(var i=0;i<this.ProcessDefs.length;i++){
            this.ProcessDefs[i].color = Raphael.getColor();
         }
         // initialize part shapes
         for(var i=0;i<this.Orders.length;i++){
         	var currOrd = this.Orders[i];
         	for(var j=0;j<currOrd.Parts.length;j++){
         		var currPart = currOrd.Parts[j];
         		currPart.initializeShape(paper);
         	}
         }
         // initialize queue displays
         for(var i=0;i<this.Devices.length;i++){
         	this.Devices[i].arrangeQueueShapes();
         }

         this.initialMTUpdate();

      }

      this.initialMTUpdate = function(){
      	for(var i=0;i<this.Devices.length;i++){
         	this.Devices[i].setStatus('IDLE-NO-PART');
         	this.Devices[i].updateAgent('queue');
         	this.Devices[i].updateAgent('process',false);
         }
      }

      this.FinishedParts = new Array();
      this.AddFinishedPart = function(thePart){
         this.FinishedParts.push(thePart);
         var stackTop = this.PartRad; // this.paper.height;
      	for(var i=this.FinishedParts.length-1;i>=0;i--){
      	  this.FinishedParts[i].Shape.animate({cx: paper.width - (this.PartRad/2) , cy: stackTop - (this.PartRad/2) , r: this.PartRad/2},1000);
      		stackTop = stackTop + (this.PartRad);
      		if(stackTop>this.paper.height){
      			return;
      		}
      	}
      }

      this.enableDisableAutoRun = function(){
         var chk = document.getElementById('chkAutoRun');
         if(chk!==undefined){
            var doEnable = chk.checked;
            for(var i=0;i<this.Devices.length;i++){
               var checkDev = this.Devices[i];
               if(doEnable===true){
                  this.stopFlashing();
                  checkDev.autoRun = true;
                  // start an auto run
                  if(checkDev.CurrPart===null && checkDev.QueueParts.length>0){
                     checkDev.partDropped(checkDev.QueueParts[0]);
                  }
               }else{
                  checkDev.autoRun = false;
               }
            }
         }
      }

      this.getOrdersHTML = function() {
      	var result = '<br /><h2>Parts/Orders:</h2>';
      	for(var i=0;i<this.Orders.length;i++){
      		result = result + '<details><summary>Order ' + ( this.Orders[i].ID + 1) + '</summary><p>';
      		var currOrder = this.Orders[i];
      		for(var j=0;j<currOrder.Parts.length;j++){
      		   var partID = currOrder.Parts[j].PartType.name + '_' + (currOrder.Parts[j].ID + 0);
      			result = result + '<a id="' + partID + '" onclick="SelectedPartSearchLink(' + "'" + partID + "'" + ');">' + currOrder.Parts[j].PartType.name + '_' + (currOrder.Parts[j].ID + 1) + '</a> ';
      		}
      		result = result + '</p></details>'
      	}
      	return result;
      }
   }

   mts.ActiveSystem = null;

   // MT Connect Device (machine) "class"

	mts.Device = function(){
	   this.deviceID = '';
		this.name = '';
		this.autoRun = false;
		this.parent = null; // system
		this.agent = null;
		this.MachineShape = null;
		this.TimeShape = null;
		this.TextShape = null;
		this.QueueShape = null;//raphael shape
		this.OutQueue = null; //raphael shape
		this.Spindle = null; //raphael shape
		
		this.Status = '';
		this.setStatus = function(status){
			this.Status = status;
			this.updateAgent('status');
			if(status==='WORKING'){
				this.joules = 150;
			}else{
			   if(status==='WORKING-SETUP'){
			   	this.joules = 20;
			   }else{
			      this.joules = 20;
			   }
			}
			this.updateAgent('electrical');
		}
		
		this.joules = 0;
		
		this.SpindleUpdate_ms = 300;
		this.SpindleBaseX = 0;
		this.SpindleBaseY = 0;
		this.ProcTimeRemaining = 0;
		this.doAnimateSpindle = false;
		this.StopSpindleAnim = function(inTime){
			this.doAnimateSpindle=false;
	       var newX = this.SpindleBaseX;
	       var newY = this.SpindleBaseY;
	       if(inTime===undefined){
	           inTime = 1000;
	       }
	       // send the spindle to the corner in timeRemaining
	       this.Spindle.animate(
	          {cx: newX, cy: newY},
	          inTime,
	          function(){
	          	// MTCONNECT this.MTCItem is device, so update from there?
	          	this.MTCItem.updateAgent('spindleLoc');
	          }
	       );
		}
		this.AnimateSpindle = function(){
		    this.Spindle.toFront();
		    // get time remaining in cycle
		    if(this.ProcTimeRemaining<=this.SpindleUpdate_ms){
		       /*this.doAnimateSpindle=false;
		       var newX = this.SpindleBaseX;
		       var newY = this.SpindleBaseY;
		       // send the spindle to the corner in timeRemaining
		       this.Spindle.animate(
		          {cx: newX, cy: newY},
		          this.ProcTimeRemaining,
		          function(){
		          	// MTCONNECT this.MTCItem is device, so update from there?
		          	this.MTCItem.updateAgent('spindleLoc');
		          }
		       );*/
		       this.StopSpindleAnim(this.ProcTimeRemaining);
		       return;
		    }
			if(this.doAnimateSpindle){
			   this.Spindle.toFront();
   			if(this.Spindle){
   			   var newX = this.ActivePartX + (Math.pow(-1,Math.ceil(10*Math.random(this.ProcTimeRemaining)))*((this.parent.PartRad-5)*Math.random(this.ProcTimeRemaining)));
   			   var newY = this.ActivePartY + (Math.pow(-1,Math.ceil(10*Math.random(this.ProcTimeRemaining)))*((this.parent.PartRad-5)*Math.random(this.ProcTimeRemaining)));
   				this.Spindle.animate(
   				     {cx: newX , cy: newY},
   				     this.SpindleUpdate_ms,
   				     function(){
   				     	  // animate some more while we should be animating
   				     	  // MTCONNECT this.MTCItem is device, so update from there?
   				     	  this.MTCItem.updateAgent('spindleLoc');
   				     	  this.MTCItem.ProcTimeRemaining = this.MTCItem.ProcTimeRemaining - this.MTCItem.SpindleUpdate_ms;
   				     	  this.MTCItem.AnimateSpindle();
   				     }
   				  )
   			}
   		}
		}
		
		this.getName = function(){return this.name;}
		
		this.sendUpdateAgent = function(agent,method,dataItemId,value){
		    if(!(agent.running)){
		    	return;
		    }
		    var pswd = document.getElementById('mtcpass');
		    var chk = document.getElementById('enableMTC');
		    var pswdTxt = 'pwd=' + pswd.value;
		    if(chk.checked === false){
		    	return;
		    }else{if(this.parent.hasDoneMTUpdate===false){this.parent.hasDoneMTUpdate=true;this.parent.initialMTUpdate();}}
			var url = agent.url + '/?method=' + method + '&deviceName=' + this.deviceID + '&dataItemId=' + dataItemId + '&value=' + value + '&' + pswdTxt;
			var xmlhttp=new XMLHttpRequest();
			xmlhttp.agent = agent;
			
			xmlhttp.onreadystatechange = function(){
			   if(this.readyState==4){
			   	if(this.status.toString().substr(0,1)!='2'){
			   		// no good
			   		this.agent.running = false;
			   	}else{this.agent.running = true;}
			   }
			}
			xmlhttp.open('put',url,true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			//xmlhttp.setRequestHeader("Content-length", pswdTxt.length);
			//xmlhttp.setRequestHeader("Connection", "close");
			xmlhttp.send(pswdTxt);
		}
		this.getDataItemId = function(name){
			return this.dataItemIds[name];
		}
		this.updateAgent = function(item,overrideProcess){

			switch(item){
				case 'spindleLoc':
				  // get spindleX and spindleY dataItemId's
				  var xLocID = this.getDataItemId('spindleX');
				  var yLocID = this.getDataItemId('spindleY');
				  var xLocVal = this.Spindle.attr('cx');
				  var yLocVal = this.Spindle.attr('cy');
				  this.sendUpdateAgent(this.agent,'storeSample',xLocID,((xLocVal - this.MachineShape.attr('x'))/6)-25);
				  this.sendUpdateAgent(this.agent,'storeSample',yLocID,(yLocVal - this.MachineShape.attr('y'))/6);
				  break;
            case 'status':
               // get status dataItemId
               var statusID = this.getDataItemId('status');
               this.sendUpdateAgent(this.agent,'storeEvent',statusID,this.Status);
               break;
            case 'process':
               // get procCode and queueCode dataItemId's
               var procCodeId= this.getDataItemId('procCode');
               var queueCodeId= this.getDataItemId('queueCode');
               var queueCode = this.getQueueString();
               if(this.CurrProc !== undefined){

                  if(overrideProcess !== undefined){
                     if(overrideProcess===true){
                        var procCode = this.CurrProc.getProcessString();
                     }else{
                        var procCode = '';
                        }
                     }
                     else{
                        var procCode = this.CurrProc.getProcessString();
                     }
               }
               else{
                  var procCode='';
               }
               this.sendUpdateAgent(this.agent,'storeEvent',procCodeId,procCode);     	
               this.sendUpdateAgent(this.agent,'storeEvent',queueCodeId,queueCode);
               break;
            case 'queue':
               var queueCodeId= this.getDataItemId('queueCode');
               var queueCode = this.getQueueString();
               this.sendUpdateAgent(this.agent,'storeEvent',queueCodeId,queueCode);
               break;
            case 'electrical':
               // get power dataItemId
               var powerId = this.getDataItemId('power');
               this.sendUpdateAgent(this.agent,'storeSample',powerId,this.joules);
               break;
            default:
			}
		}
		
		this.InQueueObj = {};
		this.InQueueObj.Machine = this;
		this.InQueueObj.yLoc = 0;
		this.InQueueObj.xLoc = 0;
		this.InQueueObj.getName = function(){
		    return this.Machine.name + ' input queue';	
		}
		this.OutQueueObj = {};
		this.OutQueueObj.Machine = this;
		this.OutQueueObj.getName = function(){
			return this.Machine.name + ' output queue';
		}
		this.Machine = this;
		this.ActivePartX = 0; //this is where we put our "active part"
		this.ActivePartY = 0;
				
		this.LastPartType = null;
		this.CurrPart = null;
		
		this.QueueParts = new Array();
		this.InTransitToMe = new Array();
		
		this.getQueueString = function(){
			var res = '';
			for(var i=0;i<this.QueueParts.length;i++){
				if(res!=''){res = res + '|';}
				res = res + this.QueueParts[i].ID;
			}
			for(var i=0;i<this.InTransitToMe.length;i++){
				if(res!=''){res = res + '|';}
				res = res + this.InTransitToMe[i].ID;
			}
			return res;
		}
		
		this.arrangeQueueShapes = function(){
		    this.arrangeQueueShapesHorizStacks();
		}
		
		this.arrangeQueueShapesHorizStacks = function(){
		   var qHeight = this.QueueShape.attr('height');
		   var qWidth = this.QueueShape.attr('width');
		   var qX = this.QueueShape.attr('x');
		   var qY = this.QueueShape.attr('y');
		
		    var firstPart = this.QueueParts[0];
		    if(firstPart){
      			var currX =  qX + qWidth - firstPart.Shape.attr('r');
      			var currY = qY + qHeight - firstPart.Shape.attr('r');
      			for (var i=0;i<this.QueueParts.length;i++){
      			   if(i>0){
      			      currX = currX - (this.QueueParts[i-1].Shape.attr('r')) - 2;	
      			   }
      				var currPart = this.QueueParts[i];
      				if(currX < qX){
      					//reset qX, put qY up by r
      					currX = qX + qWidth - (currPart.Shape.attr('r'));
      					currY = currY - (2*currPart.Shape.attr('r'));
      				}
      				currPart.Shape.attr({cx:currX , cy:currY});
      				currX = currX - (currPart.Shape.attr('r')) - 2;
      				
      			}
            }
		}
		
		this.arrangeQueueShapesVerticalStack = function(){
			// set x y locations of our queue shapes
			var devHeight = this.MachineShape.attr('height');
			var devBot = this.MachineShape.attr('y') + devHeight;
			var currX = 20;
			var currY = devBot;
			for (var i=0;i<this.QueueParts.length;i++){
				var currPart = this.QueueParts[i];
				if(i==0){
			      currY=currY-currPart.Shape.attr('r');
			   }
				currPart.Shape.attr({cx:currX , cy:currY});
				currY = currY - (2*currPart.Shape.attr('r')) - 2;
			}
		}
		
		this.PartIsInTransit = function(thePart){
			for(var i=0;i<this.InTransitToMe.length;i++){
		    	if(this.InTransitToMe[i]===thePart){
		    		return true;
		    	}
		    }
		    return false;
		}
		
		this.AddPartToInTransit = function(thePart){
		    if(this.PartIsInTransit(thePart)===false){
		    	this.InTransitToMe.push(thePart);
		    }
		}
		
		this.RemovePartFromInTransit = function(thePart){
		    for(var i=0;i<this.InTransitToMe.length;i++){
		    	if(this.InTransitToMe[i]===thePart){
		    		this.InTransitToMe.splice(i,1);
		    		break;
		    	}
		    }
		}		

		this.PartIsInQueue = function(thePart){
			for(var i=0;i<this.QueueParts.length;i++){
		    	if(this.QueueParts[i]===thePart){
		    		return true;
		    	}
		    }
		    return false;
		}
		
		this.AddPartToInQueue = function(thePart){
		    this.RemovePartFromInTransit(thePart);
		    if(this.PartIsInQueue(thePart)===false){
		    	this.QueueParts.push(thePart);
		    }
		}
		
		this.RemovePartFromInQueue = function(thePart){
		    for(var i=0;i<this.QueueParts.length;i++){
		    	if(this.QueueParts[i]===thePart){
		    		this.QueueParts.splice(i,1);
		    		break;
		    	}
		    }
		}
		
		this.ProcessAnim = null; // raphael animation object
		this.ProcessAnim2 = null; // raphael animation object - time bar crossing horizontal on machine shp
		this.SetupAnim = null; // raphael animation object
		this.stopMachineForBreakdown = function(){
			this.PreemptProcess(true,true);
			this.MachineShape.attr({fill: Raphael.color('red')});
			this.setStatus('BROKEN');
		}
		this.restartMachineFromBreakdown = function(){
			// call partdropped with currpart as argument
			this.SetupComplete();
		}
		this.PreemptProcess = function(requireCompletion,Interrupted){
		 if(this.CurrProc){
		    // stop animation changing shape color
		    if(this.SetupAnim){
		    	return; // for some reason, unable to properly stop setup...
		    }
		    if(this.ProcessAnim){
		       var PreemptObj = {}
		       PreemptObj.TimeRemaining = this.ProcTimeRemaining;
		       PreemptObj.Process = this.CurrProc;
		       PreemptObj.Part = this.CurrPart;
		       if(requireCompletion===true){
		       	this.CurrPart.PreemptObj = PreemptObj;
		       }
		       this.ProcessAnim.stop();	
		       this.ProcessAnim2.stop();
		       this.TimeShape.animate({width: this.TimeShape.origWidth},400);
		       this.ProcessComplete(requireCompletion,Interrupted);
		    }
		 }
		}
		this.ProcessComplete = function(Preempted,Interrupted){
		/* preempted means we stopped the current process to let something else on the machine,
		    and so the process needs to be resumed later, when the user puts the part back on the machine.
		    Interrupted means the machine has been stopped, as well as the current process.  The part should stay
		    in its place
		    */
		   this.ProcessAnim = null;
		   this.StopSpindleAnim();
			//var color = Raphael.color('#FFFF99');
			var color = Raphael.color('#FF7F24');
			if(this.CurrProc.partShapeAfterProcessEnd){
				var NewShape = this.CurrProc.partShapeAfterProcessEnd();
				this.CurrPart.Shape.remove();
				this.CurrPart.Shape = NewShape;
			}
			this.MachineShape.attr({fill: color});
			// mark the process complete on the part
			if(Preempted){
			   if(Preempted===false){
			      this.CurrPart.procIdx = this.CurrPart.procIdx + 1;	
   			}	
			}else{this.CurrPart.procIdx = this.CurrPart.procIdx + 1;	}
			
			var PartShouldExitMachine = true;
			if(Interrupted){
			   if(Interrupted===true){
			      PartShouldExitMachine = false;	
			   }
			}
			this.CurrProc.logEnd();
			if(PartShouldExitMachine===true){
			   var newX = this.MachineShape.attr('x')+this.MachineShape.attr('width');
   			var newY = this.MachineShape.attr('y') + (this.MachineShape.attr('height')/2);
   			this.CurrPart.Shape.attr({cx: newX , cy: newY});
   			this.CurrProc = null;	
			   this.CurrPart.enableDrag();
			}
			this.setStatus('BLOCKED-UNLOAD');
			//this.setStatus('IDLE-NO-PART');
			//this.updateAgent('process',false); // ,false sets current process on machine as nothing
			if(this.autoRun===true){
			   this.CurrPart.Shape.animate(
			      { cx: this.OutQueue.attr('x') + (this.OutQueue.attr('width')/2) ,
			        cy: this.OutQueue.attr('y') + (this.OutQueue.attr('height')/2) } ,
			        500
			   );
			   this.partDroppedOutQueue(this.CurrPart);
            if(this.QueueParts.length>0){
			      this.partDropped(this.QueueParts[0]);
			   }
			}
		}
		
		this.SetupComplete = function(){
		   this.LastPartType = this.CurrPart.PartType;
		   this.SetupAnim = null;
		   var color = Raphael.color("palegreen"); //lawngreen
			this.MachineShape.attr({fill: color});
			this.CurrProc.logSetupEnd();
			this.CurrProc.logStart();
			//this.ProcTimeRemaining = this.CurrProc.Duration_ms();
			var dur = this.CurrProc.Duration_ms() / 1000;
			var procTime = randNorm(dur,dur*.33)*1000;
			this.ProcTimeRemaining = procTime;
			this.doAnimateSpindle = true;
			this.AnimateSpindle();
			this.ProcessAnim2 = this.TimeShape.animate(
			   {
			      width : this.TimeShape.fullWidth
			   },
			   procTime,
			   '<>',
			   function(){
			      this.animate({width:this.origWidth},400);
			   }
			);
			this.ProcessAnim = this.MachineShape.animate(
			   { fill: color } ,
			   procTime,
			   function(){
			         this.MTCItem.ProcessComplete();
			      }
			
			   );
		}
		
		this.partDropped = function(thePart){ // part dropped onto the machine shape
		    // first decide if we can accept the part
		    if(thePart===this.CurrPart){
		    	return false;
		    }
		    // prevents you dragging straight from machine to machine
		    if(thePart.CurrLocation.Machine.CurrPart===thePart){
		    	return false;
		    }
		    var TheProc = thePart.Processes[ thePart.procIdx ];
		    if(TheProc){
		       if(TheProc.ProcessDef.machine===this){
		       	// accept the part
		       }else{
		          // deny the part
		          return false;
		       }
		    }else{
		       // should only happen if someone drags a part to a machine when it should be moved to an out queue and sent away\
		       // clear last location of thePart
		       thePart.destroy();
		       return false;
		    }
		
			if(this.CurrPart==null){
				//accept the part
				this.CurrPart = thePart;
				thePart.disableDrag();
				var prevLoc = thePart.CurrLocation.Machine
				thePart.CurrLocation = this;
				// remove the part from its previous location
				prevLoc.RemovePartFromInQueue(thePart);
				this.updateAgent('queue');
            prevLoc.arrangeQueueShapes();
				// locate the part on this
				var x = this.ActivePartX;
				var y = this.ActivePartY;
				// start the process up
				var TheProc = thePart.Processes[ thePart.procIdx ];
				thePart.Shape.animate({cx : x , cy : y},TheProc.SetupDuration_ms(),'elastic');
				this.CurrProc = TheProc;
				TheProc.Part = thePart;
				TheProc.logSetupStart();
				this.Status = 'setup';
				var SetupColor = Raphael.color("pink");
				this.MachineShape.attr({fill: SetupColor});
				this.SetupAnim = this.MachineShape.animate(
				        {fill: SetupColor},
				        TheProc.SetupDuration_ms() ,
				        function(){
					          this.MTCItem.SetupComplete();
					       }
				)
			}else{
			   // don't accept the part
			   //thePart.CurrLocation.Machine.arrangeQueueShapes();
			   return false;
			}
		}
		this.partDroppedInQueue = function(thePart){
		    // check the part's next process and make sure it gets done on this machine
		    var NextProc = thePart.Processes[thePart.procIdx];
		    if(NextProc){
		    	if(NextProc.ProcessDef.machine === this){
		    		// accept the part
		    	}else{
		    	  return false;
		    	}
		    }else{
		       // destroy the part
		       thePart.destroy();
		       return true; // the return tells the calling function whether the part was handled properly. if we destroy it, it's technically been handled
		    }
		    if(thePart.CurrLocation){
		    	if(thePart.CurrLocation.Machine.CurrPart===thePart){
		    		return false;
		    	}
		    }
			// add the part to the queue
			if(thePart.CurrLocation){
   			if(thePart.CurrLocation.Machine===this){}else{
   			   thePart.CurrLocation.Machine.RemovePartFromInQueue(thePart);
   			   thePart.CurrLocation.Machine.arrangeQueueShapes();
   			}
   		}
   		thePart.CurrLocation = this.InQueueObj;
			this.AddPartToInQueue(thePart);
			this.arrangeQueueShapes();
			this.updateAgent('queue');
			
			if(this.CurrPart==null && this.autoRun){
			   this.partDropped(this.QueueParts[0]);	
			}
		}
		this.partDroppedOutQueue = function(thePart){
			// animate the part moving to its next location?
			var LastMach = thePart.CurrLocation;
			if(LastMach){
				LastMach.setStatus('IDLE-NO-PART');
			}
			thePart.CurrLocation = LastMach.Machine.OutQueueObj;
			LastMach.MachineShape.attr({fill: Raphael.color('yellow')})
			LastMach.CurrPart = null;
			// get next location
			thePart.disableDrag();
			var NextProc = thePart.Processes[thePart.procIdx];
			if(NextProc){
				var Dest = NextProc.ProcessDef.machine;
				Dest.AddPartToInTransit(thePart);
				Dest.updateAgent('queue');
				thePart.Shape.MTCDestination = Dest;
				thePart.Shape.animate(
				  { cx: Dest.InQueueObj.xLoc - this.parent.PartRad , cy: Dest.InQueueObj.yLoc - this.parent.PartRad } ,
				  3000 , '<>' ,
				  function(){
				  	     // get the handle to thePart (this.MTCItem)
				  	     var thePart = this.MTCItem;
				  	     thePart.CurrLocation = null;
				  	     this.MTCDestination.partDroppedInQueue(thePart);
				  	     thePart.enableDrag();
				     }
				)
			}else{
			   // destroy the part, it's done
			   thePart.destroy();
			   }
		
	}
		
	}


   // MT Connect Agent "class"
	mts.Agent = function(){
      this.url = '';
      this.running = true;
      this.Devices = new Array();
      this.addDevice = function(dev){
      	this.Devices.push(dev);
      	dev.agent = this;
      }
      this.update = function(){
      	// for each device we have, update its status
      }
	}
	
	// Order "class"
	mts.Order = function(){
	  this.Parts = new Array();
	  this.parent = null; // system object
	  this.ID = 0;
	  this.DueDate = null;
	  this.setDueDate = function(deltaSeconds){
	  	  this.DueDate = new Date( new Date().valueOf() + (1000 * deltaSeconds) );
	  }
	  this.PartType = null;
	  this.NumPartsCompleted = 0;
	  this.PartCompleted = function(thePart){
	  	  this.NumPartsCompleted = this.NumPartsCompleted + 1;
	  	  if(this.NumPartsCompleted >= this.Parts.length){
	  	  	  // notify the system that an order has been completed
	  	  	  this.parent.OrderCompleted(this);
	  	  }
	  }
	}
	
	// Part Type "class"
	mts.PartType = function(){
	  this.name = '';
	  this.color = null;
     this.ProcessDefs = new Array();	
     this.AddProc = function(procDef){
         var res = procDef.NewInstance();
         this.ProcessDefs.push(procDef);
         procDef.partType = this;
     }
	}
	
	// Part "class"
	mts.Part = function(){
	  this.Order = null;
	  this.ID = 0;
	  this.inOrderIdx = 0;
	  this.completed = false;
	  this.Processes = new Array();
	  this.procIdx = 0;
	  this.PartType = null;
	  this.Shape = null; //raphael shape
	  this.CurrLocation = null; // either a device or a queue for a device
	
	  this.initialize = function(){
	     // go to machine at processes[0]
	     var currMachine = this.PartType.ProcessDefs[0].machine;
	     // put it in queue at currMachine
	     currMachine.AddPartToInQueue(this);
	     this.CurrLocation = currMachine.InQueueObj;
	  }
	
	  this.destroy = function(){
	     if(this.completed===true){
	     	  return;
	     }
	     this.completed = true;
	     // tell my lot that one more part is finished
	     this.Order.PartCompleted(this);
	     // tell my last location i'm not there anymore
	  	  if(this.CurrLocation){
	          if( this.CurrLocation.Machine.CurrPart === this ){
	          	this.CurrLocation.Machine.CurrPart = null;
	          }
	       }
	     //var x = this.Shape.attr('x') + 1000;
	     var x = this.Order.parent.paper.width - this.Order.parent.PartRad;
       this.Shape.animate(
             {cx: x , "fill-opacity": .8 , "stroke-opacity": .9},
             3000,
             function(){
               this.MTCItem.Order.parent.AddFinishedPart(this.MTCItem);
               //this.remove();
             }
          );
	  }
	
	  this.onDeselect = function(){
	  	  if(this.Shape){
	  	     var color = Raphael.color('black');
	  	  	  this.Shape.animate({stroke: color , "stroke-width": 2 },1000);
	  	  }
	  }
	
	  this.onSelect = function(numFlashes){
	  	  if(this.Shape){
	  	     var numFlash = numFlashes || 1;
	  	  	  var color = Raphael.color('cornflowerblue');
	  	  	  this.Shape.animate({stroke: color , "stroke-width": 6 },800);
	  	  }
	  }
	
	  this.getDivContent = function(){
	  	  var res = '';
	  	  res = '<h2>Selected Part Info</h2><b>' + this.PartType.name + ':' + (this.ID+1) + '</b><br />';
	  	  res = res + '<b>Order: </b>' + (this.Order.ID+1) + '<br />';
	  	  if(this.CurrLocation){
	  	  	  res = res + '<b>Curr Location: </b>' + this.CurrLocation.getName() + '</b><br />';
	  	  }
	  	  if(this.Order.DueDate){
	  	  	  res = res + '<b>Due Date: </b>' + this.Order.DueDate + '<br />';
	  	  }
	  	  for(var i=0;i<this.Processes.length;i++){
	  	  	  var checkProc = this.Processes[i];
	  	  	  res = res + '<p>';
	  	  	  res = res + '<b>' + checkProc.ProcessDef.name + '</b><br />';
	  	  	
	  	  	  res = res + '<b>Setup</b> ' + checkProc.setupDuration() + '<br />';
	  	  	  res = res + '<b>Process</b> ' + checkProc.duration() + '<br />';
           res = res + '</p>';
	  	  }
	  	  return res;
	  }
	
	  this.enableDrag = function(){
	  	  this.Shape.drag(move,dragger,up);
	  	  this.Shape.dragEnabled = true;
	  	  this.Shape.attr({cursor: "move"});
	  }
	
	  this.disableDrag = function(){
	     this.Shape.dragEnabled = false;
	     this.Shape.attr({cursor: "pointer"});
	  	  //this.Shape.undrag(f);
	  }
	
	  this.initializeShape = function(paper){
	     // create my shape
	     this.Shape = paper.circle(10,10,this.Order.parent.PartRad);
	     var color = this.PartType.color;
	     this.Shape.attr({fill: color, "fill-opacity": 1, "stroke-width": 2, cursor: "move"});
	     this.enableDrag();
	     this.Shape.MTCClass = 'PartShape';
	     this.Shape.MTCSystem = this.Order.parent;
	     this.Shape.MTCItem = this;
	  }
	  this.populateProcessesFromPartType = function(PartType){
	     this.PartType = PartType;
	     for(var i=0;i<PartType.ProcessDefs.length;i++){
            var currProcDef = PartType.ProcessDefs[i];
            var currProcInst = currProcDef.NewInstance();
            currProcInst.Part = this;
            this.Processes.push(currProcInst);
	     }
	  }
	}
	
   // Process Def "class"
	mts.ProcessDef = function(){
	  this.name = '';
	  this.partType = null;
	  this.Duration_ms = 1000;
	  this.SetupDuration_ms = 1000;
	  this.color = null; // raphael color for the process
	  this.machine = null; // Device where the process takes place (at least, typically...)
	  this.partShapeAfterProcessEnd = null// attach a function that will return a new shape for the part after this process is over, if you want
	  this.NewInstance = function(){
	     var res = {};
	        res.ProcessDef = this;
	        res.Duration_ms = function(){
	           if(this.Part.PreemptObj){
	           	  return this.Part.PreemptObj.TimeRemaining;
	           }else{
	              return this.ProcessDef.Duration_ms;
	           }
	        }
	        res.SetupDuration_ms = function(){
	           if(this.ProcessDef.machine.LastPartType){
	           	  if(this.ProcessDef.machine.LastPartType.name === this.Part.PartType.name){
	           	  	  return 0.25 * this.ProcessDef.SetupDuration_ms;
	           	  }else{
	           	     return this.ProcessDef.SetupDuration_ms;
	           	  }
	           }else{
	              return this.ProcessDef.SetupDuration_ms;
	           }
	        }
	        res.StartTime = null;
	        res.EndTime = null;
	        res.Part = null;
	        res.getProcessString = function(){
	        	  // create a message string to send to mt connect
	        	  // order # - process id - part idx / order # parts
	        	  var delim = '-'
	        	  var result = '0' + delim + this.Part.Order.ID + delim + this.ProcessDef.name + delim + this.Part.inOrderIdx + '/' + this.Part.Order.Parts.length;
	        	  return result;
	        }
	        res.logStart = function(){
	        	  this.StartTime = new Date();
	        	  // MTCONNECT
	        	  this.ProcessDef.machine.updateAgent('process');
	        }
	        res.logEnd = function(){
	        	  this.EndTime = new Date();
	        	  // MTCONNECT
	        	  this.ProcessDef.machine.updateAgent('process',false);
	        }
	        res.duration = function(){
	        	  if(this.StartTime){
	        	  	  if(this.EndTime){
	        	  	  	  // return endtime-starttime
	        	  	  	  return '<b>Duration: </b>' + formatSeconds((this.EndTime - this.StartTime)/1000) + ' minutes';
	        	  	  }else{
	        	  	     // return now - starttime
	        	  	     var now = new Date();
	        	  	     return '<b><i>Elapsed: </b>' + formatSeconds((now - this.StartTime)/1000) + ' minutes</i>';
	        	  	  }
	        	  }else{
	        	     return '<i>not started</i>'
	        	  }
	        }
	        res.setupDuration = function(){
	        	  if(this.SetupStart){
	        	  	  if(this.SetupEnd){
	        	  	  	  // return endtime-starttime
	        	  	  	  return '<b>Duration: </b>' + formatSeconds((this.SetupEnd - this.SetupStart)/1000) + ' minutes';
	        	  	  }else{
	        	  	     // return now - starttime
	        	  	     var now = new Date();
	        	  	     return '<b><i>Elapsed: </i></b>' + formatSeconds((now - this.SetupStart)/1000) + ' minutes</i>';
	        	  	  }
	        	  }else{
	        	     return '<i>not started</i>'
	        	  }
	        }
	        res.SetupStart = null;
	        res.SetupEnd = null;
	        res.logSetupStart = function(){
	        	  this.SetupStart = new Date();
	        	  // MTCONNECT
	        	  this.ProcessDef.machine.setStatus('WORKING-SETUP')
	        }
	        res.logSetupEnd = function(){
	        	  this.SetupEnd = new Date();
	        	  // MTCONNECT
	        	  this.ProcessDef.machine.setStatus('WORKING')
	        }
	     return res;
	  }
	}
