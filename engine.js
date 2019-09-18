import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap-high.jpg';
import circle from './assets/circle.png';
import { parseLteFile, getPositionFromTLE } from "./lte";
import { earthRadius } from "satellite.js/lib/constants";


const SatelliteSize = 50;
const ixpdotp = 1440 / (2.0 * 3.141592654) ;

let TargetDate = new Date();

const defaultOptions = {
    backgroundColor: 0x333340,
    defaultSatelliteColor: 0xff0000,
    onStationClicked: null
}

const defaultStationOptions = {
    orbitMinutes: 0,
    satelliteSize: 50
}

export class Engine {

    stations = [];

    initialize(container, options = {}) {
        this.el = container;
        this.raycaster = new THREE.Raycaster();
        this.options = { ...defaultOptions, ...options };

        this._setupScene();
        this._setupLights();
        this._addBaseObjects();

        this._animationLoop();

        window.addEventListener('resize', this.handleWindowResize);
        window.addEventListener('mousedown', this.handleMouseDown);
    }

    dispose() {
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('resize', this.handleWindowResize);
        window.cancelAnimationFrame(this.requestID);
        
        this.raycaster = null;
        this.el = null;

        this.controls.dispose();
    }

    handleWindowResize = () => {
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    };

    handleMouseDown = (e) => {
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth ) * 2 - 1,
            -(e.clientY / window.innerHeight ) * 2 + 1 );

	    this.raycaster.setFromCamera(mouse, this.camera);

        let station = null;

	    var intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects && intersects.length > 0) {
            const picked = intersects[0].object;
            if (picked) {
                station = this._findStationFromMesh(picked);
                if (station) {
                    if (station.orbit)
                        this.removeOrbit(station);
                    else
                        this.addOrbit(station);
                }
            }
        }

        const cb = this.options.onStationClicked;
        if (cb) cb(station);
    }


    // __ API _________________________________________________________________


    addSatellite = (station, color, size) => {
        
        const sat = this._getSatelliteMesh(color, size);
        const pos = this._getSatellitePositionFromTle(station);
        //const pos = { x: Math.random() * 20000 - 10000, y: Math.random() * 20000 - 10000 , z: Math.random() * 20000 - 10000, }
        if (pos) sat.position.set(pos.x, pos.y, pos.z);       

        station.mesh = sat;

        this.stations.push(station);

        if (station.orbitMinutes > 0) this.addOrbit(station);

        this.earth.add(sat);
    }

    loadLteFileStations = (url, color, stationOptions) => {
        const options = { ...defaultStationOptions, ...stationOptions };

        return fetch(url).then(res => {
            return res.text().then(text => {
                return this._addLteFileStations(text, color, options);
            });
        });
    }

    addOrbit = (station) => {
        if (station.orbitMinutes > 0) return;

        const revsPerDay = station.satrec.no * ixpdotp;
        const intervalMinutes = 1;
        const minutes = station.orbitMinutes || 1440 / revsPerDay;
        const initialDate = TargetDate;

        console.log('revsPerDay', revsPerDay, 'minutes', minutes);

        var material = new THREE.LineBasicMaterial({color: 0x999999, opacity: 1.0, transparent: true });
        var geometry = new THREE.Geometry();
        
        for (var i = 0; i <= minutes; i += intervalMinutes) {
            const date = new Date(initialDate.getTime() + i * 60000);

            const pos = getPositionFromTLE(station, date);

            geometry.vertices.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }        

        var orbitCurve = new THREE.Line(geometry, material);
        station.orbit = orbitCurve;

        this.earth.add(orbitCurve);
    }    

    removeOrbit = (station) => {
        if (!station || !station.orbit) return;

        this.earth.remove(station.orbit);
        station.orbit = null;
    }

    _addLteFileStations = (lteFileContent, color, stationOptions) => {
        const stations = parseLteFile(lteFileContent, stationOptions);

        const { satelliteSize } = stationOptions;

        stations.forEach(s => {
            this.addSatellite(s, color, satelliteSize);
        });

        return stations;
    }



    _getSatelliteMesh = (color, size) => {
        color = color || this.options.defaultSatelliteColor;
        size = size || SatelliteSize;

        if (!this.geometry) {

            this.geometry = new THREE.BoxBufferGeometry(size, size, size);
            this.material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: 0xFF4040,
                flatShading: false,
                side: THREE.DoubleSide,
            });
        }

        return new THREE.Mesh(this.geometry, this.material);
    }

    _getSatelliteSprite = (color, size) => {
        // material = material || this._getColorMaterial(this.options.defaultSatelliteColor)
        // const sat = new THREE.Sprite(material);

        // sat.position.normalize();
        // sat.position.multiplyScalar(100);

        //this._satelliteSprite = new THREE.TextureLoader().load(circle);

        
        // return new THREE.SpriteMaterial({
        //     map: bmp || this._satBmp, 
        //     color: color, 
        //     //sizeAttenuation: false
        // });
    }


    _getSatellitePositionFromTle = (station, date) => {
        date = date || TargetDate;
        return getPositionFromTLE(station, date);
    }

    updateSatellitePosition = (station, date) => {
        date = date || TargetDate;

        const pos = getPositionFromTLE(station, date);
        if (!pos) return;

        station.mesh.position.set(pos.x, pos.y, pos.z);
    }


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

        this.renderer.setClearColor(new THREE.Color(this.options.backgroundColor));
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

    _animationLoop = () => {
        this._animate();

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this._animationLoop);
    };



    // __ Scene contents ______________________________________________________


    _addEarth = () => {
        const textLoader = new THREE.TextureLoader();

        const group = new THREE.Group();

        // Planet
        let geometry = new THREE.SphereGeometry(earthRadius, 50, 50);
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

    _animate = () => {
        //this.earth.rotation.y += 0.005;
    }


    _findStationFromMesh = (threeObject) => {
        for (var i = 0; i < this.stations.length; ++i) {
            const s = this.stations[i];

            if (s.mesh === threeObject) return s;
        }

        return null;
    }
}