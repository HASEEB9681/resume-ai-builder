import React, { useState, useEffect } from 'react';
import { Target, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { MatchResult, UserProfile, GeneratedResume } from '../types';
import { analyzeJobMatch, generateCoverLetter } from '../services/geminiService';

interface JobAnalysisProps {
  resumeContent: GeneratedResume | null;
  profile: UserProfile;
}

export const JobAnalysis: React.FC<JobAnalysisProps> = ({ resumeContent, profile }) => {
  const [jd, setJd] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isLetterGenerating, setIsLetterGenerating] = useState(false);
  const [tab, setTab] = useState<'match' | 'letter'>('match');

  const handleAnalyze = async () => {
    if (!jd || !resumeContent) return;
    setIsAnalyzing(true);
    try {
      // Create a text representation of the resume for the AI
      const resumeText = `
        Summary: ${resumeContent.professionalSummary}
        Experience: ${resumeContent.enhancedExperience.map(e => e.bullets.join(' ')).join(' ')}
        Skills: ${resumeContent.skillsList.join(', ')}
      `;
      const res = await analyzeJobMatch(resumeText, jd);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateLetter = async () => {
    if (!jd) return;
    setIsLetterGenerating(true);
    try {
        const letter = await generateCoverLetter(profile, jd);
        setCoverLetter(letter);
    } catch (e) {
        console.error(e);
        alert('Failed to generate cover letter');
    } finally {
        setIsLetterGenerating(false);
    }
  };

  const chartData = result ? [{ name: 'Score', value: result.score, fill: result.score > 70 ? '#10b981' : result.score > 40 ? '#f59e0b' : '#ef4444' }] : [];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-4 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-indigo-600" /> Job Match & Cover Letter
        </h2>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* JD Input */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">Paste Job Description</label>
            <textarea 
                className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                placeholder="Paste the JD here to analyze match score..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
            />
            <div className="mt-3 flex gap-3">
                <button 
                    onClick={handleAnalyze}
                    disabled={!jd || !resumeContent || isAnalyzing}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Match'}
                </button>
                 <button 
                    onClick={() => { setTab('letter'); handleGenerateLetter(); }}
                    disabled={!jd || isLetterGenerating}
                    className="flex-1 bg-white border border-indigo-600 text-indigo-600 py-2 rounded-lg font-medium hover:bg-indigo-50 disabled:border-slate-300 disabled:text-slate-300 transition-colors"
                >
                    {isLetterGenerating ? 'Writing...' : 'Draft Cover Letter'}
                </button>
            </div>
        </div>

        {/* Navigation Tabs if both exist */}
        {(result || coverLetter) && (
            <div className="flex border-b border-slate-200">
                <button 
                    className={`flex-1 pb-2 font-medium ${tab === 'match' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                    onClick={() => setTab('match')}
                >
                    Match Analysis
                </button>
                <button 
                    className={`flex-1 pb-2 font-medium ${tab === 'letter' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
                    onClick={() => setTab('letter')}
                >
                    Cover Letter
                </button>
            </div>
        )}

        {/* Results View */}
        {tab === 'match' && result && (
            <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <div className="h-48 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" data={chartData} startAngle={90} endAngle={-270} barSize={20}>
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background dataKey="value" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-4xl font-bold text-slate-800">{result.score}%</span>
                            <span className="text-slate-500 text-sm">Match Score</span>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} /> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw, i) => (
                            <span key={i} className="bg-white text-red-600 px-3 py-1 rounded-full text-sm border border-red-100 font-medium">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} /> Suggestions
                    </h3>
                    <ul className="space-y-3">
                        {result.suggestions.map((sug, i) => (
                            <li key={i} className="flex gap-3 text-slate-700 text-sm">
                                <ArrowRight className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                {sug}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}

        {tab === 'letter' && (
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                {coverLetter ? (
                    <div className="whitespace-pre-line text-slate-700 leading-relaxed font-serif">
                        {coverLetter}
                    </div>
                ) : (
                    <div className="text-center text-slate-400 py-10">
                        Enter a Job Description and click "Draft Cover Letter" to generate.
                    </div>
                )}
             </div>
        )}

      </div>
    </div>
  );
};