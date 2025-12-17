import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, ChevronRight, ChevronLeft, Wand2, Sparkles, 
  FolderGit2, Award, Languages, Globe, CheckCircle2, 
  Upload, FileText, Linkedin, Copy, LayoutTemplate
} from 'lucide-react';
import { UserProfile } from '../types';
import { generateSingleSummary, generateJobDescription, suggestSkills } from '../services/geminiService';

interface ResumeFormProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SAMPLE_PROFILE: UserProfile = {
  fullName: "Alex Morgan",
  email: "alex.morgan@example.com",
  phone: "+1 (555) 123-4567",
  linkedin: "linkedin.com/in/alexmorgan",
  website: "alexmorgan.dev",
  location: "San Francisco, CA",
  summary: "Results-driven Marketing Manager with over 7 years of experience in digital strategy and brand growth. Proven track record of increasing ROI by 40% through targeted campaigns.",
  experience: [
    {
      id: "1",
      company: "TechFlow Solutions",
      role: "Senior Marketing Manager",
      startDate: "2021",
      endDate: "Present",
      description: "Led a team of 10 marketers. Increased annual revenue by 25% through SEO optimization. Launched 3 major product lines."
    }
  ],
  education: [
    {
      id: "1",
      institution: "University of California, Berkeley",
      degree: "B.S. Business Administration",
      year: "2017"
    }
  ],
  projects: [],
  certifications: [],
  languages: [],
  skills: "Digital Marketing, SEO, Google Analytics, Team Leadership"
};

type Step = 'start' | 'personal' | 'experience' | 'education' | 'skills' | 'summary' | 'extras';

export const ResumeForm: React.FC<ResumeFormProps> = ({ profile, setProfile, onGenerate, isGenerating }) => {
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [resumeScore, setResumeScore] = useState(0);
  const [nextScoreBoost, setNextScoreBoost] = useState<{text: string, amount: number} | null>(null);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Calculate Score & Suggestions (Resume.io style)
  useEffect(() => {
    let score = 0;
    let boost = null;

    if (profile.fullName && profile.email) score += 15;
    else if (!boost) boost = { text: "Add personal details", amount: 15 };

    if (profile.experience.length > 0) score += 25;
    else if (!boost) boost = { text: "Add employment history", amount: 25 };

    if (profile.education.length > 0) score += 15;
    else if (!boost) boost = { text: "Add education", amount: 15 };

    if (profile.skills.length > 5) score += 10;
    else if (!boost) boost = { text: "Add skills", amount: 10 };

    if (profile.summary.length > 20) score += 15;
    else if (!boost) boost = { text: "Add profile summary", amount: 15 };

    if (profile.languages.length > 0 || profile.projects.length > 0) score += 20;
    else if (!boost) boost = { text: "Add extra sections", amount: 20 };

    setResumeScore(Math.min(100, score));
    setNextScoreBoost(boost);
  }, [profile]);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const goToStep = (step: Step) => setCurrentStep(step);

  const nextStep = () => {
    const steps: Step[] = ['personal', 'experience', 'education', 'skills', 'summary', 'extras'];
    const idx = steps.indexOf(currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
  };

  const prevStep = () => {
    const steps: Step[] = ['personal', 'experience', 'education', 'skills', 'summary', 'extras'];
    const idx = steps.indexOf(currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1]);
    else setCurrentStep('start');
  };

  // --- AI Helpers ---
  const handleAiSummary = async () => {
    const role = profile.experience[0]?.role || "Professional";
    setAiLoading('summary');
    try {
      const summary = await generateSingleSummary(role, profile.skills);
      setProfile(prev => ({ ...prev, summary }));
    } catch (e) { console.error(e); }
    setAiLoading(null);
  };

  const handleAiJobDesc = async (id: string, role: string, company: string) => {
    if (!role || !company) return alert("Please enter Role and Company first.");
    setAiLoading(`job-${id}`);
    try {
      const bullets = await generateJobDescription(role, company);
      const text = bullets.map(b => `• ${b}`).join('\n');
      setProfile(prev => ({
        ...prev,
        experience: prev.experience.map(exp => exp.id === id ? { ...exp, description: text } : exp)
      }));
    } catch (e) { console.error(e); }
    setAiLoading(null);
  };

  const handleAiSkills = async () => {
    const role = profile.experience[0]?.role || "General";
    setAiLoading('skills');
    try {
        const skills = await suggestSkills(role);
        setProfile(prev => ({ ...prev, skills: skills.join(', ') }));
    } catch (e) { console.error(e); }
    setAiLoading(null);
  };

  // --- Onboarding Screen (Resume.io Style) ---
  if (currentStep === 'start') {
      return (
          <div className="flex flex-col items-center justify-center h-full p-6 animate-fadeIn">
              <div className="max-w-md w-full text-center">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Let's get started</h2>
                  <p className="text-slate-500 mb-8">How do you want to create your resume?</p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => setCurrentStep('personal')}
                        className="w-full flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
                      >
                          <div className="bg-slate-100 p-3 rounded-lg mr-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-600">
                              <FileText size={24} />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">Create new resume</h3>
                              <p className="text-sm text-slate-500">Start from scratch with our wizard</p>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                      </button>

                      <button 
                         onClick={() => { setProfile(SAMPLE_PROFILE); setCurrentStep('personal'); }}
                         className="w-full flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left"
                      >
                          <div className="bg-slate-100 p-3 rounded-lg mr-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-600">
                              <LayoutTemplate size={24} />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">Create from example</h3>
                              <p className="text-sm text-slate-500">Use a professional template</p>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                      </button>

                      <button className="w-full flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left opacity-75 cursor-not-allowed">
                          <div className="bg-slate-100 p-3 rounded-lg mr-4 text-slate-600">
                              <Linkedin size={24} />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">Import from LinkedIn</h3>
                              <p className="text-sm text-slate-500">Coming soon</p>
                          </div>
                      </button>
                      
                       <button className="w-full flex items-center p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group text-left opacity-75 cursor-not-allowed">
                          <div className="bg-slate-100 p-3 rounded-lg mr-4 text-slate-600">
                              <Upload size={24} />
                          </div>
                          <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">Upload Resume</h3>
                              <p className="text-sm text-slate-500">PDF or Word (Coming soon)</p>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  // --- Score Header (Resume.io Style) ---
  const renderScoreHeader = () => (
    <div className="flex items-center gap-4 mb-8 bg-white/50 backdrop-blur-sm sticky top-0 py-4 z-10 border-b border-slate-100">
        <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">{resumeScore}%</span>
            <span className="text-sm font-medium text-slate-600">Your resume score</span>
        </div>
        {nextScoreBoost && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <span className="text-green-600 text-xs font-bold">+{nextScoreBoost.amount}%</span>
                <span className="text-slate-700 text-xs font-medium">{nextScoreBoost.text}</span>
            </div>
        )}
    </div>
  );

  // --- Step Content Renderers ---

  const renderPersonal = () => (
    <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">First & Last Name</label>
                <input name="fullName" value={profile.fullName} onChange={handleInfoChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Email Address</label>
                <input name="email" value={profile.email} onChange={handleInfoChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Phone Number</label>
                <input name="phone" value={profile.phone} onChange={handleInfoChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
            </div>
            <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">City, Country</label>
                <input name="location" value={profile.location} onChange={handleInfoChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
            </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Job Title</label>
                <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Software Engineer" />
            </div>
        </div>
    </div>
  );

  const renderExperience = () => (
    <div className="animate-fadeIn">
         <h2 className="text-2xl font-bold text-slate-800 mb-2">Employment History</h2>
         <p className="text-slate-500 mb-8 text-sm">Show your relevant experience (last 10 years). Use bullet points to note your achievements.</p>
         
         <div className="space-y-6">
            {profile.experience.map((exp, index) => (
                <div key={exp.id} className="bg-white border border-slate-200 rounded-xl p-6 relative group hover:border-blue-300 transition-colors">
                    <button onClick={() => {
                        setProfile(prev => ({...prev, experience: prev.experience.filter(e => e.id !== exp.id)}))
                    }} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Job Title</label>
                            <input value={exp.role} onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].role = e.target.value;
                                setProfile({...profile, experience: newExp});
                            }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Employer</label>
                            <input value={exp.company} onChange={(e) => {
                                const newExp = [...profile.experience];
                                newExp[index].company = e.target.value;
                                setProfile({...profile, experience: newExp});
                            }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Start Date</label>
                                <input value={exp.startDate} onChange={(e) => {
                                    const newExp = [...profile.experience];
                                    newExp[index].startDate = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="MM/YYYY" />
                             </div>
                             <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">End Date</label>
                                <input value={exp.endDate} onChange={(e) => {
                                    const newExp = [...profile.experience];
                                    newExp[index].endDate = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" placeholder="Present" />
                             </div>
                        </div>
                    </div>

                    <div>
                         <div className="flex justify-between items-end mb-2">
                            <label className="block text-xs font-semibold text-slate-400 uppercase">Description</label>
                            <button 
                                onClick={() => handleAiJobDesc(exp.id, exp.role, exp.company)}
                                disabled={aiLoading === `job-${exp.id}`}
                                className="text-xs flex items-center gap-1.5 text-blue-600 font-bold hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                            >
                                {aiLoading === `job-${exp.id}` ? <span className="animate-spin">⏳</span> : <Wand2 size={14} />}
                                AI Writer
                            </button>
                         </div>
                         <div className="relative">
                            <textarea 
                                value={exp.description} 
                                onChange={(e) => {
                                    const newExp = [...profile.experience];
                                    newExp[index].description = e.target.value;
                                    setProfile({...profile, experience: newExp});
                                }}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg h-32 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none leading-relaxed resize-none text-slate-700" 
                                placeholder="• Achieved X by doing Y..."
                            />
                         </div>
                    </div>
                </div>
            ))}
            
            <button onClick={() => setProfile(prev => ({
                ...prev, experience: [...prev.experience, {id: Date.now().toString(), role: '', company: '', startDate: '', endDate: '', description: ''}]
            }))} className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors mt-2">
                <Plus size={18} /> Add employment
            </button>
         </div>
    </div>
  );

  const renderEducation = () => (
    <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Education</h2>
        <p className="text-slate-500 mb-8 text-sm">A varied education on your resume sums up the value that your learnings and background will bring to job.</p>

        <div className="space-y-4">
            {profile.education.map((edu, index) => (
                <div key={edu.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex gap-4 items-start group hover:border-blue-300 transition-colors">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">School</label>
                             <input value={edu.institution} onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].institution = e.target.value;
                                setProfile({...profile, education: newEdu});
                             }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Degree</label>
                             <input value={edu.degree} onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].degree = e.target.value;
                                setProfile({...profile, education: newEdu});
                             }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">Year</label>
                             <input value={edu.year} onChange={(e) => {
                                const newEdu = [...profile.education];
                                newEdu[index].year = e.target.value;
                                setProfile({...profile, education: newEdu});
                             }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    <button onClick={() => {
                        setProfile(prev => ({...prev, education: prev.education.filter(e => e.id !== edu.id)}))
                    }} className="text-slate-300 hover:text-red-500 mt-7">
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            <button onClick={() => setProfile(prev => ({
                ...prev, education: [...prev.education, {id: Date.now().toString(), institution: '', degree: '', year: ''}]
            }))} className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors mt-2">
                <Plus size={18} /> Add education
            </button>
        </div>
    </div>
  );

  const renderSkills = () => (
    <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Skills</h2>
        <p className="text-slate-500 mb-8 text-sm">Choose 5 important skills that show you fit the position. Make sure they match the key skills mentioned in the job listing.</p>
        
        <div className="relative">
             <div className="absolute top-4 right-4 z-10">
                 <button 
                    onClick={handleAiSkills}
                    disabled={aiLoading === 'skills'}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-md font-bold hover:bg-blue-100 transition-colors"
                 >
                    {aiLoading === 'skills' ? 'Thinking...' : <><Sparkles size={14}/> AI Suggest</>}
                 </button>
             </div>
             <textarea 
                name="skills" 
                value={profile.skills} 
                onChange={handleInfoChange} 
                className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl h-40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium text-slate-700 text-lg leading-relaxed" 
                placeholder="e.g. Project Management, React, Leadership, Python, SEO..."
            />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
            {['Communication', 'Leadership', 'Time Management', 'Problem Solving'].map(skill => (
                <button 
                    key={skill}
                    onClick={() => setProfile(prev => ({...prev, skills: prev.skills ? `${prev.skills}, ${skill}` : skill}))}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2"
                >
                    <Plus size={14} /> {skill}
                </button>
            ))}
        </div>
    </div>
  );

  const renderSummary = () => (
    <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-slate-800">Professional Summary</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">+15%</span>
        </div>
        <p className="text-slate-500 mb-8 text-sm">Write 2-4 short, energetic sentences about how great you are. Mention the role and what you did.</p>
        
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-blue-300 transition-colors">
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-2">
                <button onClick={handleAiSummary} disabled={aiLoading === 'summary'} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm font-medium text-blue-600 shadow-sm hover:shadow-md transition-all">
                    {aiLoading === 'summary' ? 'Writing...' : <><Wand2 size={14} /> AI Writer</>}
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600"><Copy size={16}/></button>
            </div>
            <textarea 
                name="summary" 
                value={profile.summary} 
                onChange={handleInfoChange} 
                className="w-full p-5 outline-none h-48 text-slate-700 leading-relaxed resize-none" 
                placeholder="Passionate professional with..."
            />
        </div>
    </div>
  );

  const renderExtras = () => (
    <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Add Additional Sections</h2>
        <p className="text-slate-500 mb-8 text-sm">Here’s description that you can add or skip without it.</p>

        <div className="grid grid-cols-2 gap-4">
            {[
                { label: 'Projects', icon: FolderGit2, key: 'projects', list: profile.projects, defaultItem: {id: '1', name: '', description: '', link: ''} },
                { label: 'Certifications', icon: Award, key: 'certifications', list: profile.certifications, defaultItem: {id: '1', name: '', issuer: '', year: ''} },
                { label: 'Languages', icon: Languages, key: 'languages', list: profile.languages, defaultItem: {id: '1', language: '', proficiency: ''} },
                { label: 'Websites & Links', icon: Globe, key: 'website', value: profile.website, defaultValue: 'https://' }
            ].map((section) => {
                const isActive = section.list ? section.list.length > 0 : !!section.value;
                return (
                    <div 
                        key={section.label}
                        onClick={() => {
                            if (!isActive) {
                                if (section.list) {
                                    // @ts-ignore
                                    setProfile(p => ({...p, [section.key]: [section.defaultItem]}))
                                } else {
                                     // @ts-ignore
                                     setProfile(p => ({...p, [section.key]: section.defaultValue}))
                                }
                            }
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 group
                            ${isActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-slate-200 hover:border-blue-400 hover:shadow-md bg-white'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                             <section.icon className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} size={24} />
                             {isActive && <CheckCircle2 size={18} className="text-blue-600" />}
                        </div>
                        <span className={`font-semibold text-sm ${isActive ? 'text-blue-800' : 'text-slate-700'}`}>{section.label}</span>
                    </div>
                )
            })}
        </div>

        {/* Dynamic Forms for Extras */}
        <div className="mt-8 space-y-6">
            {profile.projects.length > 0 && (
                <div className="animate-slideUp border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><FolderGit2 size={20} className="text-blue-500"/> Projects</h3>
                    {profile.projects.map((p, idx) => (
                        <div key={p.id} className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                             <input value={p.name} onChange={e => {
                                 const updated = [...profile.projects]; updated[idx].name = e.target.value; setProfile({...profile, projects: updated});
                             }} className="w-full mb-3 p-3 rounded-lg border border-slate-200 text-sm font-medium focus:border-blue-500 outline-none" placeholder="Project Name" />
                             <textarea value={p.description} onChange={e => {
                                 const updated = [...profile.projects]; updated[idx].description = e.target.value; setProfile({...profile, projects: updated});
                             }} className="w-full p-3 rounded-lg border border-slate-200 text-sm h-20 focus:border-blue-500 outline-none resize-none" placeholder="Project Description" />
                        </div>
                    ))}
                    <button onClick={() => setProfile(p => ({...p, projects: [...p.projects, {id: Date.now().toString(), name: '', description: '', link: ''}]}))} className="text-sm text-blue-600 font-bold">+ Add Project</button>
                </div>
            )}
             {profile.languages.length > 0 && (
                <div className="animate-slideUp border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg"><Languages size={20} className="text-blue-500"/> Languages</h3>
                    {profile.languages.map((l, idx) => (
                        <div key={l.id} className="mb-3 flex gap-3">
                             <input value={l.language} onChange={e => {
                                 const updated = [...profile.languages]; updated[idx].language = e.target.value; setProfile({...profile, languages: updated});
                             }} className="flex-1 p-3 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none" placeholder="Language" />
                             <input value={l.proficiency} onChange={e => {
                                 const updated = [...profile.languages]; updated[idx].proficiency = e.target.value; setProfile({...profile, languages: updated});
                             }} className="flex-1 p-3 rounded-lg border border-slate-200 text-sm focus:border-blue-500 outline-none" placeholder="Proficiency (e.g. Fluent)" />
                        </div>
                    ))}
                    <button onClick={() => setProfile(p => ({...p, languages: [...p.languages, {id: Date.now().toString(), language: '', proficiency: ''}]}))} className="text-sm text-blue-600 font-bold">+ Add Language</button>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white md:rounded-2xl md:shadow-xl overflow-hidden max-w-3xl mx-auto border border-slate-100">
        
        {/* Navigation Sidebar/Top (Simplified for Wizard) */}
        {currentStep !== 'start' && (
            <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide w-full justify-start">
                    {['personal', 'experience', 'education', 'skills', 'summary', 'extras'].map((step, i) => (
                        <button 
                            key={step} 
                            onClick={() => goToStep(step as Step)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                                ${currentStep === step 
                                    ? 'bg-slate-900 text-white shadow-md' 
                                    : 'text-slate-500 hover:bg-slate-100'
                                }`
                            }
                        >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${currentStep === step ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-500'}`}>
                                {i + 1}
                            </span>
                            <span className="capitalize">{step}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-white">
            {currentStep !== 'start' && renderScoreHeader()}
            
            {currentStep === 'personal' && renderPersonal()}
            {currentStep === 'experience' && renderExperience()}
            {currentStep === 'education' && renderEducation()}
            {currentStep === 'skills' && renderSkills()}
            {currentStep === 'summary' && renderSummary()}
            {currentStep === 'extras' && renderExtras()}
        </div>

        {/* Footer Actions */}
        {currentStep !== 'start' && (
            <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center z-20">
                <button onClick={prevStep} className="text-slate-500 font-bold text-sm hover:text-slate-800 px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors">
                    Back
                </button>
                
                {currentStep === 'extras' ? (
                     <button 
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-8 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        {isGenerating ? <span className="animate-spin">⏳</span> : <Sparkles size={18} />}
                        Finalize Resume
                    </button>
                ) : (
                    <button onClick={nextStep} className="flex items-center gap-2 px-10 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                        Next: {currentStep === 'personal' ? 'Experience' : 
                               currentStep === 'experience' ? 'Education' : 
                               currentStep === 'education' ? 'Skills' : 
                               currentStep === 'skills' ? 'Summary' : 'Extras'}
                    </button>
                )}
            </div>
        )}
    </div>
  );
};