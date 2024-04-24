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
          I love building cool software and developing web applications, if you
          have an interesting project, feel free to reach out!
        </p>
        <p>I also love Video Games 🎮, Guitars 🎸, and Hiking 🥾</p>
      </div>
    </section>
  );
}
