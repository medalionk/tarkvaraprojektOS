var key="?apikey=10efd8d786c74f93886d1a955afd758b";
var url="http://api.planetos.com/v1/datasets";

//puts variable names in the dropdown menu
function populate(stndname,varname,htmlid){
	var options="";
	for(var i = 0; i < stndname.length; i++)
		options += '<option value='+varname[i]+'>'+(stndname[i]==null ? stndname[i]:stndname[i])+'</option>';
	var def = "<option value="+'default'+" class="+'default'+">"+'Select variable'+"</option>";
	$("#"+htmlid).html(def+options);
}
//gets variable names that correspond to the  dataset name
var units=[];
function getVariables(){
	$("#datasets").css("border", "");
	var id=$("#datasets").val();
	if (id=="") return false;
	console.log(id); 
	var stndname =[];
	var varname = [];
	units=[];
	$.getJSON(url+"/"+id+key, function(data){
		for (var i = 0;i <data.Variables.length ; i++){
			if (data.Variables[i].isData) {
				stndname.push(data.Variables[i].longName);
				varname.push(data.Variables[i].name);
				units.push(data.Variables[i].unit);
			}
		}
		populate(stndname,varname,"varid");	
	});
	$("#varid").attr("disabled",false);
}
//creates a reference for each chart object
var nextcanvasnr =0;
function createCanvas(){
	var canvasid = "chart" +nextcanvasnr;
	var divid = "canvasdiv" +nextcanvasnr;
	
	$("<div>").attr({id:divid}).appendTo("#graph");
	$("<canvas>").attr({id:canvasid}).click(modalFunc).appendTo("#"+divid);
	
	nextcanvasnr++;
	return canvasid;
}
// the modal screen opens up that takes from the targetid
function modalFunc(event){
	var targetid = event.target.id;
	if (Object.keys(combchart).length !== 0){
		var previd = Object.keys(combchart)[0];
		multigraphs(combchart[previd],graphList[targetid.slice(0,-1)].config);
		$("#"+previd).on("click",modalFunc).css("border","");
		combchart={};
		$("#myModal2").css("display","none");
		$("#combgraph").empty();
		console.log("olemasolevad graafid: ", graphList);
		return false;
	}
	//getting dataset value
	$("#d1").html('Dataset:<a href="http://data.planetos.com/datasets/'+dataList[targetid].id+'">'+dataList[targetid].id+"</a>")
	$("#v1").html("Variable:<p>"+dataList[targetid].variable+"<p>");
	//$("#t1").text(dataList[targetid].start+" - "+dataList[targetid].end);
	$("#g1").html("Graph style:<p>"+dataList[targetid].style+"<p>");
	$("#a1").html("Area:<p>"+"( "+dataList[targetid].lng+" ; "+dataList[targetid].lat+" )</p>");

	var ctx = $("#modalcontent");
	var newgraph = new Chart(ctx,graphList[targetid].config);
	$("#myModal").css("display","block");
	$('.close').off('click')
	$(".close").click(function(){
		$("#myModal").css("display","none");
		newgraph.destroy();
	});
	
	$("#myModal, #myModal2").click(function(e){
		if (e.target.id == "myModal" || e.target.id=="myModal2"){
			$("#myModal").css("display","none");
			$("#myModal2").css("display","none");
			newgraph.destroy();
		}

		
	});
	$("#remove").off('click');
	$("#remove").click(function(){
		removegraph(targetid,newgraph);
	});
	
	$("#combine").off("click");
	$("#combine").click(function(){
		var num = 0;
		//ehitab mymodal2 olemasolevatest graafidest
		for (var i=0;i<Object.keys(graphList).length;i++){
			var canvasid= Object.keys(graphList)[i]
			$("<canvas>").attr({id:canvasid+num}).click(modalFunc).appendTo("#combgraph");
			var ctx = $("#"+canvasid+num);
			var copygraph = new Chart(ctx,graphList[canvasid].config);
			console.log("kopeeritud:" , copygraph);
		}
		combine(targetid,newgraph);
		$("#myModal2").css("display","block");
	});
}

function removegraph(id,newgraph){
	newgraph.destroy();
	var chartid = id;
	$("#canvasdiv"+chartid.substring(5)).remove();
	delete graphList[chartid];
	delete dataList[chartid];
	if (Object.keys(graphList).length==0){
		$("#graph").hide();
	}
	$("#myModal").css("display","none");
	console.log(graphList);
	$("#mapgraph").focus();
	
}

var combchart={};
function combine(id,newgraph){
	newgraph.destroy();
	$("#myModal").css("display","none");
	$("#"+id).css("border","1px solid red").off("click");
	combchart[id] = graphList[id];
}

// gets values on the basis to do the chart
function generateGraph(){
	var input = getValues();
	if (!input){
		return false;
	}
	
	var currenturl = url+"/"+input.id+"/point"+key+"&var="+input.variable+"&lat="+
						input.lat+"&lon="+input.lng+
						"&start="+input.start+"&end="+input.end+"&count=20";
	console.log(currenturl);
	$.getJSON(currenturl,function(data){
		var values=[];
		var time=[];
		
		for(var i=0;i<data.entries.length;i++){
			values.push(data.entries[i].data[input.variable]);
			time.push(data.entries[i].axes.time);
		
		}
		/*
		if (lastGraph!=null && moregraphs==false){
			lastGraph.data.datasets[0].data=values;
			lastGraph.data.labels=time;
			
			var graphType = $("input[name=optradio]:checked").val();
			var data = lastGraph.data;
			var ctx = lastGraph.chart.canvas;
			lastGraph.destroy();
			lastGraph=new Chart(ctx,{
				type: graphType,
				data:data,
			});

			lastGraph.update();
			console.log(lastGraph);
			//$("#mapgraph").animate({ scrollTop: $("#"+canvasid).offset().top}, "slow");
			return false;
		}
		*/
		
		var canvasid = createCanvas();
		var modtime = modTime(time);
		createGraph(canvasid,values,modtime,input);
		moregraphs=false;
		$("#graph").show();
		$("#mapgraph").animate({ scrollTop: $("#"+canvasid).offset().top}, "slow");
		
		$("#mapgraph").focus();
		console.log(graphList);
		
	});
}
//creates the right time format
function modTime(time){
	var modTime=[]
	for (var i =0;i<time.length;i++){
		var year = time[i].substring(0,4);
		var month = time[i].substring(5,7);
		var day = time[i].substring(8,10);
		var hours = time[i].substring(11,13);
		var minutes = time[i].substring(14,16);
		modTime.push(year+"/"+month+"/"+day+" "+hours+":"+minutes);
		
	}
	return modTime;
}
//will get the values from the form and 
function getValues(){
	var start = $("#StarT").val();
	var end = $("#end").val();
	var isoStart = "";
	var isoEnd ="";
	var other=new Date(start);
	var other2=new Date(end);
	var graphType = $("input[name=optradio]:checked").val();
	
	if (start!="")isoStart= new Date(other.getTime()- other.getTimezoneOffset()*60000).toISOString();
	if (end!="") isoEnd = new Date(other2.getTime()- other2.getTimezoneOffset()*60000).toISOString();
	var lat = latlngobj.lat;
	var lng = latlngobj.lng;
	// will paint borders red when no values are put by the user
	if (lat ==""){
		$("#mapdiv").css("border", "solid red");
		return false;
	}
	var id = $("#datasets").val();
	if (id=="default"){
		$("#datasets").css("border", "solid red");
		return false;
	}
	var variable = $("#varid").val();
	if (variable=="default"){
		$("#varid").css("border", "solid red");
		return false;
	}

	
	return {
		id : id,
		variable : variable,
		lat : lat,
		lng : lng,
		start : isoStart,
		end : isoEnd,
		style : graphType,
		
	};	
}
$("#varid").on('change', function() {
	$("#varid").css("border", "");
});

// creates a default form with everything empty. KAS SEDA ÜLDSE KASUTATAKSE KUSAGIL?-ei
var moregraphs=false;
function generateNewGraph(){
	$("select#datasets").val("default");
	$("select#varid").val("default");
	$("#StarT").val("");
	$("#end").val("");
	removeMarker();
	$("#mapgraph").animate({ scrollTop: 0 }, "slow");
	//window.scrollTo(0, 0);
	$("#datasets").attr("disabled",true);
	$("#varid").attr("disabled",true);
	moregraphs=true;
	
	
}
var graphList= {};
var dataList=[];
//var lastGraph;
function createGraph(id,values,time,input){
	var index = document.getElementById("varid").selectedIndex;
	var unit = units[(index-1)];
	var graphType = $("input[name=optradio]:checked").val();
	var ctx = $("#"+id);
	var myChart = new Chart(ctx, {
	type: "bar",
	data: {
		labels: time,
		datasets: [{
			type: graphType,
			label: $("#varid").val(),
			data: values,
			yAxisID:"y-axis-0",
			fill:false,
		}]
	},
	options: {
		responsive:true,
		maintainAspectRatio:false,
		scales: {
			yAxes: [{
				ticks: {
					//beginAtZero:true
				},
				scaleLabel: {
					display:true,
					labelString:unit // siia peaks tulema ühik - siia tuli ühik RL
				}
			},
			{
				ticks: {
					//beginAtZero:fromzero
				},
				scaleLabel: {
					display:true,
					labelString:""
				},
				id:"y-axis-1",
				display:false,
				position:"right",
			}]
		}
	}
	});
	graphList[id]=myChart;
	dataList[id]=input;
	//lastGraph=myChart;
}

function multigraphs(c1,c2){
	console.log(c1);
	var id = createCanvas();
	var ctx = $("#"+id);
	var time1 = c1.data.labels;
	var time2 = c2.data.labels;
	var concattime = [...new Set(time1.concat(time2))].sort();
	var data1 = c1.data.datasets[0].data;
	var clone = JSON.parse(JSON.stringify(data1));
	for (var i=0;i<concattime.length;i++){
		if (time1.indexOf(concattime[i])===-1){
			clone.splice(i,0,null);
		}
		
	}
	console.log("c1",clone);
	var label1 = c1.data.datasets[0].label;
	var type1 =c1.data.datasets[0].type;
	var fromzero=false;
	if (Math.max(...data1)<1) {
		fromzero=true;
	}
	var unit1 = c1.options.scales.yAxes[0].scaleLabel.labelString;
	var unit11 = c1.options.scales.yAxes[1].scaleLabel.labelString;
	var unit2 = c2.options.scales.yAxes[0].scaleLabel.labelString;
	var unit22 = c2.options.scales.yAxes[1].scaleLabel.labelString;

	var chart = new Chart(ctx,{
		type: "bar",
		data: {
			labels: concattime,
			datasets: [{
				type: type1,
				label: label1,
				data: clone,
				yAxisID:"y-axis-0",
				fill:false,
				backgroundColor: "#8EEBEC",
				
			}]
		},
		options: {
			responsive:true,
			maintainAspectRatio:false,
			scales: {
				yAxes: [{
					ticks: {
						//beginAtZero:fromzero
					},
					scaleLabel: {
						display:true,
						labelString:unit1
					},
					id:"y-axis-0",
					
				},
				{
					ticks: {
						//beginAtZero:fromzero
					},
					scaleLabel: {
						display:true,
						labelString:""
					},
					id:"y-axis-1",
					display:false,
					position:"right",
				}]
			}
		}
	});
	
	if (unit2 === unit1){
		
		var clone = JSON.parse(JSON.stringify(c2.data.datasets[0].data));
		for (var i=0;i<concattime.length;i++){
			if (time2.indexOf(concattime[i])===-1){
				clone.splice(i,0,null);
			}
		
		}
		console.log("unit võrdsed c2",clone)
		var dataset = {
			fill:false,
			label: c2.data.datasets[0].label,
			type: c2.data.datasets[0].type,
			yAxisID: c2.data.datasets[0].yAxisID,
			data: clone,
		};
		chart.data.datasets.push(dataset);
		chart.update();
		graphList[id]=chart;
		dataList[id]={
			id : "",
			variable : "",
			lat : "",
			lng : "",
			start : "",
			end : "",
			style : "",
			
		};
		
	}
	else if (unit2 !== unit1){
		if(unit2===unit11 || unit11===""){
			var clone = JSON.parse(JSON.stringify(c2.data.datasets[0].data));
			for (var i=0;i<concattime.length;i++){
				if (time2.indexOf(concattime[i])===-1){
					clone.splice(i,0,null);
				}
			
			}
			console.log("unit ei ole võrdsed c2",clone);
			var dataset = {
				fill:false,
				label: c2.data.datasets[0].label,
				type: c2.data.datasets[0].type,
				yAxisID: "y-axis-1",
				data: clone,
			};
			chart.options.scales.yAxes[1].display=true;
			chart.options.scales.yAxes[1].scaleLabel.labelString=unit2
			chart.data.datasets.push(dataset);
			chart.update();
			graphList[id]=chart;
			dataList[id]={
				id : "",
				variable : "",
				lat : "",
				lng : "",
				start : "",
				end : "",
				style : "",
				
			};
		}
		else {
			console.log("teise charti unit ei ühildu kummagi esimese charti omaga");
			return false;
		}
	}
	if (unit22===""){
		console.log("c2 yaxis unit on tühi");
		return false;
	}
	else {
		console.log("ei");
		if (unit22 === unit1) {
			
			chart.data.datasets.push(c2.data.datasets[1]);
			chart.update();
			graphList[id]=chart;
			return false;
		}
		else {
			if(unit22 === unit11 || unit11===""){
				c2.data.datasets[1].yAxisID="y-axis-1";
				
				chart.options.scales.yAxes[0].display=true;
				chart.options.scales.yAxes[0].scaleLabel.labelString=unit22
				chart.data.datasets.push(c2.data.datasets[1]);
				chart.update();
				graphList[id]=chart;
				return false;
			}
			else {
				console.log("teise charti teise graafi unit ei ühildu kummagi esimese charti omaga");
				return false;
			}
		}
	}
	console.log("siia ei tohiks jõuda");
	var data1 = c1.data.datasets[0].data;
	var data2 = c2.data.datasets[0].data;
	var label1 = c1.data.datasets[0].label;
	var label2 = c2.data.datasets[0].label;
	var type1 = c1.type;
	var type2 = c2.type;
	var time1 = c1.data.labels;
	var time2 = c2.data.labels;
	
	var id = createCanvas();
	$("#mapgraph").animate({ scrollTop: $("#"+id).offset().top}, "slow");
	var fromzero=false;
	if (Math.max(...data1)<1) {
		fromzero=true;
	}
	var ctx = $("#"+id);
	var myChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: time1,
			datasets: [{
			  type: type1,
			  label: label1,
			  fill:false,
			  yAxisID: "y-axis-0",
			  data: data1,
			  backgroundColor: "#8EEBEC",
			  borderColor: "#8EEBEC",
			  spanGaps:true //if null value, line doesn't cut
			  
			}, {
			  type: type2,
			  label: label2,
			  fill:false,
			  yAxisID: "y-axis-1",
			  data: data2,
			  backgroundColor: "#ED908E",
			  borderColor: "#ED908E",
			  spanGaps:true
			}]
		},
		options: {
			title: {
				display:true,
				text: "combo chart",
			},
			scales: {
			  yAxes: [{
				position: "left",
				id: "y-axis-0",
				gridLines: {
				  display:false
			    },
				ticks: {
					beginAtZero:fromzero
				},

			  }, {
				position: "right",
				id: "y-axis-1",
				gridLines: {
				  display:false
			    }
			  }],
			}
		}
	});
	if(c1.data.datasets.length>1){
		var confX = {
			type: c1.data.datasets[1].type,
			label: c1.data.datasets[1].label,
			fill:false,
			//yAxisID: "y-axis-0",
			data: c1.data.datasets[1].data,
			backgroundColor: "#00FF00",
			borderColor: "#00FF00",
			spanGaps:true
		};
		myChart.data.datasets.push(confX);
		myChart.update();
	}
	
	graphList[id]=myChart;
}


/*
function createGraph(id,values,time){
	var ctx = $("#"+id);
	var myChart = new Chart(ctx, {
	type: 'bar',
	data: {
		labels: time,
		datasets: [{
			type:"bar",
			label: "bar label",
			data: values,
			},
			{
			type:"line",
			label: "line label",
			data: values,
			}
			]
		},
	options: {
		responsive:true,
		maintainAspectRatio:false,
		scales: {
			yAxes: [{
				ticks: {
					//beginAtZero:true
				},
				scaleLabel: {
					display:true,
					labelString:"test"
				}
			}]
		}
	}
	});
	graphList.push(myChart);
	lastGraph=myChart;
}
*/