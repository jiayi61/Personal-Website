// Everything on the map lives here. Edit freely.
// Nodes are fields. Edges are the things built between two fields.
// dashed: true  -> an edge (or node) not built yet.

window.SITE = {
  nodes: [
    {
      id: "math", label: "Math",
      blurb: "Where it started. Olympiad problems taught me to sit with something hard until it gives.",
      items: [
        { t: "USAMO qualifier", d: "Qualified for the USA Mathematical Olympiad." },
        { t: "Stanford University Mathematics Camp", d: "Summer program in proof-based math." },
        { t: "Solar physics research", d: "Published research in solar physics in high school." }
      ]
    },
    {
      id: "markets", label: "Markets",
      blurb: "Markets are where math meets real decisions with real consequences, which is exactly what I like.",
      items: [
        { t: "Jane Street, First-Year Trading & Technology Program", d: "Selected participant." },
        { t: "Huatai Zijin Investment", d: "Equity research intern." },
        { t: "Bloomberg Global Trading Challenge", when: "Fall 2026", d: "Covering the earnings names for my team." },
        { t: "Dodge & Cox Stock Pitch Competition", when: "Fall 2026", d: "A three-to-five-year long-only pitch with my team." }
      ]
    },
    {
      id: "code", label: "Code & AI",
      blurb: "The tool I reach for to turn an idea into something people can use.",
      items: [
        { t: "Computer Science at Columbia", d: "B.S. in CS with a minor in Operations Research, class of 2029." },
        { t: "How I build", d: "I think a design through with AI until it is sharp, then build it with coding agents." }
      ]
    },
    {
      id: "medicine", label: "Medicine",
      blurb: "Most of what I care about building points back here. Every line into this circle is something I made for patients or doctors.",
      items: [
        { t: "Next idea: prescribing by price", when: "not built yet", d: "A doctor enters a diagnosis and sees the most effective option that insurance actually covers." }
      ]
    },
    {
      id: "product", label: "Product",
      blurb: "I start from a pain point I have actually felt, then ask who has already built it and what is still missing.",
      items: [
        { t: "Company case challenges", d: "XPeng's physical-AI challenge (an anti-motion-sickness system with a priority layer: stay quiet when you are working, brake first when it is dangerous) and WeRide's robotaxi operations challenge." }
      ]
    },
    {
      id: "people", label: "People",
      blurb: "Clubs, friends, patients. I like being the person who organizes the dinner.",
      items: [
        { t: "Columbia Chinese Debate Society", d: "First speaker." },
        { t: "Rice University", when: "2025 to 2026", d: "Spent my first year in Rice's residential college system before transferring." }
      ]
    },
    {
      id: "robots", label: "Robots", dashed: true,
      blurb: "The other field I haven't built in yet. I think the next useful thing for patients has a body, not just a screen.",
      items: []
    },
    {
      id: "education", label: "Education", dashed: true,
      blurb: "The field I keep coming back to and haven't built in yet. I want to know what open models do to how people learn.",
      items: []
    }
  ],

  edges: [
    {
      id: "math-markets", a: "math", b: "markets", label: "trading games",
      intro: "Probability, calibration and expected value, played for points.",
      items: [
        { t: "1st place, Citadel | Citadel Securities Trading Challenge", when: "Oct 2026", d: "Our team won the trading competition Citadel ran at Columbia." },
        { t: "1st Widget Factory, 2nd Estimathon", d: "Won on probabilistic reasoning, calibration and EV, not on speed." }
      ]
    },
    {
      id: "math-code", a: "math", b: "code", label: "ICPC",
      intro: "Competitive programming, where the math has to run.",
      items: [
        { t: "ICPC South Central Regional, Division II champion", d: "I was the team's strategist: picking problem order, splitting work, deciding when to abandon a line." }
      ]
    },
    {
      id: "markets-code", a: "markets", b: "code", label: "bots & engines",
      intro: "Writing the model instead of borrowing someone else's.",
      items: [
        { t: "Jump Trading Probability Cup", d: "Instead of taking other people's forecasts as inputs, I modeled every team and player Moneyball-style and wrote a bot to submit automatically." },
        { t: "C++ order book and matching engine", when: "in progress", d: "A limit order book from scratch." }
      ]
    },
    {
      id: "medicine-product", a: "medicine", b: "product", label: "hemophilia app",
      intro: "A follow-up system for people living with hemophilia.",
      items: [
        { t: "Hemophilia follow-up mini program", when: "2026", d: "With Nanjing Drum Tower Hospital. Patients scan a code to report symptoms and quality of life on standard scales (HAQ, Haem-A-QoL); doctors log factor VIII, inhibitor and joint ultrasound results every three months and manage who can see what." }
      ]
    },
    {
      id: "medicine-code", a: "medicine", b: "code", label: "MRI × AI",
      intro: "Can a model read treatment response off an MRI?",
      items: [
        { t: "AI on breast cancer MRI", d: "Research on a private ADC-MRI dataset predicting response to neoadjuvant chemotherapy. Two papers submitted: a methods paper on bias in repeated cross-validation, and a review of MRI + AI for NAC response." }
      ]
    },
    {
      id: "math-medicine", a: "math", b: "medicine", label: "药安知 dosing", short: "药安知",
      intro: "Medication safety, worked out as an optimization problem.",
      items: [
        { t: "Yao'anzhi 药安知", d: "Checks whether Chinese and Western medicines conflict, for older and rural patients, and computes an optimal schedule for when to take each. Built with four Nanjing University students for the Internet+ innovation competition." },
        { t: "Public-health proposals", d: "Mathematical models behind proposals for hemophilia care." }
      ]
    },
    {
      id: "people-medicine", a: "people", b: "medicine", label: "5 years with patients", short: "patients", bend: { tall: 0 },
      intro: "Before any software, there was listening.",
      items: [
        { t: "Supporting people with hemophilia", when: "5+ years", d: "Listening to patients and their families, and building tools that make it easier for patients and doctors to talk." }
      ]
    },
    {
      id: "product-people", a: "product", b: "people", label: "cat club & gifts",
      intro: "Small things for people I know.",
      items: [
        { t: "南师附中猫协 website", d: "A site for my high school's cat association, with a timeline rebuilt from years of old photos, plus a small ledger app so everyone can see where the cat food money goes." },
        { t: "Gift-matching app", d: "Born from picking gifts my friends didn't love. The giver and receiver each fill in a short questionnaire and the app finds the overlap. I built a demo for a VC pitch." }
      ]
    },
    {
      id: "code-product", a: "code", b: "product", label: "hackathons", bend: { tall: 0 },
      intro: "Weekends spent shipping something end to end.",
      items: [
        { t: "StreamWell", d: "IEEE OneAquaHealth Global Hackathon, team of three." },
        { t: "HeatShield", d: "Rice World Cup Hack. Designed to outlive one tournament." },
        { t: "x-minute city", d: "Rice urban sustainability hackathon. I set direction as PM, then did the data work and the final presentation." }
      ]
    },

    // Not built yet
    {
      id: "education-code", a: "education", b: "code", label: "AI & learning", dashed: true,
      intro: "Not built yet.",
      items: [{ t: "An open question", d: "What happens to tools like Duolingo when anyone can run a capable model for free?" }]
    },
    {
      id: "education-product", a: "education", b: "product", label: "a museum at home", dashed: true,
      intro: "Not built yet.",
      items: [{ t: "AI-curated exhibitions", d: "Museum guides tell you who painted it. I want an AI that curates a whole story for you, at home, no VR." }]
    },
    {
      id: "robots-people", a: "robots", b: "people", label: "care at home", dashed: true,
      intro: "Not built yet.",
      items: [{ t: "Embodied AI for care", d: "Software alone can't help someone out of bed. I want robots that help patients, older people, and anyone buried in chores." }]
    },
    {
      id: "robots-product", a: "robots", b: "product", label: "how robots ship", dashed: true,
      intro: "Not built yet.",
      items: [{ t: "Product for physical AI", d: "What I want to learn next: how robotics and AI companies decide what to build, when the product has a body." }]
    }
  ],

  // Positions as fractions of the map. "wide" for landscape, "tall" for phones.
  // The solid lines form a strip of triangles, so two zigzag rows never cross.
  layout: {
    wide: {
      math: [0.20, 0.14], medicine: [0.56, 0.10], people: [0.93, 0.26],
      markets: [0.02, 0.60], code: [0.37, 0.60], product: [0.73, 0.62],
      education: [0.52, 0.96], robots: [0.97, 0.90]
    },
    tall: {
      markets: [0.50, 0.03], math: [1.00, 0.14], code: [0.50, 0.28],
      medicine: [1.00, 0.44], product: [0.50, 0.60], people: [1.00, 0.76],
      education: [0.00, 0.44], robots: [0.42, 0.96]
    }
  }
};
