// @flow

import React from 'react';
import { render } from 'react-dom';
import Index from './pages/index';

import "leaflet/dist/leaflet.css";

// BUG https://github.com/Leaflet/Leaflet/issues/4968
import L from "leaflet";

L.Icon.Default.imagePath = "/";
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

render(<Index />, document.querySelector('#root'));
