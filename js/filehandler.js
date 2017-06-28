// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.');
}

// do file parsing / handling here
function handleFiles(evt) {
    addSpinner();
    loadFiles(evt);
}

function loadFiles(evt) {

    //requirements
    var fs = require('fs');

    //grab file from file browser
    var files = evt.target.files; // FileList object

    //import the graph
    fs.readFile($('#fileupload').get(0).value, 'utf-8', function (error, contents) {

            //error handling
            if(error) {
                alertify.error('Error opening file: ' + error);
                return;
            }
            alertify.success('Imported file: ' + files[0].name);

            //TEMP: make sure we can access the contents of the file
    		document.getElementById('displayTitle').innerHTML = files[0].name;

            var elements = [];
    		//now try adding the nodes
            $.each(JSON.parse(contents).nodes, function(idx, obj) {
                    if(obj.hasOwnProperty('depot')) {
                        elements.push({data: {id:obj.id, label:obj.name}, position: {x:obj.x,y:obj.y}, classes:'depot'});
                        depotId = obj.id;
                    } else {
                        elements.push({data: {id:obj.id, label:obj.name}, position: {x:obj.x,y:obj.y}});
                    }
            });

            //add the links
            $.each(JSON.parse(contents).links, function(idx, obj) {
                    var req = ' ';
                    var directed = '';
                    var hasSpeed = '';
                    var hasZone = '';
                    var hasType = '';

                    //set vars
                    if(obj.hasOwnProperty('required') && !obj.required) {
                        req += 'dotted';
                    }
                    if(obj.directed) {
                        directed = 'directed ';
                    } else {
                        directed = 'undirected ';
                    }
                    if(isNaN(parseInt(obj.speed))) {
                        hasSpeed = ' noSpeed';
                    }
                    if(typeof obj.zone === "undefined" || obj.zone.toUpperCase() == 'UNDEFINED') {
                        hasZone = ' noZone';
                    }
                    if(typeof obj.type === "undefined" || obj.type.toUpperCase() == 'UNCLASSIFIED') {
                        hasType = ' noType';
                    }

                    elements.push({data: {id:'e' + obj.id, source: obj.source, target: obj.sink, type: obj.type, name:obj.label, speed:parseInt(obj.speed), zone:obj.zone.toUpperCase()}, classes: directed + 'network' + req + ' ' + obj.type + hasZone + hasType + hasSpeed});
            });

            cy.add(elements);

            //set the arrow style of directed edges
            cy.style().selector('edge.directed').style({'target-arrow-shape':'triangle'}).update();

            //make the depot unselectable
            cy.$('#' + depotId).unselect();
            cy.$('#' + depotId).unselectify();

            //set tooltips

            //just use the regular qtip api but on cy elements
            cy.elements('edge').qtip({
                content: function(){

                    var str = '<b>Element</b>: ' + this.id();
                    str += ',<br><b>Street Name</b>: ' + this.data('name');
                    str += ',<br><b>Type</b>: ' + this.data('type');
                    str += ',<br><b>Speed Limit</b>: ' + this.data('speed');
                    str += ',<br><b>Zone</b>: ' + this.data('zone');
                    return str;

                },
                position: {
                    my: 'top center',
                    at: 'bottom center'
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 16,
                        height: 8
                    }
                }
            });

            cy.elements('node').qtip({
                content: function(){ return '<b>Node</b>: ' + this.id() },
                position: {
                    my: 'top center',
                    at: 'bottom center'
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 16,
                        height: 8
                    }
                }
            });

            // call on core
            /*cy.qtip({
                content: 'Example qTip on core bg',
                position: {
                    my: 'top center',
                    at: 'bottom center'
                },
                show: {
                    cyBgOnly: true
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 16,
                        height: 8
                    }
                }
            });*/

            //set the mouseover and mouseoff behaviors

            //for nodes, highlight the connected elements
            cy.on('mouseover', 'node', function(event) {
                var node = event.cyTarget;
                node.neighborhood().addClass('neighbor');
                node.addClass('highlight');

            });

            cy.on('mouseout', 'node', function(event) {
                var node = event.cyTarget;
                node.neighborhood().removeClass('neighbor');
                node.removeClass('highlight');
            });

            //for edges
            cy.on('mouseover', 'edge', function(event) {
                var edge = event.cyTarget;
                var endpoints = edge.connectedNodes();
                var hood = edge.union(endpoints);
                hood.addClass('neighbor');
                edge.addClass('highlight');

            });

            cy.on('mouseout', 'edge', function(event) {
                var edge = event.cyTarget;
                var endpoints = edge.connectedNodes();
                var hood = edge.union(endpoints);
                hood.removeClass('neighbor');
                edge.removeClass('highlight');
            });

            //set global var and enable other buttons
            graphOpen = true;
            routesOpen = false;
            $("#openRoutesButton").removeClass('disabled');
            $("#openRoutesButton").css('pointer-events','auto');
            $("#exportCanvasButton").removeClass('disabled');
            $("#exportCanvasButton").css('pointer-events','auto');
            $("#exportInstanceButton").removeClass('disabled');
            $("#exportInstanceButton").css('pointer-events','auto');

            $("#depotBtn").css('display','block');
            $("#undepotBtn").css('display','block');
            $("#requireBtn").css('display','block');
            $("#unrequireBtn").css('display','block');
            $("#removeElementsBtn").css('display','block');
            $("#randomizeBtn").css('display','block');
            $("#nodeSizeButtons").css('display','block');
            $("#edgeSizeButtons").css('display','block');
            $("#trimBtn").css('display','block');

            $("#clearRoutesElementsBtn").css('display','none');
            $("#requireBtn").removeClass('disabled');
            $("#unrequireBtn").removeClass('disabled');
            $("#depotBtn").removeClass('disabled');
            $("#undepotBtn").removeClass('disabled');
            $("#removeElementsBtn").removeClass('disabled');
            $("#clearRoutesElementsBtn").removeClass('disabled');
            $("#randomizeBtn").removeClass('disabled');
            $("#nodePlusBtn").removeClass('disabled');
            $("#nodeMinusBtn").removeClass('disabled');
            $("#edgePlusBtn").removeClass('disabled');
            $("#edgeMinusBtn").removeClass('disabled');
            $("#trimBtn").removeClass('disabled');

            populateFilters();


            //populate the view filters
            $("#placeholderNetwork").remove();
            $("#layersList li:eq(-1)").after('<li id="streetsItem"><a href="#"><input type="checkbox" id="streetsBox" value="first_checkbox" checked> Streets</a></li>');

            $('#streetsItem').click(
                function(event) {
                    var cb = $('#streetsBox');

                    if (!$(cb).prop("checked")) {
                        $(cb).prop('checked', true).change();
                    } else {
                        $(cb).prop('checked', false).change();
                    }

                    event.stopPropagation();
                }
            );
            $('#streetsBox').click(
                function(event){
                    event.stopPropagation();
                }
            );

            $('#streetsBox').change(function(){

                if(this.checked) {
                    //display the edges for the appropriate route
                    cy.style().selector('edge.network').style({'visibility':'visible'}).update();
                }
                else {
                    //hide the edges for the appropriate route
                    cy.style().selector('edge.network').style({'visibility':'hidden'}).update();
                }

            });

            var orb =
            $("#openRoutesButton").click(function(e){document.getElementById('routeupload').click();});
            $("#exportCanvasButton").click(function(e){document.getElementById('export').click();});
            $("#exportInstanceButton").click(function(e){document.getElementById('exportInstance').click();});

            //populate options menu
            $("#placeholderOption").remove();
            $("#optionsList li:eq(-1)").after('<li id="lockItem"><a href="#"><input type="checkbox" id="lockBox" value="first_checkbox" checked> Lock</a></li>');

            $('#lockItem').click(
                function(event) {
                    var cb = $('#lockBox');

                    if (!$(cb).prop("checked")) {
                        $(cb).prop('checked', true).change();
                    } else {
                        $(cb).prop('checked', false).change();
                    }

                    event.stopPropagation();
                }
            );
            $('#lockBox').click(
                function(event){
                    event.stopPropagation();
                }
            );

            $('#lockBox').change(function(){

                if(this.checked) {
                    //display the edges for the appropriate route
                    cy.autolock(true);
                }
                else {
                    //hide the edges for the appropriate route
                    cy.autolock(false);
                }

            });


            //invalidate dimensions
            cy.resize();
            cy.fit();

            //set the minZoom
            cy.minZoom(cy.zoom() * .9);


            zoomLevel = getZoomBreakpoint(cy.zoom());

            var dim = 12/ cy.zoom(),
                edgeWidth = 5/ cy.zoom(),
                overlayPadding = 4/ cy.zoom();

            cy.$('node.depot').css({
                'width':dim, //keeps its original node size
                'height':dim,  //keeps its original node size
                'font-size': dim, //redraw correctly only on node selection
                'overlay-padding':overlayPadding //keep the original overlay padding around the node
            });

            cy.nodes().forEach(function(ele){
                pos.push({x:ele.position('x'), y:ele.position('y')});
            });

            onChange();
            removeSpinner();
    	});

}

function handleRoutes(evt){

    //requirements
    var fs = require('fs');

    //grab file from file browser
    var files = evt.target.files; // FileList object


    //grab the contents
    fs.readFile(this.value, 'utf-8', function (error, contents) {

        //error handling
        if(error) {
            alertify.error('Error opening file: ' + error);
            return;
        }
        alertify.success('Imported file: ' + files[0].name);

        //now grab the routes

        var routeNumber = 0;
        var routes = JSON.parse(contents).routes;
        var numRoutes = routes.length;

        //TODO: Fix the cleanup for errored out routes
        $.each(routes, function(idx, obj) {
            alertify.success('Detected ' + obj.nodes.length + ' nodes.');
            //go through each of the nodes
            var stop = obj.nodes.length - 1;
            var prev, curr, lab, index2;
            var routeNumber = idx + 1;
            var addedRoute;

            $.each(obj.nodes, function(idx2, obj2) {

                addedRoute = true;
                //skip the first guy
                if(idx2 == 0) {
                    prev = obj2.id;
                    return true; //continue;
                }
                curr = obj2.id;
                index2 = idx2 + 1;

                lab = "R"+routeNumber+"E"+ index2;


                //or if the indices are out of bounds
                if( curr > cy.nodes().size() || prev > cy.nodes().size() ||
                curr < 1 || prev < 1) {
                    alertify.error('Error opening the route: index out of bounds.');
                    cy.remove('edge.R' + routeNumber);
                    addedRoute = false;
                    return false; //break
                }

                //If the route tries to traverse an edge that wasn't originally in the graph
                var edges = cy.elements('edge[source=\"' + prev + '\"][target=\"' + curr + '\"]');
                var edgeColl = edges.union('edge.undirected[source=\"' + curr + '\"][target=\"' + prev + '\"]');
                if(edgeColl.size() == 0) {

                    alertify.error('Error opening the route: The route appears to contain a link that was not in' +
                                        ' the original graph. Skipping Route.');
                    cy.remove('edge.R' + routeNumber);
                    addedRoute = false;
                    return false; //break
                }

                prev = curr;

                if(obj2.hasOwnProperty('service') && !obj2.service)
                    continue;

                edgeColl.forEach(function(ele){
                    ele.addClass('R' + routeNumber);
                });

            });


            //now style the new edges
            var color = makeColor( routeNumber, numRoutes);
            cy.style().selector('edge.R' + routeNumber).style({'line-color':'hsl(' + color + ',100%,50%)',
            'target-arrow-color':'hsl(' + color + ',100%, 50%)'}).update();

            //now add the routes to the layers menu
            if(addedRoute) {
                $("#networkHeading").before('<li id="route' + routeNumber + 'Item"><a href="#"><input type="checkbox" id="route' + routeNumber + 'box" value="second_checkbox" checked> Route ' + routeNumber + '</a></li>');
            }


            //add the appropriate event handlers
            $('#route' + routeNumber + 'Item').click(
                function(event) {
                    var cb = $('#route' + routeNumber + 'box');

                    if (!$(cb).prop("checked")) {
                        $(cb).prop('checked', true).change();
                    } else {
                        $(cb).prop('checked', false).change();
                    }

                    event.stopPropagation();
                }
            );
            $('#route' + routeNumber + 'box').click(
                function(event){
                    event.stopPropagation();
                }
            );

            $('#route' + routeNumber + 'box').change(function(){

                if(this.checked) {
                    //display the edges for the appropriate route
                    cy.style().selector('edge.R' + routeNumber).style({'visibility':'visible'}).update();
                }
                else {
                    //hide the edges for the appropriate route
                    cy.style().selector('edge.R' + routeNumber).style({'visibility':'hidden'}).update();
                }

            });
        });

    });

    $("#exportInstanceButton").addClass('disabled');
    $("#placeholderRoute").remove();
    $("#requireBtn").css('display','none');
    $("#unrequireBtn").css('display','none');
    $("#depotBtn").css('display','none');
    $("#undepotBtn").css('display','none');
    $("#removeElementsBtn").css('display','none');
    $("#clearRoutesBtn").css('display','block');

    routesOpen = true;
    return;
}

function makeColor(colorNum, colors){
    if (colors < 1) colors = 1; // defaults to one color - avoid divide by zero
    return colorNum * (360 / colors) % 360;
}

function exportCanvas(evt){
    var png64 = cy.png();
    var filePath = $(this).val();

    var data = png64.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer(data, 'base64');

    if (filePath !== "") {
        var fs = require("fs");
        fs.writeFile(filePath, buf, function (err) {
          if (err)
            alertify.error("Unable to save file");
          else
            alertify.success("File successfully Saved.");
        });
      }
      else {
        // User cancelled
        alertify.success('User cancelled export.')
      }
}

function getZoomBreakpoint(zoom){
    var breakpoints = [0.03, 0.05, 0.1, 0.3, 0.7, 2, 5, 10];
    var ans = breakpoints.length;

    for( var i = 0, len = breakpoints.length; i < len; i++) {
        if(zoom < breakpoints[i]){
            ans = i;
            break;
        }
    }

    return ans;
}

function resetGraph(){
    cy.nodes().positions(function( i, node ){
      return {
        x: pos[i].x,
        y: pos[i].y
      };
    });
}

function removeSelectedElements(){
    cy.remove("edge:selected");
    cy.remove("node:selected");
}

function makeSelectedElementsRequired(){
    cy.$('edge:selected').removeClass('dotted');
    cy.$('node:selected').removeClass('dotted');
}

function makeSelectedElementsUnrequired(){
    cy.$('edge:selected').addClass('dotted');
    cy.$('node:selected').addClass('dotted');
}

function makeSelectedNodesDepots(){
    cy.$('node:selected').addClass('depot');
}

function unmakeSelectedNodesDepots(){
    cy.$('node:selected').removeClass('depot');
}

function clearRoutes(){

    //TODO: Actually clear the routes

    $("#depotBtn").css('display','block');
    $("#undepotBtn").css('display','block');
    $("#requireBtn").css('display','block');
    $("#unrequireBtn").css('display','block');
    $("#removeElementsBtn").css('display','block');
    $("#clearRoutesElementsBtn").css('display','none');

}

function exportInstance(evt){

    var filePath = $(this).val();
    var instance = '================================\n';
        //front matter
        instance += 'Nodes: ' + cy.nodes().size() + '\n';
        instance += 'Edges: ' + cy.edges().size() + '\n';
        instance += 'Depot ID(s): ';

    var depots = cy.elements("node.depot");
    for( var i = 0; i < depots.length; i++ ){
        var depot = depots[i];
        instance += depot.id() + ' ';
    }
        instance += '\n';
        instance += '================================\n';
        instance += 'NODES: ID, X, Y\n';
        instance += '================================\n';

        alertify.success('Wrote Front Matter');


    var eles = cy.nodes();
    for( var i = 0; i < eles.length; i++ ){
        var ele = eles[i];
        instance += ele.id() + ', ' + ele.position('x') + ', ' + ele.position('y') + '\n';
    }

    alertify.success('Wrote Nodes');

    instance += '================================\n';
    instance += 'EDGES: ID, V1, V2, DIST, REQUIRED, DIRECTED, TYPE, NAME, MAX_SPEED, ZONE\n';
    instance += '================================\n';

    eles = cy.edges();
    for( var i = 0; i < eles.length; i++ ){
        var ele = eles[i];
        var dist = Math.sqrt(Math.pow((ele.source().position('x') - ele.target().position('x')),2) + Math.pow((ele.source().position('y') - ele.target().position('y')),2));
        instance += ele.id() + ', ' + ele.source().id() + ', ' + ele.target().id() + ', ' + dist + ', ' + !ele.hasClass('dotted') + ', ' + ele.hasClass('directed') + ', ' + ele.data('type') + ', ' + ele.data('name') + ', ' + ele.data('speed') + ', ' + ele.data('zone') + '\n';
    }

    alertify.success('Wrote Edges');

    if (filePath !== "") {
        var fs = require("fs");
        fs.writeFile(filePath, instance, function (err) {
          if (err)
            alertify.error("Unable to save file");
          else
            alertify.success("File successfully Saved.");
        });
      }
      else {
        // User cancelled
        alertify.success('User cancelled export.')
      }

}

function populateFilters(){

    var types = ["Motorway", "Trunk", "Primary", "Secondary", "Tertiary", "Unclassified", "Residential", "Service"];
    var typesLc = ["motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service"];

    $("#placeholderFilter").remove(); //remove the placeholder

    //add the types boxes
    for(var i = 0; i < types.length; i++) {

        var type = types[i];
        var typeLc = typesLc[i];
        $("#filtersList li:eq(-1)").after('<li id="' +typeLc +'Item"><a href="#"><input type="checkbox" id="' + typeLc + 'Box" value="' + typeLc + '_checkbox" checked> ' + type + ' Roads</a></li>');


        $('#' + typeLc + 'Item').click(
            function(event) {
                var prefix = this.id.slice(0, -4);
                var cb = $('#' + prefix + 'Box');

                if (!$(cb).prop("checked")) {
                    $(cb).prop('checked', true).change();
                } else {
                    $(cb).prop('checked', false).change();
                }

                event.stopPropagation();
            }
        );
        $('#' + typeLc + 'Box').click(
            function(event){
                event.stopPropagation();
            }
        );

        $('#' + typeLc + 'Box').change(function(){

            var prefix = this.id.slice(0, -3);
            if(this.checked) {
                //display the edges for the appropriate route
                cy.style().selector('edge.' + prefix).style({'visibility':'visible'}).update();
                if(prefix == "unclassified") {
                    cy.style().selector('edge.undefined').style({'visibility':'visible'}).update();
                }
            }
            else {
                //hide the edges for the appropriate route
                cy.style().selector('edge.' + prefix).style({'visibility':'hidden'}).update();
                if(prefix == "unclassified") {
                    cy.style().selector('edge.undefined').style({'visibility':'visible'}).update();
                }
            }

        });

    }

}

function randomize(){

    vex.defaultOptions.className = 'vex-theme-wireframe';
        vex.dialog.buttons.YES.text = 'Select';
        vex.dialog.buttons.NO.text = 'Cancel';
        vex.dialog.open({
            message: 'Please select the attribute you wish to use to randomize.',
            input: [
                '<style>',
                    '.vex-custom-input-wrapper {',
                        'display: inline-block;',
                    '}',
                    '.vex-custom-field {',
                        'display: block;',
                        //'float: right;',
                        'clear: both;',
                    '}',
                '</style>',
                '<div class="vex-custom-field">',
                    '<div class="vex-custom-input-wrapper">',
                        '<input type="radio" name = "type" value = "priority"> Priority<br>',
                        '<input type="radio" name = "type" value = "speed"> Speed<br>',
                        '<input type="radio" name = "type" value = "zone"> Zone<br>',
                    '</div>',
                '</div>'
            ].join(''),
            callback: function (data) {
                if (!data || "undefined" === typeof data.type) {
                    alertify.error('Randomize cancelled.')
                } else {

                    if(data.type == "priority") {
                        randomizeType();
                    }
                    if(data.type == "speed") {
                        randomizeSpeed();
                    }
                    if(data.type == "zone") {
                        randomizeZone();
                    }

                }
            }
        });


}

function randomizeType(){

    vex.defaultOptions.className = 'vex-theme-wireframe';
    vex.dialog.buttons.YES.text = 'Generate';
    vex.dialog.buttons.NO.text = 'Cancel';
    vex.dialog.open({
        message: 'Input desired % required.',
        input: [
            '<style>',
                '.vex-custom-input-wrapper {',
                    'display: inline-block;',
                '}',
                '.vex-custom-field {',
                    'display: block;',
                    'float: right;',
                    'clear: both;',
                '}',
            '</style>',
            '<div class="vex-custom-field">',
                '<span>Motorway, Trunk, and Primary: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="primary" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Secondary: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="secondary" type="number" value="% required" min="0" max="100" />',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Tertiary: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="tertiary" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Unclassified: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="unclassified" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Residential: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="residential" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Service: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="service" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
            '</div>',
        ].join(''),
        callback: function (data) {
            if (!data) {
                alertify.error('Randomize cancelled.')
            } else {

                var primaryPercent = data.primary;
                var secondaryPercent = data.secondary;
                var tertiaryPercent = data.tertiary;
                var unclassifiedPercent = data.unclassified;
                var residentialPercent = data.residential;
                var servicePercent = data.service;

                //primary
                var edges = cy.edges("[type='primary']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < primaryPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[type='trunk']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < primaryPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[type='motorway']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < primaryPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //secondary
                edges = cy.edges("[type='secondary']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < secondaryPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //tertiary
                edges = cy.edges("[type='tertiary']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < tertiaryPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //unclassified
                edges = cy.edges('.noType');
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < unclassifiedPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //residential
                edges = cy.edges("[type='residential']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < residentialPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //residential
                edges = cy.edges("[type='service']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < servicePercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

            }
        }
    })


}

function randomizeZone(){

    vex.defaultOptions.className = 'vex-theme-wireframe';
    vex.dialog.buttons.YES.text = 'Generate';
    vex.dialog.buttons.NO.text = 'Cancel';
    vex.dialog.open({
        message: 'Input desired % required.',
        input: [
            '<style>',
                '.vex-custom-input-wrapper {',
                    'display: inline-block;',
                '}',
                '.vex-custom-field {',
                    'display: block;',
                    'float: right;',
                    'clear: both;',
                '}',
            '</style>',
            '<div class="vex-custom-field">',
                '<span>Commercial: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="commercial" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Residential: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="residential" type="number" value="% required" min="0" max="100" />',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Office: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="office" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>School / University: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="school" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Other / Unclassified: </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="other" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
            '</div>',
        ].join(''),
        callback: function (data) {
            if (!data) {
                alertify.error('Randomize cancelled.')
            } else {

                var commercialPercent = data.commercial;
                var residentialPercent = data.residential;
                var officePercent = data.office;
                var schoolPercent = data.school;
                var otherPercent = data.other;

                //commercial
                var edges = cy.edges("[zone='COMMERCIAL']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < commercialPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //residential
                edges = cy.edges("[zone='RESIDENTIAL']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < residentialPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[zone='APARTMENTS']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < residentialPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //office
                edges = cy.edges("[zone='OFFICE']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < officePercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[zone='OFFICES']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < officePercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //school
                edges = cy.edges("[zone='SCHOOL']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < schoolPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[zone='UNIVERSITY']");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < schoolPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                //unclassified
                edges = cy.edges('.noZone');
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < otherPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
            }
        }
    })


}

function randomizeSpeed(){

    vex.defaultOptions.className = 'vex-theme-wireframe';
    vex.dialog.buttons.YES.text = 'Generate';
    vex.dialog.buttons.NO.text = 'Cancel';
    vex.dialog.open({
        message: 'Input desired % required.',
        input: [
            '<style>',
                '.vex-custom-input-wrapper {',
                    'display: inline-block;',
                '}',
                '.vex-custom-field {',
                    'display: block;',
                    'float: right;',
                    'clear: both;',
                '}',
            '</style>',
            '<div class="vex-custom-field">',
                '<span> Speed > 50 </span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="high" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>30 < Speed <= 50</span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="middle" type="number" value="% required" min="0" max="100" />',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>20 < Speed <= 30</span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="low" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>Speed <= 20</span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="slow" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
                '<span>None Listed</span>',
                '<div class="vex-custom-input-wrapper">',
                    '<input name="unclassified" type="number" value="% required" min="0" max="100"/>',
                '</div>',
            '</div>',
            '<div class="vex-custom-field">',
            '</div>',
        ].join(''),
        callback: function (data) {
            if (!data) {
                alertify.error('Randomize cancelled.')
            } else {

                var highPercent = data.high;
                var middlePercent = data.middle;
                var lowPercent = data.low;
                var slowPercent = data.slow;
                var unclassifiedPercent = data.unclassified;

                //primary
                var edges = cy.edges("[speed > 50]");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < highPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[speed > 30][speed <= 50]");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < middlePercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }
                edges = cy.edges("[speed > 20][speed <= 30]");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < lowPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

                edges = cy.edges("[speed <= 20]");
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < slowPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }


                edges = cy.edges('.noSpeed');
                for(var i = 0; i < edges.length; i++) {
                    if(Math.random()*100 < unclassifiedPercent) {
                        edges[i].removeClass('dotted');
                    } else {
                        edges[i].addClass('dotted');
                    }
                }

            }

        }
    })


}

function increaseNodeSize(){

    cy.$('node').css({
        'width':nodeSize* 2, //keeps its original node size
        'height':nodeSize* 2,  //keeps its original node size
        //'font-size': fontSize* 2, //redraw correctly only on node selection
    });
    nodeSize+= nodeSize;
    //fontSize += fontSize;

}

function decreaseNodeSize(){
    cy.$('node').css({
        'width':nodeSize / 2, //keeps its original node size
        'height':nodeSize / 2,  //keeps its original node size
        //'font-size': fontSize / 2, //redraw correctly only on node selection
    });
    nodeSize = nodeSize / 2;
    //fontSize = fontSize / 2;
}

function increaseEdgeSize(){
    cy.$('edge').css({
        'width':edgeWidth* 2, //keeps its original node size
    });
    edgeWidth += edgeWidth;
}

function decreaseEdgeSize(){
    cy.$('edge').css({
        'width':edgeWidth / 2, //keeps its original node size
    });
    edgeWidth = edgeWidth / 2;

}

function trim(){
    //addSpinner();
    var ccs = cy.elements().components();

    var maxSize = 0;
    var maxIndex = -1;

    //find the largest component;
    for(var i = 0; i < ccs.length; i++) {
        if(ccs[i].size() > maxSize) {
            maxSize = ccs[i].size();
            maxIndex = i;
        }
    }

    cy.batch(function(){
        //now remove everyone else
        for( var i = 0; i < ccs.length; i++) {
            if(i == maxIndex) {
                continue;
            }

            cy.remove(ccs[i]);
        }
    });
    removeSpinner();
    onChange();

}

function removeSpinner() {
    spinner.stop();
    target.parentNode.removeChild(target);
}

function addSpinner() {
    document.body.appendChild(target);
    spinner.spin(target);
}

function onChange() {
    $('#nodeSize').html('<b>Nodes</b> : ' + cy.nodes().size());
    $('#edgeSize').html('<b>Edges</b> : ' + cy.edges().size());
}

function clearCanvas(){
    location.reload();
}