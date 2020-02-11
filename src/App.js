import React, { useState, useRef } from "react";
import useSwr from "swr";
import GoogleMapReact from "google-map-react";
import useSupercluster from "use-supercluster";
import "./App.css";

const fetcher = (...args) => fetch(...args).then(response => response.json());

const Marker = ({ children }) => children;

// const infoWindow = (crime) => crime.primary_type;

function App() {
  // 1) map setup
  const mapRef = useRef();
  const [zoom, setZoom] = useState(12);
  const [bounds, setBounds] = useState(null);
  // const [selectedCrime, setSelectedCrime] = useState(null);

  // 2) load and format data
  const url = "https://data.cityofchicago.org/resource/ijzp-q8t2.json";
  const { data, error } = useSwr(url, fetcher);
  const crimes = data && !error ? data : [];
  const points = crimes.map(crime => ({
    type: "Feature",
    properties: {
      cluster: false,
      crimeId: crime.id,
      description: crime.description
    },
    geometry: {
      type: "Point",
      coordinates: [parseFloat(crime.longitude), parseFloat(crime.latitude)]
    }
  }));

  // 3) get clusters
  const { clusters, supercluster } = useSupercluster({
    points,
    bounds,
    zoom,
    options: { radius: 75, maxZoom: 30 }
  });

  // 4) render map
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_KEY }}
        defaultCenter={{ lat: 41.883718, lng: -87.632382 }}
        defaultZoom={11.5}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map }) => {
          mapRef.current = map;
        }}
        onChange={({ zoom, bounds }) => {
          setZoom(zoom);
          setBounds([
            bounds.nw.lng,
            bounds.se.lat,
            bounds.se.lng,
            bounds.nw.lat
          ]);
        }}
      >
        {clusters.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker key={cluster.id} lat={latitude} lng={longitude}>
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 30}px`,
                    height: `${10 + (pointCount / points.length) * 30}px`
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      30
                    );
                    mapRef.current.setZoom(expansionZoom);
                    mapRef.current.panTo({ lat: latitude, lng: longitude });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker
              key={cluster.properties.crimeId}
              lat={latitude}
              lng={longitude}

              // onClick={() => {
              //   setSelectedCrime(crimes);
              // }}
            >
              <button className="crime-marker">
                <img src="/custody.svg" alt="crime doesn't pay" />
              </button>
            </Marker>
          );
        })}
        {/* {selectedCrime && (
          <infoWindow
          key={selectedCrime.id} 
          lat={selectedCrime.latitude} 
          lng={selectedCrime.longitude}
          
          onClick={() => {
            selectedCrime(crimes)
          }}
          >
            <div>{selectedCrime.primary_type}</div>
          </infoWindow>
        )} */}
      </GoogleMapReact>
    </div>
  );
}

export default App;
