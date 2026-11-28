// Generated verbatim from docs/ratings/standard-0.3.md; historical draft is not the beta standard.
export const STANDARD_VERSION = "0.3" as const;
export const RATING_ANCHORS = {
  luck: {
    definition:
      "The extent to which random mechanisms influence meaningful game states and outcomes, considering how effectively decisions can mitigate them. Random draws and dice count; hidden player intentions alone do not. Setup randomness counts when it materially changes opportunity or advantage. Assess randomness relative to meaningful control, not the presence of dice or cards.",
    anchors: {
      "1": "No consequential random mechanism affects setup or play.",
      "1.5": "Rare or minor random effects have negligible influence on advantage or outcomes.",
      "2": "Randomness changes occasional opportunities; decisions usually control its consequences.",
      "2.5":
        "Randomness regularly changes options, but mitigation generally preserves the influence of good decisions.",
      "3": "Chance and decisions both materially influence advantage and outcomes; mitigation is useful but incomplete.",
      "3.5": "Random events frequently alter important advantages despite competent mitigation.",
      "4": "Random events exert strong influence on important advantages; decisions can manage some consequences but cannot reliably neutralize them.",
      "4.5":
        "Most decisive advantages depend on random outcomes; player choices offer little control.",
      "5": "Random mechanisms determine the result; players have no meaningful outcome-changing choices or execution.",
    },
  },
  skill: {
    definition:
      "The contribution of cognitive or physical execution\u2014memory, observation, recognition, accuracy, coordination, timing, and reflexes\u2014to success. Separate executing a task from selecting a plan. Untimed memory and observation can count; speed is not mandatory. Merely handling pieces does not count.",
    anchors: {
      "1": "Execution demands do not meaningfully differentiate success.",
      "1.5": "Basic awareness or execution provides occasional minor advantages.",
      "2": "Isolated recognition, memory, accuracy, or motor tasks offer modest advantages.",
      "2.5":
        "Execution tasks recur and affect progress, but other mechanisms usually determine success.",
      "3": "Execution quality regularly and materially affects results.",
      "3.5": "Execution quality shapes many consequential actions and results.",
      "4": "Execution quality is central to success across much of play.",
      "4.5":
        "Outcomes depend predominantly on execution quality, with limited compensation from other mechanisms.",
      "5": "Performance on execution tasks is the defining and overwhelmingly determining basis of success.",
    },
  },
  strategy: {
    definition:
      "The degree to which success depends on consequential planning, anticipation, adaptation, and connected decisions. Includes short-term tactics and longer-term plans. Opponents are not required: planning against a system can qualify. Randomness does not cap this rating.",
    anchors: {
      "1": "No meaningful planning choices affect outcomes.",
      "1.5": "Choices are largely automatic, with little benefit from anticipation.",
      "2": "Simple immediate tradeoffs or blocking decisions matter; future consequences are limited.",
      "2.5": "Repeated tactical choices allow modest planning across upcoming actions.",
      "3": "Connected choices and short plans materially affect success throughout play.",
      "3.5":
        "Consistent anticipation, adaptation, and coordinated choices offer substantial advantage.",
      "4": "Multi-turn plans and competing priorities are central to success.",
      "4.5":
        "Interacting strategic layers require sustained tradeoffs, adaptation, and evaluation of alternative plans.",
      "5": "Deep, sustained planning across multiple viable approaches defines play; decision quality remains consequential throughout.",
    },
  },
  social: {
    definition:
      "The extent to which meaningful interpersonal engagement shapes play, including communication, cooperation, negotiation, bluffing, persuasion, and interpreting other players. Mechanical interference alone is not equivalent to communication. Silent signaling and reading intentions can qualify; optional conversation unrelated to play does not.",
    anchors: {
      "1": "Play requires no meaningful interpersonal engagement; tasks are solo or parallel.",
      "1.5": "Brief incidental exchanges occur without shaping decisions.",
      "2": "Occasional interpersonal engagement influences limited choices; most play is individually resolved.",
      "2.5": "Recurring exchanges or interpretation of others matter in specific portions of play.",
      "3": "Communication, joint choices, or interpretation of intentions regularly changes decisions and results.",
      "3.5":
        "Cooperation, negotiation, bluffing, or interpersonal interpretation shapes many important decisions.",
      "4": "Sustained interpersonal engagement is central across most phases.",
      "4.5": "Most consequential decisions depend on communication or psychological interplay.",
      "5": "Interpersonal engagement is the primary mechanism through which the game is played and resolved.",
    },
  },
  complexity: {
    definition:
      "The burden of learning, recalling, and correctly executing the rules and procedures. Rate rules burden rather than strategic depth, theme, or box size. Teach time is corroborating evidence, not a universal cutoff.",
    anchors: {
      "1": "One simple procedure and clear outcome; almost no exceptions or ongoing rule tracking.",
      "1.5": "A few straightforward rules can be retained after a brief demonstration.",
      "2": "Several simple procedures or occasional exceptions require modest recall.",
      "2.5":
        "Multiple recurring procedures interact, but normal turns become manageable with brief guidance.",
      "3": "Several connected systems require a substantive explanation and occasional reminders or references.",
      "3.5":
        "Layered procedures, terminology, or phase differences create sustained rules demands.",
      "4": "Multiple interacting systems and recurring exceptions require substantial rules tracking.",
      "4.5":
        "Extensive exceptions, asymmetric rules, or detailed procedures create frequent reference needs.",
      "5": "Very extensive interdependent rules and procedures demand sustained preparation, reference, and management.",
    },
  },
  replayability: {
    definition:
      "The capacity for repeated plays of the assessed product to offer meaningfully different decisions, challenges, or interactions. Distinguish variability from merely different random results. Fixed setup does not imply low replayability. Do not count unowned expansions or claim universal enjoyment.",
    anchors: {
      "1": "Once experienced or solved, the product offers essentially no new meaningful challenge without replacement/reset content.",
      "1.5":
        "A small amount of repeated play is supported before the same solutions or decisions recur.",
      "2": "Some variation exists, but meaningful approaches or challenges are quickly exhausted.",
      "2.5":
        "Several distinct experiences are supported, with repetition increasingly limiting new decisions.",
      "3": "Repeated sessions offer meaningful variation through decisions, setups, challenges, or interaction.",
      "3.5": "Multiple sources of variation regularly generate new consequential situations.",
      "4": "Broad decision or challenge variation supports sustained repeat play within the assessed product.",
      "4.5": "Deep interacting variability supports extensive exploration and changing approaches.",
      "5": "The core system supports an exceptionally broad, renewable space of consequential situations across repeated play.",
    },
  },
  resourceMgmt: {
    definition:
      "The importance of allocating, conserving, exchanging, or optimizing scarce assets such as cards, currency, actions, time budgets, space, or energy. Scarcity must create consequential tradeoffs. Simply having turns or holding cards is insufficient.",
    anchors: {
      "1": "No consequential allocation of scarce resources is required.",
      "1.5": "Simple use of available assets involves little scarcity or opportunity cost.",
      "2": "Occasional allocation choices create modest tradeoffs.",
      "2.5": "Regular spend/save/use decisions matter but remain straightforward.",
      "3": "Sustained management of a resource pool materially affects success.",
      "3.5": "Timing and efficiency of resource use create substantial advantages.",
      "4": "Strongly interacting resource decisions, conversions, or competing uses require careful balancing.",
      "4.5": "Persistent scarcity and layered opportunity costs drive major decisions.",
      "5": "Resource allocation and optimization organize nearly all defining decisions and success conditions.",
    },
  },
  dexterity: {
    definition:
      "How strongly outcome-relevant motor execution defines play: precision, coordination, balancing, timing, and physical reaction. Slow controlled movement qualifies. Cognitive speed alone does not; a timer or \u201creal-time\u201d label alone is insufficient.",
    anchors: {
      "1": "Piece handling is administrative and motor execution does not affect success.",
      "1.5": "Minor motor demands occur with negligible outcome consequences.",
      "2": "Occasional motor tasks affect limited portions of play.",
      "2.5": "Motor execution recurs but has secondary influence on results.",
      "3": "Coordination, timing, or precision regularly affects success.",
      "3.5": "Motor execution shapes many important actions and materially affects results.",
      "4": "Motor performance is central to the main gameplay loop and outcomes.",
      "4.5":
        "Most consequential play depends on motor execution, with little compensation through other mechanisms.",
      "5": "Physical execution is the defining and primary basis of success.",
    },
  },
  family: {
    definition:
      "Fit for meaningful shared play between children and adults with mixed gaming experience, under standard rules. Assess independent participation, turn engagement, manageable learning demands, and opportunities to contribute.",
    anchors: {
      "1": "Within the stated suitable age context, participation demands prevent meaningful shared standard play.",
      "1.5":
        "Shared play requires extensive simplification or adults effectively making children's decisions.",
      "2": "Children can perform some tasks but require frequent assistance and have limited independent agency.",
      "2.5":
        "Children make some meaningful choices but recurring guidance or long disengagement limits participation.",
      "3": "The group can play meaningfully with occasional assistance and manageable differences in participation.",
      "3.5":
        "Children generally participate independently after introduction; most phases sustain shared engagement.",
      "4": "Clear procedures, manageable turns, and meaningful contributions support consistent participation across the group.",
      "4.5":
        "Mechanisms actively support broad participation and recovery from mistakes with minimal ongoing help.",
      "5": "Independent, sustained, consequential participation across the assessed group is a defining design strength.",
    },
  },
  party: {
    definition:
      "How centrally recurring expressive interaction, conversation, performance, or shared reactions form the intended group experience. Shared attention to solving a strategic or cooperative problem alone is insufficient. Quiet expression can qualify; noise, adult themes, large groups and guaranteed laughter are not required.",
    anchors: {
      "1": "No meaningful designed expressive or shared-reaction activity.",
      "1.5": "Such moments are incidental and infrequent.",
      "2": "Occasional shared reactions or expression supplement another primary task.",
      "2.5": "Recurring expressive or reaction moments support play but remain secondary.",
      "3": "A recurring expressive, conversational, performative or shared-reaction mechanism is central to the intended experience, with meaningful downtime or uneven participation.",
      "3.5": "That mechanism shapes many phases and repeatedly involves the group.",
      "4": "That mechanism is central throughout most play, with limited designed disengagement.",
      "4.5":
        "Nearly all phases provide expressive or shared-reaction involvement, including outside one's turn.",
      "5": "Broad ongoing expressive or shared-reaction participation defines the core loop.",
    },
  },
  board: {
    definition:
      "Dependence on a structured spatial representation\u2014board, map, grid, routes, tiles, or spatially arranged cards\u2014for meaningful decisions. Materials do not determine the rating. A score track alone is bookkeeping unless positions create consequential choices. Include consequential physical support relationships. Exclude identity lookup, decorative layout and scalar answer displays; moving a dial to report a conceptual answer alone does not qualify.",
    anchors: {
      "1": "No structured spatial relationships affect meaningful decisions.",
      "1.5": "A surface or layout is decorative or incidental bookkeeping.",
      "2": "A layout aids organization but removing its spatial relationships would barely change decisions.",
      "2.5": "Spatial relationships influence recurring secondary choices.",
      "3": "Movement, placement, adjacency, or paths regularly affect consequential choices.",
      "3.5": "Spatial relationships are central to several major mechanics.",
      "4": "Most major choices depend on position, connectivity, distance, or spatial control.",
      "4.5": "Structured spatial relationships organize nearly all major actions and interactions.",
      "5": "Spatial relationships are indispensable to the defining decisions and core gameplay loop.",
    },
  },
} as const;
