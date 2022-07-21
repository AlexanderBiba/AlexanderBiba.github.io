import "./About.scss";

export default function About() {
    return (
        <div className="about">
            <div className="title">
                <img
                    className="avatar"
                    src="images/avatar.jpeg"
                    alt="Alex Biba Profile Pic"
                />
            </div>
            <div className="content">
                <h2>About Me</h2>
                <p>I love building cool software and developing web applications, if you have a cool project for me, don't hesitate to reach out!</p>
            </div>
        </div>
    );
}