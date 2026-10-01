import Navbar from "@theme-original/Navbar";
import { ComponentProps } from "react";

export default function NavbarWrapper(props: ComponentProps<typeof Navbar>) {
  return <Navbar {...props} />;
}
