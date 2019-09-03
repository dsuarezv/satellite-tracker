import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap-high.jpg';
import * as satellite from 'satellite.js/lib/index';

const EarthRadius = 6371;
const SatelliteSize = 50;

let TargetDate = new Date();

function parseLteFile (fileContent) {
    const result = [];
    const lines = fileContent.split("\n");
    let current = null;

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i].trim();

        if (line.length === 0) continue;

        if (line[0] === '1') {
            current.lte1 = line;
        }
        else if (line[0] === '2') {
            current.lte2 = line;
        }
        else {
            current = { 
                name: line, 
                //orbitMinutes: 10
            };
            result.push(current);
        }
    }

    return result;
}

function getColorMaterial(color) {
    return new THREE.MeshPhongMaterial({
        color: color,
        side: THREE.DoubleSide,
    });
}




export default class Engine {
    initialize(container) {
        this.el = container;

        this._setupScene();
        this._setupLights();
        this._addBaseObjects();

        this._animationLoop();

        window.addEventListener('resize', this.handleWindowResize);
    }

    dispose() {
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
        this.controls.dispose();
    }

    handleWindowResize = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    };

    // __ Scene _______________________________________________________________


    _setupScene = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.scene = new THREE.Scene();

        this._setupCamera(width, height);

        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: true
        });

        this.renderer.setClearColor(new THREE.Color(0x333340));
        this.renderer.setSize(width, height);

        this.el.appendChild(this.renderer.domElement);
    };

    _setupCamera(width, height) {
        var NEAR = 1e-6, FAR = 1e27;
        this.camera = new THREE.PerspectiveCamera(54, width / height, NEAR, FAR);
        this.controls = new OrbitControls(this.camera, this.el);
        //this.controls.enableZoom = false;
        this.camera.position.z = -15000;
        this.camera.position.x = 15000;
        this.camera.lookAt(0, 0, 0);
    }


    _animationLoop = () => {
        this._animate();

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this._animationLoop);
    };

    _setupLights = () => {
        const sun = new THREE.PointLight(0xffffff, 1, 0);
        //sun.position.set(0, 0, -149400000);
        sun.position.set(0, 59333894, -137112541);

        const ambient = new THREE.AmbientLight(0x909090);

        this.scene.add(sun);
        this.scene.add(ambient);
    }

    _addBaseObjects = () => {
        this._addEarth();
    };

    loadLteFileStations = (url, color) => {
        return fetch(url).then(res => {
            res.text().then(text => {
                const material = color && getColorMaterial(color);
                this._addLteFileStations(text, material);
            });
        });
    }

    _addLteFileStations = (fileContent, material) => {
        const stations = parseLteFile(fileContent);

        stations.forEach(s => {
            this.addSatellite(s, material);
        });

        // const newStations = [...this.state.stations];
        // newStations.push(stations);
        // this.setState({newStations});
    }


    // __ Scene contents ______________________________________________________


    _addEarth = () => {
        const textLoader = new THREE.TextureLoader();

        const group = new THREE.Group();

        // Planet
        let geometry = new THREE.SphereGeometry(EarthRadius, 50, 50);
        let material = new THREE.MeshPhongMaterial({
            //color: 0x156289,
            //emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: false,
            map: textLoader.load(earthmap)
        });

        const earth = new THREE.Mesh(geometry, material);
        group.add(earth);

        // // Axis
        // material = new THREE.LineBasicMaterial({color: 0xffffff});
        // geometry = new THREE.Geometry();
        // geometry.vertices.push(
        //     new THREE.Vector3(0, -7000, 0),
        //     new THREE.Vector3(0, 7000, 0)
        // );
        
        // var earthRotationAxis = new THREE.Line(geometry, material);
        // group.add(earthRotationAxis);

        this.earth = group;
        this.scene.add(this.earth);

    }

    addSatellite = (station, material) => {
        const geometry = new THREE.BoxBufferGeometry(SatelliteSize, SatelliteSize, SatelliteSize);
        material = material || new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF4040,
            flatShading: false,
            side: THREE.DoubleSide,
        });
        
        this.sat = new THREE.Mesh(geometry, material);
        this.earth.add(this.sat);

        this.updateSatPosition(station);

        this._addOrbit(station);
    }

    _addOrbit = (station) => {
        if (!station || !station.orbitMinutes) return;

        const intervalMinutes = 1;
        const initialDate = TargetDate;

        var material = new THREE.LineBasicMaterial({color: 0x999999, opacity: 0.5 });
        var geometry = new THREE.Geometry();
        
        for (var i = 0; i <= station.orbitMinutes; i += intervalMinutes) {
            const date = new Date(initialDate.getTime() + i * 60000);

            const pos = this.getPositionFromTLE(station.lte1, station.lte2, date);

            geometry.vertices.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }        

        var orbitCurve = new THREE.Line(geometry, material);
        this.earth.add(orbitCurve);
    }

    updateSatPosition = (station, date) => {
        const pos = this.getPositionFromTLE(station.lte1, station.lte2, date);
        if (!pos) return;

        this.sat.position.set(pos.x, pos.y, pos.z);
    }


    // __ Satellite locations _________________________________________________


    _latLon2Xyz = (radius, lat, lon) => {
        var phi   = (90-lat)*(Math.PI/180)
        var theta = (lon+180)*(Math.PI/180)
    
        const x = -((radius) * Math.sin(phi)*Math.cos(theta))
        const z = ((radius) * Math.sin(phi)*Math.sin(theta))
        const y = ((radius) * Math.cos(phi))
    
        return new THREE.Vector3(x, y, z);
    }

    getPositionFromTLE = (tle1, tle2, date) => {
       
        if (!tle1 || !tle2) {
            return null;
        }

        const satrec = satellite.twoline2satrec(tle1, tle2);
        date = date || TargetDate;

        const positionVelocity = satellite.propagate(satrec, date);

        const positionEci = positionVelocity.position;
        const gmst = satellite.gstime(date);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        const lat = THREE.Math.radToDeg(positionGd.latitude);
        const lon = THREE.Math.radToDeg(positionGd.longitude);

        return this._latLon2Xyz(EarthRadius + positionGd.height, lat, lon);
    }

    _animate = () => {
        this.earth.rotation.y += 0.005;
        //this.updateSatPosition();
    }

}