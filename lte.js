import * as satellite from 'satellite.js/lib/index';


export const EarthRadius = 6371;

const rad2Deg = 180 / 3.141592654;

export const parseLteFile = (fileContent, stationOptions) => {
    const result = [];
    const lines = fileContent.split("\n");
    let current = null;

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i].trim();

        if (line.length === 0) continue;

        if (line[0] === '1') {
            current.tle1 = line;
        }
        else if (line[0] === '2') {
            current.tle2 = line;
        }
        else {
            current = { 
                name: line, 
                ...stationOptions
            };
            result.push(current);
        }
    }

    return result;
}


// __ Satellite locations _________________________________________________


export const latLon2Xyz = (radius, lat, lon) => {
    var phi   = (90-lat)*(Math.PI/180)
    var theta = (lon+180)*(Math.PI/180)

    const x = -((radius) * Math.sin(phi)*Math.cos(theta))
    const z = ((radius) * Math.sin(phi)*Math.sin(theta))
    const y = ((radius) * Math.cos(phi))

    return { x, y, z };
}

export const getPositionFromTLE = (station, date) => {
    if (!station || !date) return null;
   
    if (!station.satrec) {
        const { tle1, tle2 } = station;
        if (!tle1 || !tle2) return null;
        const satrec = satellite.twoline2satrec(tle1, tle2);
        station.satrec = satrec;
    }

    const positionVelocity = satellite.propagate(station.satrec, date);

    const positionEci = positionVelocity.position;
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    
    var longitude = positionGd.longitude;
    var latitude = positionGd.latitude;

    while (longitude < -Math.PI) {
        longitude += 2 * Math.PI;
    }
    while (longitude > Math.PI) {
        longitude -= 2 * Math.PI;
    }

    const lat = rad2Deg * latitude;
    const lon = rad2Deg * longitude;

    return latLon2Xyz(EarthRadius + positionGd.height, lat, lon);
}