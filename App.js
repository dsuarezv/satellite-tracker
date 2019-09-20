import React, { Component } from 'react';
import "./assets/theme.css";
import { Engine } from './engine';
import Info from './Info';
import Search from './Search/Search';


const ISS = {
    name: 'International Space Station ZARYA (NORAD 25544)',
    category: 'B',
    tle1: '1 25544U 98067A   19245.18443877  .00012516  00000-0  22337-3 0  9998',
    tle2: '2 25544  51.6455 339.3385 0007918 357.2134  84.5192 15.50431138187200',
    orbitMinutes: 96
}

function getCorsFreeUrl(url) {
    // Bypass CORS
    return 'https://cors-anywhere.herokuapp.com/' + url;
}


class App extends Component {

    state = {
        selected: null,
        stations: []
    }

    componentDidMount() {
        this.engine = new Engine();
        this.engine.initialize(this.el, {
            onStationClicked: this.handleStationClicked
        });
        this.addStations();
    }

    componentWillUnmount() {
        this.engine.dispose();
    }

    handleStationClicked = (station) => {
        this.setState({selected: station});
    }

    addStations = () => {
        this.addCelestrakSets();
        //this.engine.addSatellite(ISS);
        //this.addAmsatSets();
    }

    addCelestrakSets = () => {
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/weather.txt'), 0x00ffff);
        // this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/active.txt'), 0xffffff)
        //     .then(stations => {
        //         this.setState({stations});
        //     });
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/science.txt'), 0xffff00);
        this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/stations.txt'), 0xffff00)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/cosmos-2251-debris.txt'), 0xff0000);
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/iridium-NEXT.txt'), 0x00ff00);
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/gps-ops.txt'), 0x00ff00);
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/ses.txt'), 0xffffff);
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/starlink.txt'), 0xffffff);
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/gps-ops.txt'), 0xffffff, { orbitMinutes: 0, satelliteSize: 200 })
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.com/NORAD/elements/glo-ops.txt'), 0xff0000, { orbitMinutes: 500, satelliteSize: 500 })
            .then(stations => {
                this.setState({stations});
            });

    }

    addAmsatSets = () => {
        this.engine.loadLteFileStations(getCorsFreeUrl('https://www.amsat.org/tle/current/nasabare.txt'), 0xffff00);
    }

    handleSearchResultClick = (station) => {
        if (!station) return;

        console.log(station);

        this.engine.addOrbit(station);
    }

    render() {
        const { selected, stations } = this.state;

        return (
            <div>
                <Info selected={selected} stations={stations} />
                <Search stations={this.state.stations} onResultClick={this.handleSearchResultClick} />
                <div ref={c => this.el = c} style={{ width: '100%', height: '100%' }} />
            </div>
        )
    }
}

export default App;