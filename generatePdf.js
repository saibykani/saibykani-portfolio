const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const resumeData = {
  name: "Sai Krishna Bykani",
  title: "QA Automation, API & Performance Test Engineer",
  contact: "Hyderabad | +91 8522807300 | saibykani07@gmail.com",
  summary: "Software Development Engineer in Test (SDET) with 3 years of experience in test automation, API testing, performance testing, and backend validation for payment, UPI, and transaction-driven systems. Strong expertise in Java, Selenium WebDriver, Cucumber BDD, REST Assured, Postman, Newman CLI, and Apache JMeter. Proven experience in end-to-end test automation, API integration testing, log analysis, and defect lifecycle management. Adept at working in Agile/Scrum environments, collaborating with developers, and ensuring release quality, system stability, and production readiness.",
  experience: [
    {
      role: "Software Development Engineer in Test (SDET)",
      company: "Toucan Payments Private Limited",
      duration: "July 2023 – Present",
      bullets: [
        "Worked on functional, regression, integration, and end-to-end testing for web and backend payment applications.",
        "Developed and maintained UI automation scripts using Selenium WebDriver, Java, Cucumber (BDD), and TestNG.",
        "Automated critical payment and transaction workflows, improving regression coverage and execution efficiency.",
        "Built and executed API automation tests using REST Assured, Postman, and Newman, validating request/response payloads and business rules.",
        "Performed performance and load testing using Apache JMeter for UPI and card transaction flows.",
        "Configured and executed distributed JMeter master–slave setup for concurrency and scalability testing.",
        "Conducted backend data validation using MySQL, Azure SQL, and MongoDB to ensure data consistency across UI, API, and backend systems.",
        "Analyzed application logs and Grafana dashboards to identify performance issues and SLA risks.",
        "Supported CI/CD pipelines by integrating automation suites with Jenkins for scheduled and release-based execution.",
        "Logged, tracked, and managed defects using Jira, Azure DevOps, and Spira, including root cause analysis and fix validation."
      ]
    }
  ],
  projects: [
    {
      title: "Payment Gateway Automation",
      description: "Automated UI and API test cases for onboarding and transaction flows using Selenium, Cucumber, and REST Assured, ensuring end-to-end validation."
    },
    {
      title: "API Automation Framework",
      description: "Developed reusable REST Assured components and maintained Postman collections with Newman scheduler for continuous API regression testing."
    },
    {
      title: "Performance Testing",
      description: "Designed and executed Apache JMeter test plans and ran master–slave distributed tests to analyze throughput, latency, and error rates under peak load."
    },
    {
      title: "Backend Validation & Monitoring",
      description: "Performed SQL and MongoDB validation and analyzed Grafana dashboards for system stability and SLA monitoring."
    }
  ],
  skills: [
    "Programming & Automation: Java (Test Automation), Selenium WebDriver, Cucumber (BDD), TestNG, Maven, Page Object Model (POM), Data-Driven Testing",
    "API & Integration Testing: REST Assured, Postman, Newman (Postman CLI), REST APIs, JSON Validation, XML Validation, API Automation Frameworks, API Workflow Validation, Transaction Validation",
    "Performance & Load Testing: Apache JMeter, Load Testing, Stress Testing, Spike Testing, Endurance Testing, Distributed JMeter (Master–Slave), Performance Bottleneck Analysis",
    "Backend & Database Validation: MongoDB, Backend Data Validation, Data Reconciliation, Log Analysis",
    "CI/CD, DevOps & Monitoring: Jenkins, GitHub, Gitea, Grafana Monitoring, SLA Validation",
    "Defect & Test Management: Jira, Spira, Defect Tracking, Root Cause Analysis (RCA), Test Planning, Test Case Design, Test Execution, Test Reporting",
    "Methodologies: Agile, Scrum, SDLC, STLC"
  ],
  education: [
    {
      institution: "Teegala Krishna Reddy Engineering College, Hyderabad",
      duration: "Oct 2020 – July 2023",
      degree: "B.Tech, Electrical and Electronics Engineering"
    }
  ],
  achievements: [
    "Recognised for automation testing and API validation contributions that improved regression stability by ~40% and increased automated test coverage across critical payment flows.",
    "Played a key role in performance and load testing of high-volume payment and UPI transaction flows using Apache JMeter, validating system behaviour under 2x–3x peak load conditions.",
    "Supported successful release sign-offs by ensuring end-to-end test coverage across UI automation, API testing, backend validation, and integration testing, reducing post-release defects and rework."
  ]
};

async function createPdf() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  
  const outputPath = path.join(__dirname, 'public/Sai_Krishna_Bykani_Resume.pdf');
  const stream = fs.createWriteStream(outputPath);
  
  doc.pipe(stream);

  // Header
  doc.font('Helvetica-Bold').fontSize(22).text(resumeData.name, { align: 'center' });
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#333333').text(resumeData.title, { align: 'center' }).moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor('#555555').text(resumeData.contact, { align: 'center' }).moveDown(1.5);
  
  doc.fillColor('#000000');

  // Helper for Section Titles
  const sectionTitle = (title) => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#222222').text(title.toUpperCase());
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke().moveDown(0.5);
    doc.fillColor('#000000');
  };

  // Summary
  sectionTitle("Professional Summary");
  doc.font('Helvetica').fontSize(10).text(resumeData.summary, { align: 'justify', lineGap: 3 }).moveDown();

  // Experience
  sectionTitle("Professional Experience");
  resumeData.experience.forEach(exp => {
    doc.font('Helvetica-Bold').fontSize(11).text(exp.role);
    doc.font('Helvetica-Oblique').fontSize(10).text(`${exp.company} | ${exp.duration}`).moveDown(0.3);
    doc.font('Helvetica');
    exp.bullets.forEach(bullet => {
      doc.text(`•  ${bullet}`, { align: 'justify', lineGap: 2 });
    });
    doc.moveDown();
  });

  // Projects
  sectionTitle("Projects");
  resumeData.projects.forEach(proj => {
    doc.font('Helvetica-Bold').text(`•  ${proj.title}: `, { continued: true });
    doc.font('Helvetica').text(proj.description, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.3);
  });
  doc.moveDown(0.7);

  // Skills
  sectionTitle("Core Skills");
  resumeData.skills.forEach(skill => {
    const splitIndex = skill.indexOf(':');
    const category = skill.substring(0, splitIndex + 1);
    const details = skill.substring(splitIndex + 1);
    doc.font('Helvetica-Bold').text(`•  ${category}`, { continued: true });
    doc.font('Helvetica').text(details, { lineGap: 2 });
  });
  doc.moveDown();

  // Education
  sectionTitle("Education");
  resumeData.education.forEach(edu => {
    doc.font('Helvetica-Bold').text(edu.institution, { continued: true });
    doc.font('Helvetica').text(`    |    ${edu.duration}`, { align: 'right' });
    doc.font('Helvetica-Oblique').text(edu.degree).moveDown();
  });

  // Achievements
  sectionTitle("Achievements");
  resumeData.achievements.forEach(ach => {
    doc.text(`•  ${ach}`, { align: 'justify', lineGap: 2 }).moveDown(0.3);
  });

  doc.end();
  
  stream.on('finish', () => {
    console.log(`PDF generated at ${outputPath}`);
  });
}

createPdf();
