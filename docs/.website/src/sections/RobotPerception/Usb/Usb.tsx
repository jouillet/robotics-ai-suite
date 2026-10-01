import Sensor from "../../../../static/img/robot-perception/usb_camera.png";
import Link from "../../../components/Link";
import styles from "./Usb.module.css";

export const Usb = () => {
  const camerasHref = "https://builders.intel.com/solutionslibrary/verified-supported-edge-camera";

  return (
    <>
      <div className={styles.imageContainer}>
        <div>
          <h3 className={styles.title}>USB</h3>
          <p className={styles.description}>
            Cameras connected via USB to the developer kit
          </p>

          <ul className={styles.items}>
            <li>
              Flexible and easy to connect.
            </li>
            <li>Wide range of USB cameras supported for diverse use cases.</li>
            <li>
              Easy to configure and use without requiring specialized software.
            </li>
          </ul>

          <Link
            href={camerasHref}
            className={styles.link}
            label="See all supported cameras"
          />
        </div>

        <img src={Sensor} alt="USB Sensor" />
      </div>
    </>
  );
};
