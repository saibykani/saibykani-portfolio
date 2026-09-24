/* eslint-disable @next/next/no-img-element */
import { Activity, Braces, FlaskConical, Gauge, GitBranch, ListChecks, Workflow } from "lucide-react";

const DEVICON = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

type IconDef = { src?: string; invert?: boolean; Fallback?: typeof Activity; color?: string };

// Keys are lower-cased tool names as they appear in resumeData.json
const ICONS: Record<string, IconDef> = {
  java: { src: `${DEVICON}/java/java-original.svg` },
  "java (test automation)": { src: `${DEVICON}/java/java-original.svg` },
  selenium: { src: `${DEVICON}/selenium/selenium-original.svg` },
  "selenium webdriver": { src: `${DEVICON}/selenium/selenium-original.svg` },
  postman: { src: `${DEVICON}/postman/postman-original.svg` },
  "newman (postman cli)": { src: `${DEVICON}/postman/postman-original.svg` },
  jenkins: { src: `${DEVICON}/jenkins/jenkins-original.svg` },
  grafana: { src: `${DEVICON}/grafana/grafana-original.svg` },
  "grafana monitoring": { src: `${DEVICON}/grafana/grafana-original.svg` },
  jira: { src: `${DEVICON}/jira/jira-original.svg` },
  maven: { src: `${DEVICON}/maven/maven-original.svg` },
  mysql: { src: `${DEVICON}/mysql/mysql-original.svg` },
  mongodb: { src: `${DEVICON}/mongodb/mongodb-original.svg` },
  docker: { src: `${DEVICON}/docker/docker-original.svg` },
  github: { src: `${DEVICON}/github/github-original.svg`, invert: true },
  git: { src: `${DEVICON}/git/git-original.svg` },
  "azure devops": { src: `${DEVICON}/azuredevops/azuredevops-original.svg` },
  "azure sql": { src: `${DEVICON}/azuresqldatabase/azuresqldatabase-original.svg` },
  "cucumber (bdd)": { src: `${DEVICON}/cucumber/cucumber-plain.svg` },
  cucumber: { src: `${DEVICON}/cucumber/cucumber-plain.svg` },
  "rest apis": { src: `${DEVICON}/swagger/swagger-original.svg` },
  "json validation": { src: `${DEVICON}/json/json-original.svg`, invert: true },
  "xml validation": { src: `${DEVICON}/xml/xml-original.svg`, invert: true },
  "apache jmeter": { Fallback: Gauge, color: "#D22128" },
  "rest assured": { Fallback: Braces, color: "#34d399" },
  testng: { Fallback: FlaskConical, color: "#f59e0b" },
  gitea: { Fallback: GitBranch, color: "#609926" },
  spira: { Fallback: ListChecks, color: "#38bdf8" },
};

export function TechIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const def = ICONS[name.toLowerCase()];
  if (def?.src) {
    return (
      <img
        src={def.src}
        alt={name}
        loading="lazy"
        className={`${className} object-contain ${def.invert ? "invert" : ""}`}
      />
    );
  }
  const Fallback = def?.Fallback ?? Workflow;
  return <Fallback className={className} style={{ color: def?.color ?? "#a1a1a1" }} />;
}

export function hasTechIcon(name: string) {
  return Boolean(ICONS[name.toLowerCase()]);
}
