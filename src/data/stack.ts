export interface Tech {
  name: string;
  logo: string | null;
  invert: boolean;
  row: 1 | 2;
}

const D = "/stack";

export const stack: Tech[] = [
  { name: "React",        logo: `${D}/react-original.svg`,        invert: false, row: 1 },
  { name: "TypeScript",   logo: `${D}/typescript-original.svg`,   invert: false, row: 1 },
  { name: "JavaScript",   logo: `${D}/javascript-original.svg`,   invert: false, row: 1 },
  { name: "Next.js",      logo: `${D}/nextjs-original.svg`,       invert: true,  row: 1 },
  { name: "Tailwind CSS", logo: `${D}/tailwindcss-original.svg`,  invert: false, row: 1 },
  { name: "Node.js",      logo: `${D}/nodejs-original.svg`,       invert: false, row: 1 },
  { name: "PHP",          logo: `${D}/php-original.svg`,          invert: false, row: 1 },
  { name: "MySQL",        logo: `${D}/mysql-original.svg`,        invert: false, row: 1 },
  { name: "PostgreSQL",   logo: `${D}/postgresql-original.svg`,   invert: false, row: 1 },
  { name: "HTML5",        logo: `${D}/html5-original.svg`,        invert: false, row: 1 },
  { name: "CSS3",         logo: `${D}/css3-original.svg`,         invert: false, row: 1 },

  { name: "Git",       logo: `${D}/git-original.svg`,       invert: false, row: 2 },
  { name: "GitHub",    logo: `${D}/github-original.svg`,    invert: true,  row: 2 },
  { name: "Figma",     logo: `${D}/figma-original.svg`,     invert: false, row: 2 },
  { name: "Vite",      logo: `${D}/vitejs-original.svg`,    invert: false, row: 2 },
  { name: "Sass",      logo: `${D}/sass-original.svg`,      invert: false, row: 2 },
  { name: "Bootstrap", logo: `${D}/bootstrap-original.svg`, invert: false, row: 2 },
  { name: "MongoDB",   logo: `${D}/mongodb-original.svg`,   invert: false, row: 2 },
  { name: "Express",   logo: `${D}/express-original.svg`,   invert: true,  row: 2 },
  { name: "Vercel",    logo: `${D}/vercel-original.svg`,    invert: true,  row: 2 },
  { name: "REST APIs", logo: null, invert: false, row: 2 },
];
