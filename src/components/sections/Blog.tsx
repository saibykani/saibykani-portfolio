"use client";

import { useState } from "react";
import { BookOpen, Calendar, Clock, X, Heart, Share2, CornerDownRight } from "lucide-react";

interface Article {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  summary: string;
  coverGradient: string;
  content: string;
  codeBlock?: string;
  related?: string[];
}

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      slug: "enterprise-bdd-framework-design",
      title: "Designing an Enterprise BDD Framework with Java & Cucumber",
      category: "Automation Frameworks",
      date: "May 14, 2026",
      readTime: "6 min read",
      summary: "Explore best practices for designing decoupled Page Object Model frameworks, using Cucumber tags, driver factory containers, and Maven profiles.",
      coverGradient: "from-orange-950 via-red-950 to-slate-955",
      content: `In modern software development pipelines, BDD is more than a syntax preference—it is a collaboration language that aligns product managers, developers, and QA engineers. 

To prevent step-definition bloat and locators decay, we implement a strict Page Object Model pattern using DriverFactory containers. By delegating session initializations to dynamic thread contexts, we can support parallel browser executions without leaking memory.

Key architecture principles we utilize:
1. **Decoupled Locators**: Locators must reside exclusively in page object models, never inside step definitions.
2. **Context Sharing**: Use Dependency Injection containers (such as PicoContainer) to pass state across step classes.
3. **Execution Hooks**: Configure driver cleanup, screenshots on failure, and telemetry reports via Cucumber hooks.`,
      codeBlock: `@RunWith(Cucumber.class)
@CucumberOptions(
    features = "src/test/resources/features",
    glue = {"stepDefinitions", "hooks"},
    tags = "@Regression and @PaymentFlows"
)
public class TestRunner extends AbstractTestNGCucumberTests {
    // Custom parallel overrides here
}`,
      related: ["HMAC Verification in REST Assured", "Distributed load injection configurations"]
    },
    {
      slug: "hmac-signature-rest-assured",
      title: "Automating HMAC Signature Headers & Webhooks in REST Assured",
      category: "API Testing",
      date: "April 28, 2026",
      readTime: "5 min read",
      summary: "How to automate API verification for endpoints requiring dynamic encryption headers, HMAC signatures and asynchronous webhooks.",
      coverGradient: "from-yellow-950 via-orange-950 to-slate-955",
      content: `Fintech applications require strict data integrity. When validating checkout webhooks and server-to-server transaction callback endpoints, APIs often require dynamic headers containing cryptographically signed payloads (HMAC).

Instead of hardcoding payload signatures, we build custom RequestSpecBuilder filters in REST Assured. The filter automatically intercepts the request payload, computes the SHA-256 HMAC checksum using a pre-shared webhook secret, and appends it to the header context dynamically before sending the request.

This enables developers and QA to perform continuous contract testing without manually generating test signature tokens.`,
      codeBlock: `public class HMACSignerFilter implements Filter {
    // Computes HMAC dynamically in REST Assured filter spec
}`,
      related: ["Designing an Enterprise BDD Framework", "Distributed load injection configurations"]
    },
    {
      slug: "distributed-jmeter-database-pools",
      title: "Distributed Load Injection: Tuning Database Connection Pools",
      category: "Performance Testing",
      date: "March 10, 2026",
      readTime: "8 min read",
      summary: "Locating database locking bottlenecks and transaction delays during master-slave load simulations up to 3x peak volume.",
      coverGradient: "from-red-955 via-slate-955 to-orange-955",
      content: `Load testing UPI transaction paths requires scaling injectors without causing local resource starvation. When simulating 10,000+ Requests Per Second (RPS), a single JMeter JVM instance often runs out of memory or hits OS thread limits.

We implement a distributed Master-Slave JMeter architecture inside Docker containers to scale generation load. 

During load runs, we configure Grafana and Dynatrace telemetry trackers. In our latest test, we observed that while average API latency was steady at 45ms under 1x load, it spiked to 2.4 seconds under 2.5x load. The bottleneck was not database CPU limits—instead, it was database connection pool locks. Transactions were queuing waiting for connection handshakes.`,
      codeBlock: `spring.datasource.hikari.maximum-pool-size=80
spring.datasource.hikari.minimum-idle=20`,
      related: ["HMAC Verification in REST Assured", "Designing an Enterprise BDD Framework"]
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Title Header */}
        <div className="max-w-3xl mb-16 text-center sm:text-left space-y-3">
          <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase">
            Technical Insights
          </div>
          <h2 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-white leading-tight">
            <span className="bg-gradient-to-r from-orange-500 to-red-650 bg-clip-text text-transparent">
              Quality Engineering Blog
            </span>
          </h2>
          <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-24 my-2" />
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Explaining BDD structures, REST specifications, and load injector bottlenecks.
          </p>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div
              key={art.slug}
              className="rounded-2xl glass-premium overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 shadow-xl group"
            >
              {/* Cover Gradient */}
              <div className={`h-32 bg-gradient-to-br ${art.coverGradient} p-5 flex flex-col justify-between relative`}>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-[8px] font-bold text-orange-400 tracking-wider w-fit">
                  {art.category.toUpperCase()}
                </span>
                
                <BookOpen className="w-8 h-8 text-white/20 group-hover:text-orange-400 transition-colors" />
              </div>

              {/* Body Summary */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-semibold tracking-wide">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{art.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{art.readTime}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug group-hover:text-orange-450 transition-colors">
                    {art.title}
                  </h3>
                  
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-normal">
                    {art.summary}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedArticle(art)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-orange-500 hover:text-orange-450 uppercase tracking-wider pt-2"
                >
                  <span>Read Article</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Article Modal Reader */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#050508]/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-3xl glass-premium overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
            
            {/* Header */}
            <div className="px-8 py-5 bg-[#0a0f20]/95 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-slate-450">
                <BookOpen className="w-4 h-4 text-orange-500" />
                <span className="font-bold uppercase tracking-wider">Engineering Article</span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reading Context */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              
              <div className="space-y-2 border-b border-white/5 pb-4">
                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/5 border border-orange-500/10 px-2.5 py-0.5 rounded-full w-fit">
                  {selectedArticle.category}
                </span>
                
                <h1 className="text-xl sm:text-2.5xl font-extrabold text-white leading-tight mt-2">
                  {selectedArticle.title}
                </h1>
                
                <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-semibold tracking-wider pt-1 uppercase">
                  <span>Published: {selectedArticle.date}</span>
                  <span>|</span>
                  <span>Read Time: {selectedArticle.readTime}</span>
                </div>
              </div>

              {/* Main Content */}
              <p className="whitespace-pre-line text-slate-350 font-normal leading-relaxed text-xs sm:text-sm">
                {selectedArticle.content}
              </p>

              {/* Code Blocks */}
              {selectedArticle.codeBlock && (
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">
                    Source context snippet
                  </span>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-white/5 text-orange-450 text-xs font-mono overflow-x-auto leading-relaxed">
                    {selectedArticle.codeBlock}
                  </pre>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex items-center space-x-4 text-slate-500">
                  <button className="flex items-center space-x-1.5 hover:text-red-400 transition-colors">
                    <Heart className="w-4 h-4" />
                    <span className="text-[9px] font-bold">120</span>
                  </button>
                  <button className="flex items-center space-x-1.5 hover:text-orange-500 transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-[9px] font-bold">SHARE</span>
                  </button>
                </div>

                {selectedArticle.related && (
                  <div className="text-right">
                    <span className="text-[8px] text-slate-500 uppercase block mb-1 font-bold">Related</span>
                    <div className="flex flex-col space-y-1 text-[10px] text-orange-450 font-bold">
                      {selectedArticle.related.map((rel) => (
                        <span key={rel} className="flex items-center justify-end space-x-1 cursor-pointer hover:underline">
                          <span>{rel}</span>
                          <CornerDownRight className="w-3 h-3" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Close Button */}
            <div className="px-8 py-5 bg-[#0a0f20]/95 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-100 font-bold text-xs tracking-wider uppercase transition-all"
              >
                Close Reader
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
