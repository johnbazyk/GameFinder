import { RATING_ANCHORS as PREVIOUS_ANCHORS } from "./rating-anchors-03";

// Design baseline: these are anchored judgments, not measurements of a child's ability.
export const STANDARD_VERSION = "0.4-design" as const;
export const RATING_ANCHORS = {
  ...PREVIOUS_ANCHORS,
  family: {
    definition:
      "Structural support for shared participation under the standard rules: reading and arithmetic demands, procedural burden, turn access, downtime, elimination, and recovery from mistakes. This describes the design, not an age guarantee, theme suitability, or an individual child's ability.",
    anchors: {
      "1": "Extensive procedural and text or calculation demands combine with substantial barriers to continued participation.",
      "1.5":
        "Heavy independent processing demands and consequential lockout or long waits dominate the structure.",
      "2": "Layered rules or substantial text and calculation create recurring participation burdens; support is limited.",
      "2.5":
        "Several processing or turn-access barriers remain despite some structural support for participation.",
      "3": "Manageable procedures and recurring meaningful turns coexist with noticeable reading, calculation, waiting, or recovery demands.",
      "3.5":
        "Clear recurring turns and moderate processing demands generally preserve participation; some barriers remain.",
      "4": "Low procedural and processing burdens, frequent meaningful participation, and limited exclusion support shared play.",
      "4.5":
        "Simple accessible procedures and sustained involvement combine with strong recovery or minimal exclusion.",
      "5": "Very low processing burdens, meaningful ongoing participation, and minimal waiting or exclusion define the design.",
    },
  },
} as const;
