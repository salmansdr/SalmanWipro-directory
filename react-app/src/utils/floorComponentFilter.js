// Utility to filter calculation items by floor type using FloorComponentsConfig.json
export async function filterComponentsByFloorType(allItems, floorIdx, totalFloors) {
  // Dynamically import config
  const config = await fetch('/FloorComponentsConfig.json').then(r => r.json());
  let configKey;
  if (floorIdx === 0) {
    configKey = 'GroundFloor';
  } else if (floorIdx === totalFloors - 1) {
    configKey = 'TopFloor';
  } else {
    configKey = 'MiddleFloors';
  }
  const allowedComponents = config[configKey];
  return allItems.filter(item => allowedComponents.includes(item.component));
}
