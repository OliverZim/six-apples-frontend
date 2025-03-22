
import { CustomModel } from "../QueryStore"

const EXCLUDE_AREA = 1 // meter
const EXCLUDE_AREA_LAT = 8.98311174991017e-06 * EXCLUDE_AREA
const EXCLUDE_AREA_LON = 1.4763165177199368e-05 * EXCLUDE_AREA

export type DisabilityProfiles = 'no impairment' | 'crutches/walking stick' | "prothesis" | "wheelchair"

export function getCustomModel(excludePoints: [number, number][]): CustomModel {
  let speeds: any = [];
  let areas: any = [];

  for (let i = 0; i < excludePoints.length; i++) {
    let id = `area${i}`;
    areas.push({ point: excludePoints[i], id: id });
    speeds.push(speedJSON(`in_${id}`, 0));
  }

  const obj = {
    speed: speeds,
    areas: areaJSON(areas)
  }
  // console.log(obj)
  return obj
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
            [lat - EXCLUDE_AREA_LAT / 2, lon - EXCLUDE_AREA_LON / 2],
            [lat + EXCLUDE_AREA_LAT / 2, lon - EXCLUDE_AREA_LON / 2],
            [lat + EXCLUDE_AREA_LAT / 2, lon + EXCLUDE_AREA_LON / 2],
            [lat - EXCLUDE_AREA_LAT / 2, lon + EXCLUDE_AREA_LON / 2],
            [lat - EXCLUDE_AREA_LAT / 2, lon - EXCLUDE_AREA_LON / 2]
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


function speedJSON(condition: string, speed: number) {
  return {
    "if": condition,
    "limit_to": speed
  }
}
