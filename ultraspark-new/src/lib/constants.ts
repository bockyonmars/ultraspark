export const BRAND_NAME = "UltraSpark Cleaning Services";

export const CONTACT = {
  email: "info@ultrasparkcleaning.co.uk",
  phoneDisplay: "+44 07445 948269",
  phoneHref: "tel:+447445948269",
  whatsappUrl: "https://wa.me/447445948269",
};

export const SERVICE_AREA = "London, nearby areas, and selected parts of the UK";

export const SERVICE_AREA_SHORT = "London and surrounding areas";

export const SERVICES = [
  {
    slug: "home",
    title: "Home Cleaning",
    backendServiceType: "Home Cleaning",
    desc: "Regular and one-off home cleans tailored to your routine, leaving every room fresh and tidy.",
  },
  {
    slug: "office",
    title: "Office Cleaning",
    backendServiceType: "Office Cleaning",
    desc: "Spotless workspaces that keep your team healthy and productive, scheduled around your business.",
  },
  {
    slug: "deep",
    title: "Deep Cleaning",
    backendServiceType: "Deep Cleaning",
    desc: "Top-to-bottom deep cleans that tackle hidden dust, grime and the spots regular cleans miss.",
  },
  {
    slug: "airbnb",
    title: "Airbnb / Short-Let Cleaning",
    backendServiceType: "Home Cleaning",
    desc: "Reliable turnover cleaning for Airbnb and short-let properties, with fresh presentation for every guest.",
  },
  {
    slug: "tenancy",
    title: "End of Tenancy Cleaning",
    backendServiceType: "End of Tenancy Cleaning",
    desc: "Thorough end-of-tenancy cleans designed to help renters, landlords, and agents hand over with confidence.",
  },
  {
    slug: "move",
    title: "Move-In / Move-Out Cleaning",
    backendServiceType: "End of Tenancy Cleaning",
    desc: "Start fresh in a spotless space, whether you are moving into a new property or preparing one for handover.",
  },
] as const;

export type ServiceTitle = (typeof SERVICES)[number]["title"];

export function getServiceByTitle(title: string) {
  return SERVICES.find((service) => service.title === title);
}
