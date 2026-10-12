import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = getFirestore();

const blogsData = [
  {
    title: "Beyond the Classroom: How Campus Innovation Turns Ideas into Action",
    slug: "beyond-the-classroom-campus-innovation",
    author: "E-Cell DYPIU",
    category: "Innovation",
    readTime: "6 min read",
    tags: ["Campus Innovation", "E-Cell", "Ideation", "Student Startups", "DYPIU"],
    date: "September 30, 2025",
    excerpt: "Theoretical knowledge is just the foundation. Discover how university ecosystems—through rapid hackathons, state-of-the-art incubation labs, and multidisciplinary culture—transform lecture hall concepts into viable, real-world ventures.",
    content: `Universities have traditionally been celebrated as sanctuaries of academic study, where textbooks dictate intellectual curiosity and semester examinations benchmark achievement. Yet today, higher education is witnessing a monumental transformation. Modern campuses are no longer quiet halls of abstract theory—they are vibrant launchpads where bold ideas collide with urgent, real-world problems. The journey from a scribbled note in a midnight study session to an incorporated enterprise is arduous, but campus innovation ecosystems are actively rewriting the playbook of what undergraduate builders can achieve.

The Catalyst of High-Intensity Hackathons and Proving Grounds

National challenges such as the Smart India Hackathon and university-wide pitch marathons serve as the ultimate crucible for young innovators. When students are thrust into an intense 24 to 48-hour sprint, the traditional safety nets of academic routine dissolve. In these high-stakes environments, teams are not merely writing lines of code or tinkering with circuit boards; they are mastering the fundamental mechanics of execution under extreme constraints. They learn how to prioritize product backlogs, navigate rapid feature trade-offs, and pivot gracefully when their primary architecture fails under stress. Most importantly, hackathons teach founders how to pitch a compelling value proposition to discerning industry judges under unforgiving countdown timers—a vital simulation of true startup fundraising.

Bridging the Chasm from Formula to Minimum Viable Product

Innovation inevitably stagnates when young builders lack access to practical infrastructure. An idea remains an intellectual curiosity until it is subjected to hands-on experimentation. Through dedicated entrepreneurship cells and university incubation centers, students gain access to vital resources that would otherwise carry prohibitive capital costs. Cloud compute credits, developer APIs, rapid 3D prototyping hardware, and Internet of Things testbeds allow student teams to build, measure, and learn at unprecedented speed. By reducing the cost of iteration, universities empower students to fail cheaply and iterate relentlessly, compressing months of traditional product development into focused weekly cycles that yield genuine Minimum Viable Products (MVPs).

Leveraging the Campus Microcosm as a Living Laboratory

One of the most potent advantages available to a student founder is the physical campus itself. A university campus represents a hyper-dense, demographics-rich microcosm of modern society. Where else can an early-stage startup find five thousand potential early adopters living within walking distance? Whether testing a campus delivery service, validating an AI-powered study companion, or deploying an IoT sensor network across academic buildings, student teams have instant access to immediate, unfiltered feedback. This localized testing ground enables teams to refine their user experience, establish early retention metrics, and eliminate friction points before ever presenting their solution to external angel investors or corporate partners.

Fostering an Unforgiving Culture of Action

A thriving campus ecosystem does far more than coordinate periodic workshops and guest lectures. Its true mission is cultivating a resilient builder mindset. By surrounding aspiring entrepreneurs with ambitious peers, accessible faculty advisors, and experienced alumni who have walked the venture path, university life normalizes calculated risk-taking. Failure is stripped of its academic stigma and recast as essential data for the next iteration. Ideas are challenged, refined through peer critique, and methodically transformed into scalable business models equipped to endure the pressures of the modern commercial market.

The Road Ahead for Aspiring Campus Builders

If you are currently sitting in a lecture hall harbouring an unproven concept, recognize that the best time to build is right now. You possess the rarest combination of startup assets: high intellectual freedom, low overheads, and access to world-class mentors who genuinely want to see you succeed. Take the initiative to step beyond passive coursework. Join an ideation cohort, partner with a technical or design peer, and walk into the E-Cell DYPIU incubator. The future does not belong to those who merely analyze problems—it belongs to the builders who transform ideas into action.`
  },
  {
    title: "From Campus to Startup: The Making of a Student Entrepreneur",
    slug: "campus-to-startup-student-entrepreneur",
    author: "E-Cell DYPIU",
    category: "Entrepreneurship",
    readTime: "7 min read",
    tags: ["Entrepreneurship", "Student Founders", "Startup Journey", "Leadership", "Ecosystem"],
    date: "October 2, 2025",
    excerpt: "Transitioning from student to founder demands a radical shift from predictable syllabi to extreme market ambiguity. Explore the essential mental models, strategic trade-offs, and unfair advantages of building a venture in college.",
    content: `Choosing to build a venture while in university is an inherently divergent life choice. While the overwhelming majority of your peers are polishing resumes, solving standard coding interview questions, and anticipating scheduled campus placement cycles, the student founder is operating on an entirely different timeline. They are drafting financial projections, conducting customer discovery interviews between classes, and attempting to assemble an A-player team with zero capital. It is an exhilarating, exhausting journey that demands an emotional and intellectual metamorphosis.

The Essential Mindset Leap: Embracing the Gray Area

The most daunting hurdle facing an undergraduate founder is unlearning the cognitive conditioning of conventional schooling. From primary school through higher education, students are rewarded for operating within deterministic systems: transparent grading rubrics, predictable semester deadlines, and predefined solutions found in the back of the book. Entrepreneurship exists entirely in the domain of ambiguity. The market offers no syllabus for achieving product-market fit, no partial credit for well-intentioned effort, and customer rejections rarely come with diagnostic feedback. Transitioning from seeking permission to taking radical ownership is the foundational milestone in the making of any serious student founder.

Unlocking the Student Advantage: The Unfair Campus Leverage

While juggling coursework and a fledgling company is notoriously demanding, being a student confers a distinctive, often underestimated superpower: the student card. The marketplace is overwhelmingly willing to support young, hungry innovators. Senior industry leaders, C-suite executives, and seasoned angel investors who routinely decline cold pitches from professional sales reps will gladly reply to a polite, respectful email from an ambitious student asking for fifteen minutes of guidance. Furthermore, college life affords an exceptionally low personal burn rate. With housing and basic needs already managed, student founders can afford to take moonshot risks that mid-career professionals burdened with mortgages and family responsibilities simply cannot stomach.

The Delicate Art of High-Leverage Time Allocation

One of the most persistent myths surrounding campus entrepreneurship is that you must completely sacrifice your degree or drop out to make an impact. In reality, the most successful student entrepreneurs master ruthless prioritization. They view their calendar through the lens of leverage. They learn to automate mundane tasks, coordinate sprint retrospectives during lunch breaks, and maintain disciplined boundaries between academic responsibilities and startup development. By treating university projects as testbeds for their venture's core technology, savvy founders turn their coursework into a direct engine of commercial research and development.

Rallying Talent on a Zero Budget

Building a team when you cannot yet offer competitive salaries or institutional prestige requires an extraordinary level of leadership empathy. Student founders must become master storytellers. They cannot hire employees; they must recruit believers. To convince a brilliant computer science classmate or a gifted designer to spend their weekends architecting databases instead of relaxing, the founder must articulate an irresistible mission and demonstrate undeniable personal commitment. This crucible of volunteer leadership teaches young founders the art of authentic culture building long before they ever manage a corporate payroll department.

Cultivating Resilience in the Face of Relentless Friction

The defining attribute that separates fleeting hobbyists from enduring founders is emotional resilience. A student founder must endure a gauntlet of micro-failures: the harsh silence of ignored investor emails, the panic of a major production bug forty-eight hours before midterms, and the skepticism of well-meaning peers who advise them to take the safe corporate path. The founders who succeed in turning campus prototypes into legally incorporated, venture-backed companies are those who interpret this friction as the necessary resistance training required to forge an unshakeable commercial acumen.

Stepping Forward into the Arena

Every world-changing venture began as an audacious hypothesis championed by someone who refused to accept the world as it was. If you are standing at the edge of the entrepreneurial precipice, embrace the challenge. Seek out co-founders whose skills complement your weaknesses, immerse yourself in the E-Cell DYPIU community, and start shipping. The experience of building something from nothing will define your career far more profoundly than any standard lecture ever could.`
  },
  {
    title: "Innovation Has No Department: The Power of Interdisciplinary Collaboration",
    slug: "innovation-no-department-interdisciplinary",
    author: "E-Cell DYPIU",
    category: "Innovation",
    readTime: "7 min read",
    tags: ["Collaboration", "Diversity", "Team Building", "Ideation", "Tech and Business"],
    date: "October 5, 2025",
    excerpt: "The world's most enduring startups are never built by monocultures. Discover why pairing engineering architecture, intuitive design empathy, and business strategy is the definitive catalyst for breakthrough campus ventures.",
    content: `Academic departmentalization is one of the most persistent barriers to modern breakthrough innovation. On almost every university campus, an invisible wall separates the schools of engineering, design, and management. Computer science students congregate in software labs, design students critique aesthetics in studios, and business students debate balance sheets in seminar rooms. Yet out in the commercial market, problems do not present themselves neatly categorized by academic discipline. Meaningful challenges are chaotic, systemic, and multifaceted—and solving them requires tearing down the silos that keep brilliant minds apart.

The Fatal Pitfall of the Intellectual Monoculture

When teams are formed entirely of individuals from identical educational backgrounds, blind spots inevitably compound. An all-developer team will frequently engineer an astonishingly sophisticated technical architecture, only to discover that no living user can comprehend the onboarding flow, and no viable business model exists to monetize the servers. Conversely, an all-business team will draft a ninety-page venture deck with flawless financial projections, yet remain completely incapable of building a stable prototype or validating their core technical assumptions. Monocultures generate echo chambers; diverse teams generate healthy friction, strategic clarity, and enduring value.

The Golden Triangle: Hacker, Hipster, and Hustler

In the venture capital world, early-stage founding teams are frequently benchmarked against the timeless archetype of the Golden Triangle: the Hacker, the Hipster, and the Hustler. The Hacker brings technical craftsmanship, architectural rigor, and the engineering capacity to turn concepts into functional reality. The Hipster injects human-centered design, deep user empathy, intuitive interfaces, and emotional resonance into the product. The Hustler brings commercial strategy, distribution channels, customer discovery, unit economics, and operational momentum. When these three archetypes unite under a shared campus vision, their complementary perspectives neutralize individual blind spots and accelerate product velocity exponentially.

Case Studies from the Proving Grounds

Look closely at the teams that consistently dominate prestigious national hackathons, from the Smart India Hackathon to global venture challenges. They are almost never homogenous groups of solo programmers. The winning submissions inevitably combine robust algorithms with seamless UI/UX design, underpinned by a compelling presentation that clearly communicates total addressable market, pricing models, and societal impact. Judges are not merely grading code lines; they are assessing product viability. An interdisciplinary team solves the entire equation from day one, rather than attempting to tack on business strategy as an afterthought.

How Campus Ecosystems Break the Silos

Universities must take proactive institutional responsibility for fostering spontaneous collisions between disparate departments. Entrepreneurship cells, such as E-Cell DYPIU, act as the vital connective tissue across campus faculties. By organizing cross-department mixer nights, interdisciplinary ideation sprints, and collaborative design jams, E-Cell creates an open sandbox where an aspiring AI engineer can meet a gifted product designer and a sharp finance strategist over coffee. These informal interactions dissolve departmental tribalism and plant the seeds for future high-growth enterprises.

Tactical Advice for Building Your Cross-Functional Roster

If you are currently ideating on a venture, resist the comfortable temptation to recruit exclusively from your immediate circle of classmates. Force yourself to venture across campus. Visit design exhibitions, attend management forums, and seek out individuals whose skill sets make you feel delightfully inadequate. Establish transparent communication protocols early, align on equity and milestone expectations, and foster a team culture that celebrates distinct perspectives. Innovation does not belong to any single department—it belongs to those who possess the courage to bridge them.`
  },
  {
    title: "Mentorship Matters: Turning Student Ideas into Scalable Solutions",
    slug: "mentorship-matters-scalable-solutions",
    author: "E-Cell DYPIU",
    category: "Insights",
    readTime: "7 min read",
    tags: ["Mentorship", "Growth", "Networking", "Startup Advice", "Scaling"],
    date: "October 8, 2025",
    excerpt: "Raw energy and technical mastery will only get you to the starting line. Learn why seasoned mentors act as the vital bridge between a working classroom prototype and an economically sustainable, scalable company.",
    content: `Student founders are rarely held back by a deficiency in raw passion, technical agility, or work ethic. They are capable of coding through the night, mastering bleeding-edge software frameworks in a weekend, and exhibiting boundless enthusiasm for their visions. What young founders almost invariably lack is context—the distilled wisdom that can only be forged through years of operating in commercial markets, weathering economic downturns, and navigating complex corporate landscapes. This is where mentorship transitions from an optional luxury into the definitive catalyst of startup survival.

Dismantling the Solution Trap: Falling in Love with the Problem

One of the most universal cognitive biases among first-time student builders is falling hopelessly in love with their technical solution rather than the customer's actual pain point. A student will spend months developing a complex blockchain ledger or neural network model for a problem that could be solved with a simple spreadsheet or an automated notification. An experienced mentor serves as a necessary, dispassionate mirror. They ask the uncomfortable questions that founders instinctively avoid: Who has actually agreed to pay for this? Why hasn't an incumbent solved this already? What is the true cost of customer acquisition? By redirecting the founder's obsession back to the core human problem, mentors prevent hundreds of wasted engineering hours.

The Multiplier Effect of Curated Networks

While tactical advice is invaluable, perhaps the most immediate return on mentorship is access to social capital. As an undergraduate, your professional contact list is largely restricted to classmates and academic instructors. A seasoned mentor changes the equation overnight. A single warm introduction from an established industry veteran can bypass months of unanswered LinkedIn cold messages. Whether it is securing a paid pilot agreement with an enterprise corporation, negotiating favorable cloud hosting tiers, or opening the door to angel investors who write initial seed checks, a mentor's credibility lends instantaneous legitimacy to a fledgling student venture.

Navigating Legal, Regulatory, and Governance Pitfalls

In the early days of building on campus, students rarely consider legal nuances such as corporate structuring, intellectual property assignment, cap table hygiene, or statutory compliance. Yet innocent mistakes made during the ideation phase—such as dividing equity evenly among five casual contributors or failing to secure explicit IP assignments—can render a company entirely uninvestable eighteen months later. Mentors with operational scars serve as early-warning radar systems, guiding founders through proper incorporation practices, protecting their proprietary assets, and keeping their business compliant with industry regulations.

Institutionalizing a Mentorship Culture at E-Cell DYPIU

For a university innovation hub to generate enduring commercial ventures, it cannot leave mentorship to chance. At E-Cell DYPIU, we systematically structure relationships between promising student founders and a distinguished roster of alumni entrepreneurs, venture capitalists, and corporate leaders. Through formalized advisory cohorts, monthly office hours, and deep-dive pitch clinics, we ensure that every ambitious student has access to an experienced sounding board equipped to guide them through every phase of scale.

The Golden Rules of Engaging Startup Mentors

To maximize the value of an advisory relationship, student founders must master the art of being coachable. Respect a mentor's time by preparing concise, agenda-driven updates highlighting your specific metrics, key blockers, and clear asks. Never treat an advisory meeting as an opportunity for defensive argumentation; absorb feedback with humility, test hypotheses objectively in the market, and follow up promptly with documented outcomes. When you demonstrate extreme velocity and integrity, your mentors will willingly invest their time, energy, and networks to see you succeed.`
  },
  {
    title: "More Than a Pitch: What It Takes to Build a Viable Startup",
    slug: "more-than-a-pitch-viable-startup",
    author: "E-Cell DYPIU",
    category: "Startup",
    readTime: "8 min read",
    tags: ["Pitching", "Business Strategy", "Execution", "Viability", "Startups"],
    date: "October 12, 2025",
    excerpt: "Winning a college pitch competition and holding an oversized trophy is exhilarating, but pitch decks don't generate revenue. Understand the unglamorous execution, operational rigor, and customer validation required once the stage lights dim.",
    content: `A polished ten-slide presentation, a charismatic delivery, dynamic animations, and a well-rehearsed product demo can easily win a college entrepreneurship competition. The auditorium lights shine bright, the judges applaud your vision, and posing with an oversized cardboard check provides an intoxicating rush of dopamine. It feels, in that fleeting moment, as though you have already built a triumphant startup. But here lies the dangerous illusion: pitch competitions celebrate the art of storytelling, whereas entrepreneurship is the brutal science of operational execution. The real test of your venture begins the morning after, when the stage lights are extinguished and the silence of the market sets in.

Ideas Are Free: The Hegemony of Ruthless Execution

In the broader startup ecosystem, there exists an incontrovertible truth that every seasoned founder eventually learns: ideas are cheap, execution is everything. Thousands of people across the globe have conceived of revolutionary ideas identical to Uber, Airbnb, or Stripe long before those companies were founded. The companies that transformed industries did not win because their original concept was singularly divine; they won because their founders executed with obsessive velocity and operational rigor. Moving from a theoretical business deck to a viable enterprise requires shifting your daily energy from speculative slide editing to the unglamorous, grind-it-out reality of customer acquisition, systems engineering, and logistical fulfillment.

The Operational Engine: Navigating What Slides Omit

Pitch competitions rarely test you on the mundane, critical tasks that keep a business alive. A five-minute pitch deck does not showcase filing GST returns, drafting non-disclosure agreements, establishing corporate bank accounts, managing working capital cycles, or negotiating vendor contracts. Yet it is precisely these administrative and operational backbones that determine whether a startup survives its first fiscal year. Founders who fail to develop operational discipline quickly find themselves drowning in compliance chaos and cash flow bottlenecks, regardless of how visionary their original product concept appeared on stage.

The Hundred-Customer Reality Check

True product validation never comes from a panel of academic judges awarding you first place. Real validation is messy, quantitative, and indisputable: it is the sound of an actual customer handing over their hard-earned money in exchange for your product. Once your competition concludes, your immediate priority must be getting out of the university building. Talk directly to one hundred prospective customers. Listen intently to their criticisms, observe how they interact with your raw prototype, and measure their willingness to pay. A student team that secures ten paying pilot customers with a crude, buggy product is ten times more valuable than a team with a gorgeous Figma mockup and zero commercial transactions.

Surviving the Trough of Sorrow and Team Attrition

Nearly every student startup encounters what industry veterans call the Trough of Sorrow. This is the grueling valley that lies between initial launch euphoria and sustainable product-market fit. During this period, growth is agonizingly slow, bugs are plentiful, and the initial romantic excitement of being a co-founder begins to wear off. It is during this valley that fair-weather team members drop out to return to comfortable academic routines. The founders who navigate this phase are those who maintain an unshakeable belief in their mission, foster internal accountability, and cultivate a culture of relentless incremental progress.

The Incubation Ecosystem: Your Operational Co-Pilot

Building a viable enterprise while navigating university coursework does not have to be a solitary battle. At E-Cell DYPIU, our incubation initiatives are designed explicitly to support founders during the critical post-pitch execution phase. We provide dedicated co-working facilities, legal advisory partnerships, seed micro-grants, and structured milestone reviews to ensure that stage-winning concepts evolve into economically resilient enterprises. If you have an idea that has survived the competition circuit, step forward and partner with our incubation cohort. Stop pitching your dream, and start building your legacy.`
  },
  {
    title: "From Ideas to Impact: A Recap of the SIH 2026 Internal Hackathon at DYPIU",
    slug: "from-ideas-to-impact-sih-2026-internal-hackathon-dypiu",
    author: "E-Cell DYPIU",
    category: "Events",
    readTime: "6 min read",
    tags: ["SIH", "Smart India Hackathon", "Hackathon", "Innovation", "Entrepreneurship", "Startups", "DYPIU", "E-Cell"],
    date: "September 28, 2026",
    excerpt: "Over 180 teams, intense defense rounds, and a 20-member industry jury: here is the complete recap of the high-octane SIH 2026 Internal Hackathon hosted by CIIE, E-Cell, and IIC at DYPIU.",
    images: ["/SIH.png"],
    content: `On 26th and 27th September 2026, the campus of D. Y. Patil International University (DYPIU) transformed into a high-energy arena where bold ideas collided with real-world problems. The Smart India Hackathon (SIH) 2026 Internal Rounds, organized collaboratively by the Centre for Industry Interaction and Entrepreneurship (CIIE), E-Cell DYPIU, and the Institution's Innovation Council (IIC), brought together 180+ teams across the Shantai Auditorium and the 6th floor of J-Block. Every participant was driven by a single ambition: securing a coveted place on the national stage. It was not just about presenting an idea; it was about proving that the idea could withstand the scrutiny of industry-grade interrogation.

The Inaugural Address and Industry Keynote

The two-day marathon commenced with an inaugural ceremony graced by Dr. (Prof.) Manish Bhalla, Vice Chancellor of DYPIU, and Prof. Yogesh D. Brahmankar, Advisor at CIIE. Both emphasized the pivotal role of student-led innovation in driving national technological self-reliance. A standout highlight of the morning was the keynote address delivered by the Guest of Honor, Mr. Amit Agrahari of Philips. Drawing on his rich background in AI/ML and innovation product management, Mr. Agrahari brought an invaluable industry lens to the room, challenging student builders to ground their technical ingenuity in genuine user empathy. Following the keynote, Dr. Sandhya Ingale, Assistant Director at CIIE, officially declared the hackathon open, and the intense pitching rounds began.

The Gauntlet of the Twenty-Member Jury

What followed was a demanding marathon of pitches and probing questions. Participants did not merely present theoretical solutions; they defended their architectures, codebases, hardware prototypes, and business feasibility before a distinguished 20-member jury comprised of senior academics, seasoned industry professionals, and domain experts. The evaluators critically weighed every submission on novelty, technical feasibility, operational sustainability, and long-term societal impact. Student teams faced sharp, constructive questioning that forced them to think beyond standard hackathon prototypes and consider real-world deployment challenges.

The Unsung Heroes: E-Cell DYPIU Volunteers

Behind the scenes, the student volunteers of E-Cell DYPIU kept the massive event moving with precision. From multi-track venue management across two major university locations to hospitality for visiting dignitaries, audio-visual technical support, and seamless jury logistics, the organizing team worked round-the-clock to ensure every single team had its rightful moment to shine on stage.

Celebrating the Winners: Hardware and Software Standouts

When the final evaluation rounds concluded, the results spoke for themselves, highlighting the immense depth of talent at DYPIU. In the Hardware category, Team HexaTech claimed 1st place with their standout embedded prototype, followed by Team Yantrix in 2nd place and Team SonarX in 3rd place. In the Software category, Team Hashira led the pack with an exceptional software solution to take 1st place, followed closely by Team VoidX in 2nd place and Team Fraq’D in 3rd place. The valedictory ceremony at the Shantai Auditorium honored the jury and celebrated the winning teams amidst roaring applause.

Carrying the DYPIU Name to the National Stage

While the internal round has concluded, for DYPIU’s innovators, this is only the beginning. The top 100 teams will now proudly carry the DYPIU name forward to the national level of the Smart India Hackathon. With ongoing guidance from CIIE and incubation mentorship from E-Cell DYPIU, these teams are gearing up to represent the university with pride and prove their mettle against the best young minds across India.`
  }
];

async function uploadBlogs() {
  console.log('🚀 Starting dynamic blog upload to Firestore...');
  
  for (const blog of blogsData) {
    try {
      // Check if a document with this slug already exists
      const existing = await db.collection('BLOGS').where('slug', '==', blog.slug).get();
      
      const payload = {
        title: blog.title,
        slug: blog.slug,
        excerpt: blog.excerpt,
        content: blog.content,
        author: blog.author,
        category: blog.category,
        readTime: blog.readTime,
        tags: blog.tags,
        images: blog.images || [],
        date: blog.date,
        updatedAt: Timestamp.now(),
        published: true,
      };

      if (!existing.empty) {
        const docId = existing.docs[0].id;
        await db.collection('BLOGS').doc(docId).update(payload);
        console.log(`✅ Updated existing blog [${blog.slug}] (ID: ${docId})`);
      } else {
        payload.createdAt = Timestamp.now();
        const docRef = await db.collection('BLOGS').add(payload);
        console.log(`✅ Created new blog [${blog.slug}] (ID: ${docRef.id})`);
      }
    } catch (err) {
      console.error(`❌ Error uploading blog [${blog.slug}]:`, err.message);
    }
  }

  console.log('🎉 All blogs processed successfully!');
}

uploadBlogs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
