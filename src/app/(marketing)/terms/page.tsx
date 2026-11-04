import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/legal";

export const metadata: Metadata = { title: "Terms" };

const SECTIONS: LegalSection[] = [
  {
    heading: "Using Foliora",
    paragraphs: [
      "By creating an account or using Foliora you agree to these terms. If you use Foliora for an agency or company, you confirm that you may accept these terms for it.",
    ],
  },
  {
    heading: "Your account",
    paragraphs: [
      "Give correct information and keep your password safe. You are responsible for what happens under your account. Tell us at once if you think someone else has used it.",
      "New accounts may need our approval before a page can be published.",
    ],
  },
  {
    heading: "Your content",
    paragraphs: [
      "You keep ownership of the photos, videos, text and other material you add. You give Foliora the right to store it, process it (for example to resize images) and show it as you have chosen, only to run the service for you.",
      "You confirm that you have the right to use everything you add, and that it does not break anyone else's rights. Do not upload other people's photos as your own.",
    ],
  },
  {
    heading: "Rules",
    paragraphs: [
      "Do not use Foliora to break the law, to deceive or harass anyone, to pretend to be another person, to send spam, or to publish content that is violent, hateful or sexual in a way that is not appropriate for a professional portfolio.",
      "Casting calls that ask applicants to pay a fee are not allowed. Anything involving people under 18 needs the consent of a parent or guardian.",
    ],
  },
  {
    heading: "Publishing and approval",
    paragraphs: [
      "We may refuse, unpublish or suspend a page or an account that breaks these terms, or that we reasonably believe is harmful, and we will try to tell you why.",
    ],
  },
  {
    heading: "Plans and payment",
    paragraphs: [
      "Foliora offers a free plan and paid plans. Prices are shown in Sri Lankan rupees. Payment is by bank transfer and a plan starts when we confirm the payment. While Foliora is launching, all features are free. [A LAWYER AND AN ACCOUNTANT SHOULD CONFIRM TAX, REFUND AND RENEWAL TERMS.]",
    ],
  },
  {
    heading: "Other services",
    paragraphs: [
      "Foliora works with other services (such as YouTube, Vimeo, Cloudinary and Resend). Your use of them can also be covered by their own terms.",
    ],
  },
  {
    heading: "Ending your use",
    paragraphs: [
      "You can stop using Foliora and ask us to delete your account at any time. We may end or suspend access if these terms are broken.",
    ],
  },
  {
    heading: "No guarantees, and limits on our responsibility",
    paragraphs: [
      "Foliora is provided 'as it is'. We work hard to keep it running, but we cannot promise it will always be available or free of mistakes, and we cannot promise that using it will get you work.",
      "To the extent the law allows, we are not responsible for indirect losses or for what visitors, casting directors or other users do. [A LAWYER SHOULD CONFIRM THE EXACT WORDING.]",
    ],
  },
  {
    heading: "Law",
    paragraphs: ["These terms follow the laws of [Sri Lanka, TO BE CONFIRMED BY A LAWYER]."],
  },
  {
    heading: "Changes and contact",
    paragraphs: [
      "We may update these terms and will tell you about important changes. Questions: [CONTACT EMAIL].",
    ],
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms" sections={SECTIONS} />;
}
