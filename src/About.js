import "./About.scss";
import avatar from "./assets/avatar.jpg";

export default function About() {
  return (
    <section id="about">
      <div className="avatar">
        <img src={avatar} alt="Alex Biba Profile Pic" />
      </div>
      <div className="content">
        <h2>About Me</h2>
        <p>
          Senior Software Engineer with over 10 years of experience in the tech
          industry, working across multiple domains and engineering roles.
        </p>
        <p>
          My journey started with hardware VLSI design, transitioned into
          software backend development, and most recently focused on full-stack
          web development.
        </p>
        <p>
          I am deeply passionate about technology and have a keen attention to
          detail. I always strive to adhere to best practices, building scalable
          solutions for the long term, and ensuring a superior user experience
          for the end user.
        </p>
        <p>
          I love building cool software and developing web applications, if you
          have an interesting project, feel free to reach out!
        </p>
        <p>I also love Video Games 🎮, Music 🎸, and Hiking 🥾</p>
      </div>
    </section>
  );
}
