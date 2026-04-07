import { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        name: 'Sarah Chen',
        role: 'Full Stack Developer',
        company: 'TechCorp',
        avatar: 'SC',
        content: 'Finally, a Postman alternative that\'s actually free and works offline. The AI assistant is a game changer for debugging APIs.',
        rating: 5,
        color: 'bg-blue-500',
    },
    {
        name: 'Michael Rodriguez',
        role: 'Backend Engineer',
        company: 'StartupXYZ',
        avatar: 'MR',
        content: 'Love the collection runner and environment variables. Switched from Postman and never looked back. Plus it\'s open source!',
        rating: 5,
        color: 'bg-green-500',
    },
    {
        name: 'Priya Patel',
        role: 'API Developer',
        company: 'CloudSolutions',
        avatar: 'PP',
        content: 'Clean UI, fast performance, and all the features I need. The code snippet generator saves me so much time every day.',
        rating: 5,
        color: 'bg-purple-500',
    },
    {
        name: 'James Wilson',
        role: 'DevOps Engineer',
        company: 'DataFlow Inc',
        avatar: 'JW',
        content: 'Perfect for testing microservices. The request history and workspace organization are exactly what I needed.',
        rating: 5,
        color: 'bg-orange-500',
    },
    {
        name: 'Emily Zhang',
        role: 'Frontend Developer',
        company: 'WebStudio',
        avatar: 'EZ',
        content: 'Super intuitive interface. I got my team to switch and everyone loves it. The pre/post scripts feature is powerful.',
        rating: 5,
        color: 'bg-pink-500',
    },
    {
        name: 'David Kumar',
        role: 'Software Architect',
        company: 'Enterprise Solutions',
        avatar: 'DK',
        content: 'Impressed by the attention to detail. Auth support is comprehensive and the desktop app is lightning fast.',
        rating: 5,
        color: 'bg-cyan-500',
    },
];

function TestimonialCard({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`glass rounded-2xl p-6 hover:border-orange-500/30 transition-all duration-500 hover:-translate-y-1 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${(index % 3) * 100}ms` }}
        >
            <div className="flex items-start gap-4 mb-4">
                <div className={`h-12 w-12 rounded-full ${testimonial.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {testimonial.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400 truncate">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 truncate">{testimonial.company}</p>
                </div>
                <Quote className="h-6 w-6 text-orange-500/30 flex-shrink-0" />
            </div>

            <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-orange-400 fill-orange-400" />
                ))}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
                "{testimonial.content}"
            </p>
        </div>
    );
}

export default function Testimonials() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/30 to-gray-950 pointer-events-none" />

            {/* Decorative glow */}
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm text-orange-400 mb-4">
                        Loved by Developers
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
                        What Developers <span className="gradient-text">Are Saying</span>
                    </h2>
                    <p className="max-w-2xl mx-auto text-lg text-gray-400">
                        Join thousands of developers who've made the switch to Postman Like
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TESTIMONIALS.map((testimonial, i) => (
                        <TestimonialCard key={testimonial.name} testimonial={testimonial} index={i} />
                    ))}
                </div>

                {/* Social proof */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-400">
                        <div className="flex -space-x-2">
                            {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'].map((color, i) => (
                                <div key={i} className={`h-8 w-8 rounded-full ${color} border-2 border-gray-950 flex items-center justify-center text-white text-xs font-bold`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <span className="text-sm">
                            Join <span className="text-orange-400 font-semibold">1,000+</span> developers already using Postman Like
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
