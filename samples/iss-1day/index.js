import { Engine } from '../../lib'

// Bypass CORS
function getCorsFreeUrl(url) {
    return 'https://cors-anywhere.herokuapp.com/' + url;
}


var target = document.getElementById("globe");
var engine = new Engine();
engine.initialize(target, {
    backgroundColor: 0xEEEEEE
});

engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/stations.txt'), 0xFFFFFF, null, s => { 
    // Return true for the station to be displayed. False otherwise. 
    // Also, properties of the station can be altered here (like orbitMinutes to display the orbit).
    if (s.name === 'ISS (ZARYA)') { 
        s.orbitMinutes = 24 * 60; 
        return true; 
    }

    return false;
});

function update() {
    engine.updateAllPositions(new Date())
}

setInterval(update, 1000);


// Parcel hot reloading
if (module.hot) {
    module.hot.accept();
}