export type VehicleBrand = {
  name: string;
  logo: string;
  logoTreatment?: "light";
};

const brandLogoPath = (slug: string) => `/assets/brands/${slug}.svg`;
const fullBrandLogoPath = (slug: string) => `/assets/brands/full/${slug}.png`;

export const passengerVehicleBrands: VehicleBrand[] = [
  { name: "Volkswagen", logo: fullBrandLogoPath("volkswagen-generated") },
  { name: "Audi", logo: fullBrandLogoPath("audi-generated-v2") },
  { name: "Renault", logo: fullBrandLogoPath("renault") },
  { name: "BMW", logo: fullBrandLogoPath("bmw-generated") },
  { name: "Nissan", logo: fullBrandLogoPath("nissan") },
  { name: "Škoda", logo: fullBrandLogoPath("skoda") },
  { name: "Ford", logo: fullBrandLogoPath("ford") },
  { name: "Hyundai", logo: fullBrandLogoPath("hyundai") },
  { name: "Mercedes-Benz", logo: fullBrandLogoPath("mercedes-benz") },
  { name: "Toyota", logo: fullBrandLogoPath("toyota") },
  { name: "Opel", logo: fullBrandLogoPath("opel") },
  { name: "Kia", logo: brandLogoPath("kia"), logoTreatment: "light" },
  { name: "Mazda", logo: fullBrandLogoPath("mazda") },
  { name: "Mitsubishi", logo: brandLogoPath("mitsubishi") },
  { name: "Peugeot", logo: fullBrandLogoPath("peugeot") },
  { name: "Honda", logo: brandLogoPath("honda") },
  { name: "Chevrolet", logo: fullBrandLogoPath("chevrolet") },
  { name: "Daewoo", logo: fullBrandLogoPath("daewoo") },
  { name: "ZAZ", logo: fullBrandLogoPath("zaz") },
  { name: "Citroën", logo: brandLogoPath("citroen") },
  { name: "Suzuki", logo: brandLogoPath("suzuki") },
  { name: "Lexus", logo: fullBrandLogoPath("lexus") },
  { name: "Subaru", logo: fullBrandLogoPath("subaru") },
  { name: "Fiat", logo: fullBrandLogoPath("fiat") },
  { name: "Tesla", logo: brandLogoPath("tesla") },
];

export const commercialVehicleBrands: VehicleBrand[] = [
  { name: "MAN", logo: fullBrandLogoPath("man") },
  { name: "DAF", logo: fullBrandLogoPath("daf") },
  { name: "IVECO", logo: fullBrandLogoPath("iveco") },
  { name: "Scania", logo: fullBrandLogoPath("scania") },
  { name: "Volvo Trucks", logo: fullBrandLogoPath("volvo") },
];
