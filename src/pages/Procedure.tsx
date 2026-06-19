import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  Info, 
  CheckCircle2, 
  Circle, 
  Stethoscope, 
  Hospital, 
  Utensils,
  ArrowRight,
  ChevronRight,
  MapPin,
  Zap
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { GoogleGenAI, Type } from '@google/genai';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useHealth } from '../context/HealthContext';
import { useNavigate } from 'react-router-dom';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ProcedureStep {
  title: string;
  description: string;
  instructions: string[];
  videoUrl?: string;
  isHospitalVisit: boolean;
  status: 'pending' | 'current' | 'completed';
}

interface ProcedureData {
  steps: ProcedureStep[];
  doctorSpecialty: string;
  hospitalType: string;
  dietaryAdvice: string[];
  estimatedBill: string;
  isEmergency: boolean;
}

export default function Procedure() {
  const navigate = useNavigate();
  const { 
    procedure, 
    setProcedure, 
    currentStepIndex, 
    setCurrentStepIndex,
    userInput: input,
    setUserInput: setInput
  } = useHealth();
  const [isLoading, setIsLoading] = useState(false);
  const [ambulanceStep, setAmbulanceStep] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleOpenClinicMap = () => {
    if (!procedure) return;
    
    setAmbulanceStep(1);
    
    const steps = [
      { delay: 1000, step: 2 },
      { delay: 2000, step: 3 },
      { delay: 3000, step: 4 },
      { delay: 4000, step: null }
    ];

    steps.forEach(({ delay, step }) => {
      setTimeout(() => {
        if (step === null) {
          window.location.href = `/map?emergency=${procedure.isEmergency}`;
        } else {
          setAmbulanceStep(step);
        }
      }, delay);
    });
  };

  const handleWatchTutorial = () => {
    if (!procedure) return;
    const step = procedure.steps[currentStepIndex];
    const query = `${step.title} tutorial for ${input}`;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
  };

  const handleFindSpecialist = () => {
    if (!procedure) return;

    navigate(`/doctors?specialty=${encodeURIComponent(procedure.doctorSpecialty)}&search=${encodeURIComponent(procedure.doctorSpecialty)}`);
  };

  const handleViewNearbyFacilities = () => {
    if (!procedure) return;

    navigate(`/map?facility=${encodeURIComponent(procedure.hospitalType)}&emergency=${procedure.isEmergency}`);
  };

  const handleAnalyzeSymptoms = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Analyze these symptoms and provide a step-by-step medical procedure, recommended doctor specialty, hospital type, dietary advice, and estimated bill in INR. Also determine if it's an emergency: ${input}` }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    instructions: { 
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    videoUrl: { type: Type.STRING, description: "A relevant YouTube video ID for home care, or null if hospital visit" },
                    isHospitalVisit: { type: Type.BOOLEAN }
                  },
                  required: ['title', 'description', 'instructions', 'isHospitalVisit']
                }
              },
              doctorSpecialty: { type: Type.STRING },
              hospitalType: { type: Type.STRING },
              dietaryAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              estimatedBill: { type: Type.STRING },
              isEmergency: { type: Type.BOOLEAN }
            },
            required: ['steps', 'doctorSpecialty', 'hospitalType', 'dietaryAdvice', 'estimatedBill', 'isEmergency']
          },
          systemInstruction: "You are a medical procedure assistant. Based on symptoms, generate a logical step-by-step guide (4-6 steps) for the user to follow. For each step, provide a list of detailed instructions. If a step is for home care, provide a relevant YouTube video ID (e.g., 'dQw4w9WgXcQ'). If a step requires visiting a hospital, set isHospitalVisit to true. Also suggest the type of doctor they should see, the type of hospital/clinic, and specific dietary advice. Estimate the total bill in INR. Determine if the situation is an emergency. Always include a disclaimer that this is not professional medical advice."
        }
      });

      const data = JSON.parse(response.text || '{}');
      const formattedSteps = data.steps.map((step: any, index: number) => ({
        ...step,
        status: index === 0 ? 'current' : 'pending'
      }));

      setProcedure({
        ...data,
        steps: formattedSteps
      });
      setCurrentStepIndex(0);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (!procedure || currentStepIndex >= procedure.steps.length - 1) return;
    
    const newSteps = [...procedure.steps];
    newSteps[currentStepIndex].status = 'completed';
    newSteps[currentStepIndex + 1].status = 'current';
    
    setProcedure({ ...procedure, steps: newSteps });
    setCurrentStepIndex(currentStepIndex + 1);
  };

  return (
    <div className="relative mx-auto max-w-5xl space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:space-y-8 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_58%)]" />
      <header className="overflow-hidden rounded-[28px] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:px-5 sm:py-5">
        <h1 className="flex flex-wrap items-center gap-3 text-2xl font-display font-bold text-slate-900 sm:text-3xl">
          Medical Procedure Guide
          <div className="px-2 py-1 bg-brand-100 text-brand-600 text-[10px] uppercase tracking-widest rounded-md font-bold">AI Powered</div>
        </h1>
        <p className="text-slate-500 font-medium">Input your symptoms to get a personalized health roadmap.</p>
      </header>

      {!procedure && (
        <Card className="p-5 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-brand-600">
              <Sparkles size={24} />
              <h2 className="text-xl font-display font-bold text-slate-900">Symptom Analysis</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">Describe how you're feeling in detail. Our AI will analyze your symptoms and create a step-by-step procedure for you.</p>
            <div className="relative">
              <textarea 
                placeholder="e.g., I have a sharp pain in my lower back that started yesterday after lifting something heavy. It radiates down my left leg..."
                className="min-h-[150px] w-full resize-none rounded-3xl border-none bg-slate-50 p-4 font-medium transition-all focus:ring-2 focus:ring-brand-500 sm:p-6"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button 
                variant="primary" 
                className="absolute bottom-4 left-4 right-4 justify-center sm:left-auto sm:right-4 sm:w-auto"
                onClick={handleAnalyzeSymptoms}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                <span>Analyze Symptoms</span>
              </Button>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest justify-center">
              <Info size={12} />
              <span>This is not a substitute for professional medical diagnosis.</span>
            </div>
          </div>
        </Card>
      )}

      {procedure && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress & Steps */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 sm:p-6 lg:p-8">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-display font-bold text-slate-900 sm:text-xl">Your Health Roadmap</h2>
                <div className="text-sm font-bold text-brand-600">
                  Step {currentStepIndex + 1} of {procedure.steps.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-12">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2"></div>
                <motion.div 
                  className="absolute top-1/2 left-0 h-1 bg-brand-600 -translate-y-1/2"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStepIndex / (procedure.steps.length - 1)) * 100}%` }}
                />
                <div className="relative flex justify-between">
                  {procedure.steps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors z-10",
                        step.status === 'completed' ? "bg-brand-600 text-white" : 
                        step.status === 'current' ? "bg-brand-100 text-brand-600 border-brand-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {step.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={12} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Step Detail */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentStepIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-slate-50 rounded-3xl p-8 space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold text-slate-900">{procedure.steps[currentStepIndex].title}</h3>
                    <p className="text-slate-600 leading-relaxed">{procedure.steps[currentStepIndex].description}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <Info size={16} className="text-brand-600" />
                      Detailed Instructions
                    </h4>
                    <ul className="space-y-3">
                      {procedure.steps[currentStepIndex].instructions.map((ins, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{ins}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {procedure.steps[currentStepIndex].isHospitalVisit ? (
                    <Card className="p-6 bg-indigo-50 border-indigo-100 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Hospital size={80} />
                      </div>
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-600 text-white rounded-lg">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">Hospital Visit Required</h4>
                            <p className="text-xs text-slate-500 font-medium">Find the nearest {procedure.hospitalType}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                          Based on your symptoms, we recommend visiting a hospital for professional care. 
                          {procedure.isEmergency ? " This is an emergency. An ambulance is recommended." : " You can take a taxi or walk if it's nearby."}
                        </p>
                        <Button 
                          variant="primary" 
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                          onClick={handleOpenClinicMap}
                        >
                          Open Clinic Map
                        </Button>
                      </div>
                    </Card>
                  ) : procedure.steps[currentStepIndex].videoUrl ? (
                    <Card className="p-6 bg-rose-50 border-rose-100 overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-600 text-white rounded-lg">
                            <Zap size={20} />
                          </div>
                          <h4 className="font-bold text-slate-900">Watch Tutorial</h4>
                        </div>
                        <div 
                          className="aspect-video rounded-2xl overflow-hidden bg-slate-900 relative group cursor-pointer"
                          onClick={handleWatchTutorial}
                        >
                          <img 
                            src={`https://img.youtube.com/vi/${procedure.steps[currentStepIndex].videoUrl}/maxresdefault.jpg`} 
                            alt="Video Thumbnail"
                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                              <ArrowRight size={32} />
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium text-center italic">Follow this video guide for proper home care technique.</p>
                      </div>
                    </Card>
                  ) : null}

                  <div className="pt-4">
                    <Button 
                      variant="primary" 
                      onClick={nextStep}
                      disabled={currentStepIndex === procedure.steps.length - 1}
                      className="w-full py-6 text-lg"
                    >
                      {currentStepIndex === procedure.steps.length - 1 ? 'Procedure Complete' : 'Mark as Completed'}
                      <ChevronRight size={24} />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* All Steps List */}
              <div className="mt-12 space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">All Steps</h4>
                {procedure.steps.map((step, i) => (
                  <div key={i} className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                    step.status === 'current' ? "border-brand-200 bg-brand-50/50" : "border-slate-50"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                      step.status === 'completed' ? "bg-brand-600 text-white" : 
                      step.status === 'current' ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {i + 1}
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      step.status === 'completed' ? "text-slate-400 line-through" : "text-slate-700"
                    )}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-slate-900 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-600 rounded-lg">
                  <Stethoscope size={20} />
                </div>
                <h3 className="text-lg font-display font-bold">Recommended Specialist</h3>
              </div>
              <p className="text-2xl font-display font-bold mb-2">{procedure.doctorSpecialty}</p>
              <p className="text-sm text-slate-400 mb-6">Based on your symptoms, this specialist can provide the best care.</p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Estimated Bill</p>
                <p className="text-xl font-bold">₹{procedure.estimatedBill}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleFindSpecialist}
                className="w-full border-white/10 text-white hover:bg-white/5"
              >
                Find {procedure.doctorSpecialty}s
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Hospital size={20} />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900">Facility Type</h3>
              </div>
              <p className="text-xl font-bold text-slate-800 mb-2">{procedure.hospitalType}</p>
              <p className="text-sm text-slate-500 mb-6">We recommend visiting this type of facility for your condition.</p>
              <Button variant="outline" onClick={handleViewNearbyFacilities} className="w-full">
                View Nearby Facilities
              </Button>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Utensils size={20} />
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900">Dietary Advice</h3>
              </div>
              <ul className="space-y-3">
                {procedure.dietaryAdvice.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Button 
              variant="ghost" 
              className="w-full text-slate-400 hover:text-red-600"
              onClick={() => setProcedure(null)}
            >
              Reset Analysis
            </Button>
          </div>
        </div>
      )}
      {/* Ambulance Dispatch Animation Overlay */}
      <AnimatePresence>
        {ambulanceStep !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <Card className="w-full max-w-md p-8 text-center space-y-8 bg-white border-none shadow-2xl">
              <div className="relative w-24 h-24 mx-auto">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-full h-full bg-red-100 rounded-full flex items-center justify-center text-red-600"
                >
                  <Hospital size={48} />
                </motion.div>
                <motion.div 
                  animate={{ 
                    x: [-20, 20, -20],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-red-600"
                >
                  <Zap size={24} fill="currentColor" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-slate-900">Emergency Dispatch</h3>
                <p className="text-slate-500 font-medium">Arranging immediate assistance...</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Step {ambulanceStep} of 4</span>
                  <span>{Math.round((ambulanceStep / 4) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(ambulanceStep / 4) * 100}%` }}
                    className="h-full bg-red-600"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(s => (
                    <div 
                      key={s} 
                      className={cn(
                        "h-1 rounded-full transition-colors",
                        s <= ambulanceStep ? "bg-red-600" : "bg-slate-100"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-sm font-bold text-red-700">
                  {ambulanceStep === 1 && "Locating nearest ambulance..."}
                  {ambulanceStep === 2 && "Contacting emergency services..."}
                  {ambulanceStep === 3 && "Dispatching medical team..."}
                  {ambulanceStep === 4 && "Ambulance en route. Redirecting to map..."}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
