import React, { useState, useCallback, useRef } from 'react';
import { Play, RotateCcw, Award, BarChart2, Brain, Activity, Target, BookOpen, CheckCircle, XCircle, Download, Send } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const COLORS = [
  { name: 'লাল', value: '#ef4444' },
  { name: 'নীল', value: '#3b82f6' },
  { name: 'সবুজ', value: '#22c55e' },
  { name: 'হলুদ', value: '#eab308' },
  { name: 'বেগুনি', value: '#a855f7' },
  { name: 'কমলা', value: '#f97316' }
];

const App = () => {
  const [step, setStep] = useState('welcome');
  const [testType, setTestType] = useState('congruent');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [results, setResults] = useState({ congruent: [], incongruent: [] });
  
  // নতুন স্টেট - পরীক্ষণ পাত্রের তথ্য
  const [participantInfo, setParticipantInfo] = useState({
    name: '',
    age: '',
    gender: '',
    education: '',
    socioeconomic: ''
  });
  
  // নতুন স্টেট - মন্তব্য
  const [comment, setComment] = useState('');
  const pdfRef = useRef();
  
  const trialsPerPhase = 20;

  const generateTrial = useCallback((type) => {
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    let textIdx;
    
    if (type === 'congruent') {
      textIdx = colorIdx;
    } else {
      textIdx = Math.floor(Math.random() * COLORS.length);
      while (textIdx === colorIdx) {
        textIdx = Math.floor(Math.random() * COLORS.length);
      }
    }
    
    return {
      text: COLORS[textIdx].name,
      color: COLORS[colorIdx].value,
      correctColor: COLORS[colorIdx].name
    };
  }, []);

  const startTest = (type) => {
    setTestType(type);
    setCurrentTrial(0);
    const firstTrial = generateTrial(type);
    setCurrentWord(firstTrial);
    setStep('testing');
    setTimeout(() => setStartTime(Date.now()), 150);
  };

  const handleResponse = (selectedColorName) => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const isCorrect = selectedColorName === currentWord.correctColor;

    const currentResult = { responseTime, isCorrect };
    
    setResults(prev => ({
      ...prev,
      [testType]: [...prev[testType], currentResult]
    }));

    if (currentTrial + 1 < trialsPerPhase) {
      setCurrentTrial(prev => prev + 1);
      setCurrentWord(generateTrial(testType));
      setStartTime(Date.now());
    } else {
      if (testType === 'congruent') {
        setStep('instruction_incongruent');
      } else {
        setStep('participant_form');
      }
    }
  };

  // নতুন ফাংশন - পরীক্ষণ পাত্রের তথ্য সাবমিট
  const handleParticipantSubmit = () => {
    if (!participantInfo.name || !participantInfo.age || !participantInfo.gender || !participantInfo.education) {
      alert('অনুগ্রহ করে সকল তথ্য পূরণ করুন');
      return;
    }
    setStep('result');
  };

  const getStats = (data) => {
    const correctOnes = data.filter(d => d.isCorrect);
    const incorrectOnes = data.filter(d => !d.isCorrect);
    if (data.length === 0) return { avg: 0, accuracy: 0, correct: 0, incorrect: 0 };
    
    const sum = correctOnes.reduce((acc, curr) => acc + curr.responseTime, 0);
    return {
      avg: correctOnes.length > 0 ? Math.round(sum / correctOnes.length) : 0,
      accuracy: Math.round((correctOnes.length / data.length) * 100),
      correct: correctOnes.length,
      incorrect: incorrectOnes.length
    };
  };

  const resetTest = () => {
    setStep('welcome');
    setResults({ congruent: [], incongruent: [] });
    setParticipantInfo({ name: '', age: '', gender: '', education: '', socioeconomic: '' });
    setComment('');
  };

  const getAnalysis = () => {
    const cStats = getStats(results.congruent);
    const iStats = getStats(results.incongruent);
    const diff = iStats.avg - cStats.avg;

    if (iStats.accuracy < 60) {
      return "আপনার সঠিকতার হার (Accuracy) অনেক কম। এর মানে হলো আপনি অসামঞ্জস্যপূর্ণ তথ্যের চাপে বিভ্রান্ত হয়েছেন অথবা খুব তাড়াহুড়ো করে উত্তর দিয়েছেন। প্রকৃত কগনিটিভ কন্ট্রোল যাচাইয়ের জন্য আপনাকে মনোযোগ দিয়ে সঠিক উত্তর দিতে হবে।";
    }

    if (diff > 500) {
      return "আপনার মস্তিষ্কে 'কগনিটিভ ইন্টারফারেন্স' বেশ প্রকট। আপনি দ্বিতীয় ধাপে অনেক বেশি সময় নিয়েছেন, যা নির্দেশ করে যে আপনার ব্রেন শব্দের অর্থ এবং রঙের মধ্যে পার্থক্য করতে বেশ লড়াই করেছে।";
    }

    if (diff > 150) {
      return "আপনার ফলাফল স্বাভাবিক স্ট্রুপ এফেক্ট নির্দেশ করছে। শব্দের অর্থ এবং কালির রঙের অমিল আপনার প্রসেসিং স্পিড কিছুটা কমিয়ে দিয়েছে, যা মানুষের সাধারণ বৈশিষ্ট্য।";
    }

    return "চমৎকার! আপনার কগনিটিভ কন্ট্রোল খুব শক্তিশালী। অসামঞ্জস্যপূর্ণ তথ্যের মধ্যেও আপনি উচ্চ সঠিকতা বজায় রেখে দ্রুত সিদ্ধান্ত নিতে সক্ষম হয়েছেন।";
  };

  // নতুন ফাংশন - PDF জেনারেট করুন
  const generatePDF = () => {
    if (!comment.trim()) {
      alert('অনুগ্রহ করে একটি মন্তব্য যোগ করুন');
      return;
    }
    const element = pdfRef.current;
    const opt = {
      margin: 10,
      filename: `Stroop_Test_Report_${new Date().toLocaleDateString()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const AnimatedBg = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 blur-[150px] rounded-full animate-pulse delay-1000" />
      <div className="absolute top-[50%] right-[10%] w-[40%] h-[40%] bg-blue-500/15 blur-[120px] rounded-full animate-pulse delay-700" />
      <div className="grid grid-cols-10 gap-8 opacity-[0.06] p-10 absolute inset-0">
        {Array.from({ length: 100 }).map((_, i) => (
          <Activity key={i} size={28} className="animate-bounce" style={{ animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <AnimatedBg />

      <div className="max-w-2xl w-full bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[95vh] relative z-10 border border-white/20 scrollbar-hide">
        
        {/* Progress Bar */}
        {step === 'testing' && (
           <div className="h-2 bg-slate-100 w-full sticky top-0 z-20">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                style={{ width: `${((currentTrial + (testType === 'incongruent' ? trialsPerPhase : 0)) / (trialsPerPhase * 2)) * 100}%` }}
              />
           </div>
        )}

        {/* Welcome Screen */}
        {step === 'welcome' && (
          <div className="p-10 text-center animate-in fade-in duration-700">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-25 animate-pulse" />
              <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border border-indigo-50">
                <Brain size={64} className="text-indigo-600" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Stroop Test <span className="text-indigo-600">Expert</span></h1>
            <p className="text-slate-500 mb-8 font-medium italic">মস্তিষ্কের মনোযোগ ও প্রক্রিয়াকরণ ক্ষমতা যাচাই</p>
            
            <div className="bg-white/50 backdrop-blur rounded-3xl p-6 mb-8 border border-slate-200 text-left shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">MR</div>
                <div>
                  <p className="text-xl font-bold text-slate-800 leading-none">Muhammad Rakib</p>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-2">Lead Researcher</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-4 mt-2">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Session</p>
                  <p className="font-semibold text-slate-700">Psychology 22-23</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Institution</p>
                  <p className="font-semibold text-slate-700 leading-tight">Kazi Azimuddin College</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep('instruction_congruent')}
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 group active:scale-95"
            >
              পরীক্ষণ শুরু করুন <Play size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Instructions */}
        {(step === 'instruction_congruent' || step === 'instruction_incongruent') && (
          <div className="p-10 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-5 mb-8">
              <div className={`p-4 rounded-3xl shadow-lg ${step === 'instruction_congruent' ? 'bg-green-100 text-green-600 shadow-green-100' : 'bg-amber-100 text-amber-600 shadow-amber-100'}`}>
                {step === 'instruction_congruent' ? <Activity size={36} /> : <RotateCcw size={36} />}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {step === 'instruction_congruent' ? 'ফেজ ১: সাধারণ সামঞ্জস্য' : 'ফেজ ২: অসামঞ্জস্য চ্যালেঞ্জ'}
                </h2>
                <p className="text-slate-500 font-medium">নিচের নিয়মটি খেয়াল করুন</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-10">
              <div className="flex gap-4 items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <Target className="text-indigo-500 shrink-0" size={24} />
                <p className="text-slate-700 leading-relaxed font-medium">স্ক্রিনে আসা শব্দটির <strong>অর্থ নয়</strong>, বরং শব্দটি যে <strong>রঙে</strong> লেখা আছে তা দ্রুত সিলেক্ট করুন।</p>
              </div>
              <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100">
                <p className="text-indigo-700 text-sm italic text-center font-medium">"সঠিক উত্তর এবং দ্রুত গতি—উভয়ই আপনার কগনিটিভ স্কোরের জন্য জরুরি"</p>
              </div>
            </div>

            <button 
              onClick={() => startTest(step === 'instruction_congruent' ? 'congruent' : 'incongruent')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              আমি প্রস্তুত
            </button>
          </div>
        )}

        {/* Testing Phase */}
        {step === 'testing' && (
          <div className="p-10 text-center min-h-[500px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="px-5 py-2 bg-slate-100 rounded-2xl flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${testType === 'congruent' ? 'bg-green-500 shadow-[0_0_8px_green]' : 'bg-amber-500 shadow-[0_0_8px_orange]'}`} />
                <span className="text-xs font-black tracking-widest text-slate-600">
                  {testType === 'congruent' ? 'CONGRUENT' : 'INCONGRUENT'}
                </span>
              </div>
              <div className="text-indigo-600 font-black text-xl bg-indigo-50 px-5 py-2 rounded-2xl border border-indigo-100">
                {currentTrial + 1} / {trialsPerPhase}
              </div>
            </div>

            <div className="py-16">
              {currentWord && (
                <h1 
                  className="text-8xl font-black select-none transition-all duration-75 animate-in zoom-in duration-100"
                  style={{ color: currentWord.color, textShadow: '2px 4px 10px rgba(0,0,0,0.1)' }}
                >
                  {currentWord.text}
                </h1>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleResponse(color.name)}
                  className="bg-white border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 p-5 rounded-2xl font-bold text-lg transition-all active:scale-90"
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Participant Form - নতুন */}
        {step === 'participant_form' && (
          <div className="p-10 animate-in slide-in-from-right duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 rounded-3xl bg-cyan-100 text-cyan-600 shadow-lg">
                <Brain size={36} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">পরীক্ষণ পাত্রের তথ্য</h2>
                <p className="text-slate-500 font-medium">আপনার ব্যক্তিগত তথ্য প্রদান করুন</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">নাম *</label>
                <input 
                  type="text"
                  value={participantInfo.name}
                  onChange={(e) => setParticipantInfo({...participantInfo, name: e.target.value})}
                  placeholder="আপনার সম্পূর্ণ নাম"
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">বয়স *</label>
                  <input 
                    type="number"
                    value={participantInfo.age}
                    onChange={(e) => setParticipantInfo({...participantInfo, age: e.target.value})}
                    placeholder="বছর"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">লিঙ্গ *</label>
                  <select 
                    value={participantInfo.gender}
                    onChange={(e) => setParticipantInfo({...participantInfo, gender: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="male">পুরুষ</option>
                    <option value="female">নারী</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">শিক্ষাগত যোগ্যতা *</label>
                <select 
                  value={participantInfo.education}
                  onChange={(e) => setParticipantInfo({...participantInfo, education: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="hsc">এইচএসি</option>
                  <option value="graduation">স্নাতক</option>
                  <option value="masters">স্নাতকোত্তর</option>
                  <option value="phd">পিএইচডি</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">আর্থসামাজিক অবস্থা</label>
                <select 
                  value={participantInfo.socioeconomic}
                  onChange={(e) => setParticipantInfo({...participantInfo, socioeconomic: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all shadow-sm"
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="low">নিম্ন</option>
                  <option value="middle">মধ্যম</option>
                  <option value="high">উচ্চ</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleParticipantSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95"
            >
              পরবর্তী পদক্ষেপ
            </button>
          </div>
        )}

        {/* Comprehensive Result Dashboard */}
        {step === 'result' && (
          <div ref={pdfRef} className="p-8 animate-in fade-in duration-1000 pb-12">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <Award size={64} className="text-amber-500 animate-bounce" />
                <div className="absolute inset-0 bg-amber-200 blur-2xl opacity-30 -z-10" />
              </div>
              <h2 className="text-3xl font-black text-slate-900">বিস্তারিত রিপোর্ট</h2>
              <p className="text-slate-500 mt-1">Thanks For Attend</p>
            </div>

            {/* Participant Info - নতুন */}
            <div className="bg-cyan-50 p-6 rounded-[2.5rem] border border-cyan-200 mb-6 shadow-sm">
              <h3 className="font-black text-cyan-900 mb-4 text-lg uppercase tracking-tighter flex items-center gap-2">
                <Activity size={20} /> পরীক্ষণ পাত্রের তথ্য
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm">
                  <p className="text-cyan-600 font-bold text-xs uppercase mb-1">নাম</p>
                  <p className="font-bold text-slate-900">{participantInfo.name}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm">
                  <p className="text-cyan-600 font-bold text-xs uppercase mb-1">বয়স</p>
                  <p className="font-bold text-slate-900">{participantInfo.age} বছর</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm">
                  <p className="text-cyan-600 font-bold text-xs uppercase mb-1">লিঙ্গ</p>
                  <p className="font-bold text-slate-900">{participantInfo.gender === 'male' ? 'পুরুষ' : participantInfo.gender === 'female' ? 'নারী' : 'অন্যান্য'}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm">
                  <p className="text-cyan-600 font-bold text-xs uppercase mb-1">শিক্ষা</p>
                  <p className="font-bold text-slate-900">{participantInfo.education}</p>
                </div>
                {participantInfo.socioeconomic && (
                  <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm col-span-2 md:col-span-1">
                    <p className="text-cyan-600 font-bold text-xs uppercase mb-1">অর্থনৈতিক অবস্থা</p>
                    <p className="font-bold text-slate-900">{participantInfo.socioeconomic}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Score Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Congruent Results */}
              <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Phase 1: Basic</span>
                  <Activity size={16} className="text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black text-emerald-900">{getStats(results.congruent).avg}</span>
                  <span className="text-emerald-600 font-bold">ms</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-700 border-t border-emerald-100 pt-3">
                  <div className="flex items-center gap-1"><CheckCircle size={12} /> সঠিক: {getStats(results.congruent).correct}</div>
                  <div className="flex items-center gap-1"><XCircle size={12} /> ভুল: {getStats(results.congruent).incorrect}</div>
                </div>
              </div>

              {/* Incongruent Results */}
              <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-rose-600 uppercase tracking-widest">Phase 2: Challenge</span>
                  <Brain size={16} className="text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black text-rose-900">{getStats(results.incongruent).avg}</span>
                  <span className="text-rose-600 font-bold">ms</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-700 border-t border-rose-100 pt-3">
                  <div className="flex items-center gap-1"><CheckCircle size={12} /> সঠিক: {getStats(results.incongruent).correct}</div>
                  <div className="flex items-center gap-1"><XCircle size={12} /> ভুল: {getStats(results.incongruent).incorrect}</div>
                </div>
              </div>
            </div>

            {/* Interference Score */}
            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white mb-6 shadow-xl shadow-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Stroop Interference Score</p>
                <h3 className="text-3xl font-black">+{getStats(results.incongruent).avg - getStats(results.congruent).avg} ms</h3>
              </div>
              <BarChart2 size={40} className="opacity-40" />
            </div>

            {/* Analysis & Context */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8 mb-6">
              <section>
                <h4 className="flex items-center gap-2 text-indigo-600 font-black mb-3 text-lg uppercase tracking-tighter">
                  <BookOpen size={20} /> ফলাফলের বিশ্লেষণ (Analysis)
                </h4>
                <div className="bg-slate-50 p-5 rounded-3xl text-slate-700 leading-relaxed italic border-l-4 border-indigo-400">
                  {getAnalysis()}
                </div>
              </section>
              
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                <div>
                  <h5 className="font-bold text-slate-900 mb-2">গবেষণার উদ্দেশ্য</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">এই পরীক্ষার মাধ্যমে মানুষের 'অটোমেটিক প্রসেসিং' (শব্দ পড়া) এবং 'কন্ট্রোলড প্রসেসিং' (রং চেনা) এর মধ্যে যে সংঘর্ষ ঘটে, তার তীব্রতা পরিমাপ করা হয়। এটি মনোযোগ ও মানসিক জড়তা পরিমাপের একটি অন্যতম সেরা মাধ্যম।</p>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 mb-2">কেন সময়ের পার্থক্য হয়?</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">মানুষ শৈশব থেকে শব্দ পড়তে অভ্যস্ত। তাই শব্দ দেখা মাত্রই ব্রেন তা পড়ে ফেলে। কিন্তু যখন শব্দের অর্থের বিপরীতে অন্য রং বলা হয়, তখন মস্তিষ্ককে স্বয়ংক্রিয়া কাজ থামিয়ে নতুন করে চিন্তা করতে হয়, যা সময় বৃদ্ধি করে।</p>
                </div>
              </section>
            </div>

            {/* Comment Section - নতুন */}
            <div className="bg-orange-50/50 p-8 rounded-[2.5rem] border border-orange-200 shadow-sm mb-6">
              <h4 className="flex items-center gap-2 text-orange-600 font-black mb-4 text-lg uppercase tracking-tighter">
                <Send size={20} /> আপনার মন্তব্য
              </h4>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="এই পরীক্ষা সম্পর্কে আপনার অভিজ্ঞতা এবং অনুভূতি শেয়ার করুন..."
                rows="5"
                className="w-full px-5 py-4 rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all shadow-sm resize-none"
              />
              <p className="text-xs text-orange-600 font-medium mt-2">পিডিএফ ডাউনলোড করতে এটি পূরণ করা বাধ্যতামূলক</p>
            </div>

            {/* Action Buttons - আপডেট */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button 
                onClick={generatePDF}
                className="py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg active:scale-95"
              >
                <Download size={20} className="group-hover:scale-110 transition-transform" /> PDF ডাউনলোড করুন
              </button>
              <button 
                onClick={resetTest}
                className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> নতুন সেশন শুরু করুন
              </button>
            </div>
            
            <footer className="mt-12 text-center">
              <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase mb-1">Psychological Assessment Lab</p>
              <p className="text-[9px] text-slate-300 font-medium">Kazi Azimuddin College, Gazipur</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
