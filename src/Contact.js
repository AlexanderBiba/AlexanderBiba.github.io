import emailjs from "@emailjs/browser";
import { useState, useRef } from "react";
import "./Contact.scss";

export default function Contact() {
    const [contactResponseMessage, setContactResponseMessage] = useState("");
    return (
        <section id="contact">
            <h2 className="title">Contact Me</h2>
            <div className="content">
                <form id="contact-form" onSubmit={async e => {
                    e.preventDefault();
                    console.log("clicked");
                    const submitButton = e.target.elements['submit-button'];
                    submitButton.disabled = true;
                    try {
                        await emailjs.sendForm("service_htw55iu", "template_3a7hcft", e.target, "rdPzcQbDHawb-Tomt");
                        setContactResponseMessage("Message sent successfully!");
                    } catch (err) {
                        console.log(err);
                        setContactResponseMessage("Something went wrong, could not send message.");
                    }
                    submitButton.disabled = false;
                    setTimeout(() => setContactResponseMessage(""), 5000);
                }}>
                    <input className="contact-field" type="text" name="user_name" placeholder="Name" required />
                    <input className="contact-field" type="email" name="user_email" placeholder="Email" required />
                    <textarea className="contact-field" name="message" placeholder="Message" required />
                    <button id="submit-button" type="submit" >Submit</button>
                </form>
                {contactResponseMessage.length > 0 && <h3>{contactResponseMessage}</h3>}
            </div>
        </section>
    )
}