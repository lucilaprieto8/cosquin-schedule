export type ArtistStyle = {
  colorClass: string;
  sizeClass: string;
};

export const ARTIST_STYLES: Record<string, ArtistStyle> = {
  // NARANJA – headliners grandes
  "AIRBAG": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },
  "BABASONICOS": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },
  "CIRO Y LOS PERSAS": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },
  "DIVIDIDOS": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },
  "FRANZ FERDINAND": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },
  "THE CHEMICAL BROTHERS (DJ SET)": { colorClass: "text-orange-400", sizeClass: "text-[34px]" },

  // VERDE LIMA
  "CALIGARIS": { colorClass: "text-lime-300", sizeClass: "text-[28px]" },
  "CUARTETO DE NOS": { colorClass: "text-lime-300", sizeClass: "text-[28px]" },
  "DEVENDRA BANHART": { colorClass: "text-lime-300", sizeClass: "text-[28px]" },
  "HERMANOS GUTIERREZ": { colorClass: "text-lime-300", sizeClass: "text-[28px]" },
  "LOS ESPIRITUS": { colorClass: "text-lime-300", sizeClass: "text-[28px]" },

  // VIOLETA
  "ABEL PINTOS": { colorClass: "text-violet-400", sizeClass: "text-[26px]" },
  "MARILINA BERTOLDI": { colorClass: "text-violet-400", sizeClass: "text-[26px]" },
  "MARKY RAMONE": { colorClass: "text-violet-400", sizeClass: "text-[26px]" },

  // BLANCO / base
  "CTM": { colorClass: "text-white", sizeClass: "text-[22px]" },
  "BRIGADO CREW": { colorClass: "text-white", sizeClass: "text-[22px]" },
};
