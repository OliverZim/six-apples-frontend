
import { CustomModel } from "../QueryStore"


export type Profiles = "prothesis" | "wheelchair"

function getCustomModel(profile: Profiles, excludePoints: [number, number][]): CustomModel {
  let base = modelFromProfile[profile];
  // areas = 
  // for (let i = 0; i < excludePoints.length; i++) {
  //   let id = `area${i}`;
  //   areas.push({ point: excludePoints[i], id: id });
  //   speeds.push(speedJSON(`in_${id}`, 0));
  // }
  return base
}

const prothesisProfile: CustomModel = {
  priority: [
    { "if": "average_slope >= 10", "limit_to": "0.5" },
    { "if": "average_slope <= -10", "limit_to": "0.5" },
    { "if": "!foot_access", "multiply_by": "0" },
    { "else": "", "multiply_by": "foot_priority" },
    { "if": "country == DEU && road_class == BRIDLEWAY", "multiply_by": "0" }
  ],
  speed: [
    { "if": "average_slope >= 15", "limit_to": "1.5" },
    { "else_if": "average_slope >= 7", "limit_to": "2.0" },
    { "else_if": "average_slope >= 4", "multiply_by": "0.85" },
    { "if": "average_slope <= -4", "multiply_by": "1.05" },
    { "else_if": "average_slope <= -2", "multiply_by": "1.15" },
    { "if": "max_slope >= 15", "multiply_by": "0.05" },
    { "else_if": "max_slope >= 7", "limit_to": "2.5" },
    { "if": "max_slope <= -15", "multiply_by": "0.05" },
    { "else_if": "max_slope <= -7", "limit_to": "2.5" },
    { "if": "true", "limit_to": "3" },
    { "if": "surface == MISSING", "limit_to": "1.0" },
    { "if": "surface == PAVED", "limit_to": "3.5" },
    { "if": "surface == ASPHALT", "limit_to": "3.5" },
    { "if": "surface == CONCRETE", "limit_to": "3.3" },
    { "if": "surface == PAVING_STONES", "limit_to": "3.0" },
    { "if": "surface == COBBLESTONE", "limit_to": "2.0" },
    { "if": "surface == UNPAVED", "limit_to": "2.5" },
    { "if": "surface == COMPACTED", "limit_to": "2.5" },
    { "if": "surface == FINE_GRAVEL", "limit_to": "2.3" },
    { "if": "surface == GRAVEL", "limit_to": "2.2" },
    { "if": "surface == GROUND", "limit_to": "2.2" },
    { "if": "surface == DIRT", "limit_to": "2.2" },
    { "if": "surface == GRASS", "limit_to": "2.0" },
    { "if": "surface == SAND", "limit_to": "1.0" },
    { "if": "surface == WOOD", "limit_to": "3.0" },
    { "if": "surface == OTHER", "limit_to": "2.5" },
    { "if": "road_class == OTHER", "limit_to": "3.0" },
    { "if": "road_class == MOTORWAY", "limit_to": "0" },
    { "if": "road_class == TRUNK", "limit_to": "0" },
    { "if": "road_class == PRIMARY", "limit_to": "0" },
    { "if": "road_class == SECONDARY", "limit_to": "1.5" },
    { "if": "road_class == TERTIARY", "limit_to": "2.0" },
    { "if": "road_class == RESIDENTIAL", "limit_to": "2.5" },
    { "if": "road_class == UNCLASSIFIED", "limit_to": "2.0" },
    { "if": "road_class == SERVICE", "limit_to": "2.5" },
    { "if": "road_class == ROAD", "limit_to": "2.0" },
    { "if": "road_class == TRACK", "limit_to": "1.5" },
    { "if": "road_class == BRIDLEWAY", "limit_to": "0" },
    { "if": "road_class == STEPS", "limit_to": "0" },
    { "if": "road_class == CYCLEWAY", "limit_to": "0" },
    { "if": "road_class == PATH", "limit_to": "3.0" },
    { "if": "road_class == LIVING_STREET", "limit_to": "3.0" },
    { "if": "road_class == FOOTWAY", "limit_to": "3.0" },
    { "if": "road_class == PEDESTRIAN", "limit_to": "3.0" },
    { "if": "road_class == PLATFORM", "limit_to": "2.0" },
    { "if": "road_class == CORRIDOR", "limit_to": "2.0" },
    { "if": "road_class == CONSTRUCTION", "limit_to": "0" },
    { "if": "mtb_rating > 2", "limit_to": "0" },
    { "if": "hike_rating > 1", "limit_to": "0" },
    { "if": "road_environment == OTHER", "multiply_by": "1" },
    { "if": "road_environment == ROAD", "multiply_by": "1" },
    { "if": "road_environment == FERRY", "multiply_by": "0.5" },
    { "if": "road_environment == TUNNEL", "multiply_by": "0.4" },
    { "if": "road_environment == BRIDGE", "multiply_by": "0.8" },
    { "if": "road_environment == FORD", "multiply_by": "0" }
  ]
};
const wheelchairProfile: CustomModel = {
  priority: [
    { "if": "average_slope >= 10", "limit_to": "0.5" },
    { "if": "average_slope <= -10", "limit_to": "0.5" },
    { "if": "!foot_access", "multiply_by": "0" },
    { "else": "", "multiply_by": "foot_priority" },
    { "if": "country == DEU && road_class == BRIDLEWAY", "multiply_by": "0" }
  ],
  speed: [
    { "if": "average_slope >= 15", "limit_to": "1.3" },
    { "else_if": "average_slope >= 7", "limit_to": "1.8" },
    { "else_if": "average_slope >= 4", "multiply_by": "0.80" },
    { "if": "average_slope <= -4", "multiply_by": "1.00" },
    { "else_if": "average_slope <= -2", "multiply_by": "1.10" },
    { "if": "max_slope >= 15", "multiply_by": "0.05" },
    { "else_if": "max_slope >= 7", "limit_to": "2.2" },
    { "if": "max_slope <= -15", "multiply_by": "0.05" },
    { "else_if": "max_slope <= -7", "limit_to": "2.2" },
    { "if": "true", "limit_to": "3" },
    { "if": "surface == MISSING", "limit_to": "1.0" },
    { "if": "surface == PAVED", "limit_to": "3.5" },
    { "if": "surface == ASPHALT", "limit_to": "3.5" },
    { "if": "surface == CONCRETE", "limit_to": "3.3" },
    { "if": "surface == PAVING_STONES", "limit_to": "3.0" },
    { "if": "surface == COBBLESTONE", "limit_to": "2.0" },
    { "if": "surface == UNPAVED", "limit_to": "2.5" },
    { "if": "surface == COMPACTED", "limit_to": "2.5" },
    { "if": "surface == FINE_GRAVEL", "limit_to": "2.3" },
    { "if": "surface == GRAVEL", "limit_to": "2.2" },
    { "if": "surface == GROUND", "limit_to": "2.2" },
    { "if": "surface == DIRT", "limit_to": "2.2" },
    { "if": "surface == GRASS", "limit_to": "2.0" },
    { "if": "surface == SAND", "limit_to": "1.0" },
    { "if": "surface == WOOD", "limit_to": "3.0" },
    { "if": "surface == OTHER", "limit_to": "2.5" },
    { "if": "road_class == OTHER", "limit_to": "3.0" },
    { "if": "road_class == MOTORWAY", "limit_to": "0" },
    { "if": "road_class == TRUNK", "limit_to": "0" },
    { "if": "road_class == PRIMARY", "limit_to": "0" },
    { "if": "road_class == SECONDARY", "limit_to": "1.5" },
    { "if": "road_class == TERTIARY", "limit_to": "2.0" },
    { "if": "road_class == RESIDENTIAL", "limit_to": "2.5" },
    { "if": "road_class == UNCLASSIFIED", "limit_to": "2.0" },
    { "if": "road_class == SERVICE", "limit_to": "2.5" },
    { "if": "road_class == ROAD", "limit_to": "2.0" },
    { "if": "road_class == TRACK", "limit_to": "1.5" },
    { "if": "road_class == BRIDLEWAY", "limit_to": "0" },
    { "if": "road_class == STEPS", "limit_to": "0" },
    { "if": "road_class == CYCLEWAY", "limit_to": "0" },
    { "if": "road_class == PATH", "limit_to": "3.0" },
    { "if": "road_class == LIVING_STREET", "limit_to": "3.0" },
    { "if": "road_class == FOOTWAY", "limit_to": "3.0" },
    { "if": "road_class == PEDESTRIAN", "limit_to": "3.0" },
    { "if": "road_class == PLATFORM", "limit_to": "2.0" },
    { "if": "road_class == CORRIDOR", "limit_to": "2.0" },
    { "if": "road_class == CONSTRUCTION", "limit_to": "0" },
    { "if": "mtb_rating > 2", "limit_to": "0" },
    { "if": "hike_rating > 1", "limit_to": "0" },
    { "if": "!foot_subnetwork", "multiply_by": "0.9" },
    { "if": "foot_network == INTERNATIONAL", "multiply_by": "1.1" },
    { "if": "foot_network == NATIONAL", "multiply_by": "1.1" },
    { "if": "foot_network == REGIONAL", "multiply_by": "1.1" },
    { "if": "road_environment == OTHER", "multiply_by": "1" },
    { "if": "road_environment == ROAD", "multiply_by": "1" },
    { "if": "road_environment == FERRY", "multiply_by": "0.5" },
    { "if": "road_environment == TUNNEL", "multiply_by": "0.4" },
    { "if": "road_environment == BRIDGE", "multiply_by": "0.8" },
    { "if": "road_environment == FORD", "multiply_by": "0" }
  ]
}

export const modelFromProfile: Record<Profiles, CustomModel> = {
  "prothesis": prothesisProfile,
  "wheelchair": wheelchairProfile
}
