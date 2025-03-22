import { Feature, Map, Overlay } from 'ol'
import { Path } from '@/api/graphhopper'
import { FeatureCollection } from 'geojson'
import { useEffect } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { GeoJSON } from 'ol/format'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import { fromLonLat } from 'ol/proj'
import { Select } from 'ol/interaction'
import { click } from 'ol/events/condition'
import Dispatcher from '@/stores/Dispatcher'
import { SetSelectedPath } from '@/actions/Actions'
import { SelectEvent } from 'ol/interaction/Select'
import { QueryPoint } from '@/stores/QueryStore'
import { distance } from 'ol/coordinate'
import LineString from 'ol/geom/LineString'
import { Geometry, Point } from 'ol/geom'
import "./ol-popup.css"

const pathsLayerKey = 'pathsLayer'
const selectedPathLayerKey = 'selectedPathLayer'
const accessNetworkLayerKey = 'accessNetworkLayer'

export default function usePathsLayer(map: Map, paths: Path[], selectedPath: Path, queryPoints: QueryPoint[]) {
    useEffect(() => {
        removeCurrentPathLayers(map)
        addUnselectedPathsLayer(
            map,
            paths.filter(p => p != selectedPath)
        )
        addSelectedPathsLayer(map, selectedPath)
        addAccessNetworkLayer(map, selectedPath, queryPoints)
        return () => {
            removeCurrentPathLayers(map)
        }
    }, [map, paths, selectedPath])
}

function removeCurrentPathLayers(map: Map) {
    map.getLayers()
        .getArray()
        .filter(l => l.get(pathsLayerKey) || l.get(selectedPathLayerKey) || l.get(accessNetworkLayerKey))
        .forEach(l => map.removeLayer(l))
}

function addUnselectedPathsLayer(map: Map, paths: Path[]) {
    const styleArray = [
        new Style({
            stroke: new Stroke({
                color: 'rgba(39,93,173,0.8)',
                width: 6,
            }),
        }),
        new Style({
            stroke: new Stroke({
                color: 'rgba(201,217,241,0.7)',
                width: 4,
            }),
        }),
    ]
    const layer = new VectorLayer({
        source: new VectorSource({
            features: paths.map((path: Path, index) => {
                const f = new Feature({
                    index: index,
                })
                if (path.points?.coordinates)
                    f.setGeometry(new LineString(path.points.coordinates.map(c => fromLonLat(c))))
                return f
            }),
        }),
        style: styleArray,
        opacity: 0.7,
        zIndex: 1,
    })
    layer.set(pathsLayerKey, true)
    map.addLayer(layer)

    // select an alternative path if clicked
    removeSelectPathInteractions(map)
    const select = new Select({
        condition: click,
        layers: [layer],
        style: null,
        hitTolerance: 5,
    })
    select.on('select', (e: SelectEvent) => {
        const index = e.selected[0].getProperties().index
        Dispatcher.dispatch(new SetSelectedPath(paths[index]))
    })
    select.set('gh:select_path_interaction', true)
    map.addInteraction(select)
}

function createBezierLineString(start: number[], end: number[]): LineString {
    const bezierPoints = []
    const center = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2]
    const radius = distance(start, end) / 2

    const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0])
    const endAngle = Math.atan2(end[1] - center[1], end[0] - center[0])

    // Define the control points for the Bezier curve
    const controlPoints = [
        center[0] + (1 / 2) * radius * Math.sin(startAngle + (1 / 2) * (endAngle - startAngle)),
        center[1] + (1 / 2) * radius * Math.cos(startAngle + (1 / 2) * (endAngle - startAngle)),
    ]

    // Calculate intermediate points along the curve using a Bezier curve
    bezierPoints.push(start)
    for (let t = 0; t <= 1; t += 0.1) {
        const point = [
            (1 - t) * (1 - t) * start[0] + 2 * t * (1 - t) * controlPoints[0] + t * t * end[0],
            (1 - t) * (1 - t) * start[1] + 2 * t * (1 - t) * controlPoints[1] + t * t * end[1],
        ]
        bezierPoints.push(point)
    }
    bezierPoints.push(end)
    return new LineString(bezierPoints)
}

function addAccessNetworkLayer(map: Map, selectedPath: Path, queryPoints: QueryPoint[]) {
    const style = new Style({
        stroke: new Stroke({
            color: 'rgba(143,183,241,0.9)',
            width: 5,
            lineDash: [1, 10],
            lineCap: 'round',
            lineJoin: 'round',
        }),
    })
    const layer = new VectorLayer({
        source: new VectorSource(),
    })
    layer.setStyle(style)
    for (let i = 0; i < selectedPath.snapped_waypoints.coordinates.length; i++) {
        const start = fromLonLat([queryPoints[i].coordinate.lng, queryPoints[i].coordinate.lat])
        const end = fromLonLat(selectedPath.snapped_waypoints.coordinates[i])
        layer.getSource()?.addFeature(new Feature(createBezierLineString(start, end)))
    }
    layer.set(accessNetworkLayerKey, true)
    layer.setZIndex(1)
    map.addLayer(layer)
}

type SurfaceInfo = {
    color: string
    url: string
}

let surfaceMap = new Map();
surfaceMap.set('asphalt', { color: '#000000', url: 'https://wiki.openstreetmap.org/w/images/thumb/5/56/Surface_asphalt.jpg/200px-Surface_asphalt.jpg' });
surfaceMap.set('unpaved', { color: '#D2B48C', url: 'https://wiki.openstreetmap.org/w/images/thumb/5/5e/Surface_unpaved.jpg/200px-Surface_unpaved.jpg' });
surfaceMap.set('paved', { color: '#C0C0C0', url: 'https://wiki.openstreetmap.org/w/images/thumb/5/5f/Surface_paved.jpg/200px-Surface_paved.jpg' });
surfaceMap.set('concrete', { color: '#808080', url: 'https://wiki.openstreetmap.org/w/images/thumb/3/3d/Surface_concrete.jpg/200px-Surface_concrete.jpg' });
surfaceMap.set('paving_stones', { color: '#A52A2A', url: 'https://wiki.openstreetmap.org/w/images/thumb/2/2f/Surface_paving_stones.jpg/200px-Surface_paving_stones.jpg' });
surfaceMap.set('ground', { color: '#DEB887', url: 'https://wiki.openstreetmap.org/w/images/thumb/4/4b/Surface_ground.jpg/200px-Surface_ground.jpg' });
surfaceMap.set('gravel', { color: '#8B4513', url: 'https://wiki.openstreetmap.org/w/images/thumb/1/1b/Surface_gravel.jpg/200px-Surface_gravel.jpg' });
surfaceMap.set('dirt', { color: '#A0522D', url: 'https://wiki.openstreetmap.org/w/images/thumb/2/2e/Surface_dirt.jpg/200px-Surface_dirt.jpg' });
surfaceMap.set('grass', { color: '#008000', url: 'https://wiki.openstreetmap.org/w/images/thumb/6/6e/Surface_grass.jpg/200px-Surface_grass.jpg' });
surfaceMap.set('compacted', { color: '#D2691E', url: 'https://wiki.openstreetmap.org/w/images/thumb/5/5e/Surface_compacted.jpg/200px-Surface_compacted.jpg' });
surfaceMap.set('sand', { color: '#FFD700', url: 'https://wiki.openstreetmap.org/w/images/thumb/7/70/Surface_sand.jpg/200px-Surface_sand.jpg' });
surfaceMap.set('sett', { color: '#708090', url: 'https://wiki.openstreetmap.org/w/images/thumb/8/8b/Surface_sett.jpg/200px-Surface_sett.jpg' });
surfaceMap.set('fine_gravel', { color: '#CD853F', url: 'https://wiki.openstreetmap.org/w/images/thumb/3/3c/Surface_fine_gravel.jpg/200px-Surface_fine_gravel.jpg' });
surfaceMap.set('wood', { color: '#A0522D', url: 'https://wiki.openstreetmap.org/w/images/thumb/6/6b/Surface_wood.jpg/200px-Surface_wood.jpg' });
surfaceMap.set('concrete:plates', { color: '#B0C4DE', url: 'https://wiki.openstreetmap.org/w/images/thumb/9/9e/Surface_concrete_plates.jpg/200px-Surface_concrete_plates.jpg' });
surfaceMap.set('earth', { color: '#8B4513', url: 'https://wiki.openstreetmap.org/w/images/thumb/2/2e/Surface_earth.jpg/200px-Surface_earth.jpg' });
surfaceMap.set('cobblestone', { color: '#2F4F4F', url: 'https://wiki.openstreetmap.org/w/images/thumb/1/1e/Surface_cobblestone.jpg/200px-Surface_cobblestone.jpg' });
surfaceMap.set('pebblestone', { color: '#BC8F8F', url: 'https://wiki.openstreetmap.org/w/images/thumb/8/8b/Surface_pebblestone.jpg/200px-Surface_pebblestone.jpg' });
surfaceMap.set('grass_paver', { color: '#32CD32', url: 'https://wiki.openstreetmap.org/w/images/thumb/6/6e/Surface_grass_paver.jpg/200px-Surface_grass_paver.jpg' });
surfaceMap.set('metal', { color: '#B0C4DE', url: 'https://wiki.openstreetmap.org/w/images/thumb/1/1a/Surface_metal.jpg/200px-Surface_metal.jpg' });
surfaceMap.set('artificial_turf', { color: '#7CFC00', url: 'https://wiki.openstreetmap.org/w/images/thumb/4/45/Surface_artificial_turf.jpg/200px-Surface_artificial_turf.jpg' });
surfaceMap.set('tartan', { color: '#FF4500', url: 'https://wiki.openstreetmap.org/w/images/thumb/3/3e/Surface_tartan.jpg/200px-Surface_tartan.jpg' });
surfaceMap.set('unhewn_cobblestone', { color: '#696969', url: 'https://wiki.openstreetmap.org/w/images/thumb/9/9b/Surface_unhewn_cobblestone.jpg/200px-Surface_unhewn_cobblestone.jpg' });

function getSurfaceUrl(surfaceType: string): string {
    if (surfaceMap.get(surfaceType) != undefined) {
        return surfaceMap.get(surfaceType).url;
    }
    else {
        return "";
    }
}

function getSurfaceColor(surfaceType: string): string {
    if (surfaceMap.get(surfaceType) != undefined) {
        return surfaceMap.get(surfaceType).color;
    }
    else {
        return "#000000";
    }
}

type Surface = [number, number, string];

type SpecialFeature = Feature<Geometry> & { surfaceType: string };

function addSelectedPathsLayer(map: Map, selectedPath: Path) {
    const segments = selectedPath.points.coordinates;
    const features: Feature<Geometry>[] = [];
    const styles: Style[] = [];

    // Remove existing layer with the key 'selectedPathLayerKey'
    const existingLayer = map.getLayers().getArray().find(layer => layer.get('selectedPathLayerKey'));
    if (existingLayer) {
        map.removeLayer(existingLayer);
    }

    // store the surface type for each segment in a list
    const surface = ((selectedPath.details as any).surface as Surface[]) //.surface.map(s => s.surface);
    const wrapped_surface = surface ? surface : [[0, 2, "missing"] as Surface];

    const newList = wrapped_surface.flatMap(([begin, end, surface]) =>
        Array(end - begin).fill(surface)
    );


    for (let i = 0; i < segments.length - 1; i++) {
        const start = fromLonLat(segments[i]);
        const end = fromLonLat(segments[i + 1]);
        const surfaceType = newList[i];
        const lineFeature = new Feature(new LineString([start, end]));
        (lineFeature as any).surfaceType = surfaceType;
        features.push(lineFeature);
        const color = getSurfaceColor(surfaceType);
        const style = new Style({
            stroke: new Stroke({
                color: color,
                width: 8,
            }),
        });
        styles.push(style);
    }

    const pointFeatures = segments.map(c => {
        const point = new Point(fromLonLat(c));
        return new Feature(point);
    });

    const pointStyle = new Style({
        image: new Circle({
            radius: 5,
            fill: new Fill({ color: 'rgba(255, 0, 0, 0.8)' }),
            stroke: new Stroke({ color: 'rgba(255, 255, 255, 0.8)', width: 2 }),
        }),
    });

    const layer = new VectorLayer({
        source: new VectorSource({
            features: [...features] //, ...pointFeatures],
        }),
        style: (feature) => {
            if (feature.getGeometry() instanceof Point) {
                return pointStyle;
            }
            else {
                const index = features.indexOf(feature as Feature<Geometry>);
                return styles[index];
            }
        },
        opacity: 0.8,
        zIndex: 2,
    });

    layer.set('selectedPathLayerKey', true);
    map.addLayer(layer);

    // Create a popup overlay
    const popupElement = document.createElement('div');
    popupElement.className = 'ol-popup';
    const popup = new Overlay({
        element: popupElement,
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -15],
    });
    map.addOverlay(popup);

    map.on("click", function (e) {
        map.forEachFeatureAtPixel(e.pixel, function (feature, event_layer) {
            if (event_layer == layer) {
                const surfaceType = (feature as SpecialFeature).surfaceType;
                console.log("Feature clicked", surfaceType);

                // Show popup with image and surface type
                popupElement.innerHTML = `
                <img src="${getSurfaceUrl(surfaceType)}, alt="Surface Image"/>
                <div>${surfaceType}</div>
            `;
                popup.setPosition(e.coordinate);
            }
        });
    });
}

function removeSelectPathInteractions(map: Map) {
    map.getInteractions()
        .getArray()
        .filter(i => i.get('gh:select_path_interaction'))
        .forEach(i => map.removeInteraction(i))
}
