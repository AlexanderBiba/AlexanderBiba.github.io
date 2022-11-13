import emailjs from "@emailjs/browser";
import "./Contact.scss";

export default function Contact() {
    return (
        <section id="contact">
            <h2 className="title">Contact Me</h2>
            <div className="content">
                <form id="contact-form" onSubmit={e => {
                    e.preventDefault();
                    emailjs.sendForm("service_htw55iu", "template_3a7hcft", e.target, "rdPzcQbDHawb-Tomt");
                }}>
                    <input className="contact-field" type="text" name="user_name" placeholder="Name" required />
                    <input className="contact-field" type="email" name="user_email" placeholder="Email" required />
                    <textarea className="contact-field" name="message" placeholder="Message" required />
                    <button id="submit-button" type="submit" >Submit</button>
                </form>
            </div>
        </section>
    )
}