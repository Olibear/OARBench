// do file parsing / handling here
function displayAbout() {
    alertify.minimalDialog || alertify.dialog('minimalDialog',function(){
        return {
            main:function(content){
                this.set({'title':'About'});
                this.setContent(content);
            }
        };
    });
    alertify.minimalDialog("<b>Version: 0.1</b> <br/><br/> The <i>Open Arc Routing Library Visualization</i>" +
     " (OAR Lib Viz) Tool was developed by Oliver Lum in 2016 as a companion to the <i>Open Arc Routing Library</i>." +
     " Code for this utility is available at https://github.com/olibear/OARLibViz.  Code for the <i>Open Arc Routing" +
     " Library</i> is available at http://github.com/olibear/ArcRoutingLibrary.");
}