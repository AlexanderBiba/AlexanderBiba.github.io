import "./Skills.scss";

export default function Skills() {
  return (
    <section id="skills">
      <h2>Skills</h2>
      <div className="skills-grid">
        <div className="skill-category">
          <h3>Core Technologies</h3>
          <div className="skill-tags">
            <span className="skill-tag">TypeScript</span>
            <span className="skill-tag">Node.js</span>
            <span className="skill-tag">React</span>
            <span className="skill-tag">Python</span>
            <span className="skill-tag">GraphQL</span>
          </div>
        </div>
        
        <div className="skill-category">
          <h3>Databases & Infrastructure</h3>
          <div className="skill-tags">
            <span className="skill-tag">MySQL</span>
            <span className="skill-tag">REST APIs</span>
            <span className="skill-tag">Linux</span>
            <span className="skill-tag">Cloud</span>
          </div>
        </div>
        
        <div className="skill-category">
          <h3>Languages</h3>
          <div className="skill-tags">
            <span className="skill-tag">English (Fluent)</span>
            <span className="skill-tag">Hebrew (Native)</span>
            <span className="skill-tag">Russian (Basic)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
