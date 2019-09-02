import React, { Component } from 'react';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap-high.jpg';
import * as satellite from 'satellite.js/lib/index';
import "./assets/theme.css";
import active from "./assets/active.txt";

const EarthRadius = 6371;
const SatelliteSize = 50;

let TargetDate = new Date();

const ISS = {
    name: 'International Space Station ZARYA (NORAD 25544)',
    category: 'B',
    lte1: '1 25544U 98067A   19245.18443877  .00012516  00000-0  22337-3 0  9998',
    lte2: '2 25544  51.6455 339.3385 0007918 357.2134  84.5192 15.50431138187200'
}


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
            current = { name: line };
            result.push(current);
        }
    }

    return result;
}


class App extends Component {

    state = {
        selected: null
    }

    componentDidMount() {
        this.setupScene();
        this.setupLights();
        this.addCustomSceneObjects();

        // Doesn't work because of CORS
        //this.loadLteFileStations('http://www.celestrak.com/NORAD/elements/active.txt');
        
        // Bypass CORS
        this.loadLteFileStations('https://cors-anywhere.herokuapp.com/http://www.celestrak.com/NORAD/elements/active.txt');

        this.animationLoop();

        window.addEventListener('resize', this.handleWindowResize);
    }

    componentWillUnmount() {
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


    setupScene = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.scene = new THREE.Scene();

        this.setupCamera(width, height);

        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: true
        });

        this.renderer.setClearColor(new THREE.Color(0x333340));
        this.renderer.setSize(width, height);

        this.el.appendChild(this.renderer.domElement);
    };

    setupCamera(width, height) {
        var NEAR = 1e-6, FAR = 1e27;
        this.camera = new THREE.PerspectiveCamera(54, width / height, NEAR, FAR);
        this.controls = new OrbitControls(this.camera, this.el);
        //this.controls.enableZoom = false;
        this.camera.position.z = -15000;
        this.camera.position.x = 15000;
        this.camera.lookAt(0, 0, 0);
    }


    animationLoop = () => {
        this.animate();

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this.animationLoop);
    };

    setupLights = () => {
        const sun = new THREE.PointLight(0xffffff, 1, 0);
        //sun.position.set(0, 0, -149400000);
        sun.position.set(0, 59333894, -137112541);

        const ambient = new THREE.AmbientLight(0x909090);

        this.scene.add(sun);
        this.scene.add(ambient);
    }

    addCustomSceneObjects = () => {
        this.addEarth();
    };    


    loadLteFileStations = (url) => {
        fetch(url).then(res => {
            res.text().then(text => {
                this.addLteFileStations(text);
            });
        });
    }

    addLteFileStations = (fileContent) => {
        const stations = parseLteFile(fileContent);

        const material = new THREE.MeshPhongMaterial({
            color: 0x00FF00,
            emissive: 0xFF4040,
            flatShading: false,
            side: THREE.DoubleSide,
        });

        stations.forEach(s => {
            this.addSatellite(s, material);
        });
    }


    // __ Scene contents ______________________________________________________


    addEarth = () => {
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

        //this.addOrbit(station);
    }

    addOrbit = (station) => {
        const intervalMinutes = 1;
        const totalMinutes = 102;
        const initialDate = TargetDate;

        var material = new THREE.LineBasicMaterial({color: 0x999999});
        var geometry = new THREE.Geometry();
        
        for (var i = 0; i <= totalMinutes; i += intervalMinutes) {
            const date = new Date(initialDate.getTime() + i * 60000);

            const pos = this.getPositionFromTLE(station.lte1, station.lte2, date);

            geometry.vertices.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }        

        var orbitCurve = new THREE.Line(geometry, material);
        this.earth.add(orbitCurve);
    }

    updateSatPosition = (station) => {
        const pos = this.getPositionFromTLE(station.lte1, station.lte2);
        if (!pos) return;

        this.sat.position.set(pos.x, pos.y, pos.z);
    }


    // __ Satellite locations _________________________________________________


    latLon2Xyz = (radius, lat, lon) => {
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

        return this.latLon2Xyz(EarthRadius + positionGd.height, lat, lon);
    }

    animate = () => {
        //this.earth.rotation.y += 0.005;
        //this.updateSatPosition();
    }
    

    render() {
        const { selected } = this.state;

        return (
            <div>
                <div className='Info'>
                    <h1>Satellite tracker</h1>
                    <p>{TargetDate.toString()}</p>
                    <p>{selected && selected.name}</p>
                    <p>Showing 1 day prediction</p>
                </div>
                <div ref={c => this.el = c} style={{ width: '100%', height: '100%' }} />
            </div>
        )
    }
}

export default App;