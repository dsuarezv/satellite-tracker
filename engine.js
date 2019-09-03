import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap-high.jpg';
import circle from './assets/circle.png';
import { parseLteFile, getPositionFromTLE } from "./lte";
import { earthRadius } from "satellite.js/lib/constants";


const SatelliteSize = 50;

let TargetDate = new Date();

const defaultOptions = {
    backgroundColor: 0x333340,
    defaultSatelliteColor: 0xff0000
}

const defaultStationOptions = {
    orbitMinutes: 0,
    satelliteSize: 50
}

export class Engine {
    initialize(container, options = {}) {
        this.el = container;
        this.options = { ...defaultOptions, ...options };

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


    // __ API _________________________________________________________________


    addSatellite = (station, material, size) => {
        size = size || SatelliteSize;
        const geometry = new THREE.BoxBufferGeometry(size, size, size);
        material = material || new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF4040,
            flatShading: false,
            side: THREE.DoubleSide,
        });
        const sat = new THREE.Mesh(geometry, material);

        // material = material || this._getColorMaterial(this.options.defaultSatelliteColor)
        // const sat = new THREE.Sprite(material);

        station._sat = sat;

        this.updateSatellitePosition(station);
        // sat.position.normalize();
        // sat.position.multiplyScalar(100);

        this._addOrbit(station);

        this.earth.add(sat);
    }

    updateSatellitePosition = (station, date) => {
        
        date = date || TargetDate;

        const pos = getPositionFromTLE(station.lte1, station.lte2, date);
        if (!pos) return;

        station._sat.position.set(pos.x, pos.y, pos.z);
    }

    
    loadLteFileStations = (url, color, stationOptions) => {
        const options = { ...defaultStationOptions, ...stationOptions };

        return fetch(url).then(res => {
            res.text().then(text => {
                const material = color && this._getColorMaterial(color);
                this._addLteFileStations(text, material, options);
            });
        });
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

        this._satBmp = new THREE.TextureLoader().load(circle);
    };

    _animationLoop = () => {
        this._animate();

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this._animationLoop);
    };


    _getColorMaterial = (color, bmp) => {
        return new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide,
        });
    
        // return new THREE.SpriteMaterial({
        //     map: bmp || this._satBmp, 
        //     color: color, 
        //     //sizeAttenuation: false
        // });
    }
    


    _addLteFileStations = (fileContent, material, stationOptions) => {
        const stations = parseLteFile(fileContent, stationOptions);

        const { satelliteSize } = stationOptions;

        stations.forEach(s => {
            this.addSatellite(s, material, satelliteSize);
        });
    }


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


    

    _animate = () => {
        //this.earth.rotation.y += 0.005;
    }

}