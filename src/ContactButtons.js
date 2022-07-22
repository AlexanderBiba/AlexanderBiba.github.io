import "./ContactButtons.scss";
import 'font-awesome/css/font-awesome.min.css';

export default function ContactButtons() {
    return (
        <div className="contact-buttons">
            <a className="fa fa-envelope" href="mailto:alexbiba@gmail.com" />
            <a className="fa fa-linkedin" href="https://www.linkedin.com/in/alexander-biba-b9794771" />
            <a className="fa fa-github" href="https://github.com/alex152" />
            <a className="fa fa-facebook" href="https://www.facebook.com/alexbiba" />
            <a className="fa fa-instagram" href="https://www.instagram.com/alexbiba" />
        </div>
    )
}