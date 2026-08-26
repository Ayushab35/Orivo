/** Planetary archetypes used throughout soul report interpretations. */
export const PLANET_MEANINGS = {
  Sun: "Identity, vitality, authority, purpose, and self-expression.",
  Moon: "Mind, emotions, instincts, nourishment, and public connection.",
  Mars: "Drive, courage, action, discipline, and assertive force.",
  Mercury: "Intellect, communication, analysis, trade, and adaptability.",
  Jupiter: "Wisdom, growth, ethics, teaching, opportunity, and abundance.",
  Venus: "Values, relationships, beauty, harmony, comfort, and refinement.",
  Saturn: "Responsibility, endurance, structure, service, and long-term mastery.",
  Rahu: "Ambition, disruption, worldly appetite, innovation, and unconventionality.",
  Ketu: "Detachment, insight, release, spiritual inquiry, and past mastery.",
  Ascendant: "Embodiment, outlook, presence, personal style, and life approach.",
} as const;

/** Career expressions associated with each planet or chart point. */
export const PLANET_CAREER_MEANINGS = {
  Sun: ["leadership", "government", "executive management", "administration"],
  Moon: ["hospitality", "public service", "caregiving", "community work"],
  Mars: ["engineering", "military", "surgery", "operations", "entrepreneurship"],
  Mercury: ["communications", "technology", "commerce", "consulting", "analytics"],
  Jupiter: ["education", "law", "advisory", "finance", "mentoring"],
  Venus: ["design", "arts", "luxury", "diplomacy", "relationship management"],
  Saturn: ["engineering", "compliance", "manufacturing", "governance", "operations"],
  Rahu: ["technology", "media", "foreign trade", "research", "disruptive ventures"],
  Ketu: ["research", "investigation", "healing", "specialist advisory", "behind-the-scenes work"],
  Ascendant: ["personal brand", "independent work", "client-facing roles"],
} as const;

/** Work environments in which each planet's themes are commonly expressed. */
export const PLANET_CAREER_ENVIRONMENTS = {
  Sun: ["visible leadership", "structured authority", "high-accountability roles"],
  Moon: ["people-focused teams", "service settings", "responsive environments"],
  Mars: ["fast-paced execution", "competitive settings", "hands-on operations"],
  Mercury: ["information-rich teams", "commercial settings", "adaptive work"],
  Jupiter: ["learning cultures", "advisory settings", "mission-led institutions"],
  Venus: ["collaborative teams", "client-facing work", "aesthetic environments"],
  Saturn: ["structured systems", "long-term projects", "regulated environments"],
  Rahu: ["innovative ventures", "global settings", "emerging industries"],
  Ketu: ["specialist roles", "independent work", "research environments"],
  Ascendant: ["self-directed work", "visible roles", "personal-brand settings"],
} as const;

/** Leadership styles and leadership strengths associated with each planet. */
export const PLANET_LEADERSHIP_TRAITS = {
  Sun: ["authoritative", "decisive", "visible", "purpose-led"],
  Moon: ["empathetic", "protective", "responsive", "people-centered"],
  Mars: ["bold", "action-oriented", "competitive", "courageous"],
  Mercury: ["strategic", "articulate", "agile", "collaborative"],
  Jupiter: ["visionary", "ethical", "developmental", "inspirational"],
  Venus: ["diplomatic", "harmonizing", "persuasive", "relationship-led"],
  Saturn: ["disciplined", "accountable", "systematic", "resilient"],
  Rahu: ["innovative", "ambitious", "unconventional", "trend-aware"],
  Ketu: ["independent", "insightful", "non-attached", "specialist"],
  Ascendant: ["self-directed", "present", "adaptive", "authentic"],
} as const;

/** Constructive qualities associated with each planet or chart point. */
export const PLANET_STRENGTH_KEYWORDS = {
  Sun: ["confidence", "integrity", "authority", "clarity"],
  Moon: ["empathy", "intuition", "adaptability", "care"],
  Mars: ["initiative", "bravery", "energy", "persistence"],
  Mercury: ["reasoning", "communication", "curiosity", "versatility"],
  Jupiter: ["wisdom", "optimism", "generosity", "judgment"],
  Venus: ["charm", "taste", "cooperation", "creativity"],
  Saturn: ["patience", "discipline", "reliability", "mastery"],
  Rahu: ["innovation", "resourcefulness", "boldness", "adaptation"],
  Ketu: ["discernment", "depth", "objectivity", "independence"],
  Ascendant: ["presence", "self-awareness", "initiative", "resilience"],
} as const;

/** Shadow expressions or developmental challenges associated with each planet. */
export const PLANET_WEAKNESS_KEYWORDS = {
  Sun: ["ego", "rigidity", "dominance", "validation-seeking"],
  Moon: ["moodiness", "dependency", "restlessness", "over-sensitivity"],
  Mars: ["impatience", "anger", "conflict", "impulsiveness"],
  Mercury: ["overthinking", "inconsistency", "nervousness", "superficiality"],
  Jupiter: ["excess", "overconfidence", "dogmatism", "indulgence"],
  Venus: ["indecision", "people-pleasing", "vanity", "overindulgence"],
  Saturn: ["fear", "pessimism", "delay", "isolation"],
  Rahu: ["obsession", "illusion", "restlessness", "risk-taking"],
  Ketu: ["detachment", "withdrawal", "doubt", "disconnection"],
  Ascendant: ["self-consciousness", "reactivity", "image-focus", "defensiveness"],
} as const;

/** Zodiac signs ruled by each classical planetary ruler. */
export const PLANET_SIGN_OWNERSHIP = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"],
  Saturn: ["Capricorn", "Aquarius"],
  Rahu: [],
  Ketu: [],
  Ascendant: [],
} as const;

/** Ordered names of the twelve zodiac signs. */
export const SIGN_NAMES = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

/** Natural life areas signified by each planet or chart point. */
export const NATURAL_SIGNIFICATORS = {
  Sun: ["father", "authority", "reputation", "vitality", "soul"],
  Moon: ["mother", "mind", "home", "comfort", "public"],
  Mars: ["siblings", "property", "competition", "courage", "conflict"],
  Mercury: ["learning", "speech", "business", "writing", "calculation"],
  Jupiter: ["children", "teachers", "wealth", "wisdom", "guidance"],
  Venus: ["relationships", "art", "vehicles", "luxury", "pleasure"],
  Saturn: ["work", "discipline", "longevity", "labour", "responsibility"],
  Rahu: ["foreign influences", "technology", "mass appeal", "ambition", "taboo subjects"],
  Ketu: ["liberation", "research", "loss", "isolation", "intuition"],
  Ascendant: ["body", "temperament", "identity", "appearance", "life direction"],
} as const;

/** Fixed planet ranks used when a ranking-based interpretation is required. */
export const PLANET_RANKINGS = {
  Sun: 1,
  Moon: 2,
  Mars: 3,
  Mercury: 4,
  Jupiter: 5,
  Venus: 6,
  Saturn: 7,
  Rahu: 8,
  Ketu: 9,
  Ascendant: 10,
} as const;

/** Static angular definitions for common planetary aspects. */
export const ASPECT_CONSTANTS = {
  conjunction: { angle: 0, orb: 8 },
  semiSextile: { angle: 30, orb: 2 },
  sextile: { angle: 60, orb: 4 },
  square: { angle: 90, orb: 6 },
  trine: { angle: 120, orb: 6 },
  quincunx: { angle: 150, orb: 3 },
  opposition: { angle: 180, orb: 8 },
} as const;

/** Traditional Vedic special aspect house distances for each planet. */
export const VEDIC_ASPECT_HOUSES = {
  Sun: [7],
  Moon: [7],
  Mars: [4, 7, 8],
  Mercury: [7],
  Jupiter: [5, 7, 9],
  Venus: [7],
  Saturn: [3, 7, 10],
  Rahu: [5, 7, 9],
  Ketu: [5, 7, 9],
  Ascendant: [],
} as const;

/** Core meanings associated with each of the twelve houses. */
export const HOUSE_MEANINGS = {
  1: ["identity", "body", "appearance", "temperament", "life direction"],
  2: ["wealth", "family", "speech", "values", "resources"],
  3: ["courage", "communication", "skills", "siblings", "initiative"],
  4: ["home", "mother", "emotional security", "property", "education"],
  5: ["creativity", "children", "intelligence", "romance", "self-expression"],
  6: ["service", "health", "routines", "competition", "obligations"],
  7: ["partnerships", "marriage", "clients", "contracts", "public relations"],
  8: ["transformation", "shared resources", "research", "crisis", "inheritance"],
  9: ["purpose", "higher learning", "beliefs", "mentors", "long-distance travel"],
  10: ["career", "status", "responsibility", "leadership", "public contribution"],
  11: ["gains", "networks", "aspirations", "community", "recognition"],
  12: ["release", "solitude", "foreign lands", "rest", "inner life"],
} as const;
