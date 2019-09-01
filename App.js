import React, { Component } from 'react';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap-high.jpg';
import { twoline2satrec, propagate, gstime, eciToGeodetic, eciToEcf } from 'satellite.js/lib/index';
import "./assets/theme.css";


class App extends Component {

    componentDidMount() {
        this.setupScene();
        this.setupLights();
        this.addCustomSceneObjects();
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
        // get container dimensions and use them for scene sizing
        const width = this.el.clientWidth;
        const height = this.el.clientHeight;

        this.scene = new THREE.Scene();

        var NEAR = 1e-6, FAR = 1e27;

        this.camera = new THREE.PerspectiveCamera(75, width / height, NEAR, FAR);

        this.controls = new OrbitControls(this.camera, this.el);
        // this.controls.enableZoom = false;

        this.camera.position.x = 12000;
    
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({
            logarithmicDepthBuffer: true,
            antialias: true
        });

        this.renderer.setClearColor(new THREE.Color(0x333340));
        this.renderer.setSize(width, height);
        this.el.appendChild(this.renderer.domElement);
    };

    animationLoop = () => {
        this.animate();

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this.animationLoop);
    };

    setupLights = () => {
        const sun = new THREE.PointLight(0xffffff, 1, 0);
        sun.position.set(149600000, 0, 0);

        const ambient = new THREE.AmbientLight(0x404040);

        this.scene.add(sun);
        this.scene.add(ambient);
    }

    addCustomSceneObjects = () => {
        this.addEarth();
        this.addSatellite();
    };    

    
    // __ Scene contents ______________________________________________________


    addEarth = () => {
        const textLoader = new THREE.TextureLoader();


        // Planet
        let geometry = new THREE.SphereGeometry(6371, 100, 100);
        let material = new THREE.MeshPhongMaterial({
            //color: 0x156289,
            //emissive: 0x072534,
            side: THREE.DoubleSide,
            flatShading: false,
            map: textLoader.load(earthmap)
        });

        const earth = new THREE.Mesh(geometry, material);


        // Axis
        material = new THREE.LineBasicMaterial({color: 0xffffff});
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3( 0, -8000, 0 ),
            new THREE.Vector3( 0, 8000, 0 )
        );
        
        var earthRotationAxis = new THREE.Line( geometry, material );
        

        const group = new THREE.Group();
        group.add(earth);
        group.add(earthRotationAxis);

        this.earth = group;
        this.earth.rotation.x = -0.408407; // 23.4º ecliptic tilt angle
        this.scene.add(this.earth);

    }

    addSatellite = () => {
        const pos = this.getSatelliteFromTLE(
            '1   900U 64063C   19244.53857318  .00000186  00000-0  19006-3 0  9992',
            '2   900  90.1508  23.7571 0026918 203.5607 223.9641 13.73267467730663');

        const geometry = new THREE.BoxBufferGeometry(50, 50, 50);
        const material = new THREE.MeshPhongMaterial({
            color: 0xFF0000,
            emissive: 0xFF4040,
            flatShading: false,
            side: THREE.DoubleSide,
        });
        
        
        this.sat = new THREE.Mesh(geometry, material);
        this.sat.position.set(pos.x, pos.y, pos.z);
        this.earth.add(this.sat);
    }


    // __ Satellite locations _________________________________________________


    getSatelliteFromTLE = (tleLine1, tleLine2) => {

        // Initialize a satellite record
        var satrec = twoline2satrec(tleLine1, tleLine2);

        //  Propagate satellite using time since epoch (in minutes).
        //var positionAndVelocity = satellite.sgp4(satrec, timeSinceTleEpochMinutes);

        //  Or you can use a JavaScript Date
        var date = new Date();

        var pv = propagate(satrec, date);

        // The position_velocity result is a key-value pair of ECI coordinates.
        // These are the base results from which all other coordinates are derived.
        var positionEci = pv.position;
        var velocityEci = pv.velocity;

        // // Set the Observer at 122.03 West by 36.96 North, in RADIANS
        // var observerGd = {
        // longitude: satellite.degreesToRadians(-122.0308),
        // latitude: satellite.degreesToRadians(36.9613422),
        // height: 0.370
        // };

        // // You will need GMST for some of the coordinate transforms.
        // // http://en.wikipedia.org/wiki/Sidereal_time#Definition
        var gmst = gstime(date);

        // // You can get ECF, Geodetic, Look Angles, and Doppler Factor.
        // observerEcf   = satellite.geodeticToEcf(observerGd),
        // lookAngles    = satellite.ecfToLookAngles(observerGd, positionEcf),
        // dopplerFactor = satellite.dopplerFactor(observerCoordsEcf, positionEcf, velocityEcf);
        
        //var positionEcf   = eciToEcf(positionEci, gmst);
        // var positionGd = eciToGeodetic(positionEci, gmst);
        // console.log('eci', positionEci);
        // console.log('ecf', positionEcf);
        // console.log('gd', positionGd);
        
        return positionEci;

        // // The coordinates are all stored in key-value pairs.
        // // ECI and ECF are accessed by `x`, `y`, `z` properties.
        // var satelliteX = positionEci.x,
        // satelliteY = positionEci.y,
        // satelliteZ = positionEci.z;

        // // Look Angles may be accessed by `azimuth`, `elevation`, `range_sat` properties.
        // var azimuth   = lookAngles.azimuth,
        // elevation = lookAngles.elevation,
        // rangeSat  = lookAngles.rangeSat;

        // // Geodetic coords are accessed via `longitude`, `latitude`, `height`.
        // var longitude = positionGd.longitude,
        // latitude  = positionGd.latitude,
        // height    = positionGd.height;

        // //  Convert the RADIANS to DEGREES for pretty printing (appends "N", "S", "E", "W", etc).
        // var longitudeStr = satellite.degreesLong(longitude),
        // latitudeStr  = satellite.degreesLat(latitude);
    }

    animate = () => {
        //this.earth.rotation.y += 0.005;
        this.earth.rotation.y += 0.005;
    }
    

    render() {
        return (
            <div>
                <h1>Satellite tracker</h1>
                <div ref={c => this.el = c} style={{ width: '100%', height: '600px' }} />
            </div>
        )
    }
}

export default App;