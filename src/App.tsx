import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MessageSquare, 
  CloudSun, 
  Home as HomeIcon,
  Languages,
  AlertCircle,
  Menu,
  ChevronRight,
  Droplets,
  Wind,
  Thermometer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn, fileToBase64 } from './lib/utils';
import { analyzeCropImage, getGeneralAdvisory } from './lib/gemini';
import { getWeatherData, type WeatherData } from './lib/weather';

// --- Types ---
type Tab = 'home' | 'doctor' | 'advisory' | 'weather';
type Language = 'English' | 'Telugu' | 'Hindi';

// --- Components ---

const LanguageSelector = ({ current, onSelect }: { current: Language, onSelect: (l: Language) => void }) => (
  <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200">
    {(['English', 'Hindi', 'Telugu'] as Language[]).map((lang) => (
      <button
        key={lang}
        onClick={() => onSelect(lang)}
        className={cn(
          "px-3 py-1 text-xs font-medium rounded-full transition-all",
          current === lang ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-white"
        )}
      >
        {lang}
      </button>
    ))}
  </div>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-display font-bold text-slate-800">{title}</h2>
    {subtitle && <p className="text-slate-500 text-sm">{subtitle}</p>}
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [language, setLanguage] = useState<Language>('English');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);

  // Doctor State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);

  // Advisory State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(loc);
          getWeatherData(loc.lat, loc.lon).then(setWeather).catch(console.error);
        },
        (err) => console.error("Geolocation error:", err)
      );
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const base64 = await fileToBase64(file);
      setSelectedImage(`data:${file.type};base64,${base64}`);
      const result = await analyzeCropImage(base64, file.type, language);
      setDiagnosis(result || "Could not analyze the image. Please try again.");
    } catch (error) {
      setDiagnosis("An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    try {
      setLoading(true);
      const aiResponse = await getGeneralAdvisory(userMsg, weather, language);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Error communicating with AI advisor." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Tabs ---

  const renderHome = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative h-64 rounded-[40px] overflow-hidden group shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000" 
          alt="Agriculture" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2d4c3b]/90 via-[#2d4c3b]/40 to-transparent flex flex-col justify-end p-8 text-white">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80 mb-1">Morning Insight</p>
          <h1 className="text-3xl font-serif italic mb-4">Welcome to your fields.</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-300" />
              <span className="text-lg font-display font-medium">{weather?.temp != null ? `${weather.temp}°C` : '--'}</span>
            </div>
            <div className="flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-medium">{weather?.condition || 'Analyzing...'}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-serif italic text-agri-leaf">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Camera, label: 'Doctor', color: 'bg-white', tab: 'doctor' },
            { icon: MessageSquare, label: 'Advisor', color: 'bg-white', tab: 'advisory' },
            { icon: CloudSun, label: 'Weather', color: 'bg-white', tab: 'weather' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(item.tab as Tab)}
              className={cn(
                "p-4 rounded-3xl border border-white/50 shadow-sm flex flex-col items-center justify-center gap-2 hover:bg-agri-wheat transition-all active:scale-95",
                item.color
              )}
            >
              <item.icon className="w-6 h-6 text-agri-leaf" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-agri-leaf rounded-[40px] p-8 text-agri-earth shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-agri-earth/20 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Expert Advisory</span>
          </div>
          <p className="text-lg font-serif italic leading-relaxed mb-6">
            "{weather?.dailyAdvice || "Reading the wind and the skies for your crops..."}"
          </p>
          <div className="h-[1px] w-full bg-agri-earth/20 mb-6"></div>
          <div className="flex justify-between items-center">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-agri-leaf bg-agri-wheat flex items-center justify-center text-[10px] font-bold text-agri-leaf">
                  A{i}
                </div>
              ))}
            </div>
            <button className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
              Read More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
      </section>
    </div>
  );

  const renderDoctor = () => (
    <div className="space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-agri-sage mb-2">Vision Analysis</p>
        <h2 className="text-4xl font-serif italic text-agri-leaf leading-tight">Crop Doctor</h2>
      </div>
      
      {!selectedImage ? (
        <label className="block relative group cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-[#d2c7b5] bg-white/50 rounded-[40px] p-16 text-center group-hover:border-agri-leaf group-hover:bg-agri-wheat transition-all flex flex-col items-center">
            <div className="w-20 h-20 bg-agri-leaf text-agri-earth rounded-full flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
              <Camera className="w-10 h-10" />
            </div>
            <p className="text-xl font-serif italic text-agri-leaf">Capture your crop</p>
            <p className="text-slate-500 text-xs mt-2 font-medium uppercase tracking-widest">Tap to start diagnosis</p>
          </div>
        </label>
      ) : (
        <div className="space-y-8">
          <div className="relative rounded-[40px] overflow-hidden aspect-[4/5] shadow-2xl ring-8 ring-white">
            <img src={selectedImage} alt="Crop" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <button 
              onClick={() => { setSelectedImage(null); setDiagnosis(null); }}
              className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full backdrop-blur-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              Reset 
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-[40px] border border-white">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-agri-leaf/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-agri-leaf border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-agri-leaf font-serif italic text-xl">Consulting with AI Experts...</p>
              <p className="text-slate-400 text-[10px] mt-2 uppercase tracking-widest font-bold">Scanning pixel by pixel</p>
            </div>
          ) : diagnosis && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[40px] shadow-sm border border-white"
            >
              <div className="flex items-center gap-3 mb-8 p-3 bg-red-50 rounded-2xl border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Professional Warning</p>
              </div>
              <div className="markdown-body">
                <ReactMarkdown>{diagnosis}</ReactMarkdown>
              </div>
              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Diagnosis Report #8210</p>
                <button className="bg-agri-leaf text-agri-earth px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-agri-leaf/20">Save Report</button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );

  const renderAdvisory = () => (
    <div className="flex flex-col h-[75vh] pb-24 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-agri-sage mb-1">Rural Support</p>
          <h2 className="text-3xl font-serif italic text-agri-leaf leading-none">Smart Advisor</h2>
        </div>
        <div className="flex -space-x-3">
          {[1, 2].map(i => (
            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-agri-wheat flex items-center justify-center text-xs font-bold text-agri-leaf shadow-sm italic">Dr</div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 py-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-6 ring-8 ring-agri-wheat/50">
              <MessageSquare className="w-6 h-6 text-agri-leaf" />
            </div>
            <p className="text-agri-leaf font-serif italic text-xl mb-2">How can I assist your harvest?</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Ask about soil, seeds, or irrigation</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-6 max-w-[90%] font-sans",
              msg.role === 'user' 
                ? "bg-agri-leaf text-white ml-auto rounded-[32px] rounded-tr-none shadow-lg" 
                : "bg-white border border-white text-slate-800 rounded-[32px] rounded-tl-none shadow-sm"
            )}
          >
             <div className="markdown-body !m-0 !p-0">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="bg-white/50 p-4 rounded-3xl w-20 flex gap-1.5 items-center justify-center ring-1 ring-white">
            <span className="w-2 h-2 bg-agri-leaf/40 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-agri-leaf/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-agri-leaf/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-[32px] shadow-2xl border border-white flex gap-3 items-center ring-4 ring-agri-wheat/30">
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask me anything..."
          className="flex-1 px-6 py-3 bg-slate-50/50 rounded-2xl outline-none text-slate-800 font-medium placeholder:text-slate-400"
        />
        <button 
          onClick={handleSendMessage}
          disabled={loading || !chatInput.trim()}
          className="bg-agri-leaf text-white w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-30 transition-all active:scale-90"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );

  const renderWeather = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-agri-sage mb-2">Micro-Climate</p>
        <h2 className="text-4xl font-serif italic text-agri-leaf leading-tight">Field Weather</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {[
          { icon: Thermometer, label: 'Temperature', value: `${weather?.temp}°C`, color: 'text-orange-500' },
          { icon: Droplets, label: 'Humidity', value: `${weather?.humidity}%`, color: 'text-blue-500' },
          { icon: Wind, label: 'Wind Flow', value: `${weather?.windSpeed} kh`, color: 'text-emerald-500' },
          { icon: CloudSun, label: 'Sky Condition', value: weather?.condition, color: 'text-indigo-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] shadow-sm border border-white flex flex-col items-center">
            <div className={cn("p-4 rounded-3xl bg-slate-50 mb-4", stat.color)}>
              <stat.icon className="w-8 h-8" />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold font-display text-agri-leaf text-center">{stat.value || '--'}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-orange-50 p-10 rounded-[40px] border border-orange-100 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
          <AlertCircle className="w-6 h-6 text-orange-600" />
        </div>
        <h4 className="font-serif italic text-2xl text-orange-950 mb-4">Farmer's Guidance for Today</h4>
        <p className="text-orange-900/70 text-lg font-serif italic leading-relaxed">
          "{weather?.dailyAdvice || "Waiting for weather synchronization..."}"
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-[#f5f2ed] min-h-screen flex flex-col font-sans selection:bg-agri-wheat selection:text-agri-leaf">
      {/* Header */}
      <header className="p-8 pb-4 flex justify-between items-start sticky top-0 z-50 bg-[#f5f2ed]/70 backdrop-blur-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <HomeIcon className="w-4 h-4 text-agri-leaf" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-agri-leaf/40">KisanAI</span>
          </div>
          <h1 className="text-3xl font-serif italic text-agri-leaf tracking-tight">Smart Advisor</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
           <LanguageSelector current={language} onSelect={setLanguage} />
           {location && <p className="text-[8px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-widest"><Wind className="w-2 h-2" /> GPS Active</p>}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === 'home' && renderHome()}
            {activeTab === 'doctor' && renderDoctor()}
            {activeTab === 'advisory' && renderAdvisory()}
            {activeTab === 'weather' && renderWeather()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[85%] max-w-sm z-50">
        <nav className="bg-agri-leaf/95 backdrop-blur-2xl rounded-[32px] p-2 flex justify-between items-center shadow-2xl shadow-agri-leaf/40 border border-white/10">
          {[
            { id: 'home', icon: HomeIcon, label: 'Home' },
            { id: 'doctor', icon: Camera, label: 'Doctor' },
            { id: 'advisory', icon: MessageSquare, label: 'Advisor' },
            { id: 'weather', icon: CloudSun, label: 'Weather' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={cn(
                "p-4 rounded-2xl transition-all relative flex flex-col items-center",
                activeTab === item.id ? "text-agri-earth scale-105" : "text-agri-earth/40 hover:text-agri-earth/60"
              )}
            >
              <item.icon className="w-5 h-5" />
              {activeTab === item.id && (
                <motion.div 
                  layoutId="nav-pill" 
                  className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                />
              )}
              {activeTab === item.id && (
                <span className="text-[7px] font-bold uppercase tracking-[0.2em] mt-1">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #eaddca;
          border-radius: 10px;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-from-bottom {
          from { transform: translateY(1rem); }
          to { transform: translateY(0); }
        }
        .animate-in {
          animation-duration: 500ms;
          animation-fill-mode: both;
        }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-bottom-4 { animation-name: slide-in-from-bottom; }
      `}</style>
    </div>
  );
}
