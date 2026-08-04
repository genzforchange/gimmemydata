import React from 'react';
import './_group.css';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const companies = [
  {
    id: 1,
    name: 'Kroger',
    color: 'bg-[#0357a7]', // --blue
    textColor: 'text-[#f8f7f2]',
    steps: ['Log in to your account', 'Go to Privacy Center', 'Click "Request My Data"'],
    url: '#',
    rotation: '-rotate-1',
    image: '/__mockup/images/zine-shoppingcart.png',
  },
  {
    id: 2,
    name: 'Instacart',
    color: 'bg-[#cfd78c]', // --lime
    textColor: 'text-[#3a4f88]',
    steps: ['Open App Settings', 'Select "Privacy & Security"', 'Submit Data Request Form'],
    url: '#',
    rotation: 'rotate-2',
    image: null,
  },
  {
    id: 3,
    name: 'Uber',
    color: 'bg-[#e24687]', // --pink
    textColor: 'text-[#f8f7f2]',
    steps: ['Log in via web browser', 'Navigate to Privacy', 'Download your data archive'],
    url: '#',
    rotation: '-rotate-2',
    image: null,
  },
  {
    id: 4,
    name: 'Amazon',
    color: 'bg-[#ff6348]', // --orange
    textColor: 'text-[#3a4f88]',
    steps: ['Go to "Request My Data" page', 'Select data categories', 'Submit request'],
    url: '#',
    rotation: 'rotate-1',
    image: '/__mockup/images/zine-cash-register.png',
  },
  {
    id: 5,
    name: 'Target',
    color: 'bg-[#cae7f7]', // --sky
    textColor: 'text-[#3a4f88]',
    steps: ['Visit Target Privacy Center', 'Click "Access My Data"', 'Verify your email'],
    url: '#',
    rotation: '-rotate-1',
    image: '/__mockup/images/zine-loyaltycard.png',
  },
  {
    id: 6,
    name: 'DoorDash',
    color: 'bg-[#2e7b47]', // --green
    textColor: 'text-[#f8f7f2]',
    steps: ['Go to Account Details', 'Manage Account', 'Request Data Archive'],
    url: '#',
    rotation: 'rotate-2',
    image: null,
  },
];

export function GalleryPage() {
  return (
    <div className="ryd-page">
      {/* Background Texture */}
      <div className="ryd-bg-texture" aria-hidden="true">
        <img src="/__mockup/images/background-texture.jpg" alt="" />
      </div>

      <div className="ryd-content">
        {/* Navigation */}
        <header className="px-8 py-5 text-center">
          <div className="inline-flex py-2 px-4 flex-wrap justify-center gap-2">
            <a href="#" className="ryd-nav-pill ryd-pill bg-[#0357a7] text-[#f8f7f2]">
              <span className="ryd-draw-underline">Home</span>
            </a>
            <a href="#" className="ryd-nav-pill ryd-pill bg-[#3a4f88] text-[#f8f7f2]">
              <span className="ryd-draw-underline">Request Your Data</span>
            </a>
            <a href="#" className="ryd-nav-pill ryd-pill bg-[#2e7b47] text-[#f8f7f2]">
              <span className="ryd-draw-underline">Take Action</span>
            </a>
            <a href="#" className="ryd-nav-pill ryd-pill bg-[#e24687] text-[#f8f7f2]">
              <span className="ryd-draw-underline">Read the Report</span>
            </a>
            <a href="#" className="ryd-nav-pill ryd-pill bg-[#cfd78c] text-[#3a4f88]">
              <span className="ryd-draw-underline">Download Zine</span>
            </a>
          </div>
        </header>

        <main className="max-w-[1160px] mx-auto px-8 pb-20">
          {/* Hero */}
          <section className="py-6 pt-10 pb-12 text-center md:text-left">
            <h1 className="ryd-headline text-[clamp(4rem,10vw,8rem)] leading-[0.9]">
              REQUEST<br />YOUR DATA
            </h1>
          </section>

          {/* Intro Context */}
          <section className="max-w-3xl mb-16 ryd-hover-underline group cursor-default">
            <p className="text-xl md:text-2xl font-semibold mb-6 leading-relaxed mix-blend-multiply text-[#0357a7]">
              What the hell is a DSAR? It stands for <span className="ryd-draw-underline">Data Subject Access Request</span>. It's your legal right to demand a copy of all the creepy, detailed info these companies have hoarded about you.
            </p>
            <p className="text-lg md:text-xl leading-relaxed mix-blend-multiply text-[#3a4f88]">
              Grocery stores, delivery apps, and data brokers are making millions selling your habits, your locations, and your private life. Hit them where it hurts — demand it all back. Below are quick links to file a request with the biggest offenders. Grab your data before they sell it again.
            </p>
          </section>

          {/* Gallery Grid */}
          <section className="mb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company) => (
                <div 
                  key={company.id} 
                  className={`ryd-card relative p-6 flex flex-col justify-between ${company.rotation}`}
                >
                  {company.image && (
                    <img 
                      src={company.image} 
                      alt="" 
                      className="absolute -top-8 -right-8 w-24 h-24 object-contain drop-shadow-md z-10 rotate-12"
                    />
                  )}
                  <div>
                    <div className={`${company.color} ${company.textColor} inline-block px-3 py-1 mb-4 border-2 border-[#3a4f88] -rotate-2 transform`}>
                      <h2 className="ryd-headline text-3xl m-0 leading-none text-current mix-blend-normal">
                        {company.name}
                      </h2>
                    </div>
                    
                    <ol className="list-decimal pl-5 space-y-2 mb-8 font-semibold text-[#3a4f88] text-[1.1rem]">
                      {company.steps.map((step, idx) => (
                        <li key={idx} className="pl-1">{step}</li>
                      ))}
                    </ol>
                  </div>
                  
                  <a 
                    href={company.url}
                    className="ryd-button block w-full py-3 text-center bg-[#cae7f7] text-[#3a4f88] text-2xl font-bold rounded-sm mt-auto"
                  >
                    REQUEST DATA
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="max-w-3xl mx-auto">
            <h2 className="ryd-headline text-5xl mb-8 text-center text-[#e24687]">
              FAQ / WHAT TO EXPECT
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="ryd-accordion-item px-4 rounded-sm">
                <AccordionTrigger className="text-xl font-bold text-[#3a4f88] hover:no-underline hover:text-[#e24687] text-left">
                  How long does this take?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-[#3a4f88] pb-4">
                  Legally, companies usually have 30 to 45 days to respond to your request, depending on where you live (shoutout to California and Europe). They might stall, but they have to cough it up eventually.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="ryd-accordion-item px-4 rounded-sm">
                <AccordionTrigger className="text-xl font-bold text-[#3a4f88] hover:no-underline hover:text-[#e24687] text-left">
                  What if they ask for my ID?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-[#3a4f88] pb-4">
                  Some companies will ask for a photo ID to "verify your identity" before sending the data. It's annoying, but standard practice. Feel free to redact sensitive numbers before sending it over.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="ryd-accordion-item px-4 rounded-sm">
                <AccordionTrigger className="text-xl font-bold text-[#3a4f88] hover:no-underline hover:text-[#e24687] text-left">
                  What kind of data will I get?
                </AccordionTrigger>
                <AccordionContent className="text-lg text-[#3a4f88] pb-4">
                  Usually a chaotic zip file full of CSVs or JSON files. You'll see every purchase, location ping, ad interaction, and customer service chat they've logged. It's eye-opening and deeply weird.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>
      </div>
    </div>
  );
}
