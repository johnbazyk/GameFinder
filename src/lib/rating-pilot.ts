import type { RatingRecord } from "./rating-policy";
// Explicit legacy bindings; beta IDs are not permanent catalog identities. No BGG requests.
export const RATING_PILOT: readonly RatingRecord[] = [
  {
    id: "gf:beta-pilot:3931",
    version: "0.3",
    legacyId: "3931",
    expectedTitle: "Connect Four",
    edition: "Hasbro classic drop-only",
    mode: "Standard",
    playerCounts: [2],
    ratings: {
      luck: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "No random setup or resolution is specified; 1.5 would assert a random influence absent from these rules.",
        neighboringAnchor:
          "No random setup or resolution is specified; 1.5 would assert a random influence absent from these rules.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      skill: {
        value: 2,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Recognizing immediate lines is an isolated execution task (2); 1.5 understates repeated observation, while 2.5 would attribute more outcome influence separately from planning than evidenced.",
        neighboringAnchor:
          "Recognizing immediate lines is an isolated execution task (2); 1.5 understates repeated observation, while 2.5 would attribute more outcome influence separately from planning than evidenced.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      strategy: {
        value: 4,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Connected turns and competing threats support 4; 3.5 understates the defining multi-turn plans, while 4.5 claims additional interacting layers not established here.",
        neighboringAnchor:
          "Connected turns and competing threats support 4; 3.5 understates the defining multi-turn plans, while 4.5 claims additional interacting layers not established here.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      social: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "The rules require placement and blocking, not communication; 1.5 would credit optional conversation as a mechanism.",
        neighboringAnchor:
          "The rules require placement and blocking, not communication; 1.5 would credit optional conversation as a mechanism.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      complexity: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "One placement procedure and four-in-a-row outcome support 1; no recurring exception burden warrants 1.5.",
        neighboringAnchor:
          "One placement procedure and four-in-a-row outcome support 1; no recurring exception burden warrants 1.5.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      replayability: {
        value: 3,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Changing opponent choices support renewed challenges at 3; 2.5 understates evolving positions, while 3.5 requires multiple variation sources not established. Structural inference only.",
        neighboringAnchor:
          "Changing opponent choices support renewed challenges at 3; 2.5 understates evolving positions, while 3.5 requires multiple variation sources not established. Structural inference only.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      resourceMgmt: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Normal turns and occupied columns are not a separately managed pool; 1.5 would double-count positioning.",
        neighboringAnchor:
          "Normal turns and occupied columns are not a separately managed pool; 1.5 would double-count positioning.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      dexterity: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Dropping a checker is administrative; 1.5 would imply motor advantage not specified in the rules.",
        neighboringAnchor:
          "Dropping a checker is administrative; 1.5 would imply motor advantage not specified in the rules.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      party: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Occasional common reactions supplement individual positional turns (2); 1.5 understates shared outcomes, while 2.5 suggests recurring expressive mechanisms not established. Experience is unobserved.",
        neighboringAnchor:
          "Occasional common reactions supplement individual positional turns (2); 1.5 understates shared outcomes, while 2.5 suggests recurring expressive mechanisms not established. Experience is unobserved.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      board: {
        value: 5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "Row, column and diagonal relationships define winning choices (5); 4.5 understates indispensable spatial decisions.",
        neighboringAnchor:
          "Row, column and diagonal relationships define winning choices (5); 4.5 understates indispensable spatial decisions.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
    },
    family: {
      "8-10": {
        value: 3.5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/ConnectFour.PDF",
            observation:
              "Players alternate dropping checkers and attempt a four-in-a-row while preventing the opponent doing so.",
          },
        ],
        rationale:
          "No reading during play; one turn procedure; each player places a piece; no elimination before completion; occasional help recognizing threats expected. 3 understates procedural independence; 4 overstates unobserved sustained participation. Two players only.",
        neighboringAnchor:
          "No reading during play; one turn procedure; each player places a piece; no elimination before completion; occasional help recognizing threats expected. 3 understates procedural independence; 4 overstates unobserved sustained participation. Two players only.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
        ageMin: 8,
        ageMax: 10,
        language: "English rules; no reading required during turns",
        assistance: "Occasional rule or strategy reminders expected; no observed session",
        taskEvidence: [
          "No reading during turns; recognize line or support patterns",
          "Few procedural rules",
          "Each player executes their own turn",
          "Wait between turns; no elimination before game ends",
          "Occasional adult explanation expected; not observed",
        ],
      },
    },
  },
  {
    id: "gf:beta-pilot:2452",
    version: "0.3",
    legacyId: "2452",
    expectedTitle: "Jenga",
    edition: "Hasbro 2000 standard tower",
    mode: "Standard",
    playerCounts: [3],
    ratings: {
      luck: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "No rule-defined randomizer supports 1; uncontrolled motor error is not automatically chance. Material variability remains a limitation, not evidence for 1.5.",
        neighboringAnchor:
          "No rule-defined randomizer supports 1; uncontrolled motor error is not automatically chance. Material variability remains a limitation, not evidence for 1.5.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      skill: {
        value: 5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Physical extraction and placement determine success (5); 4.5 understates execution as the defining win/loss task.",
        neighboringAnchor:
          "Physical extraction and placement determine success (5); 4.5 understates execution as the defining win/loss task.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      strategy: {
        value: 2,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Immediate block selection and support tradeoffs support 2; 1.5 understates choice while 2.5 would require evidenced multi-action planning.",
        neighboringAnchor:
          "Immediate block selection and support tradeoffs support 2; 1.5 understates choice while 2.5 would require evidenced multi-action planning.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      social: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Required play is motor performance, not interpersonal interpretation (1); optional talk does not establish 1.5.",
        neighboringAnchor:
          "Required play is motor performance, not interpersonal interpretation (1); optional talk does not establish 1.5.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      complexity: {
        value: 1.5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "A few restrictions supplement removal and placement (1.5); 1 omits these restrictions, while 2 overstates the number of procedures.",
        neighboringAnchor:
          "A few restrictions supplement removal and placement (1.5); 1 omits these restrictions, while 2 overstates the number of procedures.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      replayability: {
        value: 3,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Changed support configurations renew physical challenges (3); 2.5 understates those changes, while 3.5 needs additional sources of variation. No repeated-play observation.",
        neighboringAnchor:
          "Changed support configurations renew physical challenges (3); 2.5 understates those changes, while 3.5 needs additional sources of variation. No repeated-play observation.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      resourceMgmt: {
        value: 1,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Blocks and turns do not constitute a managed resource budget; 1.5 would double-count physical support choices.",
        neighboringAnchor:
          "Blocks and turns do not constitute a managed resource budget; 1.5 would double-count physical support choices.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      dexterity: {
        value: 5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "One-hand removal and placement are the defining motor task (5); 4.5 implies compensating nonmotor mechanisms not established.",
        neighboringAnchor:
          "One-hand removal and placement are the defining motor task (5); 4.5 implies compensating nonmotor mechanisms not established.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      party: {
        value: 3.5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Each visible extraction/placement creates recurring shared suspense (3.5); 3 understates recurrence, while 4 overstates unobserved involvement across players. No promised laughter.",
        neighboringAnchor:
          "Each visible extraction/placement creates recurring shared suspense (3.5); 3 understates recurrence, while 4 overstates unobserved involvement across players. No promised laughter.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
      board: {
        value: 4,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "Most block choices depend on position/support (4); 3.5 understates that dependence, while 4.5 overstates spatial choice relative to execution.",
        neighboringAnchor:
          "Most block choices depend on position/support (4); 3.5 understates that dependence, while 4.5 overstates spatial choice relative to execution.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
      },
    },
    family: {
      "8-10": {
        value: 3.5,
        status: "proposed",
        evidenceBasis: "rules",
        sources: [
          {
            url: "https://www.hasbro.com/common/instruct/jenga.pdf",
            observation:
              "Remove a block below the highest completed level, then place it atop the tower; collapse determines loss.",
          },
        ],
        rationale:
          "No reading during turns; simple removal/placement restrictions; each player acts; watches between turns; occasional rule reminders expected. 3 understates simple independent action; 4 overstates unobserved motor access and group engagement. Three-player scope.",
        neighboringAnchor:
          "No reading during turns; simple removal/placement restrictions; each player acts; watches between turns; occasional rule reminders expected. 3 understates simple independent action; 4 overstates unobserved motor access and group engagement. Three-player scope.",
        assessor: "ChatGPT desk assessment",
        assessedAt: "2026-11-14",
        beta: {
          eligible: true,
          reason:
            "Scoped rules-based pilot with explicit neighboring-anchor rationale; experiential claims remain provisional.",
          at: "2026-11-14",
          version: "0.3",
        },
        blockers: [],
        ageMin: 8,
        ageMax: 10,
        language: "English rules; no reading required during turns",
        assistance: "Occasional rule or strategy reminders expected; no observed session",
        taskEvidence: [
          "No reading during turns; recognize line or support patterns",
          "Few procedural rules",
          "Each player executes their own turn",
          "Wait between turns; no elimination before game ends",
          "Occasional adult explanation expected; not observed",
        ],
      },
    },
  },
];
