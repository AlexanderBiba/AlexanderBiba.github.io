import "./About.scss";

export default function About() {
    return (
        <div className="about">
            <img
                className="avatar"
                src="images/avatar.jpeg"
                alt="Alexander Biba Profile Pic"
            />
            <div>
                <h2>About Me</h2>
                <p>I'm a web developer from the New York area, looking for my next challenge</p>
                <h2>Contact Information:</h2>
                <p>Email: alexbiba@gmail.com</p>
            </div>
        </div>
    );
}