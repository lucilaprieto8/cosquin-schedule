export type ArtistStyle = {
  colorClass: string;
  sizeClass: string;
};

export const ARTIST_STYLES: Record<string, ArtistStyle> = {
  // =========================
  // NARANJA – headliners
  // =========================
  "AIRBAG": { colorClass: "cr-orange", sizeClass: "cr-s-34" },
  "BABASONICOS": { colorClass: "cr-orange", sizeClass: "cr-s-34" },
  "CIRO Y LOS PERSAS": { colorClass: "cr-orange", sizeClass: "cr-s-34" },
  "DIVIDIDOS": { colorClass: "cr-orange", sizeClass: "cr-s-34" },
  "FRANZ FERDINAND": { colorClass: "cr-orange", sizeClass: "cr-s-34" },
  "THE CHEMICAL BROTHERS (DJ SET)": {
    colorClass: "cr-orange",
    sizeClass: "cr-s-34",
  },

  // =========================
  // VERDE LIMA
  // =========================
  "CALIGARIS": { colorClass: "cr-lime", sizeClass: "cr-s-28" },
  "CUARTETO DE NOS": { colorClass: "cr-lime", sizeClass: "cr-s-28" },
  "DEVENDRA BANHART": { colorClass: "cr-lime", sizeClass: "cr-s-28" },
  "HERMANOS GUTIERREZ": { colorClass: "cr-lime", sizeClass: "cr-s-28" },
  "LOS ESPIRITUS": { colorClass: "cr-lime", sizeClass: "cr-s-28" },

  // =========================
  // VIOLETA
  // =========================
  "ABEL PINTOS": { colorClass: "cr-violet", sizeClass: "cr-s-26" },
  "MARILINA BERTOLDI": { colorClass: "cr-violet", sizeClass: "cr-s-26" },
  "MARKY RAMONE": { colorClass: "cr-violet", sizeClass: "cr-s-26" },

  // =========================
  // BLANCO / base
  // =========================
  "CTM": { colorClass: "cr-white", sizeClass: "cr-s-22" },
  "BRIGADO CREW": { colorClass: "cr-white", sizeClass: "cr-s-22" },
};
