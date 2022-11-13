import emailjs from "@emailjs/browser";
import "./Contact.scss";

export default function Contact() {
    return (
        <section id="contact">
            <h2 className="title">Contact Me</h2>
            <div className="content">
                <form onSubmit={async e => {
                    e.preventDefault();
                    try {
                        const result = await emailjs.sendForm("service_htw55iu", "template_3a7hcft", e.target, "rdPzcQbDHawb-Tomt");
                        console.log(result);
                    } catch (err) {
                        console.log(err);
                    }
                }}>
                    <div>
                        <h3>Name</h3>
                        <input type="text" name="from_name" />
                    </div>
                    <div>
                        <h3>Email</h3>
                        <input type="email" name="reply_to" />
                    </div>
                    <div>
                        <h3>Message</h3>
                        <textarea name="message" />
                    </div>
                    <input type="submit" value="Submit" />
                </form>
            </div>
        </section>
    )
}