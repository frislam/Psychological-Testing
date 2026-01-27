import React, { useState, useCallback, useRef } from 'react';
import { Play, RotateCcw, Award, Brain, Activity, Target, Download, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [participantInfo, setParticipantInfo] = useState({
    name: '',
    age: '',
    gender: '',
    education: '',
    socioeconomic: ''
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const resultRef = useRef();

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
    setTimeout(() => {
      setStartTime(Date.now());
    }, 200);
  };

  const handleResponse = (selectedColorName) => {
    if (!startTime) return;
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const isCorrect = selectedColorName === currentWord.correctColor;

    setResults(prev => ({
      ...prev,
      [testType]: [...prev[testType], { responseTime, isCorrect }]
    }));

    if (currentTrial + 1 < trialsPerPhase) {
      setCurrentTrial(prev => prev + 1);
      const nextTrial = generateTrial(testType);
      setCurrentWord(nextTrial);
      setStartTime(Date.now());
    } else {
      if (testType === 'congruent') {
        setStep('instruction_incongruent');
      } else {
        setStep('participant_form');
      }
    }
  };

  const handleParticipantSubmit = () => {
    if (!participantInfo.name || !participantInfo.age || !participantInfo.gender || !participantInfo.education) {
      alert('অনুগ্রহ করে সকল তথ্য পূরণ করুন');
      return;
    }
    setStep('result');
  };

  const getStats = (data) => {
    const correctOnes = data.filter(d => d.isCorrect);
    if (data.length === 0 || correctOnes.length === 0) return { avg: 0, correct: 0, incorrect: 0 };
    
    const sum = correctOnes.reduce((acc, curr) => acc + curr.responseTime, 0);
    return {
      avg: Math.round(sum / correctOnes.length),
      correct: correctOnes.length,
      incorrect: data.length - correctOnes.length
    };
  };

  const resetTest = () => {
    setStep('welcome');
    setResults({ congruent: [], incongruent: [] });
    setCurrentWord(null);
    setStartTime(null);
    setCurrentTrial(0);
    setParticipantInfo({ name: '', age: '', gender: '', education: '', socioeconomic: '' });
    setComment('');
    setLoading(false);
  };

  const getAnalysis = () => {
    const cStats = getStats(results.congruent);
    const iStats = getStats(results.incongruent);
    const diff = iStats.avg - cStats.avg;

    if (diff < 0) {
      return "অসাধারণ! আপনার ক্ষেত্রে 'নেগেটিভ স্ট্রুপ ইফেক্ট' দেখা গেছে। অর্থাৎ চ্যালেঞ্জিং ধাপে আপনি আরও দ্রুত সিদ্ধান্ত নিয়েছেন। এটি আপনার উচ্চস্তরের অভিযোজন ক্ষমতা (Adaptability) এবং কঠিন পরিস্থিতিতে ব্রেনের দ্রুত সক্রিয় হওয়ার লক্ষণ।";
    }
    if (diff > 500) return "আপনার মস্তিষ্কে 'কগনিটিভ ইন্টারফারেন্স' বেশ প্রকট। আপনি দ্বিতীয় ধাপে অনেক বেশি সময় নিয়েছেন, যা নির্দেশ করে যে আপনার ব্রেন শব্দের অর্থ এবং রঙের মধ্যে পার্থক্য করতে লড়াই করেছে।";
    if (diff > 200) return "আপনার ফলাফল স্বাভাবিক স্ট্রুপ এফেক্ট নির্দেশ করছে। শব্দের অর্থ এবং কালির রঙের অমিল আপনার প্রসেসিং স্পিড কিছুটা কমিয়ে দিয়েছে।";
    return "চমৎকার! আপনার কগনিটিভ কন্ট্রোল খুব শক্তিশালী। অসামঞ্জস্যপূর্ণ তথ্যের মধ্যেও আপনি খুব দ্রুত সঠিক সিদ্ধান্ত নিতে সক্ষম হয়েছেন।";
  };

  const generatePDF = async () => {
    if (!comment.trim()) {
      alert('অনুগ্রহ করে একটি মন্তব্য যোগ করুন');
      return;
    }

    setLoading(true);
    try {
      // Create a compact PDF content
      const element = document.createElement('div');
      element.style.width = '210mm';
      element.style.padding = '20mm';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = "'Helvetica', 'Arial', sans-serif";
      
      const cStats = getStats(results.congruent);
      const iStats = getStats(results.incongruent);
      const diff = iStats.avg - cStats.avg;
      
      const analysis = getAnalysis();
      
      // Format date
      const date = new Date().toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #1e293b; margin-bottom: 5px;">Stroop Test Report</h1>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">পরীক্ষণের তারিখ: ${date}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
          <h2 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">পরীক্ষণ পাত্রের তথ্য</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
              <p style="color: #475569; font-size: 12px; margin-bottom: 4px;">নাম</p>
              <p style="font-weight: bold; color: #1e293b; font-size: 14px;">${participantInfo.name}</p>
            </div>
            <div>
              <p style="color: #475569; font-size: 12px; margin-bottom: 4px;">বয়স</p>
              <p style="font-weight: bold; color: #1e293b; font-size: 14px;">${participantInfo.age} বছর</p>
            </div>
            <div>
              <p style="color: #475569; font-size: 12px; margin-bottom: 4px;">লিঙ্গ</p>
              <p style="font-weight: bold; color: #1e293b; font-size: 14px;">
                ${participantInfo.gender === 'male' ? 'পুরুষ' : 
                 participantInfo.gender === 'female' ? 'নারী' : 
                 participantInfo.gender === 'other' ? 'অন্যান্য' : ''}
              </p>
            </div>
            <div>
              <p style="color: #475569; font-size: 12px; margin-bottom: 4px;">শিক্ষা</p>
              <p style="font-weight: bold; color: #1e293b; font-size: 14px;">
                ${participantInfo.education === 'hsc' ? 'এইচএসসি' :
                 participantInfo.education === 'graduation' ? 'স্নাতক' :
                 participantInfo.education === 'masters' ? 'স্নাতকোত্তর' :
                 participantInfo.education === 'phd' ? 'পিএইচডি' : ''}
              </p>
            </div>
            ${participantInfo.socioeconomic ? `
              <div>
                <p style="color: #475569; font-size: 12px; margin-bottom: 4px;">আর্থসামাজিক অবস্থা</p>
                <p style="font-weight: bold; color: #1e293b; font-size: 14px;">
                  ${participantInfo.socioeconomic === 'low' ? 'নিম্ন' :
                   participantInfo.socioeconomic === 'middle' ? 'মধ্যম' :
                   participantInfo.socioeconomic === 'high' ? 'উচ্চ' : ''}
                </p>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="display: flex; gap: 15px; margin-bottom: 25px;">
          <div style="flex: 1; background: #d1fae5; padding: 20px; border-radius: 12px; border: 1px solid #a7f3d0;">
            <h3 style="font-size: 14px; font-weight: bold; color: #065f46; margin-bottom: 10px;">ফেজ ১: সাধারণ</h3>
            <div style="font-size: 32px; font-weight: bold; color: #065f46; margin-bottom: 10px;">${cStats.avg} <span style="font-size: 16px;">ms</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #065f46;">
              <span>সঠিক: ${cStats.correct}</span>
              <span>ভুল: ${cStats.incorrect}</span>
            </div>
          </div>
          
          <div style="flex: 1; background: #fef3c7; padding: 20px; border-radius: 12px; border: 1px solid #fde68a;">
            <h3 style="font-size: 14px; font-weight: bold; color: #92400e; margin-bottom: 10px;">ফেজ ২: চ্যালেঞ্জ</h3>
            <div style="font-size: 32px; font-weight: bold; color: #92400e; margin-bottom: 10px;">${iStats.avg} <span style="font-size: 16px;">ms</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #92400e;">
              <span>সঠিক: ${iStats.correct}</span>
              <span>ভুল: ${iStats.incorrect}</span>
            </div>
          </div>
        </div>
        
        <div style="background: #ede9fe; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #ddd6fe;">
          <h3 style="font-size: 16px; font-weight: bold; color: #5b21b6; margin-bottom: 10px;">Stroop Interference Score</h3>
          <div style="font-size: 36px; font-weight: bold; color: #5b21b6; text-align: center;">+${Math.abs(diff)} ms</div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">ফলাফলের বিশ্লেষণ</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: justify;">${analysis}</p>
        </div>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #fde68a;">
          <h3 style="font-size: 16px; font-weight: bold; color: #92400e; margin-bottom: 10px;">আপনার মন্তব্য</h3>
          <p style="color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${comment}</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 11px; margin-bottom: 5px;">Psychological Assessment Lab</p>
          <p style="color: #94a3b8; font-size: 10px;">Kazi Azimuddin College, Gazipur</p>
        </div>
      `;
      
      // Add to DOM temporarily
      document.body.appendChild(element);
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 210 * 3.78, // Convert mm to pixels (1mm = 3.78px)
        height: element.scrollHeight,
        windowWidth: 210 * 3.78
      });
      
      document.body.removeChild(element);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 190; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if content fits in one page
      if (imgHeight > 280) {
        // If too long, scale down
        const scale = 280 / imgHeight;
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth * scale, imgHeight * scale);
      } else {
        pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      }
      
      pdf.save(`Stroop_Test_${participantInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF তৈরি করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  // Progress calculation
  const calculateProgress = () => {
    if (step === 'testing') {
      const totalTrials = trialsPerPhase * 2;
      const completedTrials = currentTrial + (testType === 'incongruent' ? trialsPerPhase : 0);
      return (completedTrials / totalTrials) * 100;
    }
    if (step === 'participant_form') return 75;
    if (step === 'result') return 100;
    return 0;
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
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden bg-slate-50">
      <AnimatedBg />

      <div className="max-w-2xl w-full bg-white/97 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-y-auto max-h-[95vh] relative z-10 border border-white/30">
        
        {(step === 'testing' || step === 'participant_form' || step === 'result') && (
           <div className="h-2 bg-slate-100 w-full sticky top-0 z-20">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                style={{ width: `${calculateProgress()}%` }}
              />
           </div>
        )}

        {step === 'welcome' && (
          <div className="p-10 text-center">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-3xl opacity-40 animate-pulse" />
              <div className="relative bg-white p-6 rounded-[2.5rem] shadow-2xl border border-indigo-50">
                <Brain size={64} className="text-indigo-600" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Stroop Test <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Expert</span></h1>
            <p className="text-slate-500 mb-8 font-medium italic">মস্তিষ্কের মনোযোগ ও প্রক্রিয়াকরণ ক্ষমতা যাচাই</p>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 backdrop-blur rounded-3xl p-6 mb-8 border border-slate-200 text-left shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl">MR</div>
                <div>
                  <p className="text-xl font-bold text-slate-800 leading-none">Muhammad Rakib</p>
                  <p className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold uppercase tracking-widest mt-2">Lead Researcher</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 pt-4 mt-2">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Session</p>
                  <p className="font-semibold text-slate-700">Psychology 25-26</p>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Institution</p>
                  <p className="font-semibold text-slate-700 leading-tight">Kazi Azimuddin College</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setStep('instruction_congruent')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 rounded-2xl transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 group active:scale-95 hover:shadow-indigo-200 hover:shadow-2xl"
            >
              পরীক্ষণ শুরু করুন <Play size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {(step === 'instruction_congruent' || step === 'instruction_incongruent') && (
          <div className="p-10">
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
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-3xl border border-indigo-100">
                <div className="text-center mb-3">
                  <div className="text-4xl font-black inline-block px-4 py-2 rounded-2xl mb-2" style={{ color: '#ef4444' }}>
                    নীল
                  </div>
                  <p className="text-slate-600 text-sm">উদাহরণ: শব্দটি "নীল" কিন্তু রঙ লাল। আপনাকে "লাল" সিলেক্ট করতে হবে।</p>
                </div>
              </div>
              
              <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100">
                <p className="text-indigo-700 text-sm italic text-center font-medium">"সঠিক উত্তর এবং দ্রুত গতি—উভয়ই আপনার কগনিটিভ স্কোরের জন্য জরুরি"</p>
              </div>
            </div>

            <button 
              onClick={() => startTest(step === 'instruction_congruent' ? 'congruent' : 'incongruent')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95 hover:shadow-2xl"
            >
              আমি প্রস্তুত
            </button>
          </div>
        )}

        {step === 'testing' && (
          <div className="p-10 text-center min-h-[500px] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="px-5 py-2 bg-slate-100 rounded-2xl flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${testType === 'congruent' ? 'bg-green-500' : 'bg-amber-500'}`} />
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
                  className="text-6xl md:text-8xl font-black select-none transition-all duration-75"
                  style={{ color: currentWord.color, textShadow: '4px 6px 20px rgba(0,0,0,0.2)' }}
                >
                  {currentWord.text}
                </h1>
              )}
              <p className="text-slate-400 mt-4 text-sm font-medium">শব্দের রঙটি সিলেক্ট করুন</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleResponse(color.name)}
                  className="bg-white border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1 p-4 rounded-2xl font-bold text-lg transition-all active:scale-90 shadow-sm duration-200 text-slate-900"
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'participant_form' && (
          <div className="p-10">
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
                    min="1"
                    max="120"
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
                  <option value="hsc">এইচএসসি</option>
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
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 rounded-2xl shadow-xl transition-all active:scale-95 hover:shadow-2xl"
            >
              ফলাফল দেখুন
            </button>
          </div>
        )}

        {step === 'result' && (
          <div ref={resultRef} className="p-8 pb-12 bg-white">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <Award size={64} className="text-amber-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900">বিস্তারিত রিপোর্ট</h2>
              <p className="text-slate-500 mt-1">Thanks For Attending</p>
            </div>

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
                  <p className="font-bold text-slate-900">
                    {participantInfo.gender === 'male' ? 'পুরুষ' : 
                     participantInfo.gender === 'female' ? 'নারী' : 
                     participantInfo.gender === 'other' ? 'অন্যান্য' : ''}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm">
                  <p className="text-cyan-600 font-bold text-xs uppercase mb-1">শিক্ষা</p>
                  <p className="font-bold text-slate-900">
                    {participantInfo.education === 'hsc' ? 'এইচএসসি' :
                     participantInfo.education === 'graduation' ? 'স্নাতক' :
                     participantInfo.education === 'masters' ? 'স্নাতকোত্তর' :
                     participantInfo.education === 'phd' ? 'পিএইচডি' : ''}
                  </p>
                </div>
                {participantInfo.socioeconomic && (
                  <div className="bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm col-span-2 md:col-span-1">
                    <p className="text-cyan-600 font-bold text-xs uppercase mb-1">অর্থনৈতিক অবস্থা</p>
                    <p className="font-bold text-slate-900">
                      {participantInfo.socioeconomic === 'low' ? 'নিম্ন' :
                       participantInfo.socioeconomic === 'middle' ? 'মধ্যম' :
                       participantInfo.socioeconomic === 'high' ? 'উচ্চ' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                  <div className="flex items-center gap-1">✓ সঠিক: {getStats(results.congruent).correct}</div>
                  <div className="flex items-center gap-1">✗ ভুল: {getStats(results.congruent).incorrect}</div>
                </div>
              </div>

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
                  <div className="flex items-center gap-1">✓ সঠিক: {getStats(results.incongruent).correct}</div>
                  <div className="flex items-center gap-1">✗ ভুল: {getStats(results.incongruent).incorrect}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2rem] p-6 text-white mb-6 shadow-xl shadow-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Stroop Interference Score</p>
                <h3 className="text-3xl font-black">+{Math.abs(getStats(results.incongruent).avg - getStats(results.congruent).avg)} ms</h3>
              </div>
              <div className="opacity-40">📊</div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8 mb-6">
              <section>
                <h4 className="flex items-center gap-2 text-indigo-600 font-black mb-3 text-lg uppercase tracking-tighter">
                  📖 ফলাফলের বিশ্লেষণ
                </h4>
                <div className="bg-slate-50 p-5 rounded-3xl text-slate-700 leading-relaxed italic border-l-4 border-indigo-400">
                  {getAnalysis()}
                </div>
              </section>
            </div>

            <div className="bg-orange-50 rounded-[2.5rem] p-8 border border-orange-200 shadow-sm mb-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={generatePDF}
                disabled={loading}
                className="py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-lg active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    তৈরি হচ্ছে...
                  </>
                ) : (
                  <>
                    <Download size={20} className="group-hover:scale-110 transition-transform" /> PDF ডাউনলোড করুন
                  </>
                )}
              </button>
              <button 
                onClick={resetTest}
                className="py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-md active:scale-95"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" /> নতুন সেশন শুরু করুন
              </button>
            </div>
            
            <footer className="mt-12 text-center">
              <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase mb-1">Psychological Assessment Lab</p>
              <p className="text-[9px] text-slate-400 font-medium">Kazi Azimuddin College, Gazipur | {new Date().toLocaleDateString('bn-BD')}</p>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
