import React, { Component } from 'react';
import "./assets/theme.css";
import { Engine } from './engine';
import Info from './Info';
import Search from './Search/Search';
import SelectedStations from './Selection/SelectedStations';
import Fork from './fork';
import * as qs from 'query-string';
import Highlights from './highlights';
import DateSlider from './Options/DateSlider';

// Some config
const UseDateSlider = false;
const DateSliderRangeInMilliseconds = 24 * 60 * 60 * 1000;  // 24 hours

// Bypass CORS
function getCorsFreeUrl(url) {
    return 'https://api.allorigins.win/raw?url=' + url;    
}

class App extends Component {

    state = {
        selected: [],
        stations: [], 
        query: null,
        queryObjectCount: 0,
        initialDate: new Date().getTime(),
        currentDate: new Date().getTime(), 
        referenceFrame: UseDateSlider ? 2 : 1
    }

    componentDidMount() {
        this.engine = new Engine();
        this.engine.referenceFrame = this.state.referenceFrame;
        this.engine.initialize(this.el, {
            onStationClicked: this.handleStationClicked
        });
        this.addStations();

        this.engine.updateAllPositions(new Date())

        setInterval(this.handleTimer, 1000);
    }

    componentWillUnmount() {
        this.engine.dispose();
    }

    processQuery = (stations) => {
        const q = window.location.search;
        if (!q) return;

        const params = qs.parse(q);

        if (params.ss) {
            const selectedIds = params.ss.split(',');
            if (!selectedIds || selectedIds.length === 0) return;

            selectedIds.forEach(id => {
                const station = this.findStationById(stations, id);
                if (station) this.selectStation(station);
            });
        }

        if (params.highlight) {
            const query = params.highlight;
            const matches = this.queryStationsByName(stations, query);
            matches.forEach(st => this.engine.highlightStation(st));
            this.setState({...this.state, query, queryObjectCount: matches.length });
        }
    }

    queryStationsByName = (stations, query) => {
        query = query.toLowerCase();
        return stations.filter(st => st.name.toLowerCase().indexOf(query) > -1)
    }

    findStationById = (stations, id) => {
        return stations.find(st => st.satrec && st.satrec.satnum == id);
    }

    handleStationClicked = (station) => {
        if (!station) return;

        this.toggleSelection(station);
    }

    toggleSelection(station) {
        if (this.isSelected(station))
            this.deselectStation(station);
        else
            this.selectStation(station);
    }

    isSelected = (station) => {
        return this.state.selected.includes(station);
    }

    selectStation = (station) => {
        const newSelected = this.state.selected.concat(station);
        this.setState({selected: newSelected});

        this.engine.addOrbit(station);
    }

    deselectStation = (station) => {
        const newSelected = this.state.selected.filter(s => s !== station);
        this.setState( { selected: newSelected } );

        this.engine.removeOrbit(station);
    }

    addStations = () => {
        this.addCelestrakSets();
        //this.engine.addSatellite(ISS);
        //this.addAmsatSets();
    }

    addCelestrakSets = () => {
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/weather.txt'), 0x00ffff)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/cosmos-2251-debris.txt'), 0xff0090)
        this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/active.txt'), 0xffffff)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/science.txt'), 0xffff00)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/stations.txt'), 0xffff00)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/iridium-NEXT.txt'), 0x00ff00)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/gps-ops.txt'), 0x00ff00)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/ses.txt'), 0xffffff)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/starlink.txt'), 0x0000ff)
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/gps-ops.txt'), 0xffffff, { orbitMinutes: 0, satelliteSize: 200 })
        //this.engine.loadLteFileStations(getCorsFreeUrl('http://www.celestrak.org/NORAD/elements/glo-ops.txt'), 0xff0000, { orbitMinutes: 500, satelliteSize: 500 })
            .then(stations => {
                this.setState({stations});
                this.processQuery(stations);
            });

    }

    addAmsatSets = () => {
        this.engine.loadLteFileStations(getCorsFreeUrl('https://www.amsat.org/tle/current/nasabare.txt'), 0xffff00);
    }

    handleTimer = () => {
        // By default, update in realtime every second, unless dateSlider is displayed.
        if (!UseDateSlider) this.handleDateChange(null, new Date());
    }

    handleSearchResultClick = (station) => {
        if (!station) return;

        this.toggleSelection(station);
    }

    handleRemoveSelected = (station) => {
        if (!station) return;
        
        this.deselectStation(station);
    }

    handleRemoveAllSelected = () => {
        this.state.selected.forEach(s => this.engine.removeOrbit(s));
        this.setState({selected: []});
    }

    handleReferenceFrameChange = () => {
        this.state.selected.forEach(s => this.engine.removeOrbit(s));

        const newType = this.state.referenceFrame === 1 ? 2 : 1;
        this.setState({referenceFrame: newType});
        this.engine.setReferenceFrame(newType);

        this.state.selected.forEach(s => this.engine.addOrbit(s));
    }

    handleDateChange = (v, d) => {
        const newDate = v ? v.target.value : d;
        this.setState({ currentDate: newDate });

        const date = new Date();
        date.setTime(newDate);
        this.engine.updateAllPositions(date);
    }

    renderDate = (v) => {
        const result = new Date();
        result.setTime(v);
        return result.toString();
    }

    render() {
        const { selected, stations, initialDate, currentDate } = this.state;

        const maxMs = initialDate + DateSliderRangeInMilliseconds;

        return (
            <div>
                <Fork />
                <Highlights query={this.state.query} total={this.state.queryObjectCount} />
                <Info stations={stations} refMode={this.state.referenceFrame} />
                <Search stations={this.state.stations} onResultClick={this.handleSearchResultClick} />
                <SelectedStations selected={selected} onRemoveStation={this.handleRemoveSelected} onRemoveAll={this.handleRemoveAllSelected} />
                {UseDateSlider && <DateSlider min={initialDate} max={maxMs} value={currentDate} onChange={this.handleDateChange} onRender={this.renderDate} />}
                <div ref={c => this.el = c} style={{ width: '99%', height: '99%' }} />
            </div>
        )
    }
}



export default App;