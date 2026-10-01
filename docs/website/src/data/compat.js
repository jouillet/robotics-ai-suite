import { INTERFACE } from './constants';

// Shared camera/kit compatibility logic. Used by both the camera catalog
// table (src/components/CameraTable) and the per-camera "Compatible development
// kits" callout (src/components/CameraKitSupport) so the rule lives in one
// place and the two views can never disagree.

// Support level of a camera on a kit: 'native' | 'adapter' | null (unsupported).
//   null     the kit lacks the camera's interface, or the camera ships no
//            config for the kit's IPU generation.
//   'adapter' a MIPI camera whose PHY differs from the kit's MIPI connectors
//            (a DPHY sensor on a CPHY kit needs a CPHY-DPHY adapter).
//   'native'  plugs straight in.
export function support(camera, kit) {
  if (!kit.interfaces.includes(camera.interface)) {
    return null;
  }
  if (!camera.ipuSupport.includes(kit.ipu)) {
    return null;
  }
  if (
    camera.interface === INTERFACE.MIPI &&
    camera.phy &&
    kit.mipiPhy &&
    camera.phy !== kit.mipiPhy
  ) {
    return 'adapter';
  }
  return 'native';
}

// Kits that support a camera, each with its support level. Drives the
// per-camera "Compatible development kits" callout.
export function supportingKits(camera, kits) {
  return kits
    .map((kit) => ({ kit, level: support(camera, kit) }))
    .filter((entry) => entry.level !== null);
}
