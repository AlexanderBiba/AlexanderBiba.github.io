'use client'

import emailjs from '@emailjs/browser'
import { useState, FormEvent } from 'react'
import '../Contact.scss'

export default function Contact() {
    const [contactResponseMessage, setContactResponseMessage] = useState('')
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const submitButton = form.elements.namedItem('submit-button') as HTMLButtonElement
        
        if (!submitButton) return
        
        submitButton.disabled = true
        try {
            await emailjs.sendForm('service_5osz36y', 'template_3a7hcft', form, 'rdPzcQbDHawb-Tomt')
            setContactResponseMessage('Message sent successfully!')
        } catch (err) {
            console.log(err)
            setContactResponseMessage('Something went wrong, could not send message.')
        }
        submitButton.disabled = false
        setTimeout(() => setContactResponseMessage(''), 5000)
    }
    
    return (
        <section id="contact">
            <h2 className="title">Contact Me</h2>
            <div className="content">
                <form id="contact-form" onSubmit={handleSubmit}>
                    <input className="contact-field" type="text" name="user_name" placeholder="Name" required />
                    <input className="contact-field" type="email" name="user_email" placeholder="Email" required />
                    <textarea className="contact-field" name="message" placeholder="Message" required />
                    <button id="submit-button" type="submit">Submit</button>
                </form>
                {contactResponseMessage.length > 0 && <h3>{contactResponseMessage}</h3>}
            </div>
        </section>
    )
}

