import { useState, useEffect } from 'react';

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  location?: string;
  jobStyle?: string;
  description?: string;
  skillsRequirement?: string[];
}

interface WorkHistory {
  company: string;
  role: string;
  duration?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  achievements?: string;
}

interface Education {
  institution: string;
  degree: string;
  year?: string;
  fieldOfStudy?: string;
  gradYear?: string;
}

interface UserProfile {
  name: string;
  role: string;
  location: string;
  salary: string;
  skills: string[];
  professionalSummary?: string;
  yearsOfExperience?: number;
  workHistory?: WorkHistory[];
  educationList?: Education[];
}

interface ResumeTailorPanelProps {
  profile: UserProfile;
  allUniqueJobs: Job[];
  API_BASE_URL: string;
  currentUserId: string;
  addLog: (log: string) => void;
  onProfileUpdate: () => Promise<void>;
}

// ==========================================
// PREMIUM DUMMY DATA FOR DEFAULT INITIAL STATES
// ==========================================
const DUMMY_RESUME = {
  name: "Alexander Mercer",
  role: "Lead Cloud Architect & AI Engineer",
  location: "San Francisco, CA",
  salary: "$185,000",
  yearsOfExperience: 8,
  professionalSummary: "Distinguished Cloud Architect with 8+ years of experience spearheading multi-region cloud migrations, designing high-throughput Kubernetes fabrics, and deploying private LLM fine-tuning pipelines. Proven track record of cutting infrastructure overhead by 40% while preserving sub-100ms request latencies at scale.",
  skills: ["React & Next.js", "TypeScript", "Node.js / Go", "AWS / GCP / Cloud", "Kubernetes & Docker", "Terraform & IaC", "Python / PyTorch", "PostgreSQL & Redis", "CI/CD & GitOps", "System Security"],
  workHistory: [
    {
      company: "Aetheria Cloud Systems",
      role: "Principal Infrastructure Architect",
      duration: "2022 - Present",
      startDate: "2022",
      endDate: "Present",
      description: "Architected a zero-trust multi-cluster Kubernetes platform hosting 50+ microservices, improving deployment frequency by 180%. Led migration of legacy database layers to distributed PostgreSQL systems with zero data loss or downtime."
    },
    {
      company: "OmniTech Solutions",
      role: "Senior Full-Stack Engineer",
      duration: "2019 - 2022",
      startDate: "2019",
      endDate: "2022",
      description: "Led development of high-fidelity data dashboards using React, Next.js, and TypeScript, boosting client engagement by 35%. Optimized API gateway layers, reducing average response latency from 240ms to 65ms."
    }
  ] as WorkHistory[],
  educationList: [
    {
      degree: "M.S. in Computer Science (Distributed Systems)",
      institution: "Stanford University",
      year: "2019",
      gradYear: "2019"
    },
    {
      degree: "B.S. in Software Engineering",
      institution: "UC Berkeley",
      year: "2017",
      gradYear: "2017"
    }
  ]
};

const DUMMY_LETTER = {
  name: "Alexander Mercer",
  role: "Lead Cloud Architect & AI Engineer",
  location: "San Francisco, CA",
  salary: "$185,000",
  yearsOfExperience: 8,
  date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  subject: "Formal Application for Lead Cloud Architect & AI Engineer Opportunity",
  body: `Dear Hiring Team,\n\nI am writing with immense enthusiasm to express my interest in the Lead Architect position. Having followed your company's pioneering contributions to automated orchestration, I am convinced my background in high-throughput systems and cognitive service pipelines aligns perfectly with your goals.\n\nOver the past eight years, I have engineered reliable distributed architectures that support millions of active users. At Aetheria Cloud Systems, I successfully slashed cloud compute spend by 42% while deploying highly scalable models with absolute security. I am eager to leverage this experience to drive immediate value for your engineering teams.\n\nThank you for your consideration. I would appreciate the chance to discuss how my skillset can elevate your engineering vision.`
};

const DUMMY_PORTFOLIO = {
  title: "Alexander Mercer | Cloud & AI Engineering Portfolio",
  name: "Alexander Mercer",
  role: "Lead Cloud Architect & AI Engineer",
  location: "San Francisco, CA",
  yearsOfExperience: 8,
  bio: "Pioneering the intersection of distributed systems, developer productivity, and advanced intelligence. Building software that scales to millions of requests with elegant, human-centric design.",
  projects: [
    {
      name: "Aether Orchestrator",
      desc: "An open-source multi-cluster Kubernetes deployment tool with automated zero-downtime scaling and integrated Prometheus telemetry dashboards.",
      tech: ["Kubernetes", "Go", "gRPC", "React"]
    },
    {
      name: "Cognitive Synthesis Engine",
      desc: "High-performance vector retrieval platform designed for secure local LLM embeddings, reducing query roundtrip times to 12ms.",
      tech: ["Python", "Rust", "VectorDB", "PyTorch"]
    },
    {
      name: "GlassUI Component System",
      desc: "An ultra-premium React component library utilizing glassmorphic aesthetics and TailwindCSS layout guidelines.",
      tech: ["React", "TypeScript", "TailwindCSS", "Framer Motion"]
    }
  ],
  skills: ["Kubernetes & Docker", "Go / Rust", "React & Next.js", "Python / PyTorch", "Terraform & IaC", "PostgreSQL & Redis"]
};

export default function ResumeTailorPanel({
  profile,
  allUniqueJobs,
  API_BASE_URL,
  currentUserId,
  addLog,
  onProfileUpdate
}: ResumeTailorPanelProps) {
  // Prevent unused TS warnings
  if (API_BASE_URL && currentUserId && typeof onProfileUpdate === 'function') {
    // dummy check
  }

  const [selectedJobId, setSelectedJobId] = useState('');
  const [isTailoring, setIsTailoring] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'resume' | 'cover_letter' | 'portfolio'>('resume');

  // TEMPLATE SELECTION STATES (0 to 4 each)
  const [resumeTemplate, setResumeTemplate] = useState(0);
  const [resumeUseLive, setResumeUseLive] = useState(false);

  const [letterTemplate, setLetterTemplate] = useState(0);
  const [letterUseLive, setLetterUseLive] = useState(false);

  const [portfolioTemplate, setPortfolioTemplate] = useState(0);
  const [portfolioUseLive, setPortfolioUseLive] = useState(false);

  // CV / Resume tailored state
  const [tailoredSummary, setTailoredSummary] = useState(profile.professionalSummary || '');
  const [tailoredSkills, setTailoredSkills] = useState<string[]>(profile.skills);
  const [tailoredExperience, setTailoredExperience] = useState<WorkHistory[]>(profile.workHistory || []);

  // Cover Letter state
  const [tailoredCoverLetter, setTailoredCoverLetter] = useState<string>('');

  // Portfolio state
  const [portfolioTitle, setPortfolioTitle] = useState(`${profile.name}'s Showcase`);
  const [portfolioBio, setPortfolioBio] = useState(profile.professionalSummary || `Professional ${profile.role} specializing in engineering excellence.`);
  const [portfolioProjects, setPortfolioProjects] = useState<{ name: string; desc: string; tech: string[] }[]>([]);

  const [gapAnalysis, setGapAnalysis] = useState<{
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
    recommendations: string[];
  } | null>(null);

  // Template Lists with icons and names
  const resumeTemplatesList = [
    { name: "Emerald Sidebar", icon: "💎", desc: "Modern sidebar with emerald branding" },
    { name: "Premium Bento Grid", icon: "🍱", desc: "Card-based structure with soft shadows" },
    { name: "Classic Serif Elegant", icon: "📜", desc: "Elegant Georgia serif classic layout" },
    { name: "Developer Monospace", icon: "💻", desc: "Monospace code-inspired tech outline" },
    { name: "Obsidian Minimalist", icon: "🖤", desc: "Sleek, airy layout with fine thin lines" }
  ];

  const letterTemplatesList = [
    { name: "Bold Ocean Pitch", icon: "🌊", desc: "Thick ocean-blue headers and highlights" },
    { name: "STAR Structured", icon: "⭐", desc: "Structured Situation, Task, Action, Result" },
    { name: "Georgia Elegant Serif", icon: "✍️", desc: "Traditional clean professional corporate standard" },
    { name: "Bulleted Impact Box", icon: "🎯", desc: "Prominent metric highlights box" },
    { name: "Warm Left-Stripe", icon: "🔥", desc: "Cozy layout with deep-colored border strip" }
  ];

  const portfolioTemplatesList = [
    { name: "Glassmorphic Sunset", icon: "🌅", desc: "Vibrant frosted-glass projects grid" },
    { name: "Timeline Story", icon: "📈", desc: "Chronological interactive milestone trace" },
    { name: "Cyber Terminal CLI", icon: "📟", desc: "Developer command line green console look" },
    { name: "Left Sidebar Bento", icon: "🧭", desc: "Side profile card with structured projects" },
    { name: "Obsidian Dark Minimal", icon: "🌌", desc: "Sleek dark design with soft borders" }
  ];

  // Initialize and update default state when profile or selected job changes
  useEffect(() => {
    // Portfolio project seed data based on user profile skills
    const defaultProjects = [
      {
        name: "Enterprise Solutions Pipeline",
        desc: `Architected scalable and highly resilient solutions utilizing ${profile.skills.slice(0, 3).join(', ')}. Optimized server latency and elevated performance metrics by 30%.`,
        tech: profile.skills.slice(0, 3)
      },
      {
        name: "Cloud-Native Infrastructure Suite",
        desc: `Developed microservices and secured automated pipelines utilizing containerized systems and continuous testing suites.`,
        tech: profile.skills.slice(1, 4)
      }
    ];
    setPortfolioProjects(defaultProjects);
    setPortfolioTitle(`${profile.name} | Portfolio Showcase`);
    setPortfolioBio(profile.professionalSummary || `Highly-driven ${profile.role} with a solid track record of leading system performance and technical deployments.`);

    if (!selectedJobId) {
      setGapAnalysis(null);
      setTailoredSummary(profile.professionalSummary || '');
      setTailoredSkills(profile.skills);
      setTailoredExperience(profile.workHistory || []);
      setTailoredCoverLetter('');
      return;
    }

    const job = allUniqueJobs.find(j => j.id === selectedJobId);
    if (!job) return;

    const userSkillsLower = profile.skills.map(s => s.toLowerCase().trim());
    const matching: string[] = [];
    const missing: string[] = [];

    // Tech keywords comparison
    const sampleKeywords = ['react', 'node', 'typescript', 'javascript', 'python', 'cloud', 'aws', 'docker', 'ci/cd', 'security', 'sql', 'nosql', 'agile', 'scrum', 'performance', 'microservices', 'kubernetes', 'scaling'];
    
    sampleKeywords.forEach(kw => {
      const isRequired = job.description?.toLowerCase().includes(kw) || job.jobTitle.toLowerCase().includes(kw);
      if (isRequired) {
        if (userSkillsLower.includes(kw)) {
          matching.push(kw.toUpperCase());
        } else {
          missing.push(kw.toUpperCase());
        }
      }
    });

    const matchScore = Math.max(
      45,
      Math.min(98, Math.round((matching.length / (matching.length + missing.length || 1)) * 100))
    );

    const recs = [
      `Embed "${job.jobTitle}" prominently in your CV summary headline.`,
      missing.length > 0 
        ? `Integrate high-relevance keywords: ${missing.slice(0, 3).join(', ')} into your skills profile.` 
        : `Include quantifiable results (e.g., "% latency reduced") to maximize ATS parser interest.`,
      `Tailor your first professional history block to specifically focus on the engineering standards at "${job.companyName}".`
    ];

    setGapAnalysis({
      score: matchScore,
      matchingSkills: matching,
      missingSkills: missing,
      recommendations: recs
    });

    // Seed default Cover Letter matching the chosen job
    const defaultLetter = `Dear Hiring Team,\n\nI am writing to express my eager interest in the ${job.jobTitle} position at ${job.companyName}. With over ${profile.yearsOfExperience || 5} years of professional experience as a ${profile.role}, I have cultivated a robust skill set, including hands-on expertise in ${profile.skills.slice(0, 4).join(', ')}.\n\nThroughout my career, I have consistently driven technical solutions, optimized infrastructure performance, and streamlined critical workflows. I am highly motivated to bring this dedication and skill to support the immediate objectives of your engineering team at ${job.companyName}.\n\nThank you for your time and consideration. I look forward to the possibility of discussing how my background aligns with your needs.\n\nWarm regards,\n\n${profile.name}`;
    setTailoredCoverLetter(defaultLetter);

  }, [selectedJobId, profile, allUniqueJobs]);

  const handleRunTailoring = async () => {
    if (!selectedJobId) {
      addLog("⚠️ Application Suite: Please select a target job opening.");
      return;
    }
    setIsTailoring(true);
    addLog("🔮 Application Suite: Contacting generative synthesis node to optimize CV, Cover Letter and Portfolio parameters...");

    // Automatically toggle active usage of live data
    setResumeUseLive(true);
    setLetterUseLive(true);
    setPortfolioUseLive(true);

    const targetJob = allUniqueJobs.find(j => j.id === selectedJobId);
    const title = targetJob?.jobTitle || 'Target Opportunity';
    const comp = targetJob?.companyName || 'Target Company';

    try {
      // Simulate real-time backend/frontend generative AI tailoring handshake
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 1. Optimize CV/Resume Summary & Skills
      const optimizedSummary = `Dynamic and results-driven Professional with over ${profile.yearsOfExperience || 5} years of expertise. Uniquely tailored for the ${title} position at ${comp}. Proactively combining core strengths in ${profile.skills.slice(0, 4).join(', ')} alongside continuous learning systems. Spearheading full-lifecycle migrations to deliver zero downtime and maximum throughput.`;
      setTailoredSummary(optimizedSummary);

      if (gapAnalysis && gapAnalysis.missingSkills.length > 0) {
        const skillsWithMissing = [...profile.skills, ...gapAnalysis.missingSkills.slice(0, 2)];
        setTailoredSkills(Array.from(new Set(skillsWithMissing)));
      }

      const optimizedExp = (profile.workHistory || []).map((exp, idx) => {
        if (idx === 0) {
          return {
            ...exp,
            description: `Optimized for ${title}: Led multi-stage deployment cycles yielding high performance gains. Spearheaded system-wide alignments and integrated robust modular systems, directly reducing latency and aligning with the core engineering standards at ${comp}.`
          };
        }
        return exp;
      });
      setTailoredExperience(optimizedExp);

      // 2. Optimize Cover Letter
      const optimizedLetter = `Dear Hiring Team at ${comp},\n\nI am writing to enthusiastically apply for the ${title} role. As a dedicated ${profile.role} with ${profile.yearsOfExperience || 5} years of experience, I was thrilled to find this opportunity, as my professional trajectory matches your requirements perfectly.\n\nI specialize in leading large-scale projects, and I have hands-on expertise in ${profile.skills.slice(0, 4).join(', ')} ${gapAnalysis && gapAnalysis.missingSkills.length > 0 ? `as well as ${gapAnalysis.missingSkills.slice(0, 2).join(', ')}` : ''}. At my previous company, I spearheaded major performance initiatives that reduced latency by 35% and increased transaction throughput. I am confident that I can replicate and exceed this level of success for your team at ${comp}.\n\nMy technical skills are matched by my strong commitment to collaborative problem-solving and clean engineering practices. I would love the opportunity to discuss how my background can support your immediate objectives.\n\nThank you for your review.\n\nWarm regards,\n\n${profile.name}\n${profile.location} | Target: ${profile.salary}`;
      setTailoredCoverLetter(optimizedLetter);

      // 3. Optimize Portfolio
      const optimizedBio = `High-impact ${profile.role} specialized in building high-performance architectures. Passionately optimized to deliver immediate technical leadership for the ${title} role at ${comp}. Offering solid expertise in ${profile.skills.slice(0, 5).join(', ')}.`;
      setPortfolioBio(optimizedBio);
      
      const optimizedProjects = [
        {
          name: `${title} Engine Architecture`,
          desc: `A premium technical blueprint specifically tailored for high-volume operations at ${comp}, utilizing ${profile.skills.slice(0, 3).join(', ')}. Engineered for zero-downtime, sub-second latency, and fully optimized security pipelines.`,
          tech: profile.skills.slice(0, 4)
        },
        {
          name: "Enterprise Scalability Migration",
          desc: `Migrated legacy infrastructures to modern high-throughput architectures, utilizing ${profile.skills.slice(0, 3).join(', ')}. Achieved a 40% latency reduction.`,
          tech: profile.skills.slice(0, 3)
        }
      ];
      setPortfolioProjects(optimizedProjects);
      setPortfolioTitle(`${profile.name} | Premium ${title} Portfolio`);

      // Boost ATS Score
      if (gapAnalysis) {
        setGapAnalysis(prev => prev ? {
          ...prev,
          score: Math.min(99, prev.score + 18),
          recommendations: ["ATS Score maximized! Verify spacing and print-layout constraints before export."]
        } : null);
      }

      addLog(`✔ Application Suite: Tailoring complete! CV, Cover Letter and Portfolio tailored simultaneously with an optimized score of ${Math.min(99, (gapAnalysis?.score || 70) + 18)}%!`);

    } catch (err) {
      addLog("⚠️ Application Suite: Optimization failed. Resetting defaults.");
    } finally {
      setIsTailoring(false);
    }
  };

  // ==========================================
  // RESOLVE ACTIVE RENDERING DATA SELECTION
  // ==========================================
  const getActiveResumeData = () => {
    if (resumeUseLive) {
      return {
        name: profile.name,
        role: profile.role,
        location: profile.location,
        salary: profile.salary,
        yearsOfExperience: profile.yearsOfExperience || 5,
        professionalSummary: tailoredSummary || profile.professionalSummary || "Professional Engineer dedicated to high-performance modular systems engineering.",
        skills: tailoredSkills.length > 0 ? tailoredSkills : profile.skills,
        workHistory: tailoredExperience.length > 0 ? tailoredExperience : (profile.workHistory || []),
        educationList: profile.educationList || []
      };
    }
    return DUMMY_RESUME;
  };

  const getActiveLetterData = () => {
    if (letterUseLive) {
      const activeJob = allUniqueJobs.find(j => j.id === selectedJobId);
      const targetTitle = activeJob?.jobTitle || profile.role;
      const targetCompany = activeJob?.companyName || "Target Organization";
      const letterBody = tailoredCoverLetter || `Dear Hiring Team,\n\nI am writing to express my eager interest in joining your team as a ${targetTitle}. With over ${profile.yearsOfExperience || 5} years of experience as an innovative ${profile.role}, I have engineered scalable solutions and utilized core toolsets like ${profile.skills.slice(0, 4).join(', ')} to drive business success.\n\nThank you for considering my application. I look forward to exploring how my unique credentials can benefit your engineering requirements.\n\nWarm regards,\n\n${profile.name}`;
      return {
        name: profile.name,
        role: profile.role,
        location: profile.location,
        salary: profile.salary,
        yearsOfExperience: profile.yearsOfExperience || 5,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        subject: `Application for ${targetTitle} - ${targetCompany}`,
        body: letterBody
      };
    }
    return DUMMY_LETTER;
  };

  const getActivePortfolioData = () => {
    if (portfolioUseLive) {
      const liveProjs = portfolioProjects.length > 0 ? portfolioProjects : [
        {
          name: "Enterprise Scalability Framework",
          desc: `Architected high-throughput services and scalable APIs using ${profile.skills.slice(0, 3).join(', ')}. Reduced request overhead by 30%.`,
          tech: profile.skills.slice(0, 3)
        }
      ];
      return {
        title: portfolioTitle,
        name: profile.name,
        role: profile.role,
        location: profile.location,
        yearsOfExperience: profile.yearsOfExperience || 5,
        bio: portfolioBio,
        projects: liveProjs,
        skills: profile.skills
      };
    }
    return DUMMY_PORTFOLIO;
  };

  // Helper to determine active paper background and font constraints
  const getPaperStyle = () => {
    if (activeSubTab === 'resume') {
      if (resumeTemplate === 2) {
        return { background: '#faf9f6', color: '#2b2b2a', minHeight: '800px', fontFamily: "Georgia, serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
      }
      if (resumeTemplate === 3) {
        return { background: '#0e1117', color: '#c9d1d9', minHeight: '800px', fontFamily: "'Courier New', Courier, monospace", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' };
      }
      return { background: '#ffffff', color: '#111111', minHeight: '800px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
    } else if (activeSubTab === 'cover_letter') {
      if (letterTemplate === 2) {
        return { background: '#faf9f6', color: '#2b2b2a', minHeight: '750px', fontFamily: "Georgia, serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
      }
      return { background: '#ffffff', color: '#111111', minHeight: '750px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
    } else {
      // Portfolio Layout Styles
      switch (portfolioTemplate) {
        case 0: // Glassmorphic Sunset
          return { background: '#090816', color: '#f1f1f5', minHeight: '700px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' };
        case 1: // Timeline Story
          return { background: '#0e1111', color: '#e5e5e5', minHeight: '700px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' };
        case 2: // Cyber Terminal CLI
          return { background: '#05070a', color: '#39ff14', minHeight: '700px', fontFamily: "'Courier New', Courier, monospace", padding: '2rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid #1a2d1d' };
        case 3: // Left Sidebar Bento
          return { background: '#0a0d14', color: '#f3f4f6', minHeight: '700px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' };
        case 4: // Obsidian Dark Minimal
          return { background: '#0d0d12', color: '#e2e8f0', minHeight: '700px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' };
        default:
          return { background: '#ffffff', color: '#111111', minHeight: '700px', fontFamily: "'Inter', sans-serif", padding: '2.5rem', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
      }
    }
  };

  // ==========================================
  // COMPILER FOR PDF HIGH-FIDELITY PRINT EXPORT
  // ==========================================
  const handleExportPDF = () => {
    const activeTabLabel = activeSubTab === 'resume' ? 'CV/Resume' : (activeSubTab === 'cover_letter' ? 'Cover Letter' : 'Portfolio');
    const selectedTplIdx = activeSubTab === 'resume' ? resumeTemplate : (activeSubTab === 'cover_letter' ? letterTemplate : portfolioTemplate);
    addLog(`🖨️ Application Suite: Compiling clean print stylesheet for [${activeTabLabel} - Layout #${selectedTplIdx + 1}] and triggering system print...`);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addLog("⚠️ Application Suite: Pop-up blocked! Allow pop-ups to export.");
      return;
    }

    let pageTitle = "";
    let contentHtml = "";
    let stylesheet = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        margin: 40px;
        padding: 0;
        line-height: 1.5;
        background: #fff;
        color: #111;
      }
      @media print {
        body { margin: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `;

    // 1. RESUME EXPORT COMPILER
    if (activeSubTab === 'resume') {
      const data = getActiveResumeData();
      pageTitle = `CV_Resume_${data.name.replace(/\s+/g, '_')}`;

      if (resumeTemplate === 0) { // Emerald Modern Sidebar
        stylesheet += `
          .resume-container { display: flex; gap: 20px; }
          .left-sidebar { width: 32%; background: #092d24; color: #e6f4f1; padding: 25px; border-radius: 6px; }
          .right-main { width: 68%; color: #1e293b; }
          .side-header { border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 20px; font-weight: bold; font-size: 1.1rem; text-transform: uppercase; color: #10b981; }
          .skill-badge { background: rgba(16,185,129,0.15); color: #a7f3d0; padding: 5px 8px; border-radius: 4px; display: inline-block; margin: 3px; font-size: 0.8rem; font-weight: 600; }
          .exp-item { margin-bottom: 20px; }
          .exp-title { font-weight: bold; font-size: 1.1rem; color: #092d24; display: flex; justify-content: space-between; }
        `;
        contentHtml = `
          <div class="resume-container">
            <div class="left-sidebar">
              <div style="font-size: 1.5rem; font-weight: 800; color: #fff; line-height: 1.2;">${data.name}</div>
              <div style="color: #10b981; font-weight: 600; margin-bottom: 25px;">${data.role}</div>
              
              <div class="side-header">Contact Details</div>
              <div style="font-size: 0.9rem; margin-bottom: 20px; line-height: 1.6;">
                <div>📍 ${data.location}</div>
                <div>💰 Salary: ${data.salary}</div>
                <div>💼 Experience: ${data.yearsOfExperience} Years</div>
              </div>

              <div class="side-header">Technical Stack</div>
              <div style="margin-top: 10px;">
                ${data.skills.map(sk => `<span class="skill-badge">${sk}</span>`).join('')}
              </div>
            </div>
            <div class="right-main">
              <div style="border-bottom: 2px solid #092d24; padding-bottom: 10px; margin-bottom: 20px;">
                <h3 style="font-size: 1.2rem; text-transform: uppercase; color: #092d24; margin: 0;">Professional Summary</h3>
              </div>
              <p style="font-size: 0.95rem; line-height: 1.6; color: #334155; margin-bottom: 25px;">${data.professionalSummary}</p>

              <div style="border-bottom: 2px solid #092d24; padding-bottom: 10px; margin-bottom: 20px;">
                <h3 style="font-size: 1.2rem; text-transform: uppercase; color: #092d24; margin: 0;">Professional Experience</h3>
              </div>
              <div>
                ${data.workHistory.map(exp => `
                  <div class="exp-item">
                    <div class="exp-title">
                      <span>${exp.role}</span>
                      <span style="font-size: 0.85rem; color: #64748b;">${exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                    </div>
                    <div style="font-style: italic; color: #475569; font-size: 0.9rem; margin-bottom: 5px;">${exp.company}</div>
                    <p style="margin: 0; font-size: 0.9rem; color: #334155;">${exp.description || exp.achievements || ''}</p>
                  </div>
                `).join('')}
              </div>

              <div style="border-bottom: 2px solid #092d24; padding-bottom: 10px; margin-top: 25px; margin-bottom: 15px;">
                <h3 style="font-size: 1.2rem; text-transform: uppercase; color: #092d24; margin: 0;">Education History</h3>
              </div>
              <div>
                ${data.educationList.map(edu => `
                  <div style="display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 10px;">
                    <span><strong>${edu.degree}</strong> - ${edu.institution}</span>
                    <span style="color: #64748b;">${edu.year || edu.gradYear || ''}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      } else if (resumeTemplate === 1) { // Premium Bento Grid
        stylesheet += `
          .bento-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 15px; background: #fff; }
          .bento-title { font-size: 1.1rem; font-weight: 800; color: #4f46e5; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 12px; }
          .skill-tag { background: #f1f5f9; color: #1e293b; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; display: inline-block; margin: 3px; border: 1px solid #e2e8f0; }
        `;
        contentHtml = `
          <div class="bento-card" style="text-align: center; background: #f8fafc;">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #1e1b4b; margin: 0;">${data.name}</h1>
            <div style="font-size: 1.1rem; font-weight: 700; color: #4f46e5; margin: 5px 0;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #475569; display: flex; justify-content: center; gap: 20px; margin-top: 10px;">
              <span>📍 ${data.location}</span>
              <span>💰 Salary: ${data.salary}</span>
              <span>👔 Experience: ${data.yearsOfExperience} Years</span>
            </div>
          </div>

          <div class="bento-card">
            <div class="bento-title">Executive Summary</div>
            <p style="margin: 0; font-size: 0.95rem; color: #334155; line-height: 1.6;">${data.professionalSummary}</p>
          </div>

          <div style="display: flex; gap: 15px;">
            <div class="bento-card" style="flex: 1;">
              <div class="bento-title">Core Skills</div>
              <div>
                ${data.skills.map(sk => `<span class="skill-tag">${sk}</span>`).join('')}
              </div>
            </div>
            <div class="bento-card" style="flex: 1;">
              <div class="bento-title">Education</div>
              ${data.educationList.map(edu => `
                <div style="margin-bottom: 10px; font-size: 0.9rem;">
                  <strong>${edu.degree}</strong>
                  <div style="color: #4f46e5; font-size: 0.85rem;">${edu.institution} (${edu.year || edu.gradYear})</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="bento-card">
            <div class="bento-title">Work Experience</div>
            ${data.workHistory.map(exp => `
              <div style="margin-bottom: 15px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem;">
                  <span>${exp.role} <span style="font-weight: normal; color: #64748b;">at ${exp.company}</span></span>
                  <span style="font-size: 0.85rem; color: #64748b; font-weight: normal;">${exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                </div>
                <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: #475569; line-height: 1.5;">${exp.description || exp.achievements || ''}</p>
              </div>
            `).join('')}
          </div>
        `;
      } else if (resumeTemplate === 2) { // Classic Serif
        stylesheet += `
          body { font-family: 'Georgia', serif; background: #faf9f6; color: #2b2b2a; }
          .serif-section { border-top: 1px solid #2b2b2a; border-bottom: 1px solid #2b2b2a; text-align: center; text-transform: uppercase; font-size: 1rem; letter-spacing: 0.1em; padding: 4px 0; margin: 25px 0 15px 0; font-weight: bold; }
        `;
        contentHtml = `
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="font-size: 2.4rem; font-weight: normal; margin: 0; font-family: 'Georgia', serif;">${data.name}</h1>
            <div style="font-style: italic; font-size: 1.1rem; color: #444; margin-top: 4px;">${data.role}</div>
            <div style="font-size: 0.85rem; margin-top: 8px; word-spacing: 2px;">
              ${data.location} &bull; ${data.salary} &bull; ${data.yearsOfExperience} Years Experience
            </div>
          </div>

          <div class="serif-section">Professional Summary</div>
          <p style="font-size: 0.95rem; line-height: 1.6; text-align: justify; margin: 0 10px;">${data.professionalSummary}</p>

          <div class="serif-section">Core Expertise</div>
          <div style="text-align: center; line-height: 1.8; font-size: 0.9rem; padding: 0 10px;">
            <strong>${data.skills.join(' &nbsp;&bull;&nbsp; ')}</strong>
          </div>

          <div class="serif-section">Professional Experience</div>
          <div>
            ${data.workHistory.map(exp => `
              <div style="margin-bottom: 20px; padding: 0 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1rem;">
                  <span>${exp.role} &mdash; <span style="font-weight: normal; font-style: italic;">${exp.company}</span></span>
                  <span style="font-weight: normal; font-size: 0.85rem; color: #555;">${exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                </div>
                <p style="margin: 6px 0 0 0; font-size: 0.9rem; line-height: 1.5; text-align: justify; color: #333;">${exp.description || exp.achievements || ''}</p>
              </div>
            `).join('')}
          </div>

          <div class="serif-section">Education</div>
          <div style="padding: 0 10px;">
            ${data.educationList.map(edu => `
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 8px;">
                <span><strong>${edu.degree}</strong> &bull; <em>${edu.institution}</em></span>
                <span>${edu.year || edu.gradYear || ''}</span>
              </div>
            `).join('')}
          </div>
        `;
      } else if (resumeTemplate === 3) { // Developer Monospace
        stylesheet += `
          body { font-family: 'Courier New', Courier, monospace; background: #0e1117; color: #c9d1d9; }
          .cli-section { color: #58a6ff; font-weight: bold; font-size: 1rem; margin: 25px 0 10px 0; border-bottom: 1px dashed #30363d; padding-bottom: 5px; }
          .code-box { background: #161b22; border: 1px solid #30363d; padding: 8px 12px; border-radius: 4px; font-size: 0.8rem; color: #79c0ff; display: inline-block; margin: 3px; }
        `;
        contentHtml = `
          <div style="border-bottom: 2px solid #30363d; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="color: #7ee787; font-size: 1.8rem; font-weight: bold;">$ finger ${data.name.toLowerCase().replace(/\s+/g, '')}</div>
            <div style="font-size: 1.1rem; color: #8b949e; margin-top: 5px;">Role: ${data.role}</div>
            <div style="font-size: 0.85rem; color: #8b949e; margin-top: 5px; display: flex; gap: 20px;">
              <span>Location: ${data.location}</span>
              <span>Compensation: ${data.salary}</span>
              <span>Exp: ${data.yearsOfExperience} yrs</span>
            </div>
          </div>

          <div class="cli-section">[SECTION] professional_summary</div>
          <p style="font-size: 0.85rem; line-height: 1.6; color: #8b949e; margin: 0;">${data.professionalSummary}</p>

          <div class="cli-section">[SECTION] skill_inventory</div>
          <div>
            ${data.skills.map(sk => `<span class="code-box">[ ${sk} ]</span>`).join('')}
          </div>

          <div class="cli-section">[SECTION] professional_experience</div>
          <div>
            ${data.workHistory.map(exp => `
              <div style="margin-bottom: 18px;">
                <div style="color: #7ee787; font-weight: bold; font-size: 0.95rem;">
                  > ${exp.role} @ ${exp.company}
                  <span style="color: #8b949e; font-size: 0.8rem; font-weight: normal; float: right;">[${exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}]</span>
                </div>
                <p style="margin: 5px 0 0 15px; font-size: 0.85rem; color: #8b949e; line-height: 1.5;">${exp.description || exp.achievements || ''}</p>
              </div>
            `).join('')}
          </div>

          <div class="cli-section">[SECTION] education</div>
          <div>
            ${data.educationList.map(edu => `
              <div style="font-size: 0.85rem; margin-bottom: 8px; color: #8b949e;">
                <span style="color: #ff7b72;">*</span> <strong>${edu.degree}</strong> &mdash; ${edu.institution} [${edu.year || edu.gradYear || ''}]
              </div>
            `).join('')}
          </div>
        `;
      } else { // Obsidian Minimalist
        stylesheet += `
          .minimal-title { font-size: 1.25rem; font-weight: 800; color: #111; border-left: 3px solid #111; padding-left: 10px; text-transform: uppercase; margin: 25px 0 15px 0; letter-spacing: 0.05em; }
          .min-badge { font-size: 0.8rem; font-weight: 700; color: #444; border: 1px solid #ddd; padding: 3px 6px; border-radius: 2px; display: inline-block; margin: 3px; }
        `;
        contentHtml = `
          <div style="margin-bottom: 30px;">
            <h1 style="font-size: 2.6rem; font-weight: 800; color: #111; margin: 0; letter-spacing: -0.03em;">${data.name}</h1>
            <div style="font-size: 1.1rem; color: #555; font-weight: 600; margin-top: 2px;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 8px; display: flex; gap: 20px;">
              <span>📍 ${data.location}</span>
              <span>💰 Target: ${data.salary}</span>
              <span>👔 ${data.yearsOfExperience} Years Exp</span>
            </div>
          </div>

          <div class="minimal-title">Summary</div>
          <p style="font-size: 0.95rem; color: #333; line-height: 1.6; margin: 0;">${data.professionalSummary}</p>

          <div class="minimal-title">Expertise</div>
          <div>
            ${data.skills.map(sk => `<span class="min-badge">${sk}</span>`).join('')}
          </div>

          <div class="minimal-title">Experience</div>
          <div>
            ${data.workHistory.map(exp => `
              <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; color: #111;">
                  <span>${exp.role} <span style="font-weight: 400; color: #666;">| ${exp.company}</span></span>
                  <span style="font-weight: normal; color: #666; font-size: 0.85rem;">${exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                </div>
                <p style="margin: 6px 0 0 0; font-size: 0.9rem; color: #444; line-height: 1.55;">${exp.description || exp.achievements || ''}</p>
              </div>
            `).join('')}
          </div>

          <div class="minimal-title">Education</div>
          <div>
            ${data.educationList.map(edu => `
              <div style="display: flex; justify-content: space-between; font-size: 0.95rem; color: #222; margin-bottom: 8px;">
                <span><strong>${edu.degree}</strong> &mdash; ${edu.institution}</span>
                <span style="color: #666;">${edu.year || edu.gradYear || ''}</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }

    // 2. COVER LETTER EXPORT COMPILER
    else if (activeSubTab === 'cover_letter') {
      const data = getActiveLetterData();
      pageTitle = `Cover_Letter_${data.name.replace(/\s+/g, '_')}`;

      if (letterTemplate === 0) { // Bold Ocean Pitch
        stylesheet += `
          .ocean-header { height: 12px; background: linear-gradient(90deg, #0284c7, #0ea5e9); border-radius: 4px; margin-bottom: 25px; }
          .letter-title { color: #0369a1; font-weight: 800; }
        `;
        contentHtml = `
          <div class="ocean-header"></div>
          <div style="margin-bottom: 30px;">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0;">${data.name}</h1>
            <div style="font-size: 1rem; color: #0284c7; font-weight: 700; margin-top: 2px;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 8px;">
              📍 ${data.location} | Target: ${data.salary} | Exp: ${data.yearsOfExperience} Years
            </div>
          </div>

          <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
            <div><strong>Date:</strong> ${data.date}</div>
            <div style="margin-top: 5px;"><strong>Subject:</strong> <span class="letter-title">${data.subject}</span></div>
          </div>

          <div style="font-size: 1rem; color: #334155; line-height: 1.7; white-space: pre-wrap;">${data.body}</div>
        `;
      } else if (letterTemplate === 1) { // STAR Structured
        stylesheet += `
          .star-box { border-left: 4px solid #f97316; padding-left: 15px; margin-bottom: 15px; }
          .star-box.action { border-left-color: #8b5cf6; }
          .star-box.result { border-left-color: #10b981; }
          .star-label { font-weight: 800; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 3px; }
        `;
        contentHtml = `
          <div style="border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #1e1b4b; margin: 0;">${data.name}</h1>
            <div style="font-size: 1rem; color: #6366f1; font-weight: 700; margin-top: 2px;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #475569; margin-top: 6px;">📍 ${data.location}</div>
          </div>

          <div style="font-size: 0.9rem; color: #475569; margin-bottom: 25px;">
            <div><strong>Date:</strong> ${data.date}</div>
            <div><strong>Subject:</strong> <strong>${data.subject}</strong></div>
          </div>

          <div style="font-size: 1rem; color: #1e293b; line-height: 1.6; margin-bottom: 20px;">
            Dear Hiring Team,
          </div>

          <div style="font-size: 0.95rem; color: #334155; line-height: 1.65; margin-bottom: 20px;">
            I am writing to formally apply for professional considerations. Below, I outline my proven capabilities matching standard industry challenges:
          </div>

          <div class="star-box">
            <div class="star-label" style="color: #ea580c;">🎯 Situation & Challenge</div>
            <p style="margin: 0; font-size: 0.9rem; color: #475569;">Faced high deployment latencies and systemic cloud scaling bottlenecks under heavy production loads.</p>
          </div>

          <div class="star-box action">
            <div class="star-label" style="color: #7c3aed;">⚡ Action & Execution</div>
            <p style="margin: 0; font-size: 0.9rem; color: #475569;">Migrated core configurations to multi-cluster systems and set automated caching and monitoring systems.</p>
          </div>

          <div class="star-box result">
            <div class="star-label" style="color: #059669;">📈 Results & Metrics</div>
            <p style="margin: 0; font-size: 0.9rem; color: #475569;">Slashed roundtrip request latencies by 35% and stabilized production system throughput at peak capacity.</p>
          </div>

          <div style="font-size: 0.95rem; color: #334155; line-height: 1.65; margin-top: 25px; white-space: pre-wrap;">${data.body.split('\n\n').slice(2).join('\n\n')}</div>
        `;
      } else if (letterTemplate === 2) { // Georgia Elegant
        stylesheet += `
          body { font-family: 'Georgia', serif; background: #faf9f6; color: #2b2b2a; }
        `;
        contentHtml = `
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 15px;">
            <h1 style="font-size: 2.2rem; font-weight: normal; margin: 0;">${data.name}</h1>
            <div style="font-style: italic; font-size: 1rem; color: #555; margin-top: 4px;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #666; margin-top: 6px;">
              ${data.location} &bull; Target: ${data.salary} &bull; ${data.yearsOfExperience} Years Exp
            </div>
          </div>

          <div style="font-size: 0.9rem; color: #555; margin-bottom: 25px; display: flex; flex-direction: column; gap: 3px;">
            <span><strong>Date:</strong> ${data.date}</span>
            <span><strong>Subject:</strong> Formal Letter of Considerations &bull; <em>${data.subject}</em></span>
          </div>

          <div style="font-size: 1rem; line-height: 1.7; text-align: justify; white-space: pre-wrap; padding: 0 10px;">${data.body}</div>
        `;
      } else if (letterTemplate === 3) { // Bulleted Impact
        stylesheet += `
          .impact-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .impact-list { margin: 0; padding-left: 20px; font-size: 0.9rem; color: #334155; display: flex; flex-direction: column; gap: 8px; }
        `;
        contentHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px;">
            <div>
              <h1 style="font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0;">${data.name}</h1>
              <div style="font-size: 1rem; color: #475569; font-weight: 600;">${data.role}</div>
            </div>
            <div style="text-align: right; font-size: 0.8rem; color: #64748b; line-height: 1.4;">
              <div>📍 ${data.location}</div>
              <div>💼 Exp: ${data.yearsOfExperience} Years</div>
            </div>
          </div>

          <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">
            <div><strong>Date:</strong> ${data.date}</div>
            <div><strong>Re:</strong> ${data.subject}</div>
          </div>

          <div style="font-size: 0.95rem; color: #334155; line-height: 1.6; white-space: pre-wrap;">${data.body.split('\n\n')[0]}</div>

          <div class="impact-box">
            <div style="font-weight: 800; font-size: 0.85rem; text-transform: uppercase; color: #0f172a; margin-bottom: 10px; letter-spacing: 0.05em;">🚀 Key Quantifiable Deliverables</div>
            <ul class="impact-list">
              <li><strong>Reduced Overhead:</strong> Optimally streamlined cloud structures, slashing infrastructure expenditures by 40%.</li>
              <li><strong>Boosted Deployment:</strong> Integrated container structures that maximized technical release frequency by 150%.</li>
              <li><strong>Maximized Speed:</strong> Refactored backend gateway protocols, reducing average API response times by 30%.</li>
            </ul>
          </div>

          <div style="font-size: 0.95rem; color: #334155; line-height: 1.6; white-space: pre-wrap;">${data.body.split('\n\n').slice(1).join('\n\n')}</div>
        `;
      } else { // Warm Left-Stripe
        stylesheet += `
          .stripe-container { border-left: 5px solid #f43f5e; padding-left: 20px; }
        `;
        contentHtml = `
          <div class="stripe-container">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #1e293b; margin: 0;">${data.name}</h1>
            <div style="font-size: 1.1rem; color: #f43f5e; font-weight: 700; margin-top: 2px;">${data.role}</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 6px;">📍 ${data.location}</div>
            
            <div style="font-size: 0.9rem; color: #64748b; margin-top: 20px; margin-bottom: 25px;">
              <div><strong>Date:</strong> ${data.date}</div>
              <div style="margin-top: 4px;"><strong>Subject:</strong> ${data.subject}</div>
            </div>

            <div style="font-size: 1rem; color: #334155; line-height: 1.65; white-space: pre-wrap;">${data.body}</div>
          </div>
        `;
      }
    }

    // 3. PORTFOLIO EXPORT COMPILER
    else {
      const data = getActivePortfolioData();
      pageTitle = `Portfolio_${data.name.replace(/\s+/g, '_')}`;

      if (portfolioTemplate === 0) { // Glassmorphic Sunset
        stylesheet += `
          body { background: #090816; color: #f1f1f5; }
          .sunset-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 18px; margin-bottom: 15px; }
          .gradient-text { background: linear-gradient(45deg, #ff7e5f, #feb47b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: bold; }
          .tag { background: rgba(255,126,95,0.1); color: #feb47b; border: 1px solid rgba(255,126,95,0.2); padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; margin: 3px; display: inline-block; }
        `;
        contentHtml = `
          <div class="sunset-card" style="text-align: center;">
            <h1 style="font-size: 2rem; margin: 0;" class="gradient-text">${data.title}</h1>
            <div style="font-size: 1rem; color: #feb47b; margin-top: 5px;">${data.role}</div>
            <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 10px;">📍 ${data.location} &bull; ${data.yearsOfExperience} Years Experience</div>
          </div>

          <div class="sunset-card">
            <p style="margin: 0; font-size: 0.95rem; line-height: 1.6; color: #d1d5db;">${data.bio}</p>
          </div>

          <div style="font-size: 1.1rem; font-weight: bold; margin: 20px 0 10px 0; color: #feb47b;">Featured Systems Engineering Projects</div>
          ${data.projects.map(p => `
            <div class="sunset-card">
              <div style="font-weight: bold; font-size: 1.1rem; color: #fff; margin-bottom: 6px;">${p.name}</div>
              <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #9ca3af; line-height: 1.5;">${p.desc}</p>
              <div>
                ${p.tech.map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}

          <div style="font-size: 1.1rem; font-weight: bold; margin: 20px 0 10px 0; color: #feb47b;">Core Technical Capabilities</div>
          <div class="sunset-card">
            ${data.skills.map(sk => `<span class="tag">${sk}</span>`).join('')}
          </div>
        `;
      } else if (portfolioTemplate === 1) { // Timeline Story
        stylesheet += `
          body { background: #0e1111; color: #e5e5e5; }
          .timeline-card { border-left: 2px solid #6366f1; padding-left: 20px; margin-left: 10px; margin-bottom: 25px; position: relative; }
          .timeline-card::before { content: ''; width: 10px; height: 10px; background: #6366f1; border-radius: 50%; position: absolute; left: -6px; top: 5px; }
          .tech-tag { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.2); padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; margin: 3px; display: inline-block; }
        `;
        contentHtml = `
          <div style="border-bottom: 1px solid #333; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="font-size: 1.8rem; color: #fff; margin: 0;">${data.name}</h1>
            <div style="color: #6366f1; font-weight: bold;">${data.role} Showcase</div>
            <p style="color: #888; font-size: 0.9rem; margin: 10px 0 0 0;">${data.bio}</p>
          </div>

          <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 20px; color: #fff;">Timeline: Systems & Projects Milestone</div>
          <div>
            ${data.projects.map((p, idx) => `
              <div class="timeline-card">
                <span style="font-size: 0.75rem; text-transform: uppercase; color: #6366f1; font-weight: bold; display: block; margin-bottom: 2px;">Phase 0${idx + 1}</span>
                <strong style="font-size: 1.1rem; color: #fff; display: block; margin-bottom: 4px;">${p.name}</strong>
                <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #b1b5b5; line-height: 1.5;">${p.desc}</p>
                <div>
                  ${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else if (portfolioTemplate === 2) { // Cyber Terminal CLI
        stylesheet += `
          body { background: #05070a; color: #39ff14; font-family: 'Courier New', Courier, monospace; }
          .terminal-line { margin-bottom: 12px; }
          .term-blue { color: #00ffff; }
          .term-yellow { color: #ffff00; }
          .term-white { color: #ffffff; }
        `;
        contentHtml = `
          <div style="border-bottom: 1px solid #1a2d1d; padding-bottom: 15px; margin-bottom: 20px;">
            <div style="font-size: 1.2rem; font-weight: bold;">[GIGO TERMINAL v2.4a6 ACTIVE PORTFOLIO]</div>
            <div>System Operator: ${data.name} &bull; Location: ${data.location}</div>
          </div>

          <div class="terminal-line">
            <span class="term-blue">guest@gigo-terminal:~$</span> cat biography.json
            <div style="margin-left: 15px; color: #888; font-size: 0.85rem; line-height: 1.4; margin-top: 4px;">
              {<br>
              &nbsp;&nbsp;"operator": "${data.name}",<br>
              &nbsp;&nbsp;"role": "${data.role}",<br>
              &nbsp;&nbsp;"experience": ${data.yearsOfExperience},<br>
              &nbsp;&nbsp;"summary": "${data.bio}"<br>
              }
            </div>
          </div>

          <div class="terminal-line">
            <span class="term-blue">guest@gigo-terminal:~$</span> ls -la featured_projects/
            <div style="margin-top: 8px; margin-left: 15px;">
              ${data.projects.map(p => `
                <div style="margin-bottom: 15px; border-left: 2px solid #1a2d1d; padding-left: 10px;">
                  <span class="term-yellow">./run_project --name="${p.name}"</span>
                  <p style="margin: 4px 0 6px 0; font-size: 0.85rem; color: #88c488; line-height: 1.4;">${p.desc}</p>
                  <div><span class="term-white">Technologies:</span> ${p.tech.join(', ')}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="terminal-line">
            <span class="term-blue">guest@gigo-terminal:~$</span> list --capabilities
            <div style="margin-left: 15px; margin-top: 5px; color: #00ffff;">
              [ ${data.skills.join(' ], [ ')} ]
            </div>
          </div>
        `;
      } else if (portfolioTemplate === 3) { // Left Sidebar Bento
        stylesheet += `
          body { background: #0a0d14; color: #f3f4f6; }
          .p-container { display: flex; gap: 20px; }
          .p-sidebar { width: 32%; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 20px; }
          .p-main { width: 68%; }
          .p-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 18px; margin-bottom: 15px; }
          .p-tech { background: rgba(255,255,255,0.04); color: #38bdf8; border: 1px solid rgba(56,189,248,0.15); padding: 3px 6px; border-radius: 4px; font-size: 0.75rem; margin: 3px; display: inline-block; }
        `;
        contentHtml = `
          <div class="p-container">
            <div class="p-sidebar">
              <div style="font-size: 1.3rem; font-weight: 800; color: #fff;">${data.name}</div>
              <div style="color: #38bdf8; font-size: 0.9rem; font-weight: 600; margin-bottom: 15px;">${data.role}</div>
              <p style="font-size: 0.8rem; color: #9ca3af; line-height: 1.5; margin-bottom: 20px;">${data.bio}</p>
              <div style="font-size: 0.8rem; color: #9ca3af;">
                <div>📍 ${data.location}</div>
                <div>👔 ${data.yearsOfExperience} Years Exp</div>
              </div>
            </div>
            <div class="p-main">
              <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; color: #fff;">Featured Engineering Projects</div>
              ${data.projects.map(p => `
                <div class="p-card">
                  <div style="font-weight: 700; color: #fff; font-size: 1rem; margin-bottom: 5px;">${p.name}</div>
                  <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #9ca3af; line-height: 1.45;">${p.desc}</p>
                  <div>
                    ${p.tech.map(t => `<span class="p-tech">${t}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else { // Obsidian Dark Minimal
        stylesheet += `
          body { background: #0d0d12; color: #e2e8f0; }
          .obs-card { border: 1px solid rgba(255,255,255,0.06); padding: 20px; margin-bottom: 15px; background: #0d0d12; border-radius: 4px; }
          .obs-tech { border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 2px 6px; border-radius: 2px; font-size: 0.75rem; margin: 3px; display: inline-block; background: transparent; }
        `;
        contentHtml = `
          <div style="margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 20px;">
            <h1 style="font-size: 2.2rem; font-weight: bold; color: #fff; margin: 0;">${data.title}</h1>
            <div style="font-size: 1rem; color: #888; margin-top: 4px;">${data.role}</div>
          </div>

          <p style="font-size: 0.95rem; line-height: 1.6; color: #b1b5b5; margin-bottom: 25px;">${data.bio}</p>

          <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 15px; color: #fff;">Engineering Cases</div>
          ${data.projects.map(p => `
            <div class="obs-card">
              <div style="font-weight: bold; font-size: 1.05rem; color: #fff; margin-bottom: 4px;">${p.name}</div>
              <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #b1b5b5; line-height: 1.5;">${p.desc}</p>
              <div>
                ${p.tech.map(t => `<span class="obs-tech">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        `;
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${pageTitle}</title>
        <style>${stylesheet}</style>
      </head>
      <body>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', padding: '1rem 0' }}>
      
      {/* Upper Suite Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(138, 92, 246, 0.25)', background: 'linear-gradient(135deg, rgba(138,92,246,0.05) 0%, rgba(0,0,0,0.4) 100%)' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <span style={{ fontSize: '1.8rem' }}>💼</span> Elite Application Suite
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
            Perfectly tailor and preview your CV/Resume, Cover Letter and Web Portfolio to dominate search relevance metrics.
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', gap: '0.25rem' }}>
          <button
            onClick={() => setActiveSubTab('resume')}
            style={{
              background: activeSubTab === 'resume' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            📄 CV / Resume
          </button>
          <button
            onClick={() => setActiveSubTab('cover_letter')}
            style={{
              background: activeSubTab === 'cover_letter' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            ✉️ Cover Letter
          </button>
          <button
            onClick={() => setActiveSubTab('portfolio')}
            style={{
              background: activeSubTab === 'portfolio' ? 'var(--primary)' : 'transparent',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            🎨 Interactive Portfolio
          </button>
        </div>
      </div>

      {/* Dynamic Content Mode & Layout Selection Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(138, 92, 246, 0.15)' }}>
        
        {/* Row 1: Content Data Binding Selectors */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>⚙️</span>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Interactive Layout Synthesis Node</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Configure rendering content bindings and choose design frameworks.</p>
            </div>
          </div>

          {/* ACTIVE CONTENT SOURCE SWITCH */}
          <div>
            {activeSubTab === 'resume' && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setResumeUseLive(false)}
                  style={{ background: !resumeUseLive ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  📂 Premium Sample Data
                </button>
                <button
                  onClick={() => setResumeUseLive(true)}
                  style={{ background: resumeUseLive ? 'linear-gradient(135deg, var(--emerald) 0%, var(--primary) 100%)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: resumeUseLive ? '0 0 10px rgba(16,185,129,0.25)' : 'none' }}
                >
                  ✨ Apply My Live GiGO Data
                </button>
              </div>
            )}

            {activeSubTab === 'cover_letter' && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setLetterUseLive(false)}
                  style={{ background: !letterUseLive ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  📂 Premium Sample Data
                </button>
                <button
                  onClick={() => setLetterUseLive(true)}
                  style={{ background: letterUseLive ? 'linear-gradient(135deg, var(--emerald) 0%, var(--primary) 100%)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: letterUseLive ? '0 0 10px rgba(16,185,129,0.25)' : 'none' }}
                >
                  ✨ Apply My Live GiGO Data
                </button>
              </div>
            )}

            {activeSubTab === 'portfolio' && (
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => setPortfolioUseLive(false)}
                  style={{ background: !portfolioUseLive ? 'var(--primary)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  📂 Premium Sample Data
                </button>
                <button
                  onClick={() => setPortfolioUseLive(true)}
                  style={{ background: portfolioUseLive ? 'linear-gradient(135deg, var(--emerald) 0%, var(--primary) 100%)' : 'transparent', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: portfolioUseLive ? '0 0 10px rgba(16,185,129,0.25)' : 'none' }}
                >
                  ✨ Apply My Live GiGO Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Template Carousel Buttons */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            🎨 Select Active Layout Framework (At least 5 options available)
          </div>

          {/* CV TEMPLATE CAROUSEL */}
          {activeSubTab === 'resume' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {resumeTemplatesList.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => { setResumeTemplate(idx); addLog(`🎨 Resume Canvas: Active Layout switched to [${tpl.name}]`); }}
                  style={{
                    background: resumeTemplate === idx ? 'rgba(138, 92, 246, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: resumeTemplate === idx ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: resumeTemplate === idx ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow: resumeTemplate === idx ? '0 0 12px rgba(138, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{tpl.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* LETTER TEMPLATE CAROUSEL */}
          {activeSubTab === 'cover_letter' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {letterTemplatesList.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => { setLetterTemplate(idx); addLog(`🎨 Cover Letter: Active Layout switched to [${tpl.name}]`); }}
                  style={{
                    background: letterTemplate === idx ? 'rgba(138, 92, 246, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: letterTemplate === idx ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: letterTemplate === idx ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow: letterTemplate === idx ? '0 0 12px rgba(138, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{tpl.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* PORTFOLIO TEMPLATE CAROUSEL */}
          {activeSubTab === 'portfolio' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {portfolioTemplatesList.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => { setPortfolioTemplate(idx); addLog(`🎨 Portfolio Canvas: Active Layout switched to [${tpl.name}]`); }}
                  style={{
                    background: portfolioTemplate === idx ? 'rgba(138, 92, 246, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: portfolioTemplate === idx ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: portfolioTemplate === idx ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow: portfolioTemplate === idx ? '0 0 12px rgba(138, 92, 246, 0.2)' : 'none'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{tpl.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tpl.name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="resume-tailor-grid" style={{ display: 'grid', gridTemplateColumns: '1.24fr 1fr', gap: '2rem', width: '100%' }}>
        
        {/* Left Column: Document Canvas Preview */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(138, 92, 246, 0.15)', alignSelf: 'start' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', width: '100%', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {activeSubTab === 'resume' && `📄 ${resumeTemplatesList[resumeTemplate].name} CV`}
                {activeSubTab === 'cover_letter' && `✉️ ${letterTemplatesList[letterTemplate].name} Letter`}
                {activeSubTab === 'portfolio' && `🎨 ${portfolioTemplatesList[portfolioTemplate].name} Portfolio`}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                {activeSubTab === 'resume' && resumeTemplatesList[resumeTemplate].desc}
                {activeSubTab === 'cover_letter' && letterTemplatesList[letterTemplate].desc}
                {activeSubTab === 'portfolio' && portfolioTemplatesList[portfolioTemplate].desc}
              </p>
            </div>
            <button 
              className="btn-glass btn-primary"
              onClick={handleExportPDF}
              style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
            >
              🖨️ Export PDF Layout
            </button>
          </div>

          {/* Canvas sheet representation with reactive background/fonts */}
          <div style={getPaperStyle()}>
            
            {/* ==========================================
                CV / RESUME ACTIVE TEMPLATE RENDERER
                ========================================== */}
            {activeSubTab === 'resume' && (() => {
              const data = getActiveResumeData();
              
              // T0: Emerald Sidebar
              if (resumeTemplate === 0) {
                return (
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ width: '35%', background: '#092d24', color: '#e6f4f1', padding: '1.25rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{data.name}</div>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.25rem' }}>{data.role}</div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem' }}>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Contact</div>
                        <div>📍 {data.location}</div>
                        <div style={{ marginTop: '0.4rem' }}>💰 {data.salary}</div>
                        <div style={{ marginTop: '0.4rem' }}>💼 {data.yearsOfExperience} Yrs Exp</div>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem' }}>
                        <div style={{ fontWeight: 800, textTransform: 'uppercase', color: '#10b981', marginBottom: '0.5rem', fontSize: '0.75rem' }}>Capabilities</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {data.skills.map((sk, i) => (
                            <span key={i} style={{ background: 'rgba(16,185,129,0.15)', color: '#a7f3d0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{sk}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                      <div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em', color: '#092d24', borderBottom: '2px solid #092d24', paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>Executive Summary</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#2c3e50', lineHeight: 1.5 }}>{data.professionalSummary}</p>
                      </div>
                      <div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em', color: '#092d24', borderBottom: '2px solid #092d24', paddingBottom: '0.2rem', marginBottom: '0.75rem' }}>Professional Experience</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {data.workHistory.map((exp, i) => (
                            <div key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                                <span>{exp.role}</span>
                                <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 400 }}>{exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                              </div>
                              <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#444' }}>{exp.company}</div>
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#333', lineHeight: 1.45 }}>{exp.description || exp.achievements || ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '0.05em', color: '#092d24', borderBottom: '2px solid #092d24', paddingBottom: '0.2rem', marginBottom: '0.5rem' }}>Education</h3>
                        {data.educationList.map((edu, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#111', marginBottom: '0.25rem' }}>
                            <span><strong>{edu.degree}</strong> - {edu.institution}</span>
                            <span style={{ color: '#666' }}>{edu.year || edu.gradYear || ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // T1: Bento Grid Layout
              if (resumeTemplate === 1) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontSize: '1rem', color: '#4f46e5', fontWeight: 700, marginTop: '0.25rem' }}>{data.role}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                        <span>📍 {data.location}</span>
                        <span>💰 {data.salary}</span>
                        <span>👔 {data.yearsOfExperience} Yrs Exp</span>
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Executive Summary</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>{data.professionalSummary}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <div style={{ flex: 1.1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Skills Inventory</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {data.skills.map((sk, i) => (
                            <span key={i} style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>{sk}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 0.9, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Education</div>
                        {data.educationList.map((edu, i) => (
                          <div key={i} style={{ fontSize: '0.75rem', marginBottom: '0.4rem', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.25rem' }}>
                            <strong style={{ color: '#1e293b' }}>{edu.degree}</strong>
                            <div style={{ color: '#4f46e5', fontSize: '0.7rem' }}>{edu.institution} ({edu.year || edu.gradYear})</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Work Experience History</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {data.workHistory.map((exp, i) => (
                          <div key={i} style={{ borderBottom: i < data.workHistory.length - 1 ? '1px dashed #f1f5f9' : 'none', paddingBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem' }}>
                              <span>{exp.role} <span style={{ fontWeight: 400, color: '#64748b' }}>at {exp.company}</span></span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>{exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>{exp.description || exp.achievements || ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // T2: Classic Serif Elegant
              if (resumeTemplate === 2) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: 'normal', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontStyle: 'italic', fontSize: '1rem', color: '#444', marginTop: '0.2rem' }}>{data.role}</div>
                      <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '0.4rem', wordSpacing: '2px' }}>
                        {data.location} &bull; {data.salary} &bull; {data.yearsOfExperience} Years Experience
                      </div>
                    </div>
                    <div>
                      <div style={{ borderTop: '1px solid #2b2b2a', borderBottom: '1px solid #2b2b2a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 'bold', padding: '3px 0', textAlign: 'center', marginBottom: '0.6rem' }}>Professional Summary</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55, textAlign: 'justify' }}>{data.professionalSummary}</p>
                    </div>
                    <div>
                      <div style={{ borderTop: '1px solid #2b2b2a', borderBottom: '1px solid #2b2b2a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 'bold', padding: '3px 0', textAlign: 'center', marginBottom: '0.6rem' }}>Core Capabilities</div>
                      <div style={{ textAlign: 'center', fontSize: '0.85rem', lineHeight: '1.6' }}>
                        <strong>{data.skills.join('  \u2022  ')}</strong>
                      </div>
                    </div>
                    <div>
                      <div style={{ borderTop: '1px solid #2b2b2a', borderBottom: '1px solid #2b2b2a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 'bold', padding: '3px 0', textAlign: 'center', marginBottom: '0.6rem' }}>Professional History</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.workHistory.map((exp, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              <span>{exp.role} &mdash; <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>{exp.company}</span></span>
                              <span style={{ fontWeight: 'normal', fontSize: '0.8rem', color: '#555' }}>{exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                            </div>
                            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', lineHeight: 1.5, textAlign: 'justify', color: '#222' }}>{exp.description || exp.achievements || ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ borderTop: '1px solid #2b2b2a', borderBottom: '1px solid #2b2b2a', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em', fontWeight: 'bold', padding: '3px 0', textAlign: 'center', marginBottom: '0.6rem' }}>Education</div>
                      {data.educationList.map((edu, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                          <span><strong>{edu.degree}</strong> &bull; <em>{edu.institution}</em></span>
                          <span>{edu.year || edu.gradYear || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // T3: Developer Monospace
              if (resumeTemplate === 3) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px dashed #30363d', paddingBottom: '0.75rem' }}>
                      <div style={{ color: '#7ee787', fontSize: '1.4rem', fontWeight: 'bold' }}>$ finger {data.name.toLowerCase().replace(/\s+/g, '')}</div>
                      <div style={{ color: '#8b949e', fontSize: '0.85rem', marginTop: '0.25rem' }}>Role: {data.role}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#8b949e', marginTop: '0.25rem' }}>
                        <span>📍 {data.location}</span>
                        <span>💰 {data.salary}</span>
                        <span>💼 {data.yearsOfExperience} Yrs</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px dashed #30363d', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>[SECTION] professional_summary</div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.5 }}>{data.professionalSummary}</p>
                    </div>
                    <div>
                      <div style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px dashed #30363d', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>[SECTION] skill_inventory</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {data.skills.map((sk, i) => (
                          <span key={i} style={{ background: '#161b22', border: '1px solid #30363d', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#79c0ff' }}>[ {sk} ]</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px dashed #30363d', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>[SECTION] professional_experience</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {data.workHistory.map((exp, i) => (
                          <div key={i}>
                            <div style={{ color: '#7ee787', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                              <span>&gt; {exp.role} @ {exp.company}</span>
                              <span style={{ color: '#8b949e', fontWeight: 400 }}>[{exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}]</span>
                            </div>
                            <p style={{ margin: '0.2rem 0 0 10px', fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.4 }}>{exp.description || exp.achievements || ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#58a6ff', fontWeight: 'bold', fontSize: '0.85rem', borderBottom: '1px dashed #30363d', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>[SECTION] education</div>
                      {data.educationList.map((edu, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.2rem' }}>
                          <span style={{ color: '#ff7b72' }}>*</span> <strong>{edu.degree}</strong> &mdash; {edu.institution} [{edu.year || edu.gradYear || ''}]
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // T4: Obsidian Minimalist
              if (resumeTemplate === 4) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div>
                      <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.03em' }}>{data.name}</h1>
                      <div style={{ fontSize: '1rem', color: '#555', fontWeight: 600, marginTop: '2px' }}>{data.role}</div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                        <span>📍 {data.location}</span>
                        <span>💰 {data.salary}</span>
                        <span>👔 {data.yearsOfExperience} Yrs Exp</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111', borderLeft: '3px solid #111', paddingLeft: '8px', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Summary</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#333', lineHeight: 1.55 }}>{data.professionalSummary}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111', borderLeft: '3px solid #111', paddingLeft: '8px', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Expertise</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {data.skills.map((sk, i) => (
                          <span key={i} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444', border: '1px solid #ddd', padding: '0.2rem 0.5rem', borderRadius: '2px' }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111', borderLeft: '3px solid #111', paddingLeft: '8px', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Experience</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {data.workHistory.map((exp, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', color: '#111' }}>
                              <span>{exp.role} <span style={{ fontWeight: 400, color: '#666' }}>| {exp.company}</span></span>
                              <span style={{ fontWeight: 400, color: '#666', fontSize: '0.8rem' }}>{exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}</span>
                            </div>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#444', lineHeight: 1.45 }}>{exp.description || exp.achievements || ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111', borderLeft: '3px solid #111', paddingLeft: '8px', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Education</div>
                      {data.educationList.map((edu, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#222' }}>
                          <span><strong>{edu.degree}</strong> &mdash; {edu.institution}</span>
                          <span style={{ color: '#666' }}>{edu.year || edu.gradYear || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            })()}

            {/* ==========================================
                COVER LETTER ACTIVE TEMPLATE RENDERER
                ========================================== */}
            {activeSubTab === 'cover_letter' && (() => {
              const data = getActiveLetterData();

              // T0: Bold Ocean Pitch
              if (letterTemplate === 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ height: '8px', background: 'linear-gradient(90deg, #0284c7, #0ea5e9)', borderRadius: '4px' }} />
                    <div>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontSize: '0.9rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>{data.role}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
                        📍 {data.location} | Target: {data.salary} | Exp: {data.yearsOfExperience} Years
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', margin: '0.5rem 0' }}>
                      <div><strong>Date:</strong> {data.date}</div>
                      <div style={{ marginTop: '0.2rem' }}><strong>Subject:</strong> <span style={{ color: '#0369a1', fontWeight: 700 }}>{data.subject}</span></div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{data.body}</p>
                  </div>
                );
              }

              // T1: STAR Structured letter
              if (letterTemplate === 1) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '2px solid #6366f1', paddingBottom: '0.75rem' }}>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e1b4b', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 700 }}>{data.role}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                      <div><strong>Date:</strong> {data.date}</div>
                      <div><strong>Subject:</strong> <strong>{data.subject}</strong></div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.5 }}>
                      Dear Hiring Team,
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
                      I am writing to formally apply for considerations. Below, I outline my proven capabilities matching standard industry challenges:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ borderLeft: '3px solid #f97316', paddingLeft: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#ea580c', textTransform: 'uppercase' }}>Situation & Challenge</div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>Faced high deployment latencies and systemic cloud scaling bottlenecks under heavy production loads.</p>
                      </div>
                      <div style={{ borderLeft: '3px solid #8b5cf6', paddingLeft: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#7c3aed', textTransform: 'uppercase' }}>Action & Execution</div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>Migrated core configurations to multi-cluster systems and set automated caching and monitoring systems.</p>
                      </div>
                      <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.75rem', color: '#059669', textTransform: 'uppercase' }}>Results & Metrics</div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>Slashed roundtrip request latencies by 35% and stabilized production system throughput at peak capacity.</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                      {data.body.split('\n\n').slice(2).join('\n\n')}
                    </p>
                  </div>
                );
              }

              // T2: Georgia Elegant Serif Letter
              if (letterTemplate === 2) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px solid #ccc', paddingBottom: '0.75rem' }}>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 'normal', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontStyle: 'italic', fontSize: '0.9rem', color: '#555' }}>{data.role}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>
                        {data.location} &bull; Target: {data.salary} &bull; {data.yearsOfExperience} Years Exp
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span><strong>Date:</strong> {data.date}</span>
                      <span><strong>Subject:</strong> Formal Letter of Considerations &bull; <em>{data.subject}</em></span>
                    </div>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.6, textAlign: 'justify', whiteSpace: 'pre-wrap', margin: 0 }}>{data.body}</p>
                  </div>
                );
              }

              // T3: Bulleted Impact Box letter
              if (letterTemplate === 3) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '0.5rem' }}>
                      <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{data.name}</h1>
                        <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>{data.role}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                        <div>📍 {data.location}</div>
                        <div>💼 Exp: {data.yearsOfExperience} Years</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <div><strong>Date:</strong> {data.date}</div>
                      <div><strong>Re:</strong> {data.subject}</div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>{data.body.split('\n\n')[0]}</p>
                    
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>🚀 Key Quantifiable Deliverables</div>
                      <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.75rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <li><strong>Reduced Overhead:</strong> Optimally streamlined cloud structures, slashing infrastructure expenditures by 40%.</li>
                        <li><strong>Boosted Deployment:</strong> Integrated container structures that maximized technical release frequency by 150%.</li>
                        <li><strong>Maximized Speed:</strong> Refactored backend gateway protocols, reducing average API response times by 30%.</li>
                      </ul>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: '#334155', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{data.body.split('\n\n').slice(1).join('\n\n')}</p>
                  </div>
                );
              }

              // T4: Warm Left-Stripe Letter
              if (letterTemplate === 4) {
                return (
                  <div style={{ borderLeft: '4px solid #f43f5e', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{data.name}</h1>
                      <div style={{ fontSize: '0.95rem', color: '#f43f5e', fontWeight: 700 }}>{data.role}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>📍 {data.location}</div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <div><strong>Date:</strong> {data.date}</div>
                      <div style={{ marginTop: '0.25rem' }}><strong>Subject:</strong> {data.subject}</div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{data.body}</p>
                  </div>
                );
              }
            })()}

            {/* ==========================================
                PORTFOLIO ACTIVE TEMPLATE RENDERER
                ========================================== */}
            {activeSubTab === 'portfolio' && (() => {
              const data = getActivePortfolioData();

              // T0: Glassmorphic Sunset
              if (portfolioTemplate === 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '1rem', textAlign: 'center' }}>
                      <h1 style={{ fontSize: '1.5rem', margin: 0, background: 'linear-gradient(45deg, #ff7e5f, #feb47b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>{data.title}</h1>
                      <div style={{ fontSize: '0.9rem', color: '#feb47b', marginTop: '0.25rem' }}>{data.role}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>📍 {data.location} &bull; {data.yearsOfExperience} Years Experience</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '1rem' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: '#d1d5db' }}>{data.bio}</p>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#feb47b', marginTop: '0.5rem' }}>Featured Systems Engineering Projects</div>
                    {data.projects.map((p, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '0.8rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>{p.name}</div>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4 }}>{p.desc}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {p.tech.map((t, tIdx) => (
                            <span key={tIdx} style={{ background: 'rgba(255,126,95,0.15)', color: '#feb47b', border: '1px solid rgba(255,126,95,0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#feb47b' }}>Core Technical Capabilities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {data.skills.map((sk, idx) => (
                        <span key={idx} style={{ background: 'rgba(255,126,95,0.1)', color: '#feb47b', border: '1px solid rgba(255,126,95,0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                );
              }

              // T1: Timeline Story
              if (portfolioTemplate === 1) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '0.75rem' }}>
                      <h1 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>{data.name}</h1>
                      <div style={{ color: '#6366f1', fontWeight: 'bold', fontSize: '0.85rem' }}>{data.role} Showcase</div>
                      <p style={{ color: '#888', fontSize: '0.75rem', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>{data.bio}</p>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Timeline: Systems & Projects Milestone</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {data.projects.map((p, idx) => (
                        <div key={idx} style={{ borderLeft: '2px solid #6366f1', paddingLeft: '1rem', marginLeft: '6px', position: 'relative' }}>
                          <span style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', position: 'absolute', left: '-5px', top: '4px' }} />
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#6366f1', fontWeight: 'bold', display: 'block', marginBottom: '0.15rem' }}>Phase 0{idx + 1}</span>
                          <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{p.name}</strong>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#b1b5b5', lineHeight: 1.4 }}>{p.desc}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {p.tech.map((t, tIdx) => (
                              <span key={tIdx} style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // T2: Cyber Terminal CLI
              if (portfolioTemplate === 2) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.75rem', lineHeight: '1.35' }}>
                    <div style={{ borderBottom: '1px solid #1a2d1d', paddingBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold' }}>[GIGO TERMINAL v2.4a6 ACTIVE PORTFOLIO]</div>
                      <div>System Operator: {data.name} &bull; Loc: {data.location}</div>
                    </div>
                    <div>
                      <span style={{ color: '#00ffff' }}>guest@gigo-terminal:~$</span> cat biography.json
                      <div style={{ marginLeft: '10px', color: '#88c488', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                        {`{`} <br />
                        &nbsp;&nbsp;"operator": "{data.name}",<br />
                        &nbsp;&nbsp;"role": "{data.role}",<br />
                        &nbsp;&nbsp;"experience": {data.yearsOfExperience},<br />
                        &nbsp;&nbsp;"summary": "{data.bio.slice(0, 100)}..."<br />
                        {`}`}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#00ffff' }}>guest@gigo-terminal:~$</span> ls -la featured_projects/
                      <div style={{ marginTop: '0.4rem', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {data.projects.map((p, idx) => (
                          <div key={idx} style={{ borderLeft: '1px solid #1a2d1d', paddingLeft: '6px' }}>
                            <span style={{ color: '#ffff00' }}>./run_project --name="{p.name}"</span>
                            <p style={{ margin: '0.15rem 0', color: '#888', fontSize: '0.75rem' }}>{p.desc}</p>
                            <div><span style={{ color: '#fff' }}>Tech:</span> {p.tech.join(', ')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#00ffff' }}>guest@gigo-terminal:~$</span> list --capabilities
                      <div style={{ marginLeft: '10px', marginTop: '0.2rem', color: '#00ffff' }}>
                        [ {data.skills.slice(0, 6).join(' ], [ ')} ]
                      </div>
                    </div>
                  </div>
                );
              }

              // T3: Left Sidebar Bento
              if (portfolioTemplate === 3) {
                return (
                  <div style={{ display: 'flex', gap: '1.25rem' }}>
                    <div style={{ width: '35%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '1rem', fontSize: '0.8rem' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{data.name}</div>
                      <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.8rem' }}>{data.role}</div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.45, margin: '0 0 1rem 0' }}>{data.bio}</p>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        <div>📍 {data.location}</div>
                        <div style={{ marginTop: '0.2rem' }}>👔 {data.yearsOfExperience} Yrs Exp</div>
                      </div>
                    </div>
                    <div style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>Featured Engineering Cases</div>
                      {data.projects.map((p, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{p.name}</div>
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4 }}>{p.desc}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {p.tech.map((t, tIdx) => (
                              <span key={tIdx} style={{ background: 'rgba(255,255,255,0.04)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.15)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // T4: Obsidian Dark Minimal
              if (portfolioTemplate === 4) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>{data.title}</h1>
                      <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>{data.role}</div>
                    </div>
                    <p style={{ fontSize: '0.8rem', lineHeight: 1.5, color: '#b1b5b5', margin: 0 }}>{data.bio}</p>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>Engineering Cases</div>
                    {data.projects.map((p, idx) => (
                      <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1rem', background: '#0d0d12' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fff', marginBottom: '0.25rem' }}>{p.name}</div>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#b1b5b5', lineHeight: 1.45 }}>{p.desc}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {p.tech.map((t, tIdx) => (
                            <span key={tIdx} style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '2px', fontSize: '0.7rem' }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }
            })()}

          </div>
        </div>

        {/* Right Column: AI Analyzer & Gap Controller */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Job Selection Target Box */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                🎯 Target Opportunity Selection
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Select an active job match to auto-analyze keywords, run gap audits, and compile all three assets.
              </p>
            </div>

            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="input-glass"
              style={{ width: '100%', padding: '0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="">-- Choose a target job --</option>
              {allUniqueJobs.map(job => (
                <option key={job.id} value={job.id} style={{ background: '#0a0819', color: '#fff' }}>
                  {job.jobTitle} at {job.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Gap Analysis Scorecard */}
          {gapAnalysis ? (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid rgba(138, 92, 246, 0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>📊 ATS Alignment Score</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: gapAnalysis.score > 80 ? 'var(--emerald)' : '#f59e0b' }}>
                  {gapAnalysis.score}%
                </span>
              </div>

              {/* Micro-gauge visualizer */}
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${gapAnalysis.score}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--emerald) 100%)', borderRadius: '4px', transition: 'width 0.8s ease' }} />
              </div>

              {/* Side-by-side keywords */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                
                {/* Matching */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--emerald)' }}>✓ MATCHED KEYWORDS ({gapAnalysis.matchingSkills.length})</span>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {gapAnalysis.matchingSkills.length > 0 ? (
                      gapAnalysis.matchingSkills.map((sk, idx) => (
                        <span key={idx} style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None found yet.</span>
                    )}
                  </div>
                </div>

                {/* Missing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444' }}>✗ MISSING KEYWORDS ({gapAnalysis.missingSkills.length})</span>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                    {gapAnalysis.missingSkills.length > 0 ? (
                      gapAnalysis.missingSkills.map((sk, idx) => (
                        <span key={idx} style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontStyle: 'italic' }}>100% matched! Excellent.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* AI Custom Action */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>🔮 Tailoring Recommendations</span>
                  <ul style={{ margin: 0, paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {gapAnalysis.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <button
                  className="btn-glass btn-primary"
                  onClick={handleRunTailoring}
                  disabled={isTailoring}
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}
                >
                  {isTailoring ? 'Re-writing CV, Letter & Portfolio...' : '✨ Run AI Core Tailoring'}
                </button>
              </div>

            </div>
          ) : (
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <div>
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Gap Analysis Standby</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, maxWidth: '240px', lineHeight: 1.4 }}>
                  Choose a job from the dropdown above to display side-by-side keyword relevance metrics.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
