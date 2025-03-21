import { Feature, Map } from 'ol'
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

function getColorForSurfaceType(surfaceType: string): string {
    switch (surfaceType) {
        case 'asphalt':
            return '#000000'; // black
        case 'unpaved':
            return '#D2B48C'; // tan
        case 'paved':
            return '#C0C0C0'; // silver
        case 'concrete':
            return '#808080'; // gray
        case 'paving_stones':
            return '#A52A2A'; // brown
        case 'ground':
            return '#DEB887'; // burlywood
        case 'gravel':
            return '#8B4513'; // saddle brown
        case 'dirt':
            return '#A0522D'; // sienna
        case 'grass':
            return '#008000'; // green
        case 'compacted':
            return '#D2691E'; // chocolate
        case 'sand':
            return '#FFD700'; // gold
        case 'sett':
            return '#708090'; // slate gray
        case 'fine_gravel':
            return '#CD853F'; // peru
        case 'wood':
            return '#A0522D'; // sienna
        case 'concrete:plates':
            return '#B0C4DE'; // light steel blue
        case 'earth':
            return '#8B4513'; // saddle brown
        case 'cobblestone':
            return '#2F4F4F'; // dark slate gray
        case 'pebblestone':
            return '#BC8F8F'; // rosy brown
        case 'grass_paver':
            return '#32CD32'; // lime green
        case 'metal':
            return '#B0C4DE'; // light steel blue
        case 'artificial_turf':
            return '#7CFC00'; // lawn green
        case 'tartan':
            return '#FF4500'; // orange red
        case 'unhewn_cobblestone':
            return '#696969'; // dim gray
        default:
            return '#FF0000'; // red
    }
}

type Surface = [number, number, string];

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
    const wrapped_surface = surface ? surface :  [[ 0, 2, "missing"] as Surface];

    const newList = wrapped_surface.flatMap(([begin, end, surface]) =>
        Array(end - begin).fill(surface)
      );


    for (let i = 0; i < segments.length - 1; i++) {
        const start = fromLonLat(segments[i]);
        const end = fromLonLat(segments[i + 1]);
        const lineFeature = new Feature(new LineString([start, end]));
        features.push(lineFeature);
        const color = getColorForSurfaceType(newList[i]);
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
}

function removeSelectPathInteractions(map: Map) {
    map.getInteractions()
        .getArray()
        .filter(i => i.get('gh:select_path_interaction'))
        .forEach(i => map.removeInteraction(i))
}
