import Sensor from "../../../../static/img/robot-perception/gmsl_camera.png";
import Link from "../../../components/Link";
import styles from "./Gmsl.module.css";

export const Gmsl = () => {
  const camerasHref = "https://builders.intel.com/solutionslibrary/verified-supported-edge-camera";

  return (
    <>
      <div className={styles.imageContainer}>
        <div>
          <h3 className={styles.title}>GMSL</h3>
          <p className={styles.description}>
            Cameras placed meters from the developer kit
          </p>

          <ul className={styles.items}>
            <li>
              Sends full-quality video over one cable across several meters.
            </li>
            <li>One connector on the kit runs up to four cameras.</li>
            <li>
              A dedicated Intel® Image Processing Unit (Intel® IPU) handles the imaging
              in hardware, keeping the CPU and Intel® Arc™ graphics free.
            </li>
          </ul>

          <Link
            href={camerasHref}
            className={styles.link}
            label="See all supported cameras"
          />
        </div>

        <img src={Sensor} alt="GMSL Sensor" />
      </div>


    </>
  );
};
