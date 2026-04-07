import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Download from '@/components/Download';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

export default function App() {
    return (
        <div className="min-h-screen bg-gray-950 overflow-x-hidden">
            <Header />
            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Download />
                <Testimonials />
            </main>
            <Footer />
        </div>
    );
}
