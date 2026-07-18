import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Theme, GroundingChunk } from './types';
import { LS, parseHash, hrefFor, playAudio } from './utils/helpers';
import { getComplexResponse, getGroundedResponse, getQuickResponse, getTextToSpeech } from './services/gemini';
import ChatWidget from './components/ChatWidget';
import AudioTranscriber from './components/AudioTranscriber';
import { SpeakerIcon, SpartanLogo, LightbulbIcon, CloseIcon, DownloadIcon, SpinnerIcon, DisciplineIcon, EmpathyIcon, StrategyIcon } from './components/icons';

// --- CONSTANTS ---
const ROUTE_LIST = ["/", "/method", "/playbooks", "/objections", "/tools", "/resources", "/about"];
const ROUTES = new Set(ROUTE_LIST);
const ROUTE_LABELS = new Map<string, string>([["/","Home"],["/method","The Spartan Method"],["/playbooks","Playbooks"],["/objections","Objections"],["/tools","AI Field Kit"],["/resources","Resources"],["/about","About"]]);

// --- HOOKS ---
function useTheme(): [Theme, React.Dispatch<React.SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("spartan_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? "light" : "dark";
  });
  
  useEffect(() => {
    LS.set("spartan_theme", theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--logo-inner', '#111827'); // new dark-surface color
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--logo-inner', '#f9fafb'); // new light-bg color
    }
  }, [theme]);
  
  return [theme, setTheme];
}

function useWindowWidth(): number {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

function useHashPath(): [{ path: string; params: URLSearchParams }, React.Dispatch<React.SetStateAction<{ path: string; params: URLSearchParams }>>] {
  const get = useCallback(() => parseHash(), []);
  const [state, setState] = useState(get);
  
  useEffect(() => {
    const onHashChange = () => setState(get());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash || window.location.hash === "#") {
      window.location.hash = hrefFor("/");
    }
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [get]);
  
  return [state, setState];
}

// --- UI COMPONENTS ---
const Spinner: React.FC<{className?: string}> = ({className}) => (
    <SpinnerIcon className={`animate-spin ${className}`} />
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-light-surface dark:bg-dark-surface border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const ErrorMessage: React.FC<{ message: string; className?: string }> = ({ message, className='' }) => (
  <div className={`mt-4 p-4 bg-red-500/10 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-sm font-semibold ${className}`}>
    <strong>Error:</strong> {message}
  </div>
);

const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'brand' | 'accent' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}> = ({ children, onClick, variant = 'ghost', className = '', type = 'button', disabled = false }) => {
  const baseClasses = "px-5 py-3 rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variantClasses = {
    brand: 'bg-light-brand dark:bg-dark-brand text-white hover:opacity-90 focus:ring-light-brand dark:focus:ring-dark-brand',
    accent: 'bg-light-accent dark:bg-dark-accent text-white hover:opacity-90 focus:ring-light-accent dark:focus:ring-dark-accent',
    danger: 'bg-light-danger dark:bg-dark-danger text-white hover:opacity-90 focus:ring-light-danger dark:focus:ring-dark-danger',
    ghost: 'bg-transparent text-light-text dark:text-dark-text border border-slate-400 dark:border-slate-600 hover:bg-black/5 dark:hover:bg-white/5 focus:ring-light-ring dark:focus:ring-dark-ring'
  };
  return <button type={type} onClick={onClick} className={`${baseClasses} ${variantClasses[variant]} ${className}`} disabled={disabled}>{children}</button>;
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isPrintable?: boolean;
}> = ({ isOpen, onClose, title, children, isPrintable = false }) => {
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in ${isPrintable ? 'printable-modal-container' : ''}`} 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-300 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center no-print">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label="Close modal">
            <CloseIcon />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};


// --- LAYOUT COMPONENTS ---
const Header: React.FC<{ current: string; onToggleTheme: () => void; theme: Theme }> = ({ current, onToggleTheme, theme }) => {
  const isNarrow = useWindowWidth() < 1024;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 no-print">
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between min-h-[80px]">
          <a href={hrefFor('/')} className="flex items-center gap-3 min-w-0">
            <SpartanLogo className="w-12 h-12 text-light-brand dark:text-dark-brand" />
            <div className="hidden sm:block">
              <h1 className="font-black text-xl text-light-text dark:text-dark-text whitespace-nowrap">Spartan Coaching</h1>
              <p className="text-sm text-light-sub dark:text-dark-sub">Expert Hospice Sales Training</p>
            </div>
          </a>
          {!isNarrow && (
            <nav className="flex items-center gap-2" aria-label="Main">
              {ROUTE_LIST.slice(1).map(href => (
                <a key={href} href={hrefFor(href)} className={`px-3 py-2 text-sm font-bold rounded-lg ${current === href ? 'bg-light-brand dark:bg-dark-brand text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-light-text dark:text-dark-text'}`}>{ROUTE_LABELS.get(href)}</a>
              ))}
              <button onClick={onToggleTheme} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-xl">{theme === 'dark' ? '☀️' : '🌙'}</button>
            </nav>
          )}
          {isNarrow && <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-light-text dark:text-dark-text text-sm font-bold">{menuOpen ? 'Close' : 'Menu'}</button>}
        </div>
        {isNarrow && menuOpen && (
          <nav className="py-4 grid gap-2" aria-label="Mobile">
            {ROUTE_LIST.map(href => (
              <a key={href} href={hrefFor(href)} onClick={() => setMenuOpen(false)} className={`block px-4 py-3 text-lg font-bold rounded-lg ${current === href ? 'bg-light-brand dark:bg-dark-brand text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-light-text dark:text-dark-text'}`}>{ROUTE_LABELS.get(href)}</a>
            ))}
            <button onClick={onToggleTheme} className="w-full mt-2 px-4 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-lg text-left font-bold text-light-text dark:text-dark-text">{theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
          </nav>
        )}
      </div>
    </header>
  );
};

const Footer: React.FC = () => (
  <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-light-surface dark:bg-dark-surface no-print">
    <div className="w-full max-w-7xl mx-auto px-6 flex items-center justify-between py-4">
      <p className="text-sm text-light-sub dark:text-dark-sub">&copy; {new Date().getFullYear()} Spartan Coaching</p>
      <div className="flex gap-4 text-sm">
        <a href="#" className="text-light-sub dark:text-dark-sub hover:text-light-text dark:hover:text-dark-text">Privacy</a>
        <a href="#" className="text-light-sub dark:text-dark-sub hover:text-light-text dark:hover:text-dark-text">Contact</a>
      </div>
    </div>
  </footer>
);

// --- PAGE COMPONENTS ---

const DailyDrillCard: React.FC = () => {
    const [drill, setDrill] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const cached = LS.get<{ date: string, drill: string } | null>('daily_drill', null);

        if (cached && cached.date === today) {
            setDrill(cached.drill);
        } else {
            setIsLoading(true);
            const prompt = "As the Spartan sales coach, provide a single, powerful, and actionable sales drill for today. It should be concise (2-3 sentences) and focus on one of the core pillars: Discipline, Empathy, or Strategy. Make it inspiring and challenging. Start with a bolded pillar name, like **Discipline Drill:**.";
            getQuickResponse(prompt)
                .then(response => {
                    setDrill(response);
                    LS.set('daily_drill', { date: today, drill: response });
                })
                .catch(e => {
                    console.error("Failed to get daily drill", e);
                    setDrill("Focus on your 'why' today. Every call is a chance to help a family.");
                })
                .finally(() => setIsLoading(false));
        }
    }, []);

    return (
        <Card className="bg-gradient-to-br from-light-brand to-light-accent dark:from-dark-brand dark:to-dark-accent text-white shadow-lg">
            <h3 className="font-bold text-xl flex items-center gap-2">
                <LightbulbIcon />
                Today's Spartan Drill
            </h3>
            <div className="mt-4 min-h-[6rem] flex items-center">
                {isLoading ? (
                    <div className="w-full flex justify-center"><Spinner className="w-8 h-8"/></div>
                ) : (
                    <p className="text-lg font-medium">{drill}</p>
                )}
            </div>
        </Card>
    );
};


const HomePage: React.FC = () => (
    <div className="w-full">
        <div className="w-full max-w-7xl mx-auto px-6 py-20 text-center">
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 leading-tight">Patient Outcomes First. <br/> Elite Reps Always.</h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-light-sub dark:text-dark-sub">This is the 'why' of Spartan Coaching. We exist to transform hospice sales from a transaction into a mission: ensuring every eligible patient receives the compassionate care they deserve. We build expert sales leaders who serve with integrity and lead with empathy.</p>
            <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <a href={hrefFor('/method')}><Button variant="brand">Master The Spartan Method</Button></a>
                <a href={hrefFor('/tools')}><Button variant="ghost">Explore Your AI Field Kit</Button></a>
            </div>
        </div>
        
        <div className="w-full max-w-7xl mx-auto px-6 py-12">
            <DailyDrillCard />
        </div>

        <div className="bg-light-surface dark:bg-dark-surface py-24">
             <div className="w-full max-w-7xl mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-bold text-light-brand dark:text-dark-brand">Our Philosophy</h2>
                  <h3 className="mt-2 text-4xl font-black text-light-text dark:text-dark-text">The Path to Mastery in Hospice Sales</h3>
                  <p className="mt-4 text-light-sub dark:text-dark-sub">Success isn't about closing deals. It's about opening doors to comfort, dignity, and peace. This requires more than sales tactics; it demands a disciplined mindset.</p>
                </div>
                <div className="mt-16 grid md:grid-cols-3 gap-8">
                    <Card className="text-center !bg-transparent border-none shadow-none">
                        <div className="flex justify-center"><DisciplineIcon className="w-12 h-12 text-light-brand dark:text-dark-brand"/></div>
                        <h4 className="mt-4 text-2xl font-bold text-light-text dark:text-dark-text">Discipline</h4>
                        <p className="mt-2 text-light-sub dark:text-dark-sub">Mastery demands structure. We provide a proven framework for everything from territory planning to handling complex objections, enabling consistent, high-impact performance.</p>
                    </Card>
                     <Card className="text-center !bg-transparent border-none shadow-none">
                        <div className="flex justify-center"><EmpathyIcon className="w-12 h-12 text-light-brand dark:text-dark-brand"/></div>
                        <h4 className="mt-4 text-2xl font-bold text-light-text dark:text-dark-text">Empathy</h4>
                        <p className="mt-2 text-light-sub dark:text-dark-sub">Connect on a human level. We teach you to listen with intent, understand the unspoken needs of providers and families, and build trust that transcends the sale.</p>
                    </Card>
                     <Card className="text-center !bg-transparent border-none shadow-none">
                        <div className="flex justify-center"><StrategyIcon className="w-12 h-12 text-light-brand dark:text-dark-brand"/></div>
                        <h4 className="mt-4 text-2xl font-bold text-light-text dark:text-dark-text">Strategy</h4>
                        <p className="mt-2 text-light-sub dark:text-dark-sub">Act with purpose. Leverage data, market insights, and AI-powered tools to identify the right partners and focus your energy where it matters most: on the patients who need you.</p>
                    </Card>
                </div>
            </div>
        </div>
    </div>
);

const CoreMethodPage: React.FC = () => {
  const [modalData, setModalData] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topics = {
    "Core Stories": {
      description: "Hospice is about comfort first, supported families, and care at home. These are the narratives that connect emotionally and build understanding.",
      prompt: "Elaborate on the 'Core Stories' of hospice. Provide three distinct, concise, and powerful story examples a sales rep can use to explain the value of hospice. Each story should highlight one aspect: comfort, family support, or care at home. Format the response using markdown."
    },
    "Ideal Referral": {
      description: "Identifying the right patient at the right time is key. Look for advanced illness, shifting goals, frequent hospital use, and caregiver strain.",
      prompt: "Detail the characteristics of an 'Ideal Referral' for hospice. Break it down into clinical indicators and psycho-social signs. Provide actionable questions a sales rep can ask a referral source (like a DON or physician) to identify these patients. Format the response using markdown."
    },
    "Green Flags": {
      description: "These are the clear clinical indicators that a conversation about hospice is appropriate: 2+ acute visits in 60 days, weight loss, falls, poor appetite, rapid decline.",
      prompt: "Explain the concept of 'Green Flags' for hospice eligibility. For each of the following flags (Two+ acute visits in 60 days, weight loss, falls, poor appetite, rapid decline), provide a brief explanation and a specific talking point a sales rep can use to educate a clinical partner. Format the response using markdown."
    },
    "The Art of the Follow-Up": {
        description: "Consistent, value-added follow-up builds trust and keeps you top-of-mind without being a pest. It's about service, not selling.",
        prompt: "Describe 'The Art of the Follow-Up' in hospice sales. Provide a framework for a 4-week follow-up cycle with a new referral source. Include the goal for each week's touchpoint (e.g., Week 1: Thank you, Week 2: Provide value, etc.) and give a specific example for each. Format the response using markdown."
    }
  };

  const handleCardClick = async (title: string, prompt: string) => {
    if (isLoading) return;
    setActiveTopic(title);
    setIsLoading(true);
    setError(null);
    setModalData({ title, content: '' }); // Open modal immediately with loading state
    try {
      const response = await getQuickResponse(prompt);
      setModalData({ title, content: response });
    } catch (e) {
      console.error("Failed to get AI elaboration", e);
      setError("Sorry, an error occurred while generating content. Please try again.");
      setModalData(null); // Close modal on error
    } finally {
      setIsLoading(false);
      setActiveTopic(null);
    }
  };

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-6 py-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">The Spartan Method</h1>
          <p className="text-lg text-light-sub dark:text-dark-sub mb-6">The Spartan Method is a philosophy built on three pillars: Discipline, Empathy, and Strategy. It's a structured approach to a field that is deeply human. This isn't just theory; it's a battle-tested framework for becoming a trusted healthcare partner. By mastering these principles, you create consistent results and build a career with impact.</p>
          <p className="text-light-sub dark:text-dark-sub mb-8">Below are the foundational tactics of the method. Click any principle to get AI-powered coaching, specific examples, and ready-to-use talking points.</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="grid md:grid-cols-2 gap-5 mt-4">
          {Object.entries(topics).map(([title, data]) => (
            <button 
              key={title} 
              onClick={() => handleCardClick(title, data.prompt)}
              className="text-left disabled:opacity-70 disabled:cursor-wait group"
              disabled={isLoading}
            >
              <Card className="h-full group-hover:ring-2 group-hover:ring-light-brand dark:group-hover:ring-dark-brand transition-all duration-300 transform group-hover:-translate-y-1">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-light-sub dark:text-dark-sub mt-1">{data.description}</p>
                {isLoading && activeTopic === title && (
                  <div className="mt-4 text-sm text-light-accent dark:text-dark-accent flex items-center gap-2"><Spinner className="w-4 h-4" /> Generating insights...</div>
                )}
              </Card>
            </button>
          ))}
        </div>
      </div>
      <Modal 
        isOpen={!!modalData} 
        onClose={() => setModalData(null)} 
        title={modalData?.title || ''}
      >
        {!isLoading && modalData?.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {modalData.content}
          </div>
        ) : (
          <div className="flex justify-center items-center h-48"><Spinner className="w-8 h-8"/></div>
        )}
      </Modal>
    </>
  );
};

const ObjectionsPage: React.FC = () => {
    const lines = [
        { q: "We are not ready for hospice.", a: "I completely understand. This is a significant decision, and the timing has to feel right for your family. Could we perhaps talk about what 'ready' might look like for you, so we can provide the right information when you need it, without any pressure?" },
        { q: "Our doctor will tell us when it's time.", a: "That's wonderful that you have such a strong trust in your doctor; thatrelationship is so important. To support that, we can act as an extra set of eyes and ears at home and share our observations with your doctor. This can help them have the full picture during your next conversation." },
        { q: "We feel that hospice means giving up hope.", a: "Thank you for sharing that; it's one of the most common and understandable concerns we hear. Hospice is not about giving up hope, but about redefining it. We focus hope on new goals: hope for comfort, hope for meaningful moments with family, and hope for living each day to its fullest, right at home." },
        { q: "The patient is still seeking curative treatment.", a: "It's so important to honor that desire for continued treatment, and we fully support it. Hospice can actually work alongside certain palliative treatments. Our goal isn't to replace care, but to add a layer of expert symptom management that can make those treatments more tolerable and improve quality of life." },
        { q: "We have a preferred hospice we already work with.", a: "That's great that you have a trusted partner. Patient choice is the most important thing. Our goal is simply to be a resource for you. If you ever have a patient or family who might benefit from a different approach, or if your preferred partner has a full caseload, we'd be honored to be your second call." },
        { q: "Hospice is too expensive.", a: "That is a very practical and important concern. Many people are surprised to learn that hospice is a fully covered benefit under Medicare, Medicaid, and most private insurances. This means there are typically no out-of-pocket costs for the patient or family for any care related to the hospice diagnosis." },
        { q: "We can manage the patient's symptoms ourselves.", a: "The dedication of your team is incredible, and you do amazing work. Think of us as specialists you can call on, just like a cardiologist or a pulmonologist. Our team is specifically trained in complex end-of-life symptom management, and we're available 24/7. We're here to support you, not replace you." },
        { q: "We want to do everything we can.", a: "I hear you, and that desire to provide the best possible care is so important. Hospice is not about doing less; it's about doing everything we can to ensure comfort and quality of life. We're adding a specialized layer of support focused entirely on managing symptoms and providing peace, right where the patient is most comfortable." }
    ];
    const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [playing, setPlaying] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string | null>>({});

    const generateResponse = async (objection: string) => {
        setLoading(prev => ({ ...prev, [objection]: true }));
        setErrors(prev => ({...prev, [objection]: null}));
        try {
            const prompt = `Generate an alternative, empathetic response to the common hospice objection: "${objection}". The response should be concise (2-3 sentences), reassuring, and suggest a gentle, collaborative next step. Frame it as a partnership.`;
            const response = await getQuickResponse(prompt);
            setAiResponses(prev => ({ ...prev, [objection]: response }));
        } catch (e) {
            console.error(e);
            setErrors(prev => ({...prev, [objection]: "Failed to generate AI response."}));
        } finally {
            setLoading(prev => ({ ...prev, [objection]: false }));
        }
    };
    
    const readAloud = async (text: string, key: string) => {
        if (playing === key) return;
        setPlaying(key);
        setErrors(prev => ({...prev, [key]: null}));
        try {
            const audioData = await getTextToSpeech(text);
            if (audioData) {
                await playAudio(audioData, 24000);
            } else {
                 throw new Error("No audio data returned");
            }
        } catch(e) {
            console.error(e);
            setErrors(prev => ({...prev, [key]: "Failed to generate audio."}));
        } finally {
            setPlaying(null);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-2">Objection Handling with AI</h1>
            <p className="text-lg text-light-sub dark:text-dark-sub mb-8">Objections aren't roadblocks; they are opportunities to educate and build trust. Here are expert-crafted responses. Use the AI to generate alternative approaches for any situation.</p>
            <div className="grid md:grid-cols-1 gap-6">
                {lines.map(l => (
                    <Card key={l.q} className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1">
                            <h3 className="font-bold text-lg text-light-text dark:text-dark-text">{l.q}</h3>
                            <p className="text-light-sub dark:text-dark-sub mt-2 border-l-4 border-light-accent dark:border-dark-accent pl-4 italic">"{l.a}"</p>
                        </div>
                        <div className="w-full md:w-1/2">
                            <Button onClick={() => generateResponse(l.q)} disabled={loading[l.q]} className="w-full text-sm">
                                {loading[l.q] ? <Spinner className="w-5 h-5" /> : <LightbulbIcon className="w-5 h-5" />}
                                {loading[l.q] ? 'Generating...' : 'Generate AI Alternative'}
                            </Button>
                            {errors[l.q] && <ErrorMessage message={errors[l.q]!} className="text-xs"/>}
                            {aiResponses[l.q] && (
                                <div className="mt-4 p-4 bg-black/5 dark:bg-white/5 rounded-lg">
                                    <p className="font-semibold text-sm mb-2 text-light-accent dark:text-dark-accent">AI Generated Response:</p>
                                    <p className="text-light-text dark:text-dark-text">{aiResponses[l.q]}</p>
                                    <button onClick={() => readAloud(aiResponses[l.q]!, l.q)} disabled={playing === l.q} className="mt-2 flex items-center gap-1 text-sm text-light-accent dark:text-dark-accent hover:underline disabled:opacity-50">
                                        <SpeakerIcon className="w-4 h-4" />
                                        {playing === l.q ? 'Playing...' : 'Read Aloud'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const PlaybooksPage: React.FC = () => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [desiredOutcomes, setDesiredOutcomes] = useState('');
    const [generatedPlaybook, setGeneratedPlaybook] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const classicPlaybooks = {
        "First Meeting with a SNF DON": "Create a playbook for a first-time meeting with a Director of Nursing at a Skilled Nursing Facility that has a preferred hospice provider. The goal is to establish credibility and secure a follow-up meeting, not to ask for referrals directly. The playbook should include discovery questions about their current provider and patient discharge challenges.",
        "Handling 'Too Early' from a Physician": "Generate a playbook for a conversation with a primary care physician who consistently says their patients are 'not ready yet' for hospice. The playbook should focus on educating the physician about the benefits of longer lengths of stay and how hospice can be a proactive part of their care continuum for patients with advanced illness.",
        "Presenting at a Clinic Lunch & Learn": "Craft a playbook for a 15-minute lunch & learn presentation to the clinical staff of a busy cardiology practice. The topic is 'Identifying Heart Failure Patients for Hospice.' The playbook needs a compelling opening, 3 key clinical triggers to look for, and a strong call to action that makes it easy for them to refer.",
        "Re-engaging a Cold Referral Source": "Create a playbook to re-engage with a referral source (e.g., an Assisted Living facility) that hasn't sent a referral in over 90 days. The strategy should focus on providing value and rebuilding the relationship, not on asking why they stopped referring. Include a specific 'value-add' idea.",
        "Introducing Palliative Care as a Bridge": "Generate a playbook for a conversation with an oncologist about utilizing your palliative care program as a bridge to hospice. The goal is to show how palliative care can co-exist with curative treatment to improve symptom management and introduce the hospice philosophy early."
    };

    const handleGenerate = async (prompt?: string) => {
        const finalPrompt = prompt || customPrompt;
        if (!finalPrompt) return;
        setIsLoading(true);
        setError(null);
        setGeneratedPlaybook('');
        try {
            const outcomesInstruction = desiredOutcomes 
                ? `
---
**CRITICAL DIRECTIVE: The user-provided 'Desired Outcomes or Success Metrics' are the single most important instruction. They are the highest priority and must guide every aspect of the generated playbook. If these outcomes are provided, they override all other general strategies and become the central focus of the entire plan. Do not deviate from this.**

**Desired Outcomes / Success Metrics:**
${desiredOutcomes}
---
` 
                : '';

            const fullPrompt = `You are an elite hospice sales strategist, a master of planning and execution, known as Spartan. Your mission is to generate a powerful, actionable sales playbook based on the provided scenario. Your tone should be authoritative, expert, and strategic.

${outcomesInstruction}

**Scenario Details:**
${finalPrompt}

**Required Playbook Structure (Use Markdown for formatting):**
You must follow this structure precisely for clarity and readability.
- Use a Level 1 Heading (\`#\`) for the playbook title.
- Use Level 2 Headings (\`##\`) for main sections like 'Strategic Overview' and 'Actionable Steps'.
- Under 'Actionable Steps', use Level 3 Headings (\`###\`) for each individual step.
- For each step, provide a brief description of the action, immediately followed by specific 'Talking Points'.
- Crucially, all 'Talking Points' MUST be formatted as distinct, indented markdown blockquotes (using \`>\`). This is essential to visually separate them from the action description.
- The 'Key Takeaways' section is mandatory and non-negotiable. It must be the final section and summarize the 3-5 most critical, actionable points from the playbook. For visual distinction as a summary box, please wrap the ENTIRE 'Key Takeaways' section (both its '## Key Takeaways' heading and the bulleted list) inside a markdown blockquote.`;
            
            const response = await getComplexResponse(fullPrompt);
            setGeneratedPlaybook(response);
        } catch (e) {
            console.error(e);
            setError("An unexpected error occurred while generating the playbook. The AI may be experiencing high demand. Please try again in a moment.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExportPdf = () => {
        window.print();
    };

    const handleExportTxt = () => {
        if (!generatedPlaybook) return;
        const blob = new Blob([generatedPlaybook], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spartan-playbook.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-2">AI Custom Playbook Generator</h1>
            <p className="text-lg text-light-sub dark:text-dark-sub mb-8">A playbook is not just a script; it's a strategic battle plan. Describe any sales scenario, and the Spartan AI will generate a complete, strategic playbook to guide you to success.</p>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6 no-print">
                    <Card>
                        <h2 className="text-xl font-bold">1. Describe a Scenario</h2>
                        <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Be specific about the referral source, challenges, and goals.</p>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="e.g., 'Building a new relationship with a busy cardiology clinic that has never used hospice before.'"
                            className="w-full h-32 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-light-ring dark:focus:ring-dark-ring focus:outline-none"
                        />

                        <h2 className="text-xl font-bold mt-6">2. Desired Outcomes (Optional)</h2>
                        <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Specify your goals. The AI will prioritize these to tailor the playbook.</p>
                         <textarea
                            value={desiredOutcomes}
                            onChange={(e) => setDesiredOutcomes(e.target.value)}
                            placeholder="e.g., 'Secure a follow-up meeting with the DON', 'Get 3 new patient referrals this month.'"
                            className="w-full h-24 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-light-ring dark:focus:ring-dark-ring focus:outline-none"
                        />
                        
                        <Button onClick={() => handleGenerate()} variant="brand" className="mt-6 w-full" disabled={isLoading || !customPrompt}>
                            {isLoading && <Spinner className="w-5 h-5"/>}
                            {isLoading ? 'Thinking...' : 'Generate Custom Playbook'}
                        </Button>
                    </Card>
                     <Card>
                        <h2 className="text-xl font-bold">Classic Spartan Playbooks</h2>
                        <p className="text-sm text-light-sub dark:text-dark-sub mt-1 mb-4">Need inspiration? Click a classic scenario to instantly generate a proven playbook.</p>
                        <div className="space-y-2">
                            {Object.entries(classicPlaybooks).map(([title, prompt]) => (
                                <button key={title} onClick={() => { setCustomPrompt(prompt); setDesiredOutcomes(''); handleGenerate(prompt); }} className="text-left w-full text-sm font-semibold p-3 rounded-md bg-light-bg dark:bg-dark-surface hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                    {title}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     {isLoading && <div className="text-center p-10 flex flex-col items-center justify-center h-full"><Spinner className="w-10 h-10"/><p className="text-lg mt-4">AI strategist is working...</p><p className="text-sm text-light-sub dark:text-dark-sub">This may take a moment for complex scenarios.</p></div>}
                     {!isLoading && !generatedPlaybook && !error && <div className="text-center p-10 h-full flex flex-col items-center justify-center bg-light-surface dark:bg-dark-surface rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700"><p className="text-lg font-semibold">Your Generated Playbook Will Appear Here</p><p className="text-sm text-light-sub dark:text-dark-sub max-w-sm mt-2">Use the controls on the left to describe your scenario or choose a classic playbook to get started.</p></div>}
                     {error && <ErrorMessage message={error} />}
                     {generatedPlaybook && (
                         <div className="printable-area">
                            <Card>
                               <div className="prose dark:prose-invert max-w-none playbook-output whitespace-pre-wrap">{generatedPlaybook}</div>
                           </Card>
                           <div className="mt-4 flex gap-4 no-print">
                               <Button onClick={handleExportPdf} variant="brand"><DownloadIcon className="w-5 h-5"/> Export as PDF</Button>
                               <Button onClick={handleExportTxt} variant="ghost"><DownloadIcon className="w-5 h-5"/> Export as TXT</Button>
                           </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ToolsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('planner');
    
    const TabButton: React.FC<{tabId: string; children: React.ReactNode}> = ({tabId, children}) => (
        <button 
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 font-bold rounded-lg transition-colors text-sm sm:text-base ${activeTab === tabId ? 'bg-light-brand dark:bg-dark-brand text-white' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
            {children}
        </button>
    );

    const PlannerTool = () => {
        const [scenario, setScenario] = useState('');
        const [source, setSource] = useState('SNF');
        const [plan, setPlan] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const handleGenerate = async () => {
            if (!scenario) return;
            setIsLoading(true);
            setError(null);
            setPlan('');
            const prompt = `Create a pre-call plan for a hospice sales rep visiting a ${source}. The specific scenario is: "${scenario}". The plan should be concise and actionable, including: 1. A clear objective for the call. 2. 3-4 key discovery questions to ask. 3. 2-3 value proposition points tailored to the ${source}. 4. A potential objection and a compassionate response. Use markdown for formatting.`;
            try {
                const response = await getComplexResponse(prompt);
                setPlan(response);
            } catch (e) { console.error(e); setError("Failed to generate pre-call plan."); }
            finally { setIsLoading(false); }
        };

        return <>
            <h3 className="text-xl font-bold">Pre-Call Planner</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Discipline begins before you walk in the door. Generate a strategic plan for your next sales call to ensure every interaction has a purpose.</p>
            <div className="space-y-4">
                <select value={source} onChange={e => setSource(e.target.value)} className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600">
                    <option>SNF</option><option>ALF</option><option>Hospital</option><option>Cardiology</option><option>Pulmonology</option><option>Primary Care</option>
                </select>
                <textarea value={scenario} onChange={e => setScenario(e.target.value)} placeholder="Key goals or challenges for this call..." className="w-full h-24 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                <Button variant="brand" onClick={handleGenerate} disabled={isLoading}>{isLoading && <Spinner className="w-5 h-5"/>}{isLoading ? 'Generating...' : 'Generate Plan'}</Button>
            </div>
            {isLoading && <div className="mt-4 text-center flex items-center justify-center gap-2"><Spinner className="w-5 h-5" /> AI is building your plan...</div>}
            {error && <ErrorMessage message={error} />}
            {plan && <Card className="mt-4"><div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{plan}</div></Card>}
        </>;
    };
    
    // Other tools would follow the same error handling pattern...
    const GoalSetterTool = () => {
        const [goals, setGoals] = useState(LS.get('weekly_goals', { contacts: '', meetings: '', referrals: ''}));
        const [plan, setPlan] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        
        useEffect(() => { LS.set('weekly_goals', goals); }, [goals]);

        const handleGenerate = async () => {
            if (!goals.contacts && !goals.meetings && !goals.referrals) return;
            setIsLoading(true);
            setError(null);
            setPlan('');
            const prompt = `As a Spartan sales coach, create a weekly micro-plan to help a hospice sales rep achieve the following goals:
- New Contacts: ${goals.contacts || 'N/A'}
- Meetings Set: ${goals.meetings || 'N/A'}
- Patient Referrals: ${goals.referrals || 'N/A'}
The plan should be motivational, concise, and provide 2-3 actionable focus areas for the week to hit these numbers. Use markdown for formatting.`;
            try {
                const response = await getQuickResponse(prompt);
                setPlan(response);
            } catch (e) { console.error(e); setError("Failed to generate weekly plan."); }
            finally { setIsLoading(false); }
        };

        return <>
            <h3 className="text-xl font-bold">Weekly Goal Setter</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Discipline is measured by results. Set your weekly targets and get an AI-generated micro-plan to stay focused and accountable.</p>
            <div className="grid sm:grid-cols-3 gap-4">
                <div>
                    <label className="font-bold text-sm">New Contacts</label>
                    <input type="number" value={goals.contacts} onChange={e => setGoals(g => ({...g, contacts: e.target.value}))} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                </div>
                <div>
                    <label className="font-bold text-sm">Meetings Set</label>
                    <input type="number" value={goals.meetings} onChange={e => setGoals(g => ({...g, meetings: e.target.value}))} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                </div>
                <div>
                    <label className="font-bold text-sm">Patient Referrals</label>
                    <input type="number" value={goals.referrals} onChange={e => setGoals(g => ({...g, referrals: e.target.value}))} className="w-full mt-1 p-2 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                </div>
            </div>
            <Button variant="brand" className="mt-4" onClick={handleGenerate} disabled={isLoading}>{isLoading && <Spinner className="w-5 h-5"/>}{isLoading ? 'Generating...' : 'Generate Weekly Plan'}</Button>
            {isLoading && <div className="mt-4 text-center flex items-center justify-center gap-2"><Spinner className="w-5 h-5" /> AI is building your plan...</div>}
            {error && <ErrorMessage message={error} />}
            {plan && <Card className="mt-4"><div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{plan}</div></Card>}
        </>;
    }
    const ResearchTool = () => {
        const [aiQuery, setAiQuery] = useState('');
        const [aiResponse, setAiResponse] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
        
        useEffect(() => {
            navigator.geolocation.getCurrentPosition(
                (position) => { setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }); },
                (error) => { console.warn(error.message); }
            );
        }, []);
        
        const handleSearch = async (tool: 'search' | 'maps') => {
            if (!aiQuery) return;
            setIsLoading(true); setAiResponse(null); setError(null);
            try {
                const response = await getGroundedResponse(aiQuery, tool, tool === 'maps' ? location : undefined);
                setAiResponse(response);
            } catch(e) { console.error(e); setError(`Failed to get response using ${tool}.`); }
            finally { setIsLoading(false); }
        }

        return <>
            <h3 className="text-xl font-bold">Market Research</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Strategy requires intelligence. Get up-to-date information powered by Google Search and Maps to understand your territory and identify opportunities.</p>
            <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="e.g., 'Latest Medicare hospice regulations' or 'nearby skilled nursing facilities'" className="w-full p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
            <div className="flex gap-4 mt-4">
                <Button onClick={() => handleSearch('search')} disabled={isLoading}>Search Web</Button>
                <Button onClick={() => handleSearch('maps')} disabled={isLoading || !location}>Search Maps</Button>
            </div>
            {isLoading && <div className="mt-4 text-center flex items-center justify-center gap-2"><Spinner className="w-5 h-5" /> Searching...</div>}
            {error && <ErrorMessage message={error} />}
            {aiResponse && <Card className="mt-4"><p className="whitespace-pre-wrap">{aiResponse.text}</p>{aiResponse.chunks.length > 0 && <div className="mt-4"><h4 className="font-semibold text-sm mb-2">Sources:</h4><ul className="list-disc list-inside text-sm space-y-1">{aiResponse.chunks.map((chunk, i) => { const source = chunk.web || chunk.maps; return source ? <li key={i}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-light-accent dark:text-dark-accent hover:underline">{source.title}</a></li> : null; })}</ul></div>}</Card>}
        </>
    };

    const NotesTool = () => {
        const [notes, setNotes] = useState(LS.get('notes', ''));
        useEffect(() => { LS.set('notes', notes); }, [notes]);
        return <>
            <h3 className="text-xl font-bold">Field Notes</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Discipline means capturing insights. Record audio notes from your visits for automatic transcription, ensuring no detail is lost.</p>
            <AudioTranscriber onTranscriptionUpdate={(text) => setNotes(text)} currentNote={notes} />
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Type or use the recorder to take notes..." className="w-full h-64 mt-4 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
        </>
    };

    const StrategyForgeTool = () => {
        const [challenge, setChallenge] = useState('');
        const [strategy, setStrategy] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string|null>(null);

        const handleGenerate = async () => {
            if (!challenge) return;
            setIsLoading(true);
            setStrategy('');
            setError(null);
            const prompt = `Act as a master strategist for hospice growth. Analyze the following strategic challenge and produce a comprehensive, multi-faceted plan. The plan should include market analysis, key stakeholder identification, a phased action plan with timelines, and metrics for success. Challenge: "${challenge}"`;
            try {
                const response = await getComplexResponse(prompt);
                setStrategy(response);
            } catch (e) { console.error(e); setError("Failed to generate strategy. This is an advanced query; please try again."); }
            finally { setIsLoading(false); }
        };

        return <>
            <h3 className="text-xl font-bold">Strategy Forge</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">For your biggest challenges. Describe a long-term strategic goal, and the AI will act as a master strategist, producing a comprehensive plan that includes market analysis and a phased action plan.</p>
            <div className="space-y-4">
                <textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Describe a long-term strategic challenge, e.g., 'breaking into a market dominated by a competitor' or 'shifting physician perception of our hospice.'" className="w-full h-32 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                <Button variant="brand" onClick={handleGenerate} disabled={isLoading}>{isLoading && <Spinner className="w-5 h-5"/>}{isLoading ? 'Forging Strategy...' : 'Generate Strategic Plan'}</Button>
            </div>
            {isLoading && <div className="mt-4 text-center flex items-center justify-center gap-2"><Spinner className="w-5 h-5" /> AI is performing deep analysis...</div>}
            {error && <ErrorMessage message={error} />}
            {strategy && <Card className="mt-4"><div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{strategy}</div></Card>}
        </>;
    };

    const ComplexCaseAnalystTool = () => {
        const [caseDetails, setCaseDetails] = useState('');
        const [analysis, setAnalysis] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState<string|null>(null);

        const handleGenerate = async () => {
            if (!caseDetails) return;
            setIsLoading(true);
            setAnalysis('');
            setError(null);
            const prompt = `Act as an expert hospice case consultant and ethicist. Analyze the following complex patient case. Provide a breakdown of the key issues, identify potential ethical challenges, suggest communication strategies for family and clinicians, and outline a patient-centered plan of care. Do not include any personally identifiable information. Case Details: "${caseDetails}"`;
            try {
                const response = await getComplexResponse(prompt);
                setAnalysis(response);
            } catch (e) { console.error(e); setError("Failed to generate analysis. This is an advanced query; please try again."); }
            finally { setIsLoading(false); }
        };

        return <>
            <h3 className="text-xl font-bold">Complex Case Analyst</h3>
            <p className="text-light-sub dark:text-dark-sub mt-1 mb-4">Empathy in action. Get expert analysis on difficult patient cases, including ethical and communication guidance to ensure the best possible patient outcome.</p>
            <div className="space-y-4">
                <textarea value={caseDetails} onChange={e => setCaseDetails(e.target.value)} placeholder="Describe a complex patient case, e.g., 'patient with conflicting family wishes' or 'ethically ambiguous clinical situation.' Do not include PII." className="w-full h-32 p-3 rounded-lg bg-light-bg dark:bg-dark-surface border border-slate-300 dark:border-slate-600" />
                <Button variant="brand" onClick={handleGenerate} disabled={isLoading}>{isLoading && <Spinner className="w-5 h-5"/>}{isLoading ? 'Analyzing Case...' : 'Generate Case Analysis'}</Button>
            </div>
            {isLoading && <div className="mt-4 text-center flex items-center justify-center gap-2"><Spinner className="w-5 h-5" /> AI is consulting on the case...</div>}
            {error && <ErrorMessage message={error} />}
            {analysis && <Card className="mt-4"><div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">{analysis}</div></Card>}
        </>;
    };

    const toolMap = {
      planner: <PlannerTool />,
      goals: <GoalSetterTool />,
      research: <ResearchTool />,
      notes: <NotesTool />,
      strategy: <StrategyForgeTool />,
      analyst: <ComplexCaseAnalystTool />,
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-2">AI Field Kit</h1>
            <p className="text-lg text-light-sub dark:text-dark-sub mb-6">This is your strategic arsenal. Each tool is designed to make you faster, smarter, and more effective in the field, allowing you to focus on what truly matters: building relationships and connecting patients to care.</p>
            <Card>
                <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 -mb-px flex-wrap">
                        <TabButton tabId="planner">Pre-Call Planner</TabButton>
                        <TabButton tabId="goals">Weekly Goals</TabButton>
                        <TabButton tabId="research">Research</TabButton>
                        <TabButton tabId="notes">Field Notes</TabButton>
                        <TabButton tabId="strategy">Strategy Forge</TabButton>
                        <TabButton tabId="analyst">Case Analyst</TabButton>
                    </div>
                </div>
                <div>
                    {toolMap[activeTab as keyof typeof toolMap]}
                </div>
            </Card>
        </div>
    );
};

const ResourcesPage: React.FC = () => {
    const [modalResource, setModalResource] = useState<{ title: string; content: string } | null>(null);
    const [isResourceLoading, setIsResourceLoading] = useState(false);
    const [activeResourceTitle, setActiveResourceTitle] = useState<string | null>(null);
    const [resourceError, setResourceError] = useState<string | null>(null);

    const resources = [
        {
            title: "The First 90 Days: A Spartan's Guide to Dominating a New Territory",
            description: "A week-by-week action plan for new hospice sales reps to build momentum, establish credibility, and secure early wins. This is your roadmap to becoming a top performer from day one.",
        },
        {
            title: "Advanced Communication: Reframing the Hospice Conversation",
            description: "Move beyond features and benefits. This guide provides scripts and frameworks for discussing goals of care with clinical partners, families, and patients with empathy and authority.",
        },
        {
            title: "The SNF Partnership Playbook: From Gatekeeper to Advocate",
            description: "A strategic guide to building deep, trusting relationships with Skilled Nursing Facility staff, turning them into your strongest referral partners. Learn the language and priorities of the SNF world.",
        },
        {
            title: "Mastering the Territory: A Data-Driven Approach to Hospice Sales",
            description: "Learn to analyze market data, identify high-potential accounts, and allocate your time effectively. This guide turns your territory from a map into a strategic battlefield where you always win.",
        },
        {
            title: "Ethical Persuasion: Building Unshakeable Trust with Clinicians",
            description: "Discover the psychological principles behind building trust and influencing clinical decision-making ethically. This guide focuses on long-term relationship building over short-term gains.",
        }
    ];

    const handleResourceClick = async (title: string, description: string) => {
        setResourceError(null);
        setIsResourceLoading(true);
        setActiveResourceTitle(title);
        setModalResource({ title, content: '' }); // Open modal with loading state
        
        const prompt = `You are a master hospice sales coach known as Spartan. Write the full, comprehensive content for an expert guide titled: "${title}".
        The guide's purpose is to: "${description}".
        The content should be detailed, actionable, well-structured with clear headings, and written in an authoritative and expert tone. Use markdown for formatting.`;

        try {
            const response = await getComplexResponse(prompt);
            setModalResource({ title, content: response });
        } catch (e) {
            console.error("Failed to generate resource content", e);
            setResourceError("Could not generate the resource content. Please try again later.");
        } finally {
            setIsResourceLoading(false);
            setActiveResourceTitle(null);
        }
    };

    return (
        <>
        <div className="w-full max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-bold mb-2">Expert Resources & Playbooks</h1>
            <p className="text-lg text-light-sub dark:text-dark-sub mb-6">Knowledge is power. These expert-crafted guides, developed from years of in-the-field experience, deepen your knowledge and sharpen your skills. Click any guide to generate the full content.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map(res => (
                    <button key={res.title} onClick={() => handleResourceClick(res.title, res.description)} className="text-left group disabled:opacity-50" disabled={isResourceLoading}>
                         <Card className="flex flex-col h-full group-hover:ring-2 group-hover:ring-light-brand dark:group-hover:ring-dark-brand transition-all duration-300 transform group-hover:-translate-y-1">
                            <h3 className="text-xl font-bold text-light-text dark:text-dark-text">{res.title}</h3>
                            <p className="mt-2 text-light-sub dark:text-dark-sub flex-grow">{res.description}</p>
                            <div className="mt-6">
                                <div className={`w-full px-5 py-3 rounded-lg font-bold transition-all text-white bg-light-brand dark:bg-dark-brand flex items-center justify-center gap-2`}>
                                   {isResourceLoading && activeResourceTitle === res.title ? <Spinner className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5"/>}
                                   {isResourceLoading && activeResourceTitle === res.title ? 'Generating...' : 'View & Download Guide'}
                                </div>
                            </div>
                        </Card>
                    </button>
                ))}
            </div>
        </div>
        <Modal 
            isOpen={!!modalResource} 
            onClose={() => setModalResource(null)} 
            title={modalResource?.title || ''}
            isPrintable={true}
        >
            {isResourceLoading ? (
                 <div className="flex justify-center items-center h-48"><Spinner className="w-8 h-8"/></div>
            ) : resourceError ? (
                <ErrorMessage message={resourceError} />
            ) : (
                <>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap" id="printable-resource">
                        {modalResource?.content}
                    </div>
                    <Button variant="brand" className="mt-6 no-print" onClick={() => window.print()}>
                        Print or Save as PDF
                    </Button>
                </>
            )}
        </Modal>
        </>
    );
};

const AboutPage: React.FC = () => (
    <div className="w-full max-w-4xl mx-auto px-6 py-16">
        <Card>
            <div className="prose dark:prose-invert max-w-none">
                <h1 className="text-center">The 'Why' Behind Spartan Coaching</h1>
                <p className="lead text-center">We believe that every family facing the end of life deserves peace, and every hospice sales professional has the power to deliver it.</p>
                
                <h2>Our Mission is Simple: Better Patient Outcomes.</h2>
                <p>Spartan Coaching was born from a frustration with the status quo. Too often, hospice sales is treated like any other sales job—a numbers game of calls and quotas. This approach fails patients and burns out passionate professionals. We saw a critical need for a new way—a method that puts the patient, not the metric, at the center of every action.</p>
                <p>Our mission is to elevate the role of the hospice sales representative from a vendor to a vital part of the healthcare continuum. We do this by creating elite, empathetic, and strategic leaders who understand that their true purpose is not to sell a service, but to ensure that every eligible patient gets access to the compassionate care they are entitled to.</p>

                <h2>The Philosophy: Discipline, Empathy, Strategy</h2>
                <p>The Spartan name was chosen with intent. It represents the discipline required for mastery, the strength to handle difficult conversations, and the strategic mind needed to navigate a complex healthcare landscape. But our method is not about being harsh; it's about being effective.</p>
                <ul>
                    <li><strong>Discipline</strong> is our structure for success. It's the commitment to a proven process, from pre-call planning to post-call analysis, that ensures consistent, high-impact performance.</li>
                    <li><strong>Empathy</strong> is our core connector. It's the ability to listen with intent, to understand the unspoken fears and needs of clinicians and families, and to build relationships founded on unshakable trust.</li>
                    <li><strong>Strategy</strong> is our engine for impact. It's the purpose behind every action, using data, market knowledge, and intelligent tools to focus energy where it matters most: on the patients who need our help.</li>
                </ul>
                
                <h2>Who We Serve</h2>
                <p>We work with hospice agencies who are committed to growth but refuse to sacrifice quality of care. We train sales representatives who are driven by purpose, not just commission. If you believe that sales can be a service and that your work can genuinely change lives for the better, you are in the right place.</p>

                <h2>The Result: An Impactful Career</h2>
                <p>When you master the Spartan Method, you don't just become a better salesperson. You become a more effective advocate for patients. You build a career that is not only financially rewarding but deeply fulfilling. You go home every night knowing that your work brought comfort and dignity to a family in your community. That is the Spartan victory. That is our why.</p>
            </div>
        </Card>
    </div>
);


// --- APP ---
export default function App() {
  const [theme, setTheme] = useTheme();
  const [{ path }] = useHashPath();
  const currentPath = ROUTES.has(path) ? path : "/";

  const renderPage = () => {
     switch (currentPath) {
      case "/": return <HomePage />;
      case "/method": return <CoreMethodPage />;
      case "/objections": return <ObjectionsPage />;
      case "/playbooks": return <PlaybooksPage />;
      case "/tools": return <ToolsPage />;
      case "/resources": return <ResourcesPage />;
      case "/about": return <AboutPage />;
      default:
        return <div className="w-full max-w-7xl mx-auto px-6 py-10"><Card><h1 className="text-2xl font-bold">Page Not Found</h1></Card></div>;
     }
  }

  return (
    <div className={`min-h-screen font-sans bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex flex-col`}>
      <Header current={currentPath} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} theme={theme} />
      <main id="main" className="flex-1">
        {renderPage()}
      </main>
      <Footer />
      <div className="no-print">
        <ChatWidget />
      </div>
    </div>
  );
}
