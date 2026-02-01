export type Person = {
    id: string;
    name: string;
    alias: string[];
    role: string;
    bio: string;
    knownConnections: string[]; // person ids
    redFlags: string[];
    credibleInfo: string[];
  };
  
  export type Location = {
    id: string;
    name: string;
    type: string;
    details: string;
    relevance: string[];
  };
  
  export type Evidence = {
    id: string;
    title: string;
    type: string;
    summary: string;
    details: string;
    tags: string[];
  };
  
  export const RUBRIC = [
    {
      q: 1,
      keyPoints: [
        "Identifies Varo Cind as the primary broker/facilitator",
        "Cites invoice irregularities (E6) and financial routing (E3)",
        "Explains the broker role: procurement access, client separation, profit motive"
      ]
    },
    {
      q: 2,
      keyPoints: [
        "Names at least two legitimate-layer enablers (ex: Hesk Ruun, Tomas Brill)",
        "Cites customs overrides or approval clustering (E6, E2, E4)",
        "Explains how each enabler reduces friction or risk"
      ]
    },
    {
      q: 3,
      keyPoints: [
        "Identifies Juno Hal as the most likely controller of ghost signal routing",
        "Cites maintenance-channel burst correlation (E1) and access role",
        "Explains capability: relay access, log masking, burst timing"
      ]
    },
    {
      q: 4,
      keyPoints: [
        "Provides a coherent contact chain of at least 6 individuals",
        "Includes a logical order (signal → coordination → logistics → approvals → transport)",
        "Uses evidence references to justify links (E1–E6)",
        "Notes use of cutouts or compartmentalization (ex: Mara Tey, Orrin Kale)"
      ]
    },
    {
      q: 5,
      keyPoints: [
        "States a plausible objective (diversion and covert movement of medical isotopes)",
        "Connects isotopes to value, scarcity, or controlled-use implications",
        "Links objective to both logistics evidence (E2, E6) and signal evidence (E1, E5)"
      ]
    },
    {
      q: 6,
      keyPoints: [
        "Identifies a likely next transfer location (ex: Port Lysa Dock Ring or Scrapline Corridor)",
        "Provides a reasonable time window tied to ghost burst cadence (~47 min, E1)",
        "Explains why the location fits operational patterns (low oversight, routing flexibility)"
      ]
    },
    {
      q: 7,
      keyPoints: [
        "Identifies a high OPSEC risk item (ex: cantina ledger E3 or relay access E1)",
        "Explains how that evidence could compromise the investigation",
        "Proposes a mitigation strategy (parallel construction, access control, source protection)"
      ]
    },
    {
      q: 8,
      keyPoints: [
        "Outlines a phased interdiction plan (surveillance → attribution → action)",
        "Prioritizes OPSEC and evidence preservation",
        "Considers flipping assets vs. arrests (ex: Dray Meln or Orrin Kale)",
        "Addresses contingency if the network detects exposure"
      ]
    }
  ] as const;
  
  
  export const CASE = {
    id: "PILOT_GHOST_SIGNAL",
    title: "GHOST SIGNAL — Mid Rim Diversion Cell",
    overview: `
  You are a Republic Intelligence candidate team assigned a one-night co-op tryout.
  
  A “ghost signal” — a repeating encrypted burst — has been detected hopping across civilian relays. It correlates with missing medical isotopes and an unusual spike in black-market transponder swaps.
  
  Your job is to reconstruct the network: who is moving what, where, and why — and recommend an operational plan that preserves OPSEC.
  `,
    objectives: [
      "Identify the primary facilitator (the ‘broker’) and at least two key enablers.",
      "Map the contact chain: aliases → likely real identities.",
      "Determine the objective of the operation (what they’re building/doing).",
      "Locate the next predicted transfer point and time window.",
      "Draft an OPSEC-first interdiction plan (minimize exposure, maximize attribution)."
    ],
  
    people: [
      {
        id: "p1",
        name: "Nira Voss",
        alias: ["NV-17", "Rill"],
        role: "Freight compliance clerk (civilian contractor)",
        bio:
          "Low-level compliance clerk attached to Port Authority audits. Keeps meticulous records and is known to ‘help’ captains fix paperwork. Claims to hate attention. Frequently present around manifest corrections minutes before departures.",
        knownConnections: ["p2", "p6", "p9"],
        redFlags: [
          "Manifest edits repeatedly coincide with high-value shipments",
          "Uses a secondary comm device registered to a dead business",
          "Receives ‘consulting’ payments in micro-transfers"
        ],
        credibleInfo: [
          "Knows port workflows extremely well",
          "Has access to inspection schedules",
          "May be an unwilling pressure point rather than core villain"
        ]
      },
      {
        id: "p2",
        name: "Salen Korr",
        alias: ["Skiff", "K-Glass"],
        role: "Dock foreman / shift scheduler",
        bio:
          "Controls which crews work which bays. Charismatic, makes people feel indebted. Keeps a ledger ‘for overtime disputes’ that doesn’t match official logs.",
        knownConnections: ["p1", "p3", "p7"],
        redFlags: [
          "Crew assignments shift after-hours without supervisor approval",
          "Known association with a ‘security consultant’ (unverified)",
          "Multiple ‘lost’ camera segments during his shifts"
        ],
        credibleInfo: [
          "Has motive (gambling debt) per third-party chatter",
          "Likely coordinates physical access"
        ]
      },
      {
        id: "p3",
        name: "Dray Meln",
        alias: ["Meln", "D-Arc"],
        role: "Independent slicer (contract)",
        bio:
          "Small-time slicer with a reputation for clean work and zero violence. Operates out of backroom terminals and swaps identities weekly. He says he only ‘changes plates,’ not cargo.",
        knownConnections: ["p2", "p4", "p8"],
        redFlags: [
          "Accessed transponder registry nodes outside normal windows",
          "Uses a signature packet pattern seen in the ghost signal",
          "Has protection he shouldn’t be able to afford"
        ],
        credibleInfo: [
          "If approached right, may flip to protect himself",
          "Technical glue between identity fraud + routing"
        ]
      },
      {
        id: "p4",
        name: "Mara Tey",
        alias: ["Blue-Kite", "M. T."],
        role: "Courier / runner",
        bio:
          "Fast, quiet courier who moves ‘documents’ between stations. Never stays in one place. Multiple reports of her being seen in two locations too quickly — suggests coordinated handoffs.",
        knownConnections: ["p3", "p5", "p10"],
        redFlags: [
          "Uses prearranged dead-drops",
          "Has a secure phrasebook with rotating countersigns",
          "Avoids biometric gates (always uses manual overrides)"
        ],
        credibleInfo: [
          "Operates the human link for time-sensitive transfers",
          "Likely not the planner"
        ]
      },
      {
        id: "p5",
        name: "Varo Cind",
        alias: ["Cinder", "VC-9"],
        role: "Medical supply broker",
        bio:
          "Broker with legitimate contacts in medical procurement. Not a doctor — a dealmaker. Publicly supports relief shipments; privately rumored to skim ‘spoils.’",
        knownConnections: ["p4", "p6", "p12"],
        redFlags: [
          "Invoices show mismatched isotope serial ranges",
          "Keeps two sets of clients: official and ‘private’",
          "Known to pay for silence rather than service"
        ],
        credibleInfo: [
          "Likely core facilitator (the broker)",
          "Understands which isotopes are valuable and why"
        ]
      },
      {
        id: "p6",
        name: "Hesk Ruun",
        alias: ["Harbor", "HR-2"],
        role: "Customs liaison (semi-official)",
        bio:
          "Greases wheels. Knows who to call to make inspections vanish. Presents as ‘pro-Republic’ and claims he ‘keeps trade flowing.’",
        knownConnections: ["p1", "p5", "p11"],
        redFlags: [
          "Unusual access to customs override tokens",
          "Recorded meeting with Varo Cind (unlogged)",
          "His comm traffic spikes at the same intervals as ghost bursts"
        ],
        credibleInfo: [
          "Key enabler inside the ‘legit’ layer"
        ]
      },
      {
        id: "p7",
        name: "Ketta Parn",
        alias: ["Spare", "K-7"],
        role: "Salvage pilot",
        bio:
          "Runs salvage routes and claims to be ‘just lucky’ finding wrecks. Several of her ‘salvage’ pickups match the same corridor as missing shipments.",
        knownConnections: ["p2", "p8", "p9"],
        redFlags: [
          "Transponder swaps mid-route",
          "Fuel purchases don’t match reported flight time",
          "Carries encrypted nav beacons"
        ],
        credibleInfo: [
          "May be a transport layer, not leadership"
        ]
      },
      {
        id: "p8",
        name: "Juno Hal",
        alias: ["Jun", "Signalwife"],
        role: "Relay technician",
        bio:
          "Works maintenance on civilian relays. Complains about low pay. Has the access to route short-burst signals through maintenance channels — exactly where ghost signals appear.",
        knownConnections: ["p3", "p7", "p12"],
        redFlags: [
          "Maintenance pings align with ghost bursts",
          "Keeps an offline keyring device",
          "Hides logs as ‘routine noise’"
        ],
        credibleInfo: [
          "Strong candidate for the ‘signal’ portion of the scheme"
        ]
      },
      {
        id: "p9",
        name: "Orrin Kale",
        alias: ["OK", "Kale-Hand"],
        role: "Cantina bookkeeper",
        bio:
          "Runs numbers for a popular port cantina. Everyone assumes he’s harmless. But his ledger captures who pays whom, when. His books show micro-transfers to Nira Voss and Salen Korr.",
        knownConnections: ["p1", "p2", "p10"],
        redFlags: [
          "Keeps duplicate ledgers",
          "Overly curious about ‘new faces’",
          "Known to sell ‘information’"
        ],
        credibleInfo: [
          "Useful intel source; could also be a leak risk"
        ]
      },
      {
        id: "p10",
        name: "Sera Mynt",
        alias: ["Mint", "S-Mynt"],
        role: "Private security ‘consultant’",
        bio:
          "Appears wherever problems occur. Offers ‘protection’ services. Rumored to be ex-military. Her clients overlap with multiple suspects.",
        knownConnections: ["p4", "p9", "p11"],
        redFlags: [
          "Owns nonstandard comm encryption hardware",
          "Moves with escort but has no declared employer",
          "Her presence correlates with ‘camera outages’"
        ],
        credibleInfo: [
          "May be counter-surveillance / intimidation layer"
        ]
      },
      {
        id: "p11",
        name: "Tomas Brill",
        alias: ["B-Index", "T-Index"],
        role: "Shipping allocator (mid-tier official)",
        bio:
          "Official position in shipment allocation. If he signs, cargo moves. He claims everything is ‘by the book’ — but his approvals cluster around Varo Cind’s invoice windows.",
        knownConnections: ["p6", "p10", "p12"],
        redFlags: [
          "Approvals timed right after private calls",
          "Uses a personal courier instead of official channels",
          "Has unexplained asset growth"
        ],
        credibleInfo: [
          "Could be compromised or coerced"
        ]
      },
      {
        id: "p12",
        name: "Ilex Daro",
        alias: ["Ghost-Mason", "ID-0"],
        role: "Unknown coordinator (suspected)",
        bio:
          "Name appears only in fragments: partial call-signs, ledger initials, and one witness statement. If real, this is the coordinator who understands both signals and logistics.",
        knownConnections: ["p5", "p8", "p11"],
        redFlags: [
          "Only appears as secondary references",
          "Likely uses proxies and cutouts",
          "If identified, expect rapid burn-and-run"
        ],
        credibleInfo: [
          "Highest priority to identify and attribute"
        ]
      }
    ] as Person[],
  
    locations: [
      {
        id: "l1",
        name: "Port Lysa Dock Ring",
        type: "Spaceport logistics hub",
        details:
          "A layered dock system with commercial bays, customs checkpoints, and maintenance corridors. Known for frequent schedule ‘adjustments.’",
        relevance: ["Manifest edits", "Camera gaps", "Crew swaps"]
      },
      {
        id: "l2",
        name: "The Gilded Spanner Cantina",
        type: "Port cantina",
        details:
          "Busy, loud, with private booths and a back office ledger. Staff keep tabs on who owes what.",
        relevance: ["Ledger evidence", "Information leak risk"]
      },
      {
        id: "l3",
        name: "Relay Node K-12 Maintenance Walk",
        type: "Civilian comm relay access route",
        details:
          "Maintenance access that can route diagnostic bursts. Ghost signals coincide with its ‘routine pings.’",
        relevance: ["Ghost bursts origin", "Key access suspect (Juno Hal)"]
      },
      {
        id: "l4",
        name: "Scrapline Corridor",
        type: "Remote travel lane",
        details:
          "A low-traffic corridor where transponders are swapped mid-flight and salvage claims are easy to fake.",
        relevance: ["Transport layer", "Ketta Parn route"]
      }
    ] as Location[],
  
    evidence: [
      {
        id: "e1",
        title: "Intercept A — Ghost Burst Pattern",
        type: "Signal intercept",
        summary:
          "Repeating encrypted short burst; hop pattern matches maintenance channel usage.",
        details:
          "Burst repeats every 47 minutes +/- 2 minutes. Packet framing includes a distinctive ‘double-null’ marker seen in low-rent slicer tooling. Relay logs show maintenance pings in the same window.",
        tags: ["signal", "relay", "pattern", "slicer"]
      },
      {
        id: "e2",
        title: "Cargo Manifest Diff — Bay 4",
        type: "Document diff",
        summary:
          "Last-minute manifest edits before departure; isotopes serial ranges don’t match invoice.",
        details:
          "Three departures show “medical stabilizer kits” substituted for “industrial coolant” minutes before undocking. The edits are attributed to a compliance terminal near Nira Voss’s station.",
        tags: ["manifest", "isotopes", "nira-voss"]
      },
      {
        id: "e3",
        title: "Cantina Ledger Snapshot",
        type: "Financial ledger",
        summary:
          "Micro-transfers to multiple port staff; a hidden initial ‘I.D.’ appears once.",
        details:
          "Ledger shows payments labeled ‘tips’ routed to Nira Voss and Salen Korr. One entry: ‘ID-0 / mask fee’ paid via an intermediary account.",
        tags: ["ledger", "payments", "orrin-kale", "ilex-daro"]
      },
      {
        id: "e4",
        title: "Holocam Gap Report",
        type: "Security anomaly",
        summary:
          "Camera feeds drop during key windows; same shift foreman is present.",
        details:
          "Gaps occur during Salen Korr shift blocks. Maintenance reports cite ‘power jitter’ but diagnostics show manual override events.",
        tags: ["camera", "shift", "salen-korr", "security"]
      },
      {
        id: "e5",
        title: "Transponder Registry Query Log",
        type: "System log",
        summary:
          "Unauthorized registry queries correlate with ghost bursts; signature matches Dray Meln’s tooling.",
        details:
          "Query headers include the same ‘double-null’ marker as Intercept A. Access times align with known cantina backroom terminal usage.",
        tags: ["transponder", "slicer", "dray-meln"]
      },
      {
        id: "e6",
        title: "Invoice Cluster — Varo Cind",
        type: "Invoices",
        summary:
          "Invoice windows and approvals cluster around Tomas Brill’s sign-offs.",
        details:
          "Varo Cind’s invoices are approved within 18 minutes of private calls to Tomas Brill. The invoice serials overlap with missing isotope batches.",
        tags: ["broker", "invoices", "varo-cind", "tomas-brill"]
      }
    ] as Evidence[],
  
    finalQuestions: [
      "Identify the primary facilitator (‘broker’) and justify using evidence IDs.",
      "Name two key enablers inside the legitimate layer and cite evidence.",
      "Which individual most likely controls the ghost signal routing, and why?",
      "Map the contact chain: list at least 6 people in order of probable operational dependency.",
      "What is the most likely objective of the operation? (What are they building/doing?)",
      "Which location is the next likely transfer point and what time window do you predict?",
      "Which single piece of evidence is the highest OPSEC risk (leak potential) and how do you mitigate it?",
      "Propose an interdiction plan: surveillance, attribution, arrest/turn strategy, and containment."
    ]
  };
  