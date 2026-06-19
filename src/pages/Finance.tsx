import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  Upload, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Newspaper,
  TrendingDown,
  Info,
  Hospital,
  Clock,
  MessageSquare,
  Send,
  Search,
  MapPin,
  AlertTriangle,
  Zap,
  DollarSign,
  ClipboardList
} from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, limit, or, and } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const parseAmount = (value: string) => {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const analyzeBillText = (input: string) => {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const breakdown = lines
    .map((line) => {
      const match = line.match(/^(.*?)(?:\s*[-:|]\s*|\s+)(₹?[\d,]+(?:\.\d+)?)(?:\s*)$/);
      if (!match) return null;

      const item = match[1].trim();
      const amount = parseAmount(match[2]);
      return item && amount > 0 ? { item, amount } : null;
    })
    .filter(Boolean) as { item: string; amount: number }[];

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const withStatus = breakdown.map((entry) => {
    const ratio = total > 0 ? entry.amount / total : 0;
    const normalized = entry.item.toLowerCase();
    const suspiciousKeyword = /(service|admin|convenience|misc|miscellaneous|handling)/.test(normalized);
    const highKeyword = /(lab|scan|test|diagnostic)/.test(normalized);

    let status: 'Normal' | 'High' | 'Suspicious' = 'Normal';
    if (suspiciousKeyword || ratio >= 0.35) status = 'Suspicious';
    else if (highKeyword || ratio >= 0.2) status = 'High';

    return {
      ...entry,
      status,
      cost: formatCurrency(entry.amount)
    };
  });

  const suspiciousCharges = withStatus
    .filter((item) => item.status !== 'Normal')
    .map((item) =>
      item.status === 'Suspicious'
        ? `${item.item} looks unusually high for this bill mix and should be verified before payment.`
        : `${item.item} is a sizeable cost component; compare it with another provider if possible.`
    );

  const possibleSavings = withStatus.reduce((sum, item) => {
    if (item.status === 'Suspicious') return sum + item.amount * 0.28;
    if (item.status === 'High') return sum + item.amount * 0.12;
    return sum;
  }, 0);

  const transparencyScore = Math.max(
    52,
    Math.min(
      98,
      Math.round(100 - withStatus.filter((item) => item.status === 'Suspicious').length * 16 - withStatus.filter((item) => item.status === 'High').length * 7)
    )
  );

  const comparisonItem = withStatus.find((item) => item.status !== 'Normal') || withStatus[0];
  const comparisonNote = comparisonItem
    ? `${comparisonItem.item} could potentially be reduced by about ${formatCurrency(
        Math.max(300, Math.round(comparisonItem.amount * (comparisonItem.status === 'Suspicious' ? 0.2 : 0.1)))
      )} with a second quote or insurer validation.`
    : 'Add line items with prices to compare costs and generate savings suggestions.';

  return {
    type: 'bill' as const,
    total: formatCurrency(total),
    savings: formatCurrency(Math.round(possibleSavings)),
    transparencyScore,
    relevance: suspiciousCharges.length > 1 ? 'Needs Review' : 'Mostly Clear',
    breakdown: withStatus,
    suspiciousCharges:
      suspiciousCharges.length > 0 ? suspiciousCharges : ['No obvious irregular charges were detected from the data you entered.'],
    priceComparison: comparisonNote,
    complaintEligible: withStatus.some((item) => item.status === 'Suspicious')
  };
};

const analyzePrescriptionText = (input: string, allergies?: string) => {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const medicines = lines.map((line, index) => {
    const [name = `Medicine ${index + 1}`, dosage = 'Not specified', schedule = 'Follow doctor advice', duration = 'Not specified', purpose = 'General use'] =
      line.split('|').map((part) => part.trim());

    return { name, dosage, schedule, duration, purpose };
  });

  const completedFields = medicines.reduce((sum, med) => {
    return sum + [med.name, med.dosage, med.schedule, med.duration, med.purpose].filter((value) => value && value !== 'Not specified').length;
  }, 0);
  const clarityScore = medicines.length > 0 ? Math.min(99, Math.round((completedFields / (medicines.length * 5)) * 100)) : 0;
  const severeKeywords = /(antibiotic|steroid|insulin|opioid|bp|pressure|diabetes|infection)/i;
  const severity = medicines.some((med) => severeKeywords.test(`${med.name} ${med.purpose}`))
    ? 'Moderate'
    : medicines.length >= 4
      ? 'Moderate'
      : 'Low';

  const normalizedAllergies = (allergies || '').toLowerCase();
  const allergyFlag = medicines.find((med) => normalizedAllergies && normalizedAllergies.includes(med.name.toLowerCase().split(' ')[0]));

  return {
    type: 'prescription' as const,
    clarityScore,
    severity,
    medicines,
    aiInsights: allergyFlag
      ? `${allergyFlag.name} may overlap with the allergy information in your profile. Please confirm this medicine with your doctor before taking it.`
      : `Your prescription lists ${medicines.length} medicine${medicines.length === 1 ? '' : 's'}. Keep the timing consistent and double-check each dosage label before starting.`,
    costOptimization:
      medicines.length > 0
        ? `Ask the pharmacy for generic versions of ${medicines
            .slice(0, 2)
            .map((med) => med.name)
            .join(' and ')} to potentially lower the total cost.`
        : 'Enter medicines line by line to get cost-saving suggestions.',
    availability: medicines.length > 0 ? `Common pharmacy availability expected for ${medicines.length} listed medicine${medicines.length === 1 ? '' : 's'}.` : 'No medicine data entered yet.'
  };
};

export default function Finance() {
  const { user } = useAuth();
  const [advisorMessage, setAdvisorMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const advisorChatContainerRef = useRef<HTMLDivElement>(null);
  const billFileInputRef = useRef<HTMLInputElement>(null);
  const prescriptionFileInputRef = useRef<HTMLInputElement>(null);
  const [billFileName, setBillFileName] = useState('');
  const [prescriptionFileName, setPrescriptionFileName] = useState('');

  useEffect(() => {
    const container = advisorChatContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatHistory]);
  const [isSending, setIsSending] = useState(false);
  const [activeAdvisor, setActiveAdvisor] = useState<any>(null);

  useEffect(() => {
    const advisorsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'advisor'),
      limit(1)
    );

    const unsubscribe = onSnapshot(advisorsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const advisorDoc = snapshot.docs[0];
        setActiveAdvisor({ id: advisorDoc.id, ...advisorDoc.data() });
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !activeAdvisor) return;

    const chatId = [user.uid, activeAdvisor.id].sort().join('_');
    const chatQuery = query(
      collection(db, 'messages'),
      and(
        where('chatId', '==', chatId),
        or(
          where('senderUid', '==', user.uid),
          where('receiverUid', '==', user.uid)
        )
      ),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data({ serverTimestamps: 'estimate' }));
      setChatHistory(msgs);
    }, (error) => {
      // If advisor_demo_uid doesn't exist yet, this might fail or return empty
      console.log('Chat history error or empty:', error.message);
    });

    return () => unsubscribe();
  }, [user, activeAdvisor]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<'bill' | 'prescription'>('bill');
  const [billInput, setBillInput] = useState(`Consultation Fee - 1500
Lab Tests - 4500
Pharmacy - 2450
Service Charges - 4000`);
  const [prescriptionInput, setPrescriptionInput] = useState(`Amoxicillin 500mg | 1-0-1 | After Food | 5 Days | Bacterial infection
Paracetamol 650mg | 1-1-1 | After Food | 3 Days | Fever and pain`);
  const [analysisError, setAnalysisError] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [billChatHistory, setBillChatHistory] = useState<any[]>([]);

  const handleAnalyze = (type: 'bill' | 'prescription') => {
    setAnalysisType(type);
    setAnalysisError('');
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    setTimeout(() => {
      if (type === 'bill') {
        const result = analyzeBillText(billInput);
        if (result.breakdown.length === 0) {
          setAnalysisError('Enter bill items like "Consultation Fee - 1500" on separate lines.');
          setIsAnalyzing(false);
          return;
        }
        setAnalysisResult(result);
        setBillChatHistory([{ role: 'ai', content: 'Analysis complete! I used the bill items you entered. Ask me if you want help understanding any specific charge.' }]);
        setIsAnalyzing(false);
        return;
      }

      const result = analyzePrescriptionText(prescriptionInput, user?.allergies);
      if (result.medicines.length === 0) {
        setAnalysisError('Enter prescription lines like "Medicine | Dosage | Timing | Duration | Purpose".');
        setIsAnalyzing(false);
        return;
      }
      setAnalysisResult(result);
      setBillChatHistory([{ role: 'ai', content: 'Analysis complete! I used the prescription details you entered. Ask me if you want help understanding the dosage or schedule.' }]);
      setIsAnalyzing(false);
      return;
      if (type === 'bill') {
        setAnalysisResult({
          type: 'bill',
          total: '₹12,450.00',
          savings: '₹3,420.00',
          transparencyScore: 85,
          relevance: 'Fairly Relevant',
          breakdown: [
            { item: 'Consultation Fee', cost: '₹1,500', status: 'Normal' },
            { item: 'Lab Tests (CBC, Lipid)', cost: '₹4,500', status: 'High' },
            { item: 'Pharmacy (Antibiotics)', cost: '₹2,450', status: 'Normal' },
            { item: 'Service Charges', cost: '₹4,000', status: 'Suspicious' },
          ],
          suspiciousCharges: ['Service charges are 30% higher than average for this clinic type.'],
          priceComparison: 'Nearby clinics offer the same lab tests for ₹3,200 (28% less).',
          complaintEligible: true
        });
      } else {
        setAnalysisResult({
          type: 'prescription',
          clarityScore: 92,
          severity: 'Moderate',
          medicines: [
            { name: 'Amoxicillin 500mg', dosage: '1-0-1', schedule: 'After Food', duration: '5 Days', purpose: 'Bacterial Infection' },
            { name: 'Paracetamol 650mg', dosage: '1-1-1', schedule: 'As needed', duration: '3 Days', purpose: 'Fever/Pain' },
          ],
          aiInsights: 'No allergies detected based on your profile. Patient age (28) is suitable for these dosages.',
          costOptimization: 'Switch to Generic Amoxicillin to save ₹120 per strip.',
          availability: 'Available at 4 nearby stores (Apollo Pharmacy, Wellness Forever).',
        });
      }
      setBillChatHistory([{ role: 'ai', content: `Analysis complete! I've scanned your ${type}. How can I help you understand the details?` }]);
    }, 3000);
  };

  const handleFileUpload = (type: 'bill' | 'prescription', file?: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';

      if (type === 'bill') {
        setBillInput(text);
        setBillFileName(file.name);
      } else {
        setPrescriptionInput(text);
        setPrescriptionFileName(file.name);
      }

      setAnalysisType(type);
      setAnalysisError('');
      setAnalysisResult(null);
      setBillChatHistory([]);
    };

    reader.readAsText(file);
  };

  const handleSendToAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim() || !user || !activeAdvisor) return;

    setIsSending(true);
    const chatId = [user.uid, activeAdvisor.id].sort().join('_');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderUid: user.uid,
        receiverUid: activeAdvisor.id,
        content: advisorMessage,
        timestamp: serverTimestamp(),
        unread: true
      });
      setAdvisorMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBillMessage = () => {
    if (!chatMessage.trim()) return;
    const newHistory = [...billChatHistory, { role: 'user', content: chatMessage }];
    setBillChatHistory(newHistory);
    setChatMessage('');
    
    setTimeout(() => {
      setBillChatHistory([...newHistory, { 
        role: 'ai', 
        content: "Based on the analysis, the costs are mostly standard, but the lab tests seem slightly overpriced compared to the local average. Would you like me to find a cheaper diagnostic center?" 
      }]);
    }, 1000);
  };

const expenseData = [
  { month: 'Jan', withoutApp: 4500, withApp: 4500 },
  { month: 'Feb', withoutApp: 4800, withApp: 4200 },
  { month: 'Mar', withoutApp: 5200, withApp: 4600 },
  { month: 'Apr', withoutApp: 4200, withApp: 3500 },
  { month: 'May', withoutApp: 5500, withApp: 4100 },
  { month: 'Jun', withoutApp: 4800, withApp: 3200 },
  { month: 'Jul', withoutApp: 6200, withApp: 4500 },
  { month: 'Aug', withoutApp: 5400, withApp: 3800 },
  { month: 'Sep', withoutApp: 5800, withApp: 3400 },
  { month: 'Oct', withoutApp: 4900, withApp: 2900 },
  { month: 'Nov', withoutApp: 6500, withApp: 3100 },
  { month: 'Dec', withoutApp: 5200, withApp: 2600 },
];

const yourInsurances = [
  {
    title: 'LIC Health Plus',
    img: 'https://d3jbu7vaxvlagf.cloudfront.net/small/v2/category_media/image_17089410905301.jpeg',
    about: 'A long-term health insurance plan that provides financial protection against medical expenses.',
    coverage: 'Up to ₹10 Lakhs per annum',
    restrictions: 'Pre-existing diseases covered after 4 years.',
    link: 'https://licindia.in/'
  }
];

const govInsurances = [
  {
    title: 'The New India Assurance Company',
    img: 'https://content3.jdmagicbox.com/comp/tumkur/36/9999pmulblrstd1004736/catalogue/the-new-india-assurance-co-ltd-barline-tumkur-insurance-companies-lkzz0w8.jpg',
    about: 'Government-owned general insurance company offering comprehensive health plans.',
    coverage: 'Flexible, up to ₹15 Lakhs',
    restrictions: 'Waiting period for specific surgeries.',
    link: 'https://www.newindia.co.in/'
  },
  {
    title: 'United India Insurance Company',
    img: 'https://www.taxscan.in/wp-content/uploads/2023/08/Multiple-openings-United-India-Insurance-Company-Legal-Specialities-Finance-Specialities-Accountants-Jobscan-taxscan.jpg',
    about: 'Leading public sector insurer providing affordable health coverage for all.',
    coverage: 'Up to ₹10 Lakhs',
    restrictions: 'Co-payment applicable for senior citizens.',
    link: 'https://uiic.co.in/'
  },
  {
    title: 'Ayushman Bharat',
    img: 'https://hindiimages.etnownews.com/thumb/msid-118775972,width-1280,height-720,resizemode-75/118775972.jpg',
    about: 'Flagship government health assurance scheme that supports eligible families with cashless treatment at empanelled hospitals.',
    coverage: 'Up to â‚¹5 Lakhs per family per year',
    restrictions: 'Available only to eligible PM-JAY beneficiaries and valid at empanelled hospitals.',
    link: 'https://pmjay.gov.in/'
  }
];

const privateInsurances = [
  {
    title: 'HDFC ERGO General Insurance',
    img: 'https://www.ashoka.edu.in/wp-content/uploads/2021/06/hdfcergo1.jpg',
    about: 'Top-rated private insurer known for quick claim settlements and wide hospital network.',
    coverage: 'Up to ₹50 Lakhs',
    restrictions: 'No-claim bonus resets on claim.',
    link: 'https://www.hdfcergo.com/'
  },
  {
    title: 'Star Health and Allied Insurance',
    img: 'https://www.qian.co.in/images/Star-Health-and-Allied-Insurance-Company.jpg',
    about: 'Specialized health insurer offering plans for specific conditions like diabetes and cardiac.',
    coverage: 'Up to ₹1 Crore',
    restrictions: 'Specific sub-limits on room rent.',
    link: 'https://www.starhealth.in/'
  },
  {
    title: 'ICICI Lombard General Insurance',
    img: 'https://cms-img.coverfox.com/ICICI-LOMBARD-General-Insurance-1200x628.jpg',
    about: 'Innovative health solutions with wellness rewards and digital-first approach.',
    coverage: 'Up to ₹25 Lakhs',
    restrictions: 'Maternity benefits have a 3-year waiting period.',
    link: 'https://www.icicilombard.com/'
  }
];

const InsuranceCard = ({ item, buttonText = "Apply Now", ...props }: { item: any; buttonText?: string; [key: string]: any }) => (
  <Card {...props} className="group overflow-hidden flex flex-col h-full border-slate-200/60 shadow-md hover:shadow-2xl transition-all duration-500">
    <div className="h-52 overflow-hidden relative">
      <img 
        src={item.img} 
        alt={item.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
    <div className="p-6 flex flex-col flex-1 space-y-6 bg-white">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-display font-bold text-slate-900 leading-tight">{item.title}</h3>
        <a 
          href={item.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all shrink-0"
        >
          <ExternalLink size={18} />
        </a>
      </div>
      
      <div className="grid grid-cols-1 gap-3 flex-1">
        <Card hover={false} className="p-4 bg-slate-50/50 border-slate-100 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-brand-100 text-brand-600 rounded-lg">
              <Info size={14} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Its About</p>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">{item.about}</p>
        </Card>
        
        <Card hover={false} className="p-4 bg-emerald-50/30 border-emerald-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShieldCheck size={14} />
            </div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Coverage Amount</p>
          </div>
          <p className="text-sm text-emerald-900 font-bold">{item.coverage}</p>
        </Card>
        
        <Card hover={false} className="p-4 bg-amber-50/30 border-amber-100/50 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle size={14} />
            </div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Restrictions</p>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">{item.restrictions}</p>
        </Card>
      </div>

      <Button
        variant="primary"
        onClick={() => window.open(item.link, '_blank', 'noopener,noreferrer')}
        className="w-full py-6 rounded-2xl shadow-lg shadow-brand-100 group-hover:scale-[1.02] transition-transform"
      >
        {buttonText}
        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  </Card>
);

const newsItems = [
  {
    title: 'New Tax Benefits for Health Insurance in 2026',
    source: 'Financial Times',
    time: '2 hours ago',
    relevance: 'High'
  },
  {
    title: 'How to Dispute Medical Billing Errors Effectively',
    source: 'Health News',
    time: '5 hours ago',
    relevance: 'Medium'
  },
  {
    title: 'Ayushman Bharat Expansion: More Hospitals Added',
    source: 'Government Portal',
    time: '1 day ago',
    relevance: 'High'
  }
];


  return (
    <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-4 sm:px-6 sm:py-6 lg:space-y-12 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_58%)]" />
      <header className="overflow-hidden rounded-[28px] border border-white/80 bg-white/78 px-4 py-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:px-5 sm:py-5">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
          <Wallet size={12} />
          Smart Savings
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 sm:text-3xl">Financial Wellness</h1>
        <p className="text-sm font-medium text-slate-500 sm:text-base">Manage medical expenses, analyze bills, and get expert advice.</p>
      </header>

      {/* AI Bill Checker */}
      <Card className="relative overflow-hidden p-5 sm:p-6 lg:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} className="text-brand-600" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-600 rounded-2xl text-white shadow-lg shadow-brand-200">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">AI Medical Bill Analyzer</h2>
              <p className="text-sm text-slate-500">Upload your bill to find errors and potential savings.</p>
            </div>
          </div>

          {!analysisResult && !isAnalyzing && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div 
                onClick={() => setAnalysisType('bill')}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer group",
                  analysisType === 'bill' ? "border-brand-300 bg-brand-50/40" : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                )}
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-100 transition-all">
                  <FileText size={32} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Analyze Medical Bill</p>
                  <p className="text-sm text-slate-500">Check for errors & overpricing</p>
                </div>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    billFileInputRef.current?.click();
                  }}
                >
                  Upload Bill
                </Button>
              </div>

              <div 
                onClick={() => setAnalysisType('prescription')}
                className={cn(
                  "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all cursor-pointer group",
                  analysisType === 'prescription' ? "border-brand-300 bg-brand-50/40" : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/30"
                )}
              >
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-100 transition-all">
                  <ClipboardList size={32} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Analyze Prescription</p>
                  <p className="text-sm text-slate-500">Dosage, schedule & generic alternatives</p>
                </div>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    prescriptionFileInputRef.current?.click();
                  }}
                >
                  Upload Prescription
                </Button>
              </div>
              </div>

              <Card hover={false} className="p-6 border-slate-200/70 bg-slate-50/70">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-display font-bold text-slate-900">
                      {analysisType === 'bill' ? 'Uploaded Bill File' : 'Uploaded Prescription File'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {analysisType === 'bill'
                        ? 'Choose a text file from your file manager containing bill line items and prices.'
                        : 'Choose a text file from your file manager containing medicine details line by line.'}
                    </p>
                  </div>
                  <Button variant={analysisType === 'bill' ? 'primary' : 'outline'} onClick={() => setAnalysisType(analysisType === 'bill' ? 'prescription' : 'bill')}>
                    {analysisType === 'bill' ? 'Switch to Prescription' : 'Switch to Bill'}
                  </Button>
                </div>

                {analysisError && (
                  <div className="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {analysisError}
                  </div>
                )}

                <input
                  ref={billFileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,text/plain"
                  className="hidden"
                  onChange={(e) => handleFileUpload('bill', e.target.files?.[0])}
                />
                <input
                  ref={prescriptionFileInputRef}
                  type="file"
                  accept=".txt,.csv,.md,text/plain"
                  className="hidden"
                  onChange={(e) => handleFileUpload('prescription', e.target.files?.[0])}
                />

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Selected File</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {analysisType === 'bill'
                          ? (billFileName || 'No bill file selected yet')
                          : (prescriptionFileName || 'No prescription file selected yet')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (analysisType === 'bill') billFileInputRef.current?.click();
                        else prescriptionFileInputRef.current?.click();
                      }}
                    >
                      {analysisType === 'bill' ? 'Choose Bill File' : 'Choose Prescription File'}
                    </Button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {analysisType === 'bill'
                      ? 'Expected format inside file: one charge per line, for example "Consultation Fee - 1500".'
                      : 'Expected format inside file: one medicine per line, for example "Medicine | Dosage | Timing | Duration | Purpose".'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-500">
                    {analysisType === 'bill'
                      ? 'Tip: include all major charges in the file to get a better savings estimate.'
                      : 'Tip: include dosage, timing, duration, and purpose for clearer prescription analysis.'}
                  </p>
                  <Button variant="primary" onClick={() => handleAnalyze(analysisType)} className="px-6">
                    {analysisType === 'bill' ? 'Analyze Bill' : 'Analyze Prescription'}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {isAnalyzing && (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-16 h-16 border-4 border-brand-100 border-t-brand-600 rounded-full"
              />
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900">AI is processing your {analysisType}...</p>
                <p className="text-sm text-slate-500">Scanning for codes, prices, and medical insights.</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {analysisResult && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {analysisResult.type === 'bill' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-6 bg-slate-900 rounded-2xl text-white">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <h3 className="text-3xl font-display font-bold">{analysisResult.total}</h3>
                      </div>
                      <div className="p-6 bg-emerald-500 rounded-2xl text-white">
                        <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">Potential Savings</p>
                        <h3 className="text-3xl font-display font-bold">{analysisResult.savings}</h3>
                      </div>
                      <div className="p-6 bg-brand-50 border border-brand-100 rounded-2xl">
                        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">Transparency Score</p>
                        <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-display font-bold text-brand-700">{analysisResult.transparencyScore}</h3>
                          <span className="text-sm font-bold text-brand-600 mb-1">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <DollarSign size={16} className="text-brand-600" />
                          Cost Breakdown
                        </h4>
                        <div className="space-y-2">
                          {analysisResult.breakdown.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-sm font-medium text-slate-700">{item.item}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-900">{item.cost}</span>
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                  item.status === 'Normal' ? "bg-emerald-100 text-emerald-700" : 
                                  item.status === 'High' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                                )}>
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-rose-600" />
                          Suspicious Charges Detection
                        </h4>
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                          <ul className="space-y-2">
                            {analysisResult.suspiciousCharges.map((err: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-rose-800 font-medium">
                                <div className="mt-1 w-1 h-1 bg-rose-400 rounded-full shrink-0" />
                                {err}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-2">
                          <Search size={16} className="text-brand-600" />
                          Price Comparison
                        </h4>
                        <p className="text-xs text-slate-600 bg-brand-50 p-4 rounded-2xl border border-brand-100">
                          {analysisResult.priceComparison}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-6 bg-brand-600 rounded-2xl text-white">
                        <p className="text-xs font-bold text-brand-100 uppercase tracking-wider mb-1">Clarity Score</p>
                        <h3 className="text-3xl font-display font-bold">{analysisResult.clarityScore}%</h3>
                      </div>
                      <div className="p-6 bg-slate-900 rounded-2xl text-white">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Severity Level</p>
                        <h3 className="text-3xl font-display font-bold">{analysisResult.severity}</h3>
                      </div>
                      <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Availability</p>
                        <div className="flex items-center gap-2 text-emerald-700">
                          <MapPin size={20} />
                          <span className="text-sm font-bold">4 Stores Nearby</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Zap size={16} className="text-brand-600" />
                          Medicine Breakdown & Schedule
                        </h4>
                        <div className="space-y-3">
                          {analysisResult.medicines.map((med: any, i: number) => (
                            <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-slate-900">{med.name}</h5>
                                <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded uppercase">{med.purpose}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                                <p><span className="font-bold text-slate-700">Dosage:</span> {med.dosage}</p>
                                <p><span className="font-bold text-slate-700">Timing:</span> {med.schedule}</p>
                                <p><span className="font-bold text-slate-700">Duration:</span> {med.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Sparkles size={16} className="text-brand-600" />
                          Smart AI Insights
                        </h4>
                        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-xs text-brand-800 leading-relaxed">
                          {analysisResult.aiInsights}
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 pt-2">
                          <TrendingDown size={16} className="text-emerald-600" />
                          Cost Optimization
                        </h4>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-800">
                          {analysisResult.costOptimization}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chat Section */}
                <div className="border-t border-slate-100 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={20} className="text-brand-600" />
                    <h4 className="text-sm font-bold text-slate-900">Ask AI Assistant about this {analysisResult.type}</h4>
                  </div>
                  <div className="bg-slate-50 rounded-3xl p-4 h-48 overflow-y-auto mb-4 space-y-3">
                    {billChatHistory.map((chat, i) => (
                      <div key={i} className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-xs",
                        chat.role === 'ai' ? "bg-white text-slate-700 rounded-tl-none shadow-sm" : "bg-brand-600 text-white rounded-tr-none ml-auto"
                      )}>
                        {chat.content}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask about suspicious charges or alternatives..."
                      className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendBillMessage()}
                    />
                    <Button variant="primary" onClick={handleSendBillMessage} className="px-6">
                      <Send size={18} />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  {analysisResult.type === 'bill' && analysisResult.complaintEligible && (
                    <Button variant="primary" className="flex-1 bg-rose-600 hover:bg-rose-700">
                      Auto-Generate Complaint
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setAnalysisResult(null);
                      setAnalysisError('');
                      setBillChatHistory([]);
                    }}
                  >
                    Upload New Document
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Expense Graph */}
      <Card className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">Expense Optimization</h2>
            <p className="text-sm text-slate-500">Comparison of medical expenses with and without WELLORA.</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <TrendingDown size={20} />
            <span>45% Reduction</span>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="withoutApp" 
                name="Without WELLORA" 
                stroke="#ef4444" 
                strokeWidth={3} 
                strokeDasharray="8 4"
                dot={{ r: 4, fill: '#ef4444' }}
              />
              <Line 
                type="monotone" 
                dataKey="withApp" 
                name="With WELLORA" 
                stroke="#16a34a" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#16a34a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insurance Sections */}
      <section className="space-y-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-slate-900">Insurance Help</h2>
          <Button variant="ghost">View All Plans</Button>
        </div>

        {/* Subsection 1: Your Insurances */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-brand-600" size={24} />
            <h3 className="text-xl font-display font-bold text-slate-900">Your Insurances</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              {yourInsurances.map((item, i) => (
                <InsuranceCard key={i} item={item} buttonText="More Info" />
              ))}
            </div>
            
            {/* Usage History Card */}
            <Card className="lg:col-span-2 p-8 bg-slate-50/50 border-slate-200/60">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-100">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-bold text-slate-900">Usage History</h4>
                    <p className="text-xs text-slate-500 font-medium">Recent claims and transactions for LIC Health Plus</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Claims</p>
                  <p className="text-xl font-display font-bold text-slate-900">₹2,45,000</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { hospital: 'Apollo Hospital', date: '12 Mar 2026', amount: '₹1,20,000', status: 'Settled', type: 'Surgery' },
                  { hospital: 'Max Healthcare', date: '05 Feb 2026', amount: '₹45,000', status: 'Settled', type: 'Consultation' },
                  { hospital: 'Fortis Hospital', date: '20 Jan 2026', amount: '₹80,000', status: 'Settled', type: 'Diagnostics' },
                ].map((claim, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-brand-200 transition-all group">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-brand-600 group-hover:bg-brand-50 transition-all">
                      <Hospital size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-900">{claim.hospital}</p>
                        <p className="text-sm font-bold text-slate-900">{claim.amount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 font-medium">{claim.type} • {claim.date}</p>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase">
                          {claim.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="ghost" className="w-full mt-6 text-brand-600 font-bold">
                Download Detailed Statement
              </Button>
            </Card>
          </div>
        </div>

        {/* Subsection: Our Financial Advisor */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={24} />
            <h3 className="text-xl font-display font-bold text-slate-900">Our Financial Advisor</h3>
          </div>
          <Card className="p-8 bg-indigo-50 border-indigo-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} className="text-indigo-600" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-2xl font-display font-bold text-slate-900">Expert Financial Guidance</h4>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Connect with our certified financial advisors to optimize your medical expenses, 
                    understand insurance policies, and plan your healthcare budget effectively.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-indigo-200 shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">Certified Experts</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-indigo-200 shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-indigo-200 shadow-sm">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700">Personalized Plans</span>
                  </div>
                </div>
                <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 py-6 px-8">
                  <MessageSquare size={20} className="mr-2" />
                  <span>Chat with Advisor Now</span>
                </Button>
              </div>

              <div className="space-y-4">
                <Card className="p-6 bg-white border-none shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <img 
                        src={activeAdvisor?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Advisor"} 
                        alt="Advisor" 
                        className="w-12 h-12 rounded-full bg-indigo-100 border-2 border-indigo-50"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{activeAdvisor?.name || 'Sarah Jenkins'}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeAdvisor?.specialty || 'Senior Financial Advisor'}</p>
                    </div>
                  </div>
                  <div ref={advisorChatContainerRef} className="space-y-3 max-h-48 overflow-y-auto no-scrollbar">
                    {chatHistory.length === 0 ? (
                      <>
                        <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-none text-xs text-slate-600 font-medium">
                          Hello! I can help you analyze your current insurance coverage and suggest ways to reduce your out-of-pocket expenses.
                        </div>
                      </>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={cn(
                          "p-3 rounded-2xl text-xs font-medium max-w-[80%]",
                          msg.senderUid === user?.uid 
                            ? "bg-indigo-600 text-white rounded-tr-none ml-auto" 
                            : "bg-slate-50 text-slate-600 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendToAdvisor} className="mt-6 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                      value={advisorMessage}
                      onChange={(e) => setAdvisorMessage(e.target.value)}
                    />
                    <Button type="submit" disabled={isSending} variant="primary" className="bg-indigo-600 p-2 h-auto">
                      <Send size={16} />
                    </Button>
                  </form>
                </Card>
              </div>
            </div>
          </Card>
        </div>

        {/* Subsection 2: Gov. Insurance */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Hospital className="text-emerald-600" size={24} />
            <h3 className="text-xl font-display font-bold text-slate-900">You can also apply: Gov. Insurance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {govInsurances.map((item, i) => (
              <InsuranceCard key={i} item={item} />
            ))}
          </div>
        </div>

        {/* Subsection 3: Private Insurance */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={24} />
            <h3 className="text-xl font-display font-bold text-slate-900">Private Insurance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {privateInsurances.map((item, i) => (
              <InsuranceCard key={i} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Financial News */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-lg">
            <Newspaper size={20} />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Financial News for You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((news, i) => (
            <Card key={i} className="p-6 hover:border-brand-200 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400">{news.source}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  news.relevance === 'High' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                )}>
                  {news.relevance} Relevance
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-4 line-clamp-2">{news.title}</h3>
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>{news.time}</span>
                <button className="text-brand-600 hover:underline">Read Article</button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
