import { INTERFACE, PHY, IPU, CAPABILITY } from './constants';

// Single source of truth for documented camera modules.
//
// To add a camera, copy an entry and fill in:
//   name        Display name (e.g. 'AR0233').
//   capabilities Tags from CAPABILITY in constants.js. These drive the
//                Capability filter and the Type column — no separate `type`.
//   interface   One of INTERFACE (how the camera wires to the kit).
//   phy         For MIPI sensors, PHY.DPHY or PHY.CPHY; null otherwise. A
//               DPHY sensor on a CPHY kit is flagged "adapter required".
//   vendor      Module vendor.
//   ipuSupport  IPU generations the camera ships config files for (from IPU).
//               Find these from the camera's config/<sensor>/<ipu> folders.
//   href        Link to the camera's doc page.
//
// See src/data/README.md for the full maintenance guide.

const cameras = [
  // GMSL
  {
    id: 'gmsl-ar0233',
    name: 'AR0233',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HDR],
    interface: INTERFACE.GMSL,
    phy: null,
    vendor: 'Sensing',
    ipuSupport: [IPU.IPU6EPMTL, IPU.IPU75XA],
    href: '/docs/sensors/cameras/gmsl/ar0233',
  },
  {
    id: 'gmsl-ar0234',
    name: 'AR0234',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.GLOBAL_SHUTTER],
    interface: INTERFACE.GMSL,
    phy: null,
    vendor: 'D3 Embedded',
    ipuSupport: [IPU.IPU6EPMTL],
    href: '/docs/sensors/cameras/gmsl/ar0234',
  },
  {
    id: 'gmsl-ar0820',
    name: 'AR0820',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HDR, CAPABILITY.HIGH_RESOLUTION],
    interface: INTERFACE.GMSL,
    phy: null,
    vendor: 'Sensing',
    ipuSupport: [IPU.IPU6EPMTL, IPU.IPU75XA],
    href: '/docs/sensors/cameras/gmsl/ar0820',
  },
  {
    id: 'gmsl-isx031',
    name: 'ISX031',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HDR, CAPABILITY.GLOBAL_SHUTTER],
    interface: INTERFACE.GMSL,
    phy: null,
    vendor: 'D3 Embedded, Leopard Imaging, Sensing',
    ipuSupport: [IPU.IPU6EP, IPU.IPU6EPMTL, IPU.IPU75XA],
    href: '/docs/sensors/cameras/gmsl/isx031',
  },
  {
    id: 'gmsl-d457',
    name: 'RealSense D457',
    capabilities: [CAPABILITY.DEPTH, CAPABILITY.COLOR],
    interface: INTERFACE.GMSL,
    phy: null,
    vendor: 'Intel',
    ipuSupport: [IPU.IPU75XA, IPU.IPU8],
    href: '/docs/sensors/cameras/gmsl/intel-realsense-d457',
  },

  // MIPI CSI-2
  {
    id: 'mipi-ar0234',
    name: 'AR0234',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.GLOBAL_SHUTTER],
    interface: INTERFACE.MIPI,
    phy: PHY.DPHY,
    vendor: 'D3 Embedded',
    ipuSupport: [IPU.IPU6EPMTL],
    href: '/docs/sensors/cameras/mipi-csi-2/ar0234',
  },
  {
    id: 'mipi-ar0830',
    name: 'AR0830',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HIGH_RESOLUTION],
    interface: INTERFACE.MIPI,
    phy: PHY.DPHY,
    vendor: 'Leopard Imaging',
    ipuSupport: [IPU.IPU6EPMTL, IPU.IPU75XA],
    href: '/docs/sensors/cameras/mipi-csi-2/ar0830',
  },
  {
    id: 'mipi-imx415',
    name: 'IMX415',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HIGH_RESOLUTION],
    interface: INTERFACE.MIPI,
    phy: PHY.DPHY,
    vendor: 'Leopard Imaging',
    ipuSupport: [IPU.IPU6EPMTL],
    href: '/docs/sensors/cameras/mipi-csi-2/imx415',
  },
  {
    id: 'mipi-imx586',
    name: 'IMX586',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HIGH_RESOLUTION],
    interface: INTERFACE.MIPI,
    phy: PHY.DPHY,
    vendor: 'Leopard Imaging',
    ipuSupport: [IPU.IPU6EPMTL],
    href: '/docs/sensors/cameras/mipi-csi-2/imx586',
  },
  {
    id: 'mipi-isx031',
    name: 'ISX031',
    capabilities: [CAPABILITY.COLOR, CAPABILITY.HDR, CAPABILITY.GLOBAL_SHUTTER],
    interface: INTERFACE.MIPI,
    phy: PHY.DPHY,
    vendor: 'D3 Embedded, Sensing',
    ipuSupport: [IPU.IPU6EP, IPU.IPU6EPMTL, IPU.IPU75XA],
    href: '/docs/sensors/cameras/mipi-csi-2/isx031',
  },
];

export default cameras;
