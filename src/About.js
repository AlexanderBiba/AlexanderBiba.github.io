import "./About.scss";
import avatar from "./assets/avatar.jpg";

export default function About() {
  return (
    <section id="about">
      <div className="about-content">
        <div className="avatar">
          <img src={avatar} alt="Alex Biba Profile Pic" />
        </div>
        <div className="content">
          <h2>About Me</h2>
          <p>
            Senior Software Engineer with over 10 years of experience building scalable solutions 
            across multiple domains. I specialize in full-stack development with a focus on 
            Node.js, React, and cloud technologies.
          </p>
          <div className="passions">
            <h3>Passions</h3>
            <div className="passion-tags">
              <span className="tag">Software Development</span>
              <span className="tag">AI Tools</span>
              <span className="tag">3D Printing</span>
              <span className="tag">Music</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
