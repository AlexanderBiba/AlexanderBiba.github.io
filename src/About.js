import "./About.scss";

export default function About() {
    return (
        <div className="about">
            <img
                className="avatar"
                src="images/avatar.jpeg"
                alt="Alexander Biba Profile Pic"
            />
            <div className="content">
                <h2>About Me</h2>
                <p>I love building cool software and developing web applications, if you have a cool project for me, don't hesitate to reach out!</p>
                <h2>Contact Information:</h2>
                <p>GitHub: <a href="https://github.com/alex152">https://github.com/alex152</a></p>
                <p>LinkedIn: <a href="https://www.linkedin.com/in/alexander-biba-b9794771/">https://www.linkedin.com/in/alexander-biba-b9794771/</a></p>
                <p>Email: <a href="alexbiba@gmail.com">alexbiba@gmail.com</a></p>
            </div>
        </div>
    );
}