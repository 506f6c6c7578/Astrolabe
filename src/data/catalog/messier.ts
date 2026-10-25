import type { ConstellationCode } from "@/data/catalog/constellations";
import type { ObjectType } from "@/data/catalog/object-types";


export interface MessierObject {
    id: string;
    number: number;
    designation: string;
    ngc: string | null;
    name: string | null;
    type: ObjectType;
    constellation: ConstellationCode;
    rightAscension: number;
    declination: number;
    magnitude: number;
}

type MessierRow = readonly [
    number: number,
    ngc: string | null,
    name: string | null,
    type: ObjectType,
    constellation: ConstellationCode,
    rightAscension: string,
    declination: string,
    magnitude: number
];

const rows = [
    [1, "NGC 1952", "Nébuleuse du Crabe", "supernova-remnant", "Tau", "05 34.5", "+22 01", 8.4],
    [2, "NGC 7089", null, "globular-cluster", "Aqr", "21 33.5", "-00 49", 6.5],
    [3, "NGC 5272", null, "globular-cluster", "CVn", "13 42.2", "+28 23", 6.2],
    [4, "NGC 6121", null, "globular-cluster", "Sco", "16 23.6", "-26 32", 5.6],
    [5, "NGC 5904", null, "globular-cluster", "Ser", "15 18.6", "+02 05", 5.6],
    [6, "NGC 6405", "Amas du Papillon", "open-cluster", "Sco", "17 40.1", "-32 13", 4.2],
    [7, "NGC 6475", "Amas de Ptolémée", "open-cluster", "Sco", "17 53.9", "-34 49", 3.3],
    [8, "NGC 6523", "Nébuleuse de la Lagune", "diffuse-nebula", "Sgr", "18 03.8", "-24 23", 6.0],
    [9, "NGC 6333", null, "globular-cluster", "Oph", "17 19.2", "-18 31", 7.7],
    [10, "NGC 6254", null, "globular-cluster", "Oph", "16 57.1", "-04 06", 6.6],
    [11, "NGC 6705", "Amas du Canard sauvage", "open-cluster", "Sct", "18 51.1", "-06 16", 6.3],
    [12, "NGC 6218", null, "globular-cluster", "Oph", "16 47.2", "-01 57", 6.7],
    [13, "NGC 6205", "Grand amas d'Hercule", "globular-cluster", "Her", "16 41.7", "+36 28", 5.8],
    [14, "NGC 6402", null, "globular-cluster", "Oph", "17 37.6", "-03 15", 7.6],
    [15, "NGC 7078", null, "globular-cluster", "Peg", "21 30.0", "+12 10", 6.2],
    [16, "NGC 6611", "Nébuleuse de l'Aigle", "diffuse-nebula", "Ser", "18 18.8", "-13 47", 6.4],
    [17, "NGC 6618", "Nébuleuse Oméga", "diffuse-nebula", "Sgr", "18 20.8", "-16 11", 7.0],
    [18, "NGC 6613", null, "open-cluster", "Sgr", "18 19.9", "-17 08", 7.5],
    [19, "NGC 6273", null, "globular-cluster", "Oph", "17 02.6", "-26 16", 6.8],
    [20, "NGC 6514", "Nébuleuse Trifide", "diffuse-nebula", "Sgr", "18 02.6", "-23 02", 9.0],
    [21, "NGC 6531", null, "open-cluster", "Sgr", "18 04.6", "-22 30", 6.5],
    [22, "NGC 6656", null, "globular-cluster", "Sgr", "18 36.4", "-23 54", 5.1],
    [23, "NGC 6494", null, "open-cluster", "Sgr", "17 56.8", "-19 01", 6.9],
    [24, "IC 4715", "Nuage stellaire du Sagittaire", "star-cloud", "Sgr", "18 16.9", "-18 29", 4.6],
    [25, "IC 4725", null, "open-cluster", "Sgr", "18 31.6", "-19 15", 4.6],
    [26, "NGC 6694", null, "open-cluster", "Sct", "18 45.2", "-09 24", 8.0],
    [27, "NGC 6853", "Nébuleuse de l'Haltère", "planetary-nebula", "Vul", "19 59.6", "+22 43", 7.4],
    [28, "NGC 6626", null, "globular-cluster", "Sgr", "18 24.5", "-24 52", 6.8],
    [29, "NGC 6913", null, "open-cluster", "Cyg", "20 23.9", "+38 32", 7.1],
    [30, "NGC 7099", null, "globular-cluster", "Cap", "21 40.4", "-23 11", 7.2],
    [31, "NGC 224", "Galaxie d'Andromède", "galaxy", "And", "00 42.7", "+41 16", 3.4],
    [32, "NGC 221", null, "galaxy", "And", "00 42.7", "+40 52", 8.1],
    [33, "NGC 598", "Galaxie du Triangle", "galaxy", "Tri", "01 33.9", "+30 39", 5.7],
    [34, "NGC 1039", null, "open-cluster", "Per", "02 42.0", "+42 47", 5.5],
    [35, "NGC 2168", null, "open-cluster", "Gem", "06 08.9", "+24 20", 5.3],
    [36, "NGC 1960", null, "open-cluster", "Aur", "05 36.1", "+34 08", 6.3],
    [37, "NGC 2099", null, "open-cluster", "Aur", "05 52.4", "+32 33", 6.2],
    [38, "NGC 1912", null, "open-cluster", "Aur", "05 28.4", "+35 50", 7.4],
    [39, "NGC 7092", null, "open-cluster", "Cyg", "21 32.2", "+48 26", 4.6],
    [40, null, "Winnecke 4", "double-star", "UMa", "12 22.4", "+58 05", 8.4],
    [41, "NGC 2287", null, "open-cluster", "CMa", "06 46.0", "-20 44", 4.6],
    [42, "NGC 1976", "Grande nébuleuse d'Orion", "diffuse-nebula", "Ori", "05 35.4", "-05 27", 4.0],
    [43, "NGC 1982", "Nébuleuse de De Mairan", "diffuse-nebula", "Ori", "05 35.6", "-05 16", 9.0],
    [44, "NGC 2632", "Amas de la Ruche", "open-cluster", "Cnc", "08 40.1", "+19 59", 3.7],
    [45, null, "Pléiades", "open-cluster", "Tau", "03 47.0", "+24 07", 1.6],
    [46, "NGC 2437", null, "open-cluster", "Pup", "07 41.8", "-14 49", 6.0],
    [47, "NGC 2422", null, "open-cluster", "Pup", "07 36.6", "-14 30", 5.2],
    [48, "NGC 2548", null, "open-cluster", "Hya", "08 13.8", "-05 48", 5.5],
    [49, "NGC 4472", null, "galaxy", "Vir", "12 29.8", "+08 00", 8.4],
    [50, "NGC 2323", null, "open-cluster", "Mon", "07 03.2", "-08 20", 6.3],
    [51, "NGC 5194", "Galaxie du Tourbillon", "galaxy", "CVn", "13 29.9", "+47 12", 8.4],
    [52, "NGC 7654", null, "open-cluster", "Cas", "23 24.2", "+61 35", 7.3],
    [53, "NGC 5024", null, "globular-cluster", "Com", "13 12.9", "+18 10", 7.6],
    [54, "NGC 6715", null, "globular-cluster", "Sgr", "18 55.1", "-30 29", 7.6],
    [55, "NGC 6809", null, "globular-cluster", "Sgr", "19 40.0", "-30 58", 6.3],
    [56, "NGC 6779", null, "globular-cluster", "Lyr", "19 16.6", "+30 11", 8.3],
    [57, "NGC 6720", "Nébuleuse de la Lyre", "planetary-nebula", "Lyr", "18 53.6", "+33 02", 8.8],
    [58, "NGC 4579", null, "galaxy", "Vir", "12 37.7", "+11 49", 9.7],
    [59, "NGC 4621", null, "galaxy", "Vir", "12 42.0", "+11 39", 9.6],
    [60, "NGC 4649", null, "galaxy", "Vir", "12 43.7", "+11 33", 8.8],
    [61, "NGC 4303", null, "galaxy", "Vir", "12 21.9", "+04 28", 9.7],
    [62, "NGC 6266", null, "globular-cluster", "Oph", "17 01.2", "-30 07", 6.5],
    [63, "NGC 5055", "Galaxie du Tournesol", "galaxy", "CVn", "13 15.8", "+42 02", 8.6],
    [64, "NGC 4826", "Galaxie de l'Œil noir", "galaxy", "Com", "12 56.7", "+21 41", 8.5],
    [65, "NGC 3623", null, "galaxy", "Leo", "11 18.9", "+13 05", 9.3],
    [66, "NGC 3627", null, "galaxy", "Leo", "11 20.2", "+12 59", 8.9],
    [67, "NGC 2682", null, "open-cluster", "Cnc", "08 50.4", "+11 49", 6.1],
    [68, "NGC 4590", null, "globular-cluster", "Hya", "12 39.5", "-26 45", 7.8],
    [69, "NGC 6637", null, "globular-cluster", "Sgr", "18 31.4", "-32 21", 7.6],
    [70, "NGC 6681", null, "globular-cluster", "Sgr", "18 43.2", "-32 18", 7.9],
    [71, "NGC 6838", null, "globular-cluster", "Sge", "19 53.8", "+18 47", 8.2],
    [72, "NGC 6981", null, "globular-cluster", "Aqr", "20 53.5", "-12 32", 9.3],
    [73, "NGC 6994", null, "asterism", "Aqr", "20 58.9", "-12 38", 9.0],
    [74, "NGC 628", null, "galaxy", "Psc", "01 36.7", "+15 47", 9.4],
    [75, "NGC 6864", null, "globular-cluster", "Sgr", "20 06.1", "-21 55", 8.5],
    [76, "NGC 650", "Petite nébuleuse de l'Haltère", "planetary-nebula", "Per", "01 42.4", "+51 34", 10.1],
    [77, "NGC 1068", null, "galaxy", "Cet", "02 42.7", "-00 01", 8.9],
    [78, "NGC 2068", null, "diffuse-nebula", "Ori", "05 46.7", "+00 03", 8.3],
    [79, "NGC 1904", null, "globular-cluster", "Lep", "05 24.5", "-24 33", 7.7],
    [80, "NGC 6093", null, "globular-cluster", "Sco", "16 17.0", "-22 59", 7.3],
    [81, "NGC 3031", "Galaxie de Bode", "galaxy", "UMa", "09 55.6", "+69 04", 6.9],
    [82, "NGC 3034", "Galaxie du Cigare", "galaxy", "UMa", "09 55.8", "+69 41", 8.4],
    [83, "NGC 5236", "Galaxie du Moulinet austral", "galaxy", "Hya", "13 37.0", "-29 52", 7.6],
    [84, "NGC 4374", null, "galaxy", "Vir", "12 25.1", "+12 53", 9.1],
    [85, "NGC 4382", null, "galaxy", "Com", "12 25.4", "+18 11", 9.1],
    [86, "NGC 4406", null, "galaxy", "Vir", "12 26.2", "+12 57", 8.9],
    [87, "NGC 4486", "Virgo A", "galaxy", "Vir", "12 30.8", "+12 23", 8.6],
    [88, "NGC 4501", null, "galaxy", "Com", "12 32.0", "+14 25", 9.6],
    [89, "NGC 4552", null, "galaxy", "Vir", "12 35.7", "+12 33", 9.8],
    [90, "NGC 4569", null, "galaxy", "Vir", "12 36.8", "+13 10", 9.5],
    [91, "NGC 4548", null, "galaxy", "Com", "12 35.4", "+14 30", 10.2],
    [92, "NGC 6341", null, "globular-cluster", "Her", "17 17.1", "+43 08", 6.4],
    [93, "NGC 2447", null, "open-cluster", "Pup", "07 44.6", "-23 52", 6.0],
    [94, "NGC 4736", null, "galaxy", "CVn", "12 50.9", "+41 07", 8.2],
    [95, "NGC 3351", null, "galaxy", "Leo", "10 44.0", "+11 42", 9.7],
    [96, "NGC 3368", null, "galaxy", "Leo", "10 46.8", "+11 49", 9.2],
    [97, "NGC 3587", "Nébuleuse du Hibou", "planetary-nebula", "UMa", "11 14.8", "+55 01", 9.9],
    [98, "NGC 4192", null, "galaxy", "Com", "12 13.8", "+14 54", 10.1],
    [99, "NGC 4254", null, "galaxy", "Com", "12 18.8", "+14 25", 9.9],
    [100, "NGC 4321", null, "galaxy", "Com", "12 22.9", "+15 49", 9.3],
    [101, "NGC 5457", "Galaxie du Moulinet", "galaxy", "UMa", "14 03.2", "+54 21", 7.9],
    [102, "NGC 5866", "Galaxie du Fuseau", "galaxy", "Dra", "15 06.5", "+55 46", 9.9],
    [103, "NGC 581", null, "open-cluster", "Cas", "01 33.2", "+60 42", 7.4],
    [104, "NGC 4594", "Galaxie du Sombrero", "galaxy", "Vir", "12 40.0", "-11 37", 8.0],
    [105, "NGC 3379", null, "galaxy", "Leo", "10 47.8", "+12 35", 9.3],
    [106, "NGC 4258", null, "galaxy", "CVn", "12 19.0", "+47 18", 8.4],
    [107, "NGC 6171", null, "globular-cluster", "Oph", "16 32.5", "-13 03", 7.9],
    [108, "NGC 3556", null, "galaxy", "UMa", "11 11.5", "+55 40", 10.0],
    [109, "NGC 3992", null, "galaxy", "UMa", "11 57.6", "+53 23", 9.8],
    [110, "NGC 205", null, "galaxy", "And", "00 40.4", "+41 41", 8.5]
] as const satisfies readonly MessierRow[];

function parseSexagesimal(value: string): number {
    const [whole = "0", minutes = "0"] = value.split(" ");
    const sign = whole.startsWith("-") ? -1 : 1;
    return sign * (Math.abs(Number(whole)) + Number(minutes) / 60);
}

export const messierObjects: readonly MessierObject[] = rows.map(
    ([number, ngc, name, type, constellation, rightAscension, declination, magnitude]) => ({
        id: `m${number}`,
        number,
        designation: `M${number}`,
        ngc,
        name,
        type,
        constellation,
        rightAscension: parseSexagesimal(rightAscension),
        declination: parseSexagesimal(declination),
        magnitude
    })
);

export function getObjectTitle({ designation, name }: MessierObject): string {
    return name ? `${designation} · ${name}` : designation;
}
