import React, { useState } from 'react';
import { Layout, FileText, Briefcase, Crown, Check, Palette, ChevronLeft } from 'lucide-react';
import { ResumeForm } from './components/ResumeForm';
import { ResumePreview } from './components/ResumePreview';
import { JobAnalysis } from './components/JobAnalysis';
import { UserProfile, GeneratedResume, ResumeStyle } from './types';
import { generateOptimizedResume } from './services/geminiService';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    skills: ''
  });

  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'match'>('editor');
  
  // Theme State
  const [activeStyle, setActiveStyle] = useState<ResumeStyle>(ResumeStyle.MODERN);
  const [themeColor, setThemeColor] = useState<string>('indigo');
  const [font, setFont] = useState<string>('font-sans');
  
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // Auto-switch to preview on mobile after generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateOptimizedResume(profile);
      setGeneratedResume(result);
      // On mobile, switch tab. On desktop, it's side-by-side usually, but let's ensure visibility
      if (window.innerWidth < 768) {
        setActiveTab('preview');
      }
    } catch (error) {
      console.error("Generation failed", error);
      alert("Failed to generate resume. Please check your API key or try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const unlockPremium = () => {
    setIsPremium(true);
    setShowPremiumModal(false);
    setActiveStyle(ResumeStyle.PREMIUM_DARK);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header - Resume.io Style (Clean White) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center px-4 md:px-8 justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
            <div className="md:hidden">
                <FileText className="text-blue-600" />
            </div>
            {/* Desktop Breadcrumb/Back */}
            <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 cursor-pointer">
                <ChevronLeft size={16} />
                <span>Resumes</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-wider hidden md:block">Untitled</h1>
        </div>
        
        {/* Desktop Nav - Centered Pills */}
        <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex bg-slate-100 p-1 rounded-full">
           <button 
             onClick={() => setActiveTab('editor')}
             className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Edit
           </button>
           <button 
             onClick={() => setActiveTab('preview')}
             className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Preview
           </button>
            <button 
             onClick={() => setActiveTab('match')}
             className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'match' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Analyze
           </button>
        </nav>

        <div className="flex items-center gap-3">
             {isPremium ? (
            <div className="flex items-center gap-1 text-yellow-600 font-bold text-xs bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-200 uppercase tracking-wider">
                <Crown size={12} fill="currentColor" /> Premium
            </div>
            ) : (
            <button 
                onClick={() => setShowPremiumModal(true)}
                className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wide"
            >
                Go Premium
            </button>
            )}
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200">
                AM
            </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full flex flex-col md:flex-row">
          
          {/* Left Panel: Editor or Match Analysis (On desktop) */}
          <div className={`flex-1 md:max-w-xl lg:max-w-2xl border-r border-slate-200 overflow-y-auto custom-scrollbar bg-slate-50/50 ${activeTab === 'preview' ? 'hidden md:block' : 'block'}`}>
            {activeTab === 'match' ? (
                 <JobAnalysis profile={profile} resumeContent={generatedResume} />
            ) : (
                 <div className="p-0 h-full">
                    <ResumeForm 
                        profile={profile} 
                        setProfile={setProfile} 
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                    />
                 </div>
            )}
          </div>

          {/* Right Panel: Preview (Always visible on desktop, toggled on mobile) */}
          <div className={`flex-1 bg-slate-100 h-full overflow-hidden ${activeTab === 'preview' ? 'block fixed inset-0 z-40 md:static' : 'hidden md:block'}`}>
            <ResumePreview 
                profile={profile} 
                generatedContent={generatedResume}
                activeStyle={activeStyle}
                themeColor={themeColor}
                font={font}
                isPremium={isPremium}
                setActiveStyle={setActiveStyle}
                setThemeColor={setThemeColor}
                setFont={setFont}
                onUnlockPremium={() => setShowPremiumModal(true)}
            />
            {/* Mobile Close Preview Button */}
            <button 
                onClick={() => setActiveTab('editor')}
                className="md:hidden absolute top-4 left-4 z-50 bg-white p-2 rounded-full shadow-lg text-slate-700"
            >
                ✕
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50 pb-safe">
        <button onClick={() => setActiveTab('editor')} className={`flex flex-col items-center text-xs ${activeTab === 'editor' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Layout size={20} className="mb-1" /> Editor
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex flex-col items-center text-xs ${activeTab === 'preview' ? 'text-blue-600' : 'text-slate-400'}`}>
            <FileText size={20} className="mb-1" /> Preview
        </button>
        <button onClick={() => setActiveTab('match')} className={`flex flex-col items-center text-xs ${activeTab === 'match' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Briefcase size={20} className="mb-1" /> Analyze
        </button>
      </nav>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Crown size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Unlock Premium</h2>
                <p className="text-slate-600 mb-6">Get access to ATS-optimized dark modes, creative templates, and unlimited cover letter generations.</p>
                
                <ul className="text-left space-y-3 mb-8">
                    <li className="flex gap-2 text-sm text-slate-700"><Check size={18} className="text-green-500" /> Exclusive Dark Mode Template</li>
                    <li className="flex gap-2 text-sm text-slate-700"><Check size={18} className="text-green-500" /> Advanced Keyword Matching</li>
                    <li className="flex gap-2 text-sm text-slate-700"><Check size={18} className="text-green-500" /> Priority Support</li>
                </ul>

                <button 
                    onClick={unlockPremium}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                    Unlock for Free (Demo)
                </button>
                <button 
                    onClick={() => setShowPremiumModal(false)}
                    className="mt-4 text-slate-400 text-sm font-medium hover:text-slate-600"
                >
                    Maybe Later
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;