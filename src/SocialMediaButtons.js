import "./SocialMediaButtons.scss";
import 'font-awesome/css/font-awesome.min.css';

export default function SocialMediaButtons() {
    return (
        <div className="social-media-buttons">
            <a href="mailto:alexbiba@gmail.com" ><i className="fa fa-envelope" ></i></a>
            <a href="https://www.linkedin.com/in/alexander-biba-b9794771" ><i className="fa fa-linkedin" ></i></a>
            <a href="https://github.com/AlexanderBiba" ><i className="fa fa-github" ></i></a>
            <a href="https://www.facebook.com/alexbiba" ><i className="fa fa-facebook" ></i></a>
            <a href="https://www.instagram.com/alexbiba" ><i className="fa fa-instagram" ></i></a>
        </div>
    )
}