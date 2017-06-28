function estimateEdges(){

    //form the bounding box
    if(!subSelect) {
        extentArray = mmap.getBounds();
    }
    var botLeftLon = extentArray.getWest();
    var botLeftLat = extentArray.getSouth();
    var topRightLon = extentArray.getEast();
    var topRightLat = extentArray.getNorth();
    var osmtogeojson = require('osmtogeojson');
    var request = require('request');

    var estimate = 0;

    var instanceQuery = '[out:json];(way[highway~"."][highway!~"path|track|cycleway|footway"][foot!~"."](' + botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon + ');' +
        'way[building~"."]["building"!="yes"](' + botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon + '););(._;>;);out;';

    //now form the query
    var bbox = botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon ;
    var queryStart = '[out:json];(';
    var queryEnd = ');(._;>;);out;';

    var primaryQueryPiece = 'way[highway~"primary|motorway|trunk"](' + bbox + ');';
    var secondaryQueryPiece = 'way[highway="secondary"](' + bbox + ');';
    var tertiaryQueryPiece = 'way[highway="tertiary"](' + bbox + ');';
    var otherQueryPiece = 'way[highway~"."][highway!~"primary|secondary|tertiary|path|track|cycleway|footway"][foot!~"."](' + bbox + ');';
    var footPathPiece = 'way[highway~"footway|cycleway|path"](' + bbox + ');';

    var query = queryStart;
    var hasContent = false;

    if($("#primary").prop('checked')) {
        query = query + primaryQueryPiece;
        hasContent = true;
    }
    if($("#secondary").prop('checked')) {
        query = query + secondaryQueryPiece;
        hasContent = true;
    }
    if($("#tertiary").prop('checked')) {
        query = query + tertiaryQueryPiece;
        hasContent = true;
    }
    if($("#other").prop('checked')) {
        query = query + otherQueryPiece;
        hasContent = true;
    }
    if($("#foot").prop('checked')) {
        query = query + footPathPiece;
        hasContent = true;
    }

    query = query + queryEnd;

    if(!hasContent) {
        alertify.error('None of the content checkboxes are checked.  Please check at least one and try again.');
        removeSpinner2();
        return;
    }


    var endpoint = "http://overpass-api.de/api/";
    //var endpoint = "http://overpass.osm.rambler.ru/cgi/";

    request.post(endpoint + 'interpreter', function (error, response, body) {
            var geojson, json;

            if (!error && response.statusCode === 200) {

                json = JSON.parse(body);
                geoJson = osmtogeojson(json);

                if(overlayGenerated){
                    mmap.removeLayer(streetOverlay);
                    streets = [];
                }

                var temp = geoJson.features;
                        var tempFeature;
                        for(i=0;i<temp.length;i++) {
                            tempFeature = temp[i];
                            if(tempFeature.geometry.type == "LineString") {
                                streets.push(tempFeature);
                            }
                        }

                        streetOverlay.addTo(mmap);
                        overlayGenerated = true;

                        estimate = 0;

                        // create an easy lookup for ways and nodes by id.
                        var typeDict = { }; // Eg: typeDict['way']['1234']
                        var trueNodeDict = {};
                        typeDict['way'] = {};

                        for(i=0;i<json.elements.length;i++) {
                          var e = json.elements[i];
                          var type = e['type'];

                          if( type!=="way" ) {
                            continue;
                          }

                          typeDict[ e['type'] ][ e['id'] ] = e ;
                        }

                        for(var wayId in typeDict['way'] ) {

                          var way = typeDict['way'][wayId];

                          // build a list of latLng objects
                          for( var n in way['nodes'] ) {
                            var nodeId = way['nodes'][n];
                            //for estimate
                            if(nodeId in trueNodeDict) {
                                estimate += 1;
                            } else {
                                trueNodeDict[nodeId] = 1; //doesn't matter, just need the key to exist
                            }
                          }//n
                        }//w

                        alertify.success('We approximate ' + estimate + ' links in the overlaid instance.');
            } else if (error) {
                alertify.error('Error: ' + error);
            } else if (response) {
                    alertify.error('Request failed: HTTP ' + response.statusCode);
            } else {
                    alertify.error('Unknown error.');
            }
            removeSpinner2();
        }).form({
            data: query
        });
}

function exportJson(evt, query){

    addSpinner2();
    //form the bounding box
    if(!subSelect) {
        extentArray = mmap.getBounds();
    }
    var botLeftLon = extentArray.getWest();
    var botLeftLat = extentArray.getSouth();
    var topRightLon = extentArray.getEast();
    var topRightLat = extentArray.getNorth();
    var osmtogeojson = require('osmtogeojson');
    var request = require('request');

    var instanceQuery = '[out:json];(way[highway~"."][highway!~"path|track|cycleway|footway"][foot!~"."](' + botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon + ');' +
    'way[building~"."]["building"!="yes"](' + botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon + '););(._;>;);out;';


    //now form the query
    var bbox = botLeftLat + ',' + botLeftLon + ',' + topRightLat + ',' + topRightLon ;
    var queryStart = '[out:json];(';
    var queryEnd = ');(._;>;);out;';

    var primaryQueryPiece = 'way[highway~"primary|motorway|trunk"](' + bbox + ');';
    var secondaryQueryPiece = 'way[highway="secondary"](' + bbox + ');';
    var tertiaryQueryPiece = 'way[highway="tertiary"](' + bbox + ');';
    var otherQueryPiece = 'way[highway~"."][highway!~"primary|secondary|tertiary|path|track|cycleway|footway"][foot!~"."](' + bbox + ');';

    var query = queryStart;
    var hasContent = false;

    if($("#primary").prop('checked')) {
        query = query + primaryQueryPiece;
        hasContent = true;
    }
    if($("#secondary").prop('checked')) {
        query = query + secondaryQueryPiece;
        hasContent = true;
    }
    if($("#tertiary").prop('checked')) {
        query = query + tertiaryQueryPiece;
        hasContent = true;
    }
    if($("#other").prop('checked')) {
        query = query + otherQueryPiece;
        hasContent = true;
    }

    query = query + queryEnd;

    if(!hasContent) {
        alertify.error('None of the content checkboxes are checked.  Please check at least one and try again.');
        removeSpinner2();
        return;
    }

    var endpoint = "http://overpass-api.de/api/";
    //var endpoint = "http://overpass.osm.rambler.ru/cgi/";

    //query overpass
    var request = require('request');
    var numTrueNodes = 0;
    //write the file
    var filePath = $(this).val();
    request.post(endpoint + 'interpreter', function (error, response, body) {
        if (!error && response.statusCode === 200) {

        var fs = require('fs');
        var instance = '{\n\t\"nodes\":\n\t[\n\t\t'; //this string will hold our instance

        //parse the body to write the instance
        var elements = JSON.parse(body).elements;
        var element, wayNodes, wayNodeId;
        var nodes = {},
            edgesDict = {},
            trueNodesDict = {}, //to keep track of who we've seen in our traversal
            trueNodes = {}, //actually has the nodes we want to include in the graph
            zones = {}; //zone tracker

            alertify.success('Got response.');

        for(i=0;i<elements.length;i++) {

            element = elements[i];
            if(element.type == "node") {
                nodes[element.id] = element;
            } else if(element.type == "way") {
                wayNodes = element.nodes;
                for( var n in wayNodes) {
                    wayNodeId = wayNodes[n];
                    if(wayNodeId in trueNodesDict) {
                        if(trueNodes[wayNodeId] !== 1){
                            numTrueNodes++;
                        }
                        trueNodes[wayNodeId] = 1;
                    } else {
                        trueNodesDict[wayNodeId] = 1;
                    }
                }
            } else {
                continue;
            }
        }

        alertify.success('Processed ' + numTrueNodes + ' nodes.');

        //write the nodes section
        var index = 1;
        var minLon = 200,
            minLat = 200;
        for(var n in trueNodes){
            if(nodes[n].lon < minLon){
                minLon = nodes[n].lon;
            }
            if(nodes[n].lat < minLat){
                minLat = nodes[n].lat;
            }
        }
        for(var n in trueNodes){

            instance += '{\"id\":' + index
            + ', \"name\":\"Node ' + index + '\"'
            + ', \"x\":' + Math.round((nodes[n].lon-minLon) * 1000000)
            + ', \"y\":' + Math.round((nodes[n].lat-minLat) * 1000000)
            + '}';

            if(index !== numTrueNodes) {
                instance += ',\n\t\t';
            } else {
                instance += '\n\t],\n\t\"links\":\n\t[\n\t\t';
            }

            //bookkeeping
            trueNodes[n] = index;
            index++;
        }

        alertify.success('Wrote ' + (index-1) + ' nodes.');

        for(i=0;i<elements.length;i++){
            element = elements[i];
            if(element.type !== "way"){
                continue;
            }
            if(!element.tags.hasOwnProperty('building')){
                continue;
            }
            if(element.tags.building == "yes"){
                continue;
            }
            if(element.tags.hasOwnProperty('addr:street')){
                zones[element.tags['addr:street']] = element.tags.building;
            }
        }

        index = 1;
        var prevTrueNodeIndex = -1;
        //now go back through the elements array and write things now that we know which elements to include
        for(i=0;i<elements.length;i++){
            element = elements[i];
            if(element.type !== "way"){
                continue;
            }

            prevTrueNodeIndex = -1;
            for(j=0;j<element.nodes.length;j++) {
                n = element.nodes[j];
                if(n in trueNodes) {
                    if(prevTrueNodeIndex == -1){
                        prevTrueNodeIndex = n; //first one, keep going
                    } else {
                        instance += '{\"id\":' + index
                        + ', \"label\":\"' + element.tags.name + '\"'
                        + ', \"source\":' + trueNodes[prevTrueNodeIndex]
                        + ', \"sink\":' + trueNodes[n]
                        + ', \"directed\":' + (element.tags.oneway == "yes")
                        + ', \"required\":false' //default to none required
                        + ', \"type\":\"' + element.tags.highway + '\"'
                        + ', \"speed\":\"' + element.tags.maxspeed + '\"'
                        + ', \"zone\":\"' + zones[element.tags.name] + '\"}'

                        instance += ',\n\t\t';

                        prevTrueNodeIndex = n;
                        index++;
                    }
                }
            }
        }

        instance = instance.slice(0,-4);
        instance += '\n\t\t]\n}';

        alertify.success('Wrote links.');



        fs.writeFile(filePath, instance, function(err) {
            if(err) {
                alertify.error(err);
            }
            alertify.success('File saved.');
        });

        } else if (error) {
            alertify.error(error);
        } else if (response) {
                alertify.error('Request failed: HTTP ' + response.statusCode);
        } else {
                alertify.error('Unknown error.');
        }
        removeSpinner2();
    }).form({
        data: query
    });
}


function removeSpinner2() {
    spinner2.stop();
    target2.parentNode.removeChild(target2);
}

function addSpinner2() {
    document.body.appendChild(target2);
    spinner2.spin(target2);
}