export type DetectorMode = "illust" | "photo";

export type PartId = "female" | "male" | "breast" | "anus" | "buttocks";

export const PART_JA: Record<PartId, string> = {
  female: "女性器",
  male: "男性器",
  breast: "胸部",
  anus: "肛門",
  buttocks: "臀部",
};

export const DEFAULT_PARTS: PartId[] = ["female", "male"];

export const PHOTO_LABELS = [
  "FEMALE_GENITALIA_COVERED",
  "FACE_FEMALE",
  "BUTTOCKS_EXPOSED",
  "FEMALE_BREAST_EXPOSED",
  "FEMALE_GENITALIA_EXPOSED",
  "MALE_BREAST_EXPOSED",
  "ANUS_EXPOSED",
  "FEET_EXPOSED",
  "BELLY_COVERED",
  "FEET_COVERED",
  "ARMPITS_COVERED",
  "ARMPITS_EXPOSED",
  "FACE_MALE",
  "BELLY_EXPOSED",
  "MALE_GENITALIA_EXPOSED",
  "ANUS_COVERED",
  "FEMALE_BREAST_COVERED",
  "BUTTOCKS_COVERED",
] as const;

export const ILLUST_LABELS = ["nipple_f", "penis", "pussy"] as const;

const PHOTO_MAP: Record<string, PartId> = {
  FEMALE_GENITALIA_COVERED: "female",
  FEMALE_GENITALIA_EXPOSED: "female",
  MALE_GENITALIA_EXPOSED: "male",
  FEMALE_BREAST_EXPOSED: "breast",
  ANUS_EXPOSED: "anus",
  BUTTOCKS_EXPOSED: "buttocks",
};

const ILLUST_MAP: Record<string, PartId> = {
  pussy: "female",
  penis: "male",
  nipple_f: "breast",
};

export type ModelSpec = {
  url: string;
  inputSize: number;
  nmsIou: number;
  labels: readonly string[];
  map: Record<string, PartId>;
  extras: PartId[];
};

export const MODELS: Record<DetectorMode, ModelSpec> = {
  illust: {
    url: "/models/anime-censor-n.onnx",
    inputSize: 640,
    nmsIou: 0.7,
    labels: ILLUST_LABELS,
    map: ILLUST_MAP,
    extras: ["breast"],
  },
  photo: {
    url: "/models/nudenet-320n.onnx",
    inputSize: 320,
    nmsIou: 0.45,
    labels: PHOTO_LABELS,
    map: PHOTO_MAP,
    extras: ["breast", "anus", "buttocks"],
  },
};

export function partFromRaw(mode: DetectorMode, raw: string): PartId | null {
  return MODELS[mode].map[raw] ?? null;
}
