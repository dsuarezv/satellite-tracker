import * as satellite from 'satellite.js/lib/index';


export const EarthRadius = 6371;

const rad2Deg = 180 / 3.141592654;

export const parseTleFile = (fileContent, stationOptions) => {
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


const latLon2Xyz = (radius, lat, lon) => {
    var phi   = (90-lat)*(Math.PI/180)
    var theta = (lon+180)*(Math.PI/180)

    const x = -((radius) * Math.sin(phi) * Math.cos(theta))
    const z = ((radius) * Math.sin(phi) * Math.sin(theta))
    const y = ((radius) * Math.cos(phi))

    return { x, y, z };
}

const toThree = (v) => {
    return { x: v.x, y: v.z, z: -v.y };
}

const getSolution = (station, date) => {
    
    if (!station.satrec) {
        const { tle1, tle2 } = station;
        if (!tle1 || !tle2) return null;
        station.satrec = satellite.twoline2satrec(tle1, tle2);;
    }

    return satellite.propagate(station.satrec, date);
}


// type: 1 ECEF coordinates   2: ECI coordinates
export const getPositionFromTle = (station, date, type = 1) => {
    if (!station || !date) return null;

    const positionVelocity = getSolution(station, date);

    const positionEci = positionVelocity.position;
    if (!positionEci) return null;  // Ignore 
        
    if (type === 2) return toThree(positionEci);

    const gmst = satellite.gstime(date);
    const positionEcf = satellite.eciToEcf(positionEci, gmst);
    return toThree(positionEcf);
}