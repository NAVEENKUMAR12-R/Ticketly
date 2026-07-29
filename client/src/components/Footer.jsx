import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
    return (
        <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500/30 pb-14">
                <div className="md:max-w-96">
                    <img className="w-36 h-auto" src={assets.logo} alt="Ticketly Logo" />
                    <p className="mt-6 text-sm text-gray-400 leading-relaxed">
                        Ticketly is your premier destination for discovering, exploring, and booking movie tickets online. Enjoy seamless seat reservation and exclusive cinematic experiences anytime, anywhere.
                    </p>
                    <div className="flex items-center gap-3 mt-5">
                        <img src={assets.googlePlay} alt="Google Play Store" className="h-9 w-auto hover:opacity-90 transition cursor-pointer" />
                        <img src={assets.appStore} alt="Apple App Store" className="h-9 w-auto hover:opacity-90 transition cursor-pointer" />
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-16 md:gap-32">
                    <div>
                        <h2 className="font-semibold text-white mb-4">Quick Links</h2>
                        <ul className="text-sm space-y-2 text-gray-400">
                            <li><a href="/" className="hover:text-primary transition">Home</a></li>
                            <li><a href="/movies" className="hover:text-primary transition">Movies</a></li>
                            <li><a href="/my-bookings" className="hover:text-primary transition">My Bookings</a></li>
                            <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold text-white mb-4">Get In Touch</h2>
                        <div className="text-sm space-y-2 text-gray-400">
                            <p className="flex items-center gap-2">📍 Chennai, Tamil Nadu, India</p>
                            <p className="flex items-center gap-2">📞 +91 99999 99999</p>
                            <p className="flex items-center gap-2">✉️ support@ticketly.com</p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-6 text-center text-sm text-gray-400 pb-6">
                Copyright {new Date().getFullYear()} © Ticketly. All Rights Reserved.
            </p>
        </footer>
    )
}

export default Footer
