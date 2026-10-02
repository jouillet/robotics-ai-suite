```{eval-rst}
.. meta::
   :description: Deploy and run the ORB-SLAM3 visual SLAM (VSLAM) pipeline for camera-based localization and mapping, enabling execution of VSLAM demonstrations with supported camera configurations and datasets.
```

# VSLAM: ORB-SLAM3

This section shows how to install and run the ORB-SLAM3 Visual Simultaneous Localization and Mapping (VSLAM) pipeline using monocular, stereo, RGB-D, and visual-inertial inputs, with example demonstrations using datasets and Intel® RealSense™ cameras.

VSLAM uses one or more cameras, with optional IMU inputs, to sense the surrounding environment. ORB-SLAM3 is a real-time feature-based Simultaneous Localization and Mapping (SLAM) library that supports Visual, Visual-Inertial, and Multi-Map SLAM with monocular, stereo, and RGB-D cameras using pinhole and fisheye lens models.

![ORB-SLAM3 Architecture](assets/images/ORB-SLAM3-Architecture.png)

## Source Code

The source code of this component can be found here: [ORB-SLAM3-Sample](https://github.com/open-edge-platform/robotics-ai-suite/tree/main/src/pipelines/orb-slam3-sample)

## Prerequisites

Please make sure you have all the prerequisites and installation in [Get Started](../../../platform_foundation/getting_started.md) before proceeding. Follow the [RealSense camera guide](../../../components/sensors/cameras/usb/realsense.md) to install the RealSense SDK.

### Setup ECI APT Repository

```{include} ../../../components/realtime_determinism/fragment_setup_eci_repository.md
```

## Installation

1. Make sure the RealSense SDK is installed. If not, follow the [RealSense camera guide](../../../components/sensors/cameras/usb/realsense.md) to install the RealSense packages. Here is a minimal installation:

   ```bash
   sudo apt install librealsense2
   ```

2. Install the ORB-SLAM3 packages with the following command:

   ```bash
   sudo apt install orb-slam3
   ```

After installation, the VSLAM example programs are installed under folder `/opt/intel/orb-slam3`.

> [!NOTE]
> The `orb-slam3` Debian Package is compiled without `-march=native` flag by default to ensure compatibility and prevent potential segmentation faults. For enhanced performance, consider building locally with `-march=native`, which optimizes the code based on specific CPU architecture. The `-march=native` option is a compiler flag used with GCC and other compilers to optimize code for the specific architecture of the machine where the compilation occurs. However, it can potentially lead to unexpected behavior, especially when code is intended to run on different architectures.

## VSLAM Demos

### Demo-1: Monocular Camera with Mono-Dataset

This Demo uses EUROC dataset to test ORB-SLAM3 monocular mode.

![ORB-SLAM3 mono](assets/images/orb-slam3-mono.gif)

1. Download the EUROC MAV Dataset files

   ```bash
   mkdir -p ~/orb-slam3/dataset
   cd ~/orb-slam3/dataset
   wget http://robotics.ethz.ch/~asl-datasets/ijrr_euroc_mav_dataset/machine_hall/MH_04_difficult/MH_04_difficult.zip
   unzip MH_04_difficult.zip -d MH04
   ```

   > [!NOTE]
   > This demo uses MH_04_difficult dataset. If you want to try other dataset, you may download them from the link: <https://projects.asl.ethz.ch/datasets/doku.php?id=kmavvisualinertialdatasets>.
   >
   > Please download EUROC Machine Hall datasets from <https://www.research-collection.ethz.ch/entities/researchdata/bcaf173e-5dac-484b-bc37-faf97a594f1f> if there are any issues with the above links.

2. Launch ORB-SLAM3 Demo pipeline

   Run the following commands in a bash terminal:

   ```bash
   mkdir -p ~/orb-slam3/log
   cd ~/orb-slam3/
   /opt/intel/orb-slam3/Examples/Monocular/mono_euroc /opt/intel/orb-slam3/Vocabulary/ORBvoc.txt /opt/intel/orb-slam3/Examples/Monocular/EuRoC.yaml ~/orb-slam3/dataset/MH04/ /opt/intel/orb-slam3/Examples/Monocular/EuRoC_TimeStamps/MH04.txt  ~/orb-slam3/log/MH04_mono.txt
   ```

   > [!NOTE]
   > If you use other datasets other than MH_04_difficult, you should make sure you update the command above with the correct name of dataset you use.

### Demo-2: VSLAM Demo with RealSense Camera

This Demo uses RealSense Camera as stereo inputs.

![ORB-SLAM3 realsense](assets/images/orb-slam3-realsense.gif)

1. Connect a RealSense D435 or D435i Camera to the test machine

2. Launch ORB-SLAM3 Demo pipeline

   Run the following command in a bash terminal:

   ```bash
   /opt/intel/orb-slam3/Examples/Stereo/stereo_realsense_D435i /opt/intel/orb-slam3/Vocabulary/ORBvoc.txt /opt/intel/orb-slam3/Examples/Stereo/RealSense_D435i.yaml
   ```
