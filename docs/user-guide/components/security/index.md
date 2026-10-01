# Security

When deploying, your solution will have security-hardening requirements. Robotics AI Suite relies on the Open Edge Platform Guidance for application platform security. Follow the links below for more information and recommendations.

::::{grid} 2

:::{grid-item-card} **Application Security Enablement**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security.html
:link-type: url
:link-alt: clickable cards

Intel Open Edge Platform includes guidance on application and platform security for your edge and robotics applications.
:::

:::{grid-item-card} **IFWI Flashing Guide**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/ifwi_flashing_guide.html
:link-type: url
:link-alt: clickable cards

Flash an Integrated FirmWare Image (IFWI) binary onto supported Intel target platforms.
:::

:::{grid-item-card} **UEFI Secure Boot**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_uefi.html
:link-type: url
:link-alt: clickable cards

Establish a verified boot chain from hardware root of trust to OS to ensure only authenticated components can boot.
:::

:::{grid-item-card} **Install Ubuntu with Full Disk Encryption**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_full_disk_install.html
:link-type: url
:link-alt: clickable cards

Protect disk data from physical compromise using software-based or hardware-assisted (TPM) Full Disk Encryption (FDE).
:::

:::{grid-item-card} **Total Memory Encryption (TME)**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_tme.html
:link-type: url
:link-alt: clickable cards

Protect sensitive memory data and AI models against physical and cold-boot attacks using Intel TME.
:::

:::{grid-item-card} **Trusted Compute Overview**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_introduction.html
:link-type: url
:link-alt: clickable cards

Deploy workloads in hardware-isolated virtual machines using Kata Containers and Intel platform security features.
:::

:::{grid-item-card} **Trusted Compute Smart Intersection**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_si.html
:link-type: url
:link-alt: clickable cards

Deploy a secure video analytics pipeline (DL Streamer Pipeline Server) within a Trusted Compute environment.
:::

:::{grid-item-card} **Trusted Compute Smart Intersection Agent**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_si_agent.html
:link-type: url
:link-alt: clickable cards

Deploy an Agentic AI application with Vision Language Models (VLMs) in an isolated Trusted Compute environment.
:::

:::{grid-item-card} **Intel HW Key Generation & Cryptography with OpenSSL**
:link: https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/hw_key_gen_crypto.html
:link-type: url
:link-alt: clickable cards

Leverage Intel hardware instructions (RDRAND, RDSEED, AES-NI, SHA-NI) transparently through standard OpenSSL APIs.
:::
::::

:::{toctree}
:hidden:

Application Security Enablement <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security.html>
IFWI Flashing Guide <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/ifwi_flashing_guide.html>
UEFI Secure Boot <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_uefi.html>
Install Ubuntu with Full Disk Encryption <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_full_disk_install.html>
Total Memory Encryption (TME) <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/enable_tme.html>
Trusted Compute Overview <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_introduction.html>
Trusted Compute Smart Intersection <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_si.html>
Trusted Compute Smart Intersection Agent <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/trusted_compute_si_agent.html>
Intel HW Key Generation & Cryptography with OpenSSL <https://docs.openedgeplatform.intel.com/dev/OEP-articles/application-security/hw_key_gen_crypto.html>
:::
