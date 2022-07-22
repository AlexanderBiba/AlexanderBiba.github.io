import "./About.scss";
import resumePdf from "./assets/resume.pdf";

export default function About() {
    return (
        <section id="about">
            <div className="avatar">
                <img
                    src="images/avatar.jpeg"
                    alt="Alex Biba Profile Pic"
                />
            </div>
            <div className="content">
                <h2>About Me</h2>
                <p>I love building cool software and developing web applications, if you have an interesting project, feel free to reach out!</p>
                <a
                    className="download-cv"
                    href={resumePdf}
                    download="AlexanderBibaResume"
                    color="transparent"
                ><i className="fa fa-download"/> Download Resume</a>
            </div>
        </section>
    );
}