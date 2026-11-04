import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "Foliora ('we') provides websites where actors, actresses, models and agencies show their work. This page explains what personal data we handle and why.",
      "Our contact for privacy questions: [CONTACT EMAIL]. Our business details: [COMPANY NAME, ADDRESS, REGISTRATION NUMBER].",
    ],
  },
  {
    heading: "What we collect",
    paragraphs: [
      "Your account: your name, your email address and your password (stored only as a one-way hash, we cannot read it).",
      "What you add to your profile: stage name, biography, photos, showreel links, credits, social media links and similar details. You may also give a legal name and a birth year. These two are private and are never shown on your public page.",
      "Messages that visitors send you through your page: their name, email, phone number, company, project and message. We keep them for you in your inbox.",
      "Technical data: when someone sends a message we store a one-way fingerprint of their network address, only to stop floods of spam. We do not store the address itself.",
    ],
  },
  {
    heading: "How we use it",
    paragraphs: [
      "To run your account and show your public page, to let visitors contact you, to send you notices about your account and messages, to keep the service secure, and to improve it.",
      "We do not sell personal data and we do not use your photos or content for advertising.",
    ],
  },
  {
    heading: "What is public",
    paragraphs: [
      "Only what you choose to publish: when your page is published, anyone with the link can see your stage name, photos, biography, skills, works, showreels and links. Search engines may index your public page. You can unpublish it at any time.",
    ],
  },
  {
    heading: "Who we share data with",
    paragraphs: [
      "We use service providers to run Foliora: hosting (Vercel), database (Neon), image storage (Cloudinary) and email (Resend). They process data on our behalf and only to provide their service.",
      "If a visitor presses play on a showreel, the video is loaded from YouTube or Vimeo, which then receive that visitor's technical data under their own policies.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "We use a cookie to keep you signed in and a cookie to remember your language. We do not use advertising cookies.",
    ],
  },
  {
    heading: "How long we keep data",
    paragraphs: [
      "We keep your data while your account exists. You can ask us to delete your account and data at any time. We may keep limited records where the law or security requires it.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You can ask to see, correct or delete the personal data we hold about you, and to object to how we use it. Write to [CONTACT EMAIL]. [A LAWYER SHOULD ADD THE RIGHTS AND PROCEDURES REQUIRED BY SRI LANKA'S PERSONAL DATA PROTECTION LAW.]",
    ],
  },
  {
    heading: "Young people",
    paragraphs: [
      "Foliora is meant for adults. A profile of a person under 18 must be created and managed by a parent or legal guardian.",
    ],
  },
  {
    heading: "Changes",
    paragraphs: ["If we change this page in an important way we will tell account holders by email or inside Foliora."],
  },
];

export default function PrivacyPage() {
  return <LegalPage title="Privacy" sections={SECTIONS} />;
}
