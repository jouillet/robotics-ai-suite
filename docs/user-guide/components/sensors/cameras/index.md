---
:orphan:
---

# Cameras

This documentation covers supported interfaces, configuration, and validated
camera modules.

## Supported Edge Cameras

Intel's SoC supports a wide range of cameras and interfaces, such as MIPI and GMSL, giving you the flexibility to design robust vision systems. See document below for a complete list of supported edge cameras.

```{raw} html
<iframe
  src="https://builders.intel.com/docs/networkbuilders/verified-supported-edge-camera-1788867680.pdf"
  width="100%"
  height="800px"
  style="border: 1px solid #ccc;"
  title="Verified Supported Edge Cameras">
  <p>Your browser does not support embedded PDFs.
     <a href="https://builders.intel.com/docs/networkbuilders/verified-supported-edge-camera-1788867680.pdf">Download the PDF</a>.
  </p>
</iframe>
```

## Validated GMSL Cameras

See **[GMSL Camera Guide](./gmsl/index.md)** for instructions on setting up a GMSL camera.

```{include} ./gmsl/fragment_camera_table_gmsl.md
```

## Validated USB Cameras

See **[USB Camera Guide](./usb/index.md)** for instructions on setting up a GMSL camera.

```{include} ./usb/fragment_camera_table_usb.md
```

:::{toctree}
:hidden:

GMSL Cameras <gmsl/index>
USB Cameras <usb/index>
:::
