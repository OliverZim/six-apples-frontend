import { Instruction, Path, RoutingResultInfo } from '@/api/graphhopper'
import { Coordinate, CurrentRequest, getBBoxFromCoord, RequestState, SubRequest } from '@/stores/QueryStore'
import styles from './RoutingResult.module.css'
import { ReactNode, useContext, useEffect, useState } from 'react'
import Dispatcher from '@/stores/Dispatcher'
import { PathDetailsElevationSelected, SetBBox, SetSelectedPath, SetCustomModel, SetCustomModelEnabled } from '@/actions/Actions'
import { metersToShortText, metersToTextForFile, milliSecondsToText } from '@/Converters'
import PlainButton from '@/PlainButton'
import Details from '@/sidebar/list.svg'
import GPXDownload from '@/sidebar/file_download.svg'
import Instructions from '@/sidebar/instructions/Instructions'
import { LineString, Position } from 'geojson'
import { calcDist } from '@/distUtils'
import { useMediaQuery } from 'react-responsive'
import { tr } from '@/translation/Translation'
import { ApiImpl } from '@/api/Api'
import FordIcon from '@/sidebar/routeHints/water.svg'
import CondAccessIcon from '@/sidebar/routeHints/remove_road.svg'
import FerryIcon from '@/sidebar/routeHints/directions_boat.svg'
import PrivateIcon from '@/sidebar/routeHints/privacy_tip.svg'
import StepsIcon from '@/sidebar/routeHints/floor.svg'
import BorderCrossingIcon from '@/sidebar/routeHints/border.svg'
import EuroIcon from '@/sidebar/routeHints/toll_euro.svg'
import DollarIcon from '@/sidebar/routeHints/toll_dollar.svg'
import GetOffBikeIcon from '@/sidebar/routeHints/push_bike.svg'
import SteepIcon from '@/sidebar/routeHints/elevation.svg'
import BadTrackIcon from '@/sidebar/routeHints/ssid_chart.svg'
import DangerousIcon from '@/sidebar/routeHints/warn_report.svg'
import { Bbox } from '@/api/graphhopper'
import { SettingsContext } from '@/contexts/SettingsContext'
import { Settings } from '@/stores/SettingsStore'
import { RouteStoreState } from '@/stores/RouteStore'
import { getClosestStreetViewImage } from '@/api/fetchimage'

export interface RoutingResultsProps {
    info: RoutingResultInfo
    paths: Path[]
    selectedPath: Path
    currentRequest: CurrentRequest
    profile: string
    route: RouteStoreState
}

export default function RoutingResults(props: RoutingResultsProps) {
    // for landscape orientation there is no need that there is space for the map under the 3 alternatives and so the max-height is smaller for short screen
    const isShortScreen = useMediaQuery({
        query: '(max-height: 45rem) and (orientation: landscape), (max-height: 70rem) and (orientation: portrait)',
    })
    return <ul>{isShortScreen ? createSingletonListContent(props) : createListContent(props)}</ul>
}



function RoutingResult({
    info,
    path,
    isSelected,
    profile,
    route
}: {
    info: RoutingResultInfo
    path: Path
    isSelected: boolean
    profile: string
    route: RouteStoreState
}) {
    const [isExpanded, setExpanded] = useState(false)
    const [selectedRH, setSelectedRH] = useState('')
    const [descriptionRH, setDescriptionRH] = useState('')
    const [showStepsModal, setShowStepsModal] = useState(false)
    const [StepsFirstPoint, setStepsFirstPoint] = useState<Coordinate | null>(null)
    const [pointsToExclude, setPointsToExclude] = useState<Coordinate[]>([])
    const [stepsImageUrl, setStepsImageUrl] = useState<string>("")
    const [imageError, setImageError] = useState(false)
    const resultSummaryClass = isSelected
        ? styles.resultSummary + ' ' + styles.selectedResultSummary
        : styles.resultSummary

    useEffect(() => setExpanded(isSelected && isExpanded), [isSelected])
    const settings = useContext(SettingsContext)
    const showDistanceInMiles = settings.showDistanceInMiles

    const fordInfo = getInfoFor(path.points, path.details.road_environment, s => s === 'ford')
    const tollInfo = getInfoFor(
        path.points,
        path.details.toll,
        s => s === 'all' || (s === 'hgv' && ApiImpl.isTruck(profile))
    )
    const ferryInfo = getInfoFor(path.points, path.details.road_environment, s => s === 'ferry')
    const accessCondInfo = getInfoFor(path.points, path.details.access_conditional, s => s != null && s.length > 0)
    const footAccessCondInfo = getInfoFor(path.points, path.details.foot_conditional, s => s != null && s.length > 0)
    const hikeRatingInfo = getInfoFor(path.points, path.details.hike_rating, s => s > 1)

    const bikeAccessCondInfo = getInfoFor(path.points, path.details.bike_conditional, s => s != null && s.length > 0)
    const mtbRatingInfo = getInfoFor(path.points, path.details.mtb_rating, s => s > 1)

    const privateOrDeliveryInfo = getInfoFor(
        path.points,
        path.details.road_access,
        s => s === 'private' || s === 'customers' || s === 'delivery'
    )

    const badTrackInfo = getInfoFor(
        path.points,
        path.details.track_type,
        s => s === 'grade2' || s === 'grade3' || s === 'grade4' || s === 'grade5'
    )
    const trunkInfo = getInfoFor(path.points, path.details.road_class, s => s === 'motorway' || s === 'trunk')
    const stepsInfo = getInfoFor(path.points, path.details.road_class, s => s === 'steps')
    const steepInfo = getHighSlopeInfo(path.points, 15, showDistanceInMiles)
    const getOffBikeInfo = getInfoFor(path.points, path.details.get_off_bike, s => s)
    const borderInfo = crossesBorderInfo(path.points, path.details.country)

    const showHints =
        fordInfo.distance > 0 ||
        tollInfo.distance > 0 ||
        ferryInfo.distance > 0 ||
        accessCondInfo.distance > 0 ||
        footAccessCondInfo.distance > 0 ||
        bikeAccessCondInfo.distance > 0 ||
        privateOrDeliveryInfo.distance > 0 ||
        trunkInfo.distance > 0 ||
        badTrackInfo.distance > 0 ||
        stepsInfo.distance > 0 ||
        borderInfo.values.length > 0 ||
        getOffBikeInfo.distance > 0 ||
        mtbRatingInfo.distance > 0 ||
        hikeRatingInfo.distance > 0 ||
        steepInfo.distance > 0


    const EXCLUDE_AREA = 30 // meter
    const EXCLUDE_AREA_LAT = 8.98311174991017e-06 * EXCLUDE_AREA
    const EXCLUDE_AREA_LON = 1.4763165177199368e-05 * EXCLUDE_AREA

    function SkipObStacle() {
        const customModelText = getCustomModel(pointsToExclude)

        // Use Dispatcher.dispatch directly
        Dispatcher.dispatch(new SetCustomModel(customModelText, true))
        Dispatcher.dispatch(new SetCustomModelEnabled(true))
    }

    function getCustomModel(excludePoints: Coordinate[]): string {
        let priority: any = [];
        let areas: any = [];

        for (let i = 0; i < excludePoints.length; i++) {
            let id = `area${i}`;
            areas.push({ point: [excludePoints[i].lat, excludePoints[i].lng], id: id });
            priority.push(priorityJSON(`in_${id}`, 0));
        }

        const obj = {
            priority: priority,
            areas: areaJSON(areas)
        }
        return JSON.stringify(obj)
    }

    function areaJSON(areas: { point: [number, number], id: string }[]) {
        let features: any = [];
        for (let area of areas) {
            const lat = area.point[0];
            const lon = area.point[1];
            features.push({
                "type": "Feature",
                "id": area.id,
                "properties": {},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [lon - EXCLUDE_AREA_LON / 2, lat - EXCLUDE_AREA_LAT / 2 ],
                            [lon - EXCLUDE_AREA_LON / 2, lat + EXCLUDE_AREA_LAT / 2 ],
                            [lon + EXCLUDE_AREA_LON / 2, lat + EXCLUDE_AREA_LAT / 2 ],
                            [lon + EXCLUDE_AREA_LON / 2, lat - EXCLUDE_AREA_LAT / 2 ],
                            [lon - EXCLUDE_AREA_LON / 2, lat - EXCLUDE_AREA_LAT / 2 ]
                        ]
                    ]
                }
            })
        }
        return {
            "type": "FeatureCollection",
            "features": features
        }
    }


    function priorityJSON(condition: string, speed: number) {
        return {
            "if": condition,
            "multiply_by": `${speed}`
        }
    }

    const handleStepsClick = async (segments: Coordinate[][]) => {
        if (segments && segments.length > 0) {
            const firstSegment = segments[0]
            if (firstSegment && firstSegment.length > 0) {
                const firstPoint = firstSegment[0]
                const imageUrl = await getClosestStreetViewImage(firstPoint.lng, firstPoint.lat)
                setStepsImageUrl(imageUrl)
                setImageError(false)
                setShowStepsModal(true)
                setPointsToExclude(pointsToExclude.concat([firstPoint]))
                console.log(pointsToExclude)
                // setStepsFirstPoint(firstPoint);
            }
        }
    }

    return (
        <div className={styles.resultRow}>
            <div className={styles.resultSelectableArea} onClick={() => Dispatcher.dispatch(new SetSelectedPath(path))}>
                <div className={resultSummaryClass}>
                    <div className={styles.resultValues}>
                        <span className={styles.resultMainText}>{milliSecondsToText(path.time)}</span>
                        <span className={styles.resultSecondaryText}>
                            {metersToShortText(path.distance, showDistanceInMiles)}
                        </span>
                        {isSelected && !ApiImpl.isMotorVehicle(profile) && (
                            <div className={styles.elevationHint}>
                                <span title={tr('total_ascend', [Math.round(path.ascend) + 'm'])}>
                                    ↗{metersToShortText(path.ascend, showDistanceInMiles)}{' '}
                                </span>
                                <span title={tr('total_descend', [Math.round(path.descend) + 'm'])}>
                                    ↘{metersToShortText(path.descend, showDistanceInMiles)}
                                </span>
                            </div>
                        )}
                        {path.description && (
                            <span className={styles.resultTertiaryText}>
                                {tr('Via')} {path.description}
                            </span>
                        )}
                    </div>
                    {isSelected && (
                        <PlainButton
                            className={isExpanded ? styles.detailsButtonExpanded : styles.detailsButton}
                            onClick={() => setExpanded(!isExpanded)}
                        >
                            <Details />
                            <div>{isExpanded ? tr('hide_button') : tr('details_button')}</div>
                        </PlainButton>
                    )}
                </div>
            </div>
            {isSelected && !isExpanded && showHints && (
                <div className={styles.routeHints}>
                    <div className={styles.icons}>
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_ford')}
                            setType={t => setSelectedRH(t)}
                            type={'ford'}
                            child={<FordIcon />}
                            value={fordInfo.distance > 0 && metersToShortText(fordInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={fordInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_crosses_border')}
                            setType={t => setSelectedRH(t)}
                            type={'border'}
                            child={<BorderCrossingIcon />}
                            value={borderInfo.values.length > 0 && borderInfo.values[0]}
                            selected={selectedRH}
                            segments={borderInfo.segments}
                            values={borderInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_ferry')}
                            setType={t => setSelectedRH(t)}
                            type={'ferry'}
                            child={<FerryIcon />}
                            value={ferryInfo.distance > 0 && metersToShortText(ferryInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={ferryInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_restrictions')}
                            setType={t => setSelectedRH(t)}
                            type={'access_conditional'}
                            child={<CondAccessIcon />}
                            value={
                                accessCondInfo.distance > 0 &&
                                metersToShortText(accessCondInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={accessCondInfo.segments}
                            values={accessCondInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_restrictions')}
                            setType={t => setSelectedRH(t)}
                            type={'foot_access_conditional'}
                            child={<CondAccessIcon />}
                            value={
                                footAccessCondInfo.distance > 0 &&
                                metersToShortText(footAccessCondInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={footAccessCondInfo.segments}
                            values={footAccessCondInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_restrictions')}
                            setType={t => setSelectedRH(t)}
                            type={'bike_access_conditional'}
                            child={<CondAccessIcon />}
                            value={
                                bikeAccessCondInfo.distance > 0 &&
                                metersToShortText(bikeAccessCondInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={bikeAccessCondInfo.segments}
                            values={bikeAccessCondInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('private_sections')])}
                            setType={t => setSelectedRH(t)}
                            type={'private'}
                            child={<PrivateIcon />}
                            value={
                                privateOrDeliveryInfo.distance > 0 &&
                                metersToShortText(privateOrDeliveryInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={privateOrDeliveryInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains_toll')}
                            setType={t => setSelectedRH(t)}
                            type={'toll'}
                            child={showDistanceInMiles ? <DollarIcon /> : <EuroIcon />}
                            value={tollInfo.distance > 0 && metersToShortText(tollInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={tollInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('challenging_sections')])}
                            setType={t => setSelectedRH(t)}
                            type={'mtb_rating'}
                            child={<DangerousIcon />}
                            value={
                                mtbRatingInfo.distance > 0 &&
                                metersToShortText(mtbRatingInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={mtbRatingInfo.segments}
                            values={mtbRatingInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('challenging_sections')])}
                            setType={t => setSelectedRH(t)}
                            type={'hike_rating'}
                            child={<DangerousIcon />}
                            value={
                                hikeRatingInfo.distance > 0 &&
                                metersToShortText(hikeRatingInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={hikeRatingInfo.segments}
                            values={hikeRatingInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('steps')])}
                            setType={t => setSelectedRH(t)}
                            type={'steps'}
                            child={<StepsIcon />}
                            value={stepsInfo.distance > 0 && metersToShortText(stepsInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={stepsInfo.segments}
                            values={[]}
                            onClick={() => handleStepsClick(stepsInfo.segments)}
                        />

                        {showStepsModal && (
                            <div className={styles.modalOverlay} onClick={() => setShowStepsModal(false)}>
                                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                                    <h2 className={styles.modalTitle}>Steps Preview</h2>
                                    {!imageError ? (
                                        <img
                                            src={stepsImageUrl}
                                            alt="Street View of Steps"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className={styles.noImagePlaceholder}>
                                            <p>Street View image not available for this location</p>
                                        </div>
                                    )}
                                    <div className={styles.modalButtons}>
                                        <button onClick={() => setShowStepsModal(false)}>Close</button>
                                        <button onClick={() => {
                                            setShowStepsModal(false);
                                            // Skip this obstacle by calling the SkipObStacle function
                                            SkipObStacle();
                                        }}>Skip this obstacle</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('tracks')])}
                            setType={t => setSelectedRH(t)}
                            type={'tracks'}
                            child={<BadTrackIcon />}
                            value={
                                badTrackInfo.distance > 0 &&
                                metersToShortText(badTrackInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={badTrackInfo.segments}
                            values={badTrackInfo.values}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('trunk_roads_warn')}
                            setType={t => setSelectedRH(t)}
                            type={'trunk'}
                            child={<DangerousIcon />}
                            value={trunkInfo.distance > 0 && metersToShortText(trunkInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={trunkInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('get_off_bike_for', [
                                metersToShortText(getOffBikeInfo.distance, showDistanceInMiles),
                            ])}
                            setType={t => setSelectedRH(t)}
                            type={'get_off_bike'}
                            child={<GetOffBikeIcon />}
                            value={
                                getOffBikeInfo.distance > 0 &&
                                metersToShortText(getOffBikeInfo.distance, showDistanceInMiles)
                            }
                            selected={selectedRH}
                            segments={getOffBikeInfo.segments}
                            values={[]}
                        />
                        <RHButton
                            setDescription={b => setDescriptionRH(b)}
                            description={tr('way_contains', [tr('steep_sections')])}
                            setType={t => setSelectedRH(t)}
                            type={'steep_sections'}
                            child={<SteepIcon />}
                            value={steepInfo.distance > 0 && metersToShortText(steepInfo.distance, showDistanceInMiles)}
                            selected={selectedRH}
                            segments={steepInfo.segments}
                            values={steepInfo.values}
                        />
                    </div>
                    {descriptionRH && <div>{descriptionRH}</div>}
                </div>
            )}
            {isExpanded && <Instructions instructions={path.instructions} us={showDistanceInMiles} />}
            {isExpanded && (
                <div className={styles.routingResultRoadData}>
                    {tr('road_data_from')}: {info.road_data_timestamp}
                </div>
            )}
        </div>
    )
}

function RHButton(p: {
    setDescription: (s: string) => void
    description: string
    setType: (s: string) => void
    type: string
    child: ReactNode
    value: string | false
    selected: string
    segments: Coordinate[][]
    values: string[]
    onClick?: () => void
}) {
    let [index, setIndex] = useState(0)
    if (p.value === false) return null
    return (
        <PlainButton
            className={p.selected == p.type ? styles.selectedRouteHintButton : styles.routeHintButton}
            onClick={() => {
                p.setType(p.type)

                if (index < 0) {
                    Dispatcher.dispatch(new PathDetailsElevationSelected([]))
                    p.setDescription('')
                } else {
                    let tmpDescription
                    if (p.type == 'get_off_bike') tmpDescription = p.description
                    else if (p.type == 'border') tmpDescription = p.description + ': ' + p.values[index]
                    else if (p.values && p.values[index]) {
                        if (p.type.includes('rating'))
                            tmpDescription =
                                p.description + ': ' + p.value + ' (' + p.type + ':' + p.values[index] + ')'
                        else if (p.type.includes('steep')) tmpDescription = p.description + ': ' + p.values[index]
                        else tmpDescription = p.description + ': ' + p.value + ' ' + p.values[index]
                    } else tmpDescription = p.description + ': ' + p.value

                    p.setDescription(tmpDescription)
                    Dispatcher.dispatch(new PathDetailsElevationSelected(p.segments))
                    if (p.segments.length > index) Dispatcher.dispatch(new SetBBox(toBBox(p.segments[index])))
                }

                setIndex(index + 1 >= p.segments.length ? -1 : index + 1)
                if (p.onClick) p.onClick()
            }}
            title={p.description}
        >
            {p.child}
            {<span>{p.value}</span>}
        </PlainButton>
    )
}

function crossesBorderInfo(points: LineString, countryPathDetail: [number, number, string][]) {
    if (!countryPathDetail || countryPathDetail.length == 0) return new RouteInfo()
    const info = new RouteInfo()
    let prev = countryPathDetail[0][2]
    const coords = points.coordinates
    for (const i in countryPathDetail) {
        if (countryPathDetail[i][2] != prev) {
            info.values.push(prev + ' - ' + countryPathDetail[i][2])
            info.segments.push([
                toCoordinate(coords[countryPathDetail[i][0] - 1]),
                toCoordinate(coords[countryPathDetail[i][0]]),
            ])
            prev = countryPathDetail[i][2]
        }
    }
    return info
}

class RouteInfo {
    segments: Coordinate[][] = []
    distance: number = 0
    values: string[] = []
}

function toCoordinate(pos: Position): Coordinate {
    return { lng: pos[0], lat: pos[1] }
}

function toBBox(segment: Coordinate[]): Bbox {
    // TODO replace with ApiImpl.getBBoxPoints
    const bbox = getBBoxFromCoord(segment[0], 0.002)
    if (segment.length == 1) bbox
    segment.forEach(c => {
        bbox[0] = Math.min(bbox[0], c.lng)
        bbox[1] = Math.min(bbox[1], c.lat)
        bbox[2] = Math.max(bbox[2], c.lng)
        bbox[3] = Math.max(bbox[3], c.lat)
    })
    if (bbox[2] - bbox[0] < 0.005) {
        bbox[0] -= 0.005 / 2
        bbox[2] += 0.005 / 2
    }
    if (bbox[3] - bbox[1] < 0.005) {
        bbox[1] -= 0.005 / 2
        bbox[3] += 0.005 / 2
    }
    return bbox as Bbox
}

function getInfoFor(points: LineString, details: [number, number, any][], fnc: { (s: any): boolean }) {
    if (!details) return new RouteInfo()
    let info = new RouteInfo()
    const coords = points.coordinates
    for (const i in details) {
        if (fnc(details[i][2])) {
            const from = details[i][0],
                to = details[i][1]
            const segCoords: Coordinate[] = []
            for (let i = from; i < to; i++) {
                const dist = calcDistPos(coords[i], coords[i + 1])
                info.distance += dist
                if (dist == 0) info.distance += 0.01 // some obstacles have no length when mapped as a node like fords
                segCoords.push(toCoordinate(coords[i]))
            }
            segCoords.push(toCoordinate(coords[to]))
            info.values.push(details[i][2])
            info.segments.push(segCoords)
        }
    }
    return info
}

function calcDistPos(from: Position, to: Position): number {
    return calcDist({ lat: from[1], lng: from[0] }, { lat: to[1], lng: to[0] })
}

// sums up the lengths of the road segments with a slope bigger than steepSlope
function getHighSlopeInfo(points: LineString, steepSlope: number, showDistanceInMiles: boolean) {
    if (points.coordinates.length == 0) return new RouteInfo()
    if (points.coordinates[0].length != 3) return new RouteInfo()
    const info = new RouteInfo()
    let distForSlope = 0
    let segmentPoints: Coordinate[] = []
    let prevElePoint = points.coordinates[0]
    let prevDistPoint = points.coordinates[0]
    points.coordinates.forEach(currPoint => {
        distForSlope += calcDistPos(currPoint, prevDistPoint)
        // we assume that elevation data is not that precise and we can improve when using a minimum distance:
        if (distForSlope > 100) {
            const slope = (100.0 * Math.abs(prevElePoint[2] - currPoint[2])) / distForSlope
            if (slope > steepSlope) {
                const distanceTxt = metersToShortText(Math.round(distForSlope), showDistanceInMiles)
                info.values.push(distanceTxt + ' (' + Math.round(slope) + '%)')
                info.distance += distForSlope
                info.segments.push(segmentPoints)
            }
            prevElePoint = currPoint
            distForSlope = 0
            segmentPoints = []
        }
        prevDistPoint = currPoint
        segmentPoints.push(toCoordinate(currPoint))
    })
    return info
}

function RoutingResultPlaceholder() {
    return (
        <div className={styles.resultRow}>
            <div className={styles.placeholderContainer}>
                <div className={styles.placeholderMain} />
                <div className={styles.placeholderMain + ' ' + styles.placeholderSecondary} />
            </div>
        </div>
    )
}

function hasPendingRequests(subRequests: SubRequest[]) {
    return subRequests.some(req => req.state === RequestState.SENT)
}

function getLength(paths: Path[], subRequests: SubRequest[]) {
    if (subRequests.length > 0 && hasPendingRequests(subRequests)) {
        // consider maxAlternativeRoutes only for subRequests that are not yet returned, i.e. state === SENT
        // otherwise it can happen that too fast alternatives reject the main request leading to stale placeholders
        return Math.max(
            paths.length,
            ...subRequests
                .filter(request => request.state === RequestState.SENT)
                .map(request => request.args.maxAlternativeRoutes)
        )
    }
    return paths.length
}

function createSingletonListContent(props: RoutingResultsProps) {
    if (props.paths.length > 0)
        return <RoutingResult path={props.selectedPath} isSelected={true} profile={props.profile} info={props.info} route={props.route} />
    if (hasPendingRequests(props.currentRequest.subRequests)) return <RoutingResultPlaceholder key={1} />
    return ''
}

function createListContent({ info, paths, currentRequest, selectedPath, profile, route }: RoutingResultsProps) {
    const length = getLength(paths, currentRequest.subRequests)
    const result = []

    for (let i = 0; i < length; i++) {
        if (i < paths.length)
            result.push(
                <RoutingResult
                    key={i}
                    path={paths[i]}
                    isSelected={paths[i] === selectedPath}
                    profile={profile}
                    info={info}
                    route={route}
                />
            )
        else result.push(<RoutingResultPlaceholder key={i} />)
    }

    return result
}