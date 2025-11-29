"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "./ui/Modal";

type GuestModalProps = {
    onGuest?: () => void; // callback when user continues as guest
};

export default function GuestModal({ onGuest }: GuestModalProps) {
    const [open, setOpen] = useState(false);
    const [animate, setAnimate] = useState(false);
    const router = useRouter();
    const AUTO_CLOSE_MS = 8000;

    useEffect(() => {
        const hasSeen = sessionStorage.getItem("guestModalShown");
        if (!hasSeen) {
            setOpen(true);
            sessionStorage.setItem("guestModalShown", "true");
            setTimeout(() => setAnimate(true), 50);

            const timer = setTimeout(() => handleGuest(), AUTO_CLOSE_MS);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleGuest = () => {
        setAnimate(false);
        setTimeout(() => setOpen(false), 300);
        localStorage.setItem("guestUser", "true");
        if (onGuest) onGuest(); // notify parent
    };

    const handleSignUp = () => {
        setAnimate(false);
        setTimeout(() => {
            setOpen(false);
            router.push("/handler/sign-up");
        }, 300);
    };

    return (
        <Modal open={open} title="Welcome" onClose={handleGuest}>
            <div className={`transition-transform transition-opacity duration-300 ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                <div className="flex flex-col gap-4">
                    <p>Continue as Guest or Sign Up to save your progress.</p>
                    <div className="flex justify-end gap-2">
                        <button onClick={handleGuest} className="rounded-md bg-gray-200 px-4 py-2 hover:bg-gray-300 transition">
                            Continue as Guest
                        </button>
                        <button onClick={handleSignUp} className="rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition">
                            Sign Up
                        </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">Auto-continuing as guest in {AUTO_CLOSE_MS / 1000} seconds...</p>
                </div>
            </div>
        </Modal>
    );
}
