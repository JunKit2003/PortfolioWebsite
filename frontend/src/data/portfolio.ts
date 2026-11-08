import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BrainCircuit,
  Cloud,
  Database,
  GitBranch,
  Layers,
  MonitorSmartphone,
  Server,
} from "lucide-react"

export type SkillGroup = {
  title: string
  description: string
  icon: LucideIcon
  skills: string[]
}

export type ProjectImage = {
  src: string
  alt: string
}

export type Project = {
  name: string
  description: string
  tools: string[]
  images: ProjectImage[]
  href?: string
  linkLabel?: string
  note?: string
}

export type ExperienceEntry = {
  role: string
  company: string
  period: string
  bullets: string[]
}

export type EducationEntry = {
  degree: string
  institution: string
  period: string
}

export type SocialLink = {
  label: string
  href: string
  description: string
  iconSlug: string
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Frontend",
    description: "Accessible, component-driven interfaces.",
    icon: MonitorSmartphone,
    skills: ["React", "TypeScript", "ShadCN UI", "Tailwind CSS", "HTML", "CSS"],
  },
  {
    title: "Backend",
    description: "Services and APIs for enterprise applications.",
    icon: Server,
    skills: ["ASP.NET", "C#", "Node.js"],
  },
  {
    title: "Data",
    description: "Relational storage and data modelling.",
    icon: Database,
    skills: ["MSSQL", "PostgreSQL", "Sequelize ORM"],
  },
  {
    title: "Cloud & Infrastructure",
    description: "Hosting, delivery, and containerized workloads.",
    icon: Cloud,
    skills: [
      "Azure Static Web Apps",
      "Azure Container Apps",
      "Azure Front Door",
      "Azure CLI",
      "Azure MCP",
      "Docker",
      "Kubernetes",
      "Nginx",
    ],
  },
  {
    title: "Source Control & Delivery",
    description: "Version control and coordinated releases.",
    icon: GitBranch,
    skills: [
      "Git",
      "Azure DevOps Boards",
      "Azure DevOps Tickets",
      "Azure DevOps CI/CD",
    ],
  },
  {
    title: "AI & Developer Tools",
    description: "Day-to-day tooling and AI-assisted workflows.",
    icon: BrainCircuit,
    skills: ["Claude", "Codex", "Devin", "AI CLI tools", "Ubuntu / WSL"],
  },
  {
    title: "Observability",
    description: "Monitoring and diagnosing production systems.",
    icon: Activity,
    skills: ["Coralogix", "New Relic"],
  },
  {
    title: "Architecture & Extensibility",
    description: "Composable systems and extensible platforms.",
    icon: Layers,
    skills: [
      "Microfrontends",
      "OpenComponents Registry",
      "Plugins",
      "MCP servers",
      "Workflows",
      "Obra Superpowers",
      "Graphify",
    ],
  },
]

export const projects: Project[] = [
  {
    name: "Kubernetes Playground",
    description:
      "Interactive Kubernetes playground for experimenting with chaos scenarios, resilience testing, and distributed systems, featuring an AI chatbot for log-based troubleshooting.",
    tools: [
      "React",
      "OpenRouter Meta LLM",
      "Kubernetes",
      "Docker",
      "Chaos Engineering",
      "Oracle VPS",
    ],
    images: [{ src: "/k8s.png", alt: "Kubernetes Playground interface" }],
    href: "https://k8s.junkit.my",
    linkLabel: "View Live",
  },
  {
    name: "Car Consignment Website",
    description:
      "A simple car consignment website for browsing and managing vehicle listings.",
    tools: ["React", "Node.js", "MySQL", "Oracle VPS"],
    images: [
      {
        src: "/CarConsignmentWebsite.png",
        alt: "Car Consignment Website listing page",
      },
    ],
    href: "https://consigncars.junkit.my",
    linkLabel: "View Live",
  },
  {
    name: "Bike Shop Website",
    description: "Dynamic e-commerce site for Faction Bikeworks.",
    tools: [
      "ReactJS",
      "Node.js",
      "Sequelize ORM",
      "MariaDB",
      "Nginx",
      "Brevo",
      "Stripe",
      "Botpress",
      "Cloudflare",
      "Git",
      "Oracle VPS",
    ],
    images: [{ src: "/faction.png", alt: "Faction Bikeworks storefront" }],
    note: "No longer hosted",
  },
  {
    name: "Reinforcement Learning on Traffic Signals",
    description:
      "Optimized traffic signal control using reinforcement learning and the SUMO simulator.",
    tools: ["Python", "SUMO", "RL Libraries"],
    images: [
      {
        src: "/sumo.gif",
        alt: "SUMO traffic simulation animation",
      },
    ],
    href: "https://github.com/JunKit2003/Designing-Intelligent-Agents",
    linkLabel: "View Repo",
  },
  {
    name: "LunarLander-v2 & CartPole-v3 RL",
    description:
      "Comparative study on noise and modularity in reinforcement learning algorithms.",
    tools: ["Python", "OpenAI Gymnasium", "RL Libraries"],
    images: [
      { src: "/cart_pole.gif", alt: "CartPole-v3 reinforcement learning animation" },
      {
        src: "/lunar_lander.gif",
        alt: "LunarLander-v2 reinforcement learning animation",
      },
    ],
    href: "https://github.com/JunKit2003/Autonomous-Robotics-Systems",
    linkLabel: "View Repo",
  },
  {
    name: "University Marketplace Website",
    description: "Team lead for a university marketplace web app.",
    tools: ["Flutter", "Node.js", "MySQL", "Nginx"],
    images: [
      { src: "/unm.png", alt: "University Marketplace Website interface" },
    ],
    note: "No longer hosted",
  },
]

export const experience: ExperienceEntry[] = [
  {
    role: "Junior Software Engineer",
    company: "The Access Group",
    period: "February 2026 - Present",
    bullets: [
      "Design, develop, and maintain enterprise software applications using modern frameworks and best practices.",
      "Collaborate with cross-functional teams including product managers, designers, and senior engineers to deliver high-quality solutions.",
    ],
  },
  {
    role: "Graduate Software Engineer",
    company: "The Access Group",
    period: "September 2025 - January 2026",
    bullets: [
      "Completed comprehensive training program focused on learning industry standards and best practices in enterprise software development.",
      "Gained hands-on experience with modern frameworks, tools, and methodologies used in professional software engineering.",
    ],
  },
  {
    role: "Technician",
    company: "Faction Bikeworks",
    period: "May 2022 - July 2025",
    bullets: [
      "Expert maintenance, repair, and diagnostics for high-end mountain bikes.",
      "Personalized advice and customer service, maintaining strong relationships.",
    ],
  },
  {
    role: "Intern",
    company: "Kidocode",
    period: "Dec 2018 - Jan 2019",
    bullets: [
      "Developed a personal website using HTML and CSS.",
      "Mentored students on coding projects and contributed to educational content.",
    ],
  },
]

export const education: EducationEntry[] = [
  {
    degree: "BSc (Hons) Computer Science (AI)",
    institution: "University of Nottingham Malaysia",
    period: "Sep 2022 - Jul 2025",
  },
  {
    degree: "Foundation in Engineering",
    institution: "University of Nottingham Malaysia",
    period: "Apr 2021 - Mar 2022",
  },
]

export const socialLinks: SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/JunKit2003",
    description: "Projects and source code.",
    iconSlug: "github",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/cheejunkit/",
    description: "Professional profile and experience.",
    iconSlug: "linkedin",
  },
]

export const skillIconSlugs: Record<string, string> = {
  React: "react",
  TypeScript: "typescript",
  "Tailwind CSS": "tailwindcss",
  HTML: "html5",
  CSS: "css3",
  "ASP.NET": "dotnetcore",
  "C#": "csharp",
  "Node.js": "nodejs",
  MSSQL: "microsoftsqlserver",
  PostgreSQL: "postgresql",
  "Sequelize ORM": "sequelize",
  "Azure Static Web Apps": "azure",
  "Azure Container Apps": "azure",
  "Azure Front Door": "azure",
  "Azure CLI": "azure",
  "Azure MCP": "azure",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Nginx: "nginx",
  Git: "git",
  "Azure DevOps Boards": "azuredevops",
  "Azure DevOps Tickets": "azuredevops",
  "Azure DevOps CI/CD": "azuredevops",
  "Ubuntu / WSL": "ubuntu",
  "New Relic": "newrelic",
}
