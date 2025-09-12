'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { usePathname } from 'next/navigation';
import AnimatedNavbar from "./AnimatedNavbar";
import Footer from "./Footer";
import BrandIntroAnimation from "./BrandIntroAnimation";
import Clairo from "./chatbot/Clairo";
import { useChatbotStore } from '../store/useChatbotStore';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.4,
};

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(true);
  const { isChatbotOpen, toggleChatbot } = useChatbotStore();
  const pathname = usePathname();

  useEffect(() => {
    // Scroll reveal for elements with .animate-section
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.animate-section'));
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all immediately
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      });
    }, { threshold: 0.15 });

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <div className="relative min-h-screen pt-28 bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {showIntro && (
        <BrandIntroAnimation onAnimationComplete={() => setShowIntro(false)} />
      )}
      <AnimatedNavbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
      <Footer />
      <div className="fixed bottom-5 right-5">
        <button
          className="bg-blue-500 text-white rounded-full p-4 shadow-lg"
          onClick={toggleChatbot}
        >
          Chat
        </button>
      </div>
      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div
            className="fixed bottom-20 right-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Clairo />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    );
}