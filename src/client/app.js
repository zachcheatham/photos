// @flow

import React from "react";
import { render } from "react-dom";
import Index from "./pages/index";

import "leaflet/dist/leaflet.css";

// BUG https://github.com/Leaflet/Leaflet/issues/4968
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
})

render(<Index />, document.querySelector('#root'));
