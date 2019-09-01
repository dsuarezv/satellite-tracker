import React, { Component } from 'react';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import earthmap from './assets/earthmap.png';


class App extends Component {

    componentDidMount() {
        this.setupScene();
        this.setupLights();
        this.addCustomSceneObjects();
        this.startAnimationLoop();

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

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

        this.controls = new OrbitControls(this.camera, this.el);
        // this.controls.enableZoom = false;

        this.camera.position.z = 5;
        this.camera.position.y = 4;
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(width, height);
        this.el.appendChild(this.renderer.domElement);
    };

    setupLights = () => {
        const lights = [];
        lights[0] = new THREE.PointLight(0xffffff, 1, 0);
        lights[1] = new THREE.PointLight(0xffffff, 1, 0);
        lights[2] = new THREE.PointLight(0xffffff, 1, 0);

        lights[0].position.set(0, 200, 0);
        lights[1].position.set(100, 200, 100);
        lights[2].position.set(- 100, - 200, - 100);

        this.scene.add(lights[0]);
        this.scene.add(lights[1]);
        this.scene.add(lights[2]);
    }

    addCustomSceneObjects = () => {
        this.addEarth();
    };

    startAnimationLoop = () => {
        //this.cube.rotation.x += 0.01;
        this.earth.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop);
    };

    
    // __ Scene contents ______________________________________________________


    addEarth() {
        const geometry = new THREE.SphereGeometry(2, 100, 100);
        //const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({
            //color: 0x156289,
            //emissive: 0x072534,
            //side: THREE.DoubleSide,
            //flatShading: false,
            map: THREE.ImageUtils.loadTexture(earthmap)
        });


        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);
    }


    

    render() {
        const p = this.props;

        return (
            <div>
                <h1>Satellite tracker</h1>
                <div ref={c => this.el = c} style={{ width: '640px', height: '400px' }} />
            </div>
        )
    }
}

export default App;