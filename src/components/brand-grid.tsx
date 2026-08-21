"use client";

import Image from "next/image";
import { Car, ChevronDown, Truck } from "lucide-react";
import { useState } from "react";
import { ContactTrigger } from "@/components/contact-dialog";
import {
  commercialVehicleBrands,
  passengerVehicleBrands,
  type VehicleBrand,
} from "@/config/brands";

const MOBILE_VISIBLE_BRANDS = 8;

type BrandGridProps = {
  passengerLabel: string;
  commercialLabel: string;
  showMore: string;
  showLess: string;
};

export function BrandGrid({
  passengerLabel,
  commercialLabel,
  showMore,
  showLess,
}: BrandGridProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <BrandGroup
        label={passengerLabel}
        brands={passengerVehicleBrands}
        icon="car"
        isExpanded={isExpanded}
        collapsible
      />

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls="additional-vehicle-brands"
        onClick={() => setIsExpanded((current) => !current)}
        className="mx-auto mt-6 flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold/55 bg-gold/10 px-6 text-sm font-semibold text-gold transition hover:border-gold hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:hidden"
      >
        <span>{isExpanded ? showLess : showMore}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div id="additional-vehicle-brands" className={isExpanded ? "block" : "hidden sm:block"}>
        <BrandGroup
          label={commercialLabel}
          brands={commercialVehicleBrands}
          icon="truck"
          isExpanded
        />
      </div>
    </>
  );
}

function BrandGroup({
  label,
  brands,
  icon,
  isExpanded,
  collapsible = false,
}: {
  label: string;
  brands: VehicleBrand[];
  icon: "car" | "truck";
  isExpanded: boolean;
  collapsible?: boolean;
}) {
  const Icon = icon === "car" ? Car : Truck;

  return (
    <div className="mt-10 first:mt-12">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-200">
        <Icon aria-hidden="true" className="h-5 w-5 text-gold" strokeWidth={1.9} />
        <span>{label}</span>
      </h3>
      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
        {brands.map((brand, index) => {
          const hiddenOnMobile = collapsible && !isExpanded && index >= MOBILE_VISIBLE_BRANDS;
          const isLastOddCard = index === brands.length - 1 && brands.length % 2 === 1;

          return (
            <li
              key={brand.name}
              className={`${hiddenOnMobile ? "hidden sm:block" : "block"} ${
                isLastOddCard
                  ? "col-span-2 w-[calc(50%-0.3125rem)] justify-self-center sm:col-span-1 sm:w-auto sm:justify-self-stretch"
                  : ""
              }`}
            >
              <ContactTrigger
                aria-label={brand.name}
                aria-haspopup="dialog"
                className="brand-logo-card group flex min-h-[106px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-white/[0.12] bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.055),transparent_52%),linear-gradient(145deg,#111820,#080d13)] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.055),0_10px_28px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.09),transparent_55%),linear-gradient(145deg,#151e28,#0a1017)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e16] active:translate-y-0 sm:min-h-[114px] sm:px-4 sm:py-2"
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={150}
                  height={64}
                  sizes="(min-width: 640px) 180px, 50vw"
                  className={`h-14 w-full max-w-[164px] object-contain transition duration-300 group-hover:scale-[1.04] sm:h-16 sm:max-w-[190px] ${logoTreatmentClass(brand)}`}
                />
                <span className="mt-2 text-sm font-medium leading-tight text-white sm:text-base">
                  {brand.name}
                </span>
              </ContactTrigger>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function logoTreatmentClass(brand: VehicleBrand) {
  if (brand.logo.endsWith(".png")) {
    return "drop-shadow-[0_3px_7px_rgba(0,0,0,0.68)]";
  }

  if (brand.logoTreatment === "light") {
    return "brightness-0 invert opacity-90 drop-shadow-[0_3px_7px_rgba(0,0,0,0.7)]";
  }

  return "[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.72))_drop-shadow(0_3px_7px_rgba(0,0,0,0.7))]";
}
