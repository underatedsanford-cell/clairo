'use client';
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';

const HeroAnimation = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-animation-container",
        start: "top top",
        end: "+=100%",
        scrub: true,
        pin: true,
      },
    });

    tl.fromTo(
      ".hero-character",
      { y: 0, scale: 1 },
      { y: -100, scale: 0.8, duration: 1 }
    );

    tl.fromTo(
      ".hero-bg",
      { y: 0, scale: 1 },
      { y: -50, scale: 1.2, duration: 1 },
      "<"
    );

    tl.fromTo(
      ".hero-interface-container",
      { y: 0, opacity: 1 },
      { y: -100, opacity: 0, duration: 1 },
      "<"
    );

    tl.fromTo(
      ".hero-cta-button",
      { scale: 1, opacity: 1 },
      { scale: 0.8, opacity: 0, duration: 0.5 },
      "<"
    );

    tl.fromTo(
      ".hero-title",
      { y: 0, opacity: 1 },
      { y: -50, opacity: 0, duration: 0.5 },
      "<"
    );

    tl.fromTo(
      ".hero-description",
      { y: 0, opacity: 1 },
      { y: -50, opacity: 0, duration: 0.5 },
      "<"
    );

  }, []);

  return (
    <div className="hero-animation-container relative w-full h-screen overflow-hidden bg-black">
      <div className="hero-bg absolute inset-0">
        <Image
          src="/hero-bg.svg"
          alt=""
          fill
          style={{ objectFit: 'cover' }}
          className="hero-bg absolute inset-0 z-0"
        />
      </div>
      <div className="hero-character absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-auto">
        <Image
          src="/hero-character.svg"
          alt="Hero Character"
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="hero-interface-container relative z-10 text-center text-white p-8 rounded-lg">
        <h1 className="hero-title text-4xl md:text-6xl font-extrabold mb-4">
          Transform Your Sales with AI
        </h1>
        <p className="hero-description text-lg md:text-xl mb-8">
          Leverage cutting-edge AI to automate lead generation, personalize outreach, and close deals faster than ever before.
        </p>
        <Link href="/demo">
          <button className="hero-cta-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300">
            Get Started Today
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HeroAnimation;
