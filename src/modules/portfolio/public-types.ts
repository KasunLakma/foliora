/** Everything a visitor of a public page may receive. Private fields (legal name, birth year, ids) are NOT here. */
export type PublicPortfolio = {
  live: boolean; // false = the owner is looking at their own draft
  slug: string;
  templateKey: string;
  stageName: string;
  taglineEn: string | null;
  taglineSi: string | null;
  bioEn: string | null;
  bioSi: string | null;
  location: string | null;
  nationality: string | null;
  heightCm: number | null;
  build: string | null;
  eyeColor: string | null;
  hairColor: string | null;
  languages: string[];
  skills: { nameEn: string; nameSi: string }[];
  socialLinks: { platform: string; url: string }[];
  photos: { publicId: string; caption: string | null; isCover: boolean }[];
  works: {
    title: string;
    year: number;
    type: string;
    roleName: string | null;
    roleType: string | null;
    director: string | null;
    company: string | null;
    description: string | null;
    link: string | null;
    isFeatured: boolean;
  }[];
  showreels: { title: string; provider: "YOUTUBE" | "VIMEO"; videoId: string; isPrimary: boolean }[];
  seoTitle: string | null;
  seoDescription: string | null;
};
