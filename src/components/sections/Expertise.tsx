"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Activity, Terminal, Database, Cpu } from "lucide-react";

interface ExpertiseDomain {
  name: string;
  icon: any;
  description: string;
  strategy: string;
  tools: string;
}

export default function Expertise() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        type: "spring" as const, 
        stiffness: 100, 
        damping: 15 
      } 
    }
  };

  const domains: ExpertiseDomain[] = [
    {
      name: "API Contract Testing",
      icon: Terminal,
      tools: "REST Assured, Postman, Newman",
      description: "Automating validation of server-to-server transaction status endpoints, request payloads, response codes, and json schemas.",
      strategy: "Executing payload specs dynamic HMAC encryption checksum signers in continuous integration pipelines."
    },
    {
      name: "UI Web Regression",
      icon: Cpu,
      tools: "Selenium WebDriver, Java, Cucumber",
      description: "Automating merchant redirect screens, checkout error validations, payment methods selection pages, and onboarding forms.",
      strategy: "Writing Gherkin scenarios executing in headless multi-browser environments managed via Maven profiles."
    },
    {
      name: "Performance Load Injection",
      icon: Activity,
      tools: "Apache JMeter, Docker, Grafana",
      description: "Testing API latency limits, response metrics, spikes recovery limits, and database lock limits under load.",
      strategy: "Configuring distributed JMeter master-slave thread groups scaling test injections up to 3x peak production concurrency."
    },
    {
      name: "Database Reconciliations",
      icon: Database,
      tools: "MySQL, MongoDB, JDBC client",
      description: "Reconciling settlement ledger entries in SQL tables against MongoDB document vaults post checkout transactions.",
      strategy: "Setting up database clients directly in automated scripts to execute assertions synchronously post UI/API execution."
    },
    {
      name: "Smoke & Sanity checks",
      icon: CheckCircle2,
      tools: "Jenkins, GitHub Actions, TestNG",
      description: "Running fast-pass regression checks during staging pushes to guarantee service and database connections stability.",
      strategy: "Bundling critical scenario tags executing in under 3 minutes, alerting operations Slack channels on failure."
    },
    {
      name: "Requirement Coverage QA",
      icon: ShieldCheck,
      tools: "Jira, Spira TestCase Manager",
      description: "Designing end-to-end traceabilities, logging root cause analyses (RCA), and signing off weekly commits.",
      strategy: "Mapping defect linkages, designing clear test requirements checklists, and participating in sprint review cycles."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-[10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-accent-theme-glow filter blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16 text-center sm:text-left space-y-3"
        >
          <div className="text-accent-theme text-[10px] font-bold tracking-widest uppercase">
            Validation Domains
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Quality Assurance Expertise
            </span>
          </h2>
          <div className="h-1 bg-gradient-accent rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Sai Krishna implements structured verification plans to ensure transactional correctness in Fintech applications.
          </p>
        </motion.div>

        {/* Expertise Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {domains.map((dom) => {
            const Icon = dom.icon;
            return (
              <motion.div
                key={dom.name}
                variants={itemVariants}
                whileHover={{ y: -6, scale: 1.02, borderColor: "var(--accent-color)", boxShadow: "0 15px 30px -10px rgba(0,0,0,0.8)" }}
                className="p-6 rounded-2xl glass-premium space-y-4 hover:border-accent-theme/20 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-theme-glow border border-accent-theme/20 flex items-center justify-center text-accent-theme">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {dom.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  {dom.description}
                </p>

                <div className="space-y-1.5 pt-3 border-t border-white/5 text-[10px] leading-relaxed">
                  <div>
                    <span className="text-slate-500 font-bold block uppercase tracking-wider">Tools</span>
                    <span className="text-slate-300">{dom.tools}</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="text-accent-theme font-bold block uppercase tracking-wider">Strategy</span>
                    <span className="text-slate-400 font-normal">{dom.strategy}</span>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
