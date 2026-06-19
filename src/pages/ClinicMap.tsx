import { MapPin, Navigation, Search, Phone, Clock, Star, Tag, Ambulance, User as UserIcon, MessageSquare, ChevronDown } from 'lucide-react';
import { Card, Button } from '@/src/components/ui/Base';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Map, Marker, ZoomControl } from 'pigeon-maps';
import { useSearchParams } from 'react-router-dom';

const clinics = [
  {
    id: '1',
    name: 'Sharda Hospital',
    address: 'Knowledge Park III, Greater Noida',
    rating: 4.8,
    distance: '1.2 km',
    phone: '+91 120 232 9700',
    openUntil: '24 Hours',
    hours: 'Open 24/7',
    coords: [28.4744, 77.4840] as [number, number],
    tags: ['Most Used', 'Fastest'],
    color: 'bg-brand-600',
    image: 'https://www.shardahospital.org/assests/images/contact-hospital.png',
    busyHours: [20, 30, 45, 70, 85, 90, 75, 60, 40, 30, 25, 20],
    reviews: [
      { user: 'Amit K.', rating: 5, comment: 'Excellent emergency service. Very professional staff.' },
      { user: 'Sonia R.', rating: 4, comment: 'Good facilities but waiting time can be long during peak hours.' }
    ]
  },
  {
    id: '2',
    name: 'Kailash Hospital',
    address: 'Omega 1, Greater Noida',
    rating: 4.7,
    distance: '3.5 km',
    phone: '+91 120 232 7799',
    openUntil: '24 Hours',
    hours: 'Open 24/7',
    coords: [28.4644, 77.5140] as [number, number],
    tags: ['Expensive'],
    color: 'bg-amber-500',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Kailash_Hospital_Noida.jpg',
    busyHours: [10, 20, 40, 60, 80, 95, 85, 70, 50, 30, 20, 10],
    reviews: [
      { user: 'Rahul M.', rating: 4, comment: 'Top notch equipment. A bit pricey but worth it.' }
    ]
  },
  {
    id: '3',
    name: 'Yatharth Super Speciality',
    address: 'Omega 1, Greater Noida',
    rating: 4.9,
    distance: '4.2 km',
    phone: '+91 120 232 9999',
    openUntil: '24 Hours',
    hours: 'Open 24/7',
    coords: [28.4544, 77.5240] as [number, number],
    tags: ['Most Affordable', 'Most Used'],
    color: 'bg-emerald-500',
    image: 'https://rawahealth.com/wp-content/uploads/2024/04/2022-03-23-1.jpg',
    busyHours: [30, 40, 55, 75, 90, 85, 70, 60, 50, 40, 35, 30],
    reviews: [
      { user: 'Priya S.', rating: 5, comment: 'Very affordable and great care. Highly recommended.' }
    ]
  },
  {
    id: '4',
    name: 'Fortis Hospital',
    address: 'Sector 62, Noida',
    rating: 4.6,
    distance: '12.5 km',
    phone: '+91 120 436 2222',
    openUntil: '24 Hours',
    hours: 'Open 24/7',
    coords: [28.6189, 77.3725] as [number, number],
    tags: ['Premium'],
    color: 'bg-indigo-600',
    image: 'https://www.medijourney.co.in/uploads/51ba570fe68fc088e0a942bdf8700cdce7eb8b1e/1750825409Fortis-Hospital-Noida.webp',
    busyHours: [15, 25, 40, 65, 80, 85, 75, 60, 45, 30, 20, 15],
    reviews: [
      { user: 'Vikram J.', rating: 4, comment: 'Good service but very far from Greater Noida.' }
    ]
  },
  {
    id: '5',
    name: 'Max Super Speciality',
    address: 'Sector 128, Noida',
    rating: 4.8,
    distance: '15.2 km',
    phone: '+91 120 666 1234',
    openUntil: '24 Hours',
    hours: 'Open 24/7',
    coords: [28.5140, 77.3720] as [number, number],
    tags: ['Advanced Tech'],
    color: 'bg-rose-500',
    image: 'https://fitsib-strapi.s3.ap-south-1.amazonaws.com/Max_Super_Speciality_Hospital_Noida_a418f2b6e1.png',
    busyHours: [20, 35, 50, 70, 90, 95, 80, 65, 50, 40, 30, 20],
    reviews: [
      { user: 'Anjali P.', rating: 5, comment: 'The best technology available in the region.' }
    ]
  }
];

const TagBadge = ({ tag, ...props }: { tag: string; [key: string]: any }) => {
  const colors: any = {
    'Most Affordable': 'bg-emerald-100 text-emerald-700',
    'Fastest': 'bg-brand-100 text-brand-700',
    'Expensive': 'bg-rose-100 text-rose-700',
    'Most Used': 'bg-indigo-100 text-indigo-700'
  };
  return (
    <span {...props} className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider", colors[tag])}>
      {tag}
    </span>
  );
};

const findBestClinic = (facilityType: string) => {
  const normalizedFacilityType = facilityType.trim().toLowerCase();

  const facilityPriorityMap: Record<string, string[]> = {
    orthopedic: ['Yatharth Super Speciality', 'Sharda Hospital', 'Fortis Hospital'],
    orthopaedic: ['Yatharth Super Speciality', 'Sharda Hospital', 'Fortis Hospital'],
    dermatology: ['Kailash Hospital', 'Yatharth Super Speciality', 'Sharda Hospital'],
    dermatologist: ['Kailash Hospital', 'Yatharth Super Speciality', 'Sharda Hospital'],
    cardiology: ['Fortis Hospital', 'Max Super Speciality', 'Sharda Hospital'],
    cardiologist: ['Fortis Hospital', 'Max Super Speciality', 'Sharda Hospital'],
    neurology: ['Max Super Speciality', 'Fortis Hospital', 'Yatharth Super Speciality'],
    neurologist: ['Max Super Speciality', 'Fortis Hospital', 'Yatharth Super Speciality'],
    pediatrics: ['Sharda Hospital', 'Yatharth Super Speciality', 'Kailash Hospital'],
    pediatrician: ['Sharda Hospital', 'Yatharth Super Speciality', 'Kailash Hospital'],
    psychiatry: ['Sharda Hospital', 'Fortis Hospital', 'Kailash Hospital'],
    psychiatrist: ['Sharda Hospital', 'Fortis Hospital', 'Kailash Hospital'],
    multispeciality: ['Yatharth Super Speciality', 'Fortis Hospital', 'Max Super Speciality'],
    'super speciality': ['Yatharth Super Speciality', 'Fortis Hospital', 'Max Super Speciality'],
    hospital: ['Sharda Hospital', 'Yatharth Super Speciality', 'Kailash Hospital'],
    clinic: ['Sharda Hospital', 'Kailash Hospital', 'Yatharth Super Speciality'],
    emergency: ['Sharda Hospital', 'Yatharth Super Speciality', 'Fortis Hospital'],
  };

  const rankedNames =
    facilityPriorityMap[normalizedFacilityType] ||
    Object.entries(facilityPriorityMap).find(([key]) => normalizedFacilityType.includes(key))?.[1] ||
    ['Sharda Hospital', 'Yatharth Super Speciality', 'Kailash Hospital'];

  const matchedClinic = rankedNames
    .map((name) => clinics.find((clinic) => clinic.name === name))
    .find(Boolean);

  return matchedClinic || clinics[0];
};

export default function ClinicMap() {
  const [searchParams] = useSearchParams();
  const isEmergency = searchParams.get('emergency') === 'true';
  const facilityType = searchParams.get('facility') || '';
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [center, setCenter] = useState<[number, number]>([28.4744, 77.5040]);
  const [zoom, setZoom] = useState(13);
  const [userLocation, setUserLocation] = useState<[number, number]>([28.4744, 77.5040]);
  const [ambulancePos, setAmbulancePos] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState(2);
  const [showReviews, setShowReviews] = useState(false);

  useEffect(() => {
    if (isEmergency) {
      // Start ambulance simulation
      const startPos: [number, number] = [28.4944, 77.5240];
      setAmbulancePos(startPos);
      
      const interval = setInterval(() => {
        setAmbulancePos(prev => {
          if (!prev) return null;
          const latDiff = (userLocation[0] - prev[0]) * 0.1;
          const lngDiff = (userLocation[1] - prev[1]) * 0.1;
          
          if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
            clearInterval(interval);
            setEta(0);
            return userLocation;
          }
          
          return [prev[0] + latDiff, prev[1] + lngDiff];
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isEmergency, userLocation]);

  useEffect(() => {
    if (!facilityType) return;

    const bestClinic = findBestClinic(facilityType);
    setSelectedClinic(bestClinic);
    setCenter(bestClinic.coords);
  }, [facilityType]);

  const handleClinicSelect = (clinic: any) => {
    setSelectedClinic(clinic);
    setCenter(clinic.coords);
  };

  return (
    <div className="min-h-screen flex flex-col lg:h-screen lg:flex-row">
      {/* Sidebar */}
      <div className="w-full border-b border-slate-100 bg-white lg:h-full lg:w-96 lg:border-b-0 lg:border-r">
        <div className="space-y-4 border-b border-slate-100 p-4 sm:p-5 lg:p-6">
          <h1 className="text-xl font-display font-bold text-slate-900 sm:text-2xl">Find Clinics</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto p-4 space-y-4 no-scrollbar lg:max-h-none lg:h-[calc(100%-110px)]">
          {clinics.map(clinic => (
            <div 
              key={clinic.id}
              onClick={() => handleClinicSelect(clinic)}
              className={cn(
                "p-4 rounded-2xl border transition-all cursor-pointer group",
                selectedClinic?.id === clinic.id 
                  ? "bg-brand-50 border-brand-200 shadow-sm" 
                  : "bg-white border-slate-100 hover:border-slate-200"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{clinic.name}</h3>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star size={12} fill="currentColor" />
                  <span>{clinic.rating}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                <MapPin size={12} />
                {clinic.address}
              </p>
              <div className="flex flex-wrap gap-1 mb-3">
                {clinic.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-400">{clinic.distance}</span>
                <span className={cn(clinic.openUntil === '24 Hours' ? "text-emerald-600" : "text-brand-600")}>
                  Open until {clinic.openUntil}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="relative min-h-[55vh] flex-1 overflow-hidden bg-slate-100 lg:min-h-0">
        <Map 
          height={undefined} 
          center={center} 
          zoom={zoom} 
          onBoundsChanged={({ center, zoom }) => {
            setCenter(center);
            setZoom(zoom);
          }}
        >
          <ZoomControl />
          
          {/* User Marker */}
          <Marker width={40} anchor={userLocation}>
            <div className="relative">
              <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl">
                <UserIcon size={20} />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-bold text-slate-900 border border-slate-100">
                You are here
              </div>
            </div>
          </Marker>

          {/* Ambulance Marker */}
          {ambulancePos && (
            <Marker width={50} anchor={ambulancePos}>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="relative"
              >
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-2xl">
                  <Ambulance size={24} />
                </div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white px-3 py-1 rounded-full shadow-lg text-[10px] font-bold animate-bounce">
                  Ambulance: {eta} min
                </div>
              </motion.div>
            </Marker>
          )}

          {clinics.map(clinic => {
            const MarkerAny = Marker as any;
            return (
              <MarkerAny 
                key={clinic.id}
                width={50}
                anchor={clinic.coords} 
                onClick={() => handleClinicSelect(clinic)}
              >
                <div className="relative cursor-pointer group">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white transition-transform group-hover:scale-110",
                    clinic.color
                  )}>
                    <MapPin size={20} />
                  </div>
                  {selectedClinic?.id === clinic.id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 bg-brand-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </MarkerAny>
            );
          })}
        </Map>

        {/* Selected Clinic Info Card */}
        {selectedClinic && (
          <div className="absolute bottom-4 left-4 right-4 z-10 max-h-[72vh] overflow-y-auto no-scrollbar lg:bottom-8 lg:left-auto lg:right-auto lg:w-[450px] lg:max-h-[80vh]">
            <Card className="shadow-2xl border-none overflow-hidden">
              <div className="h-48 relative">
                <img src={selectedClinic.image} alt={selectedClinic.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h2 className="text-2xl font-display font-bold">{selectedClinic.name}</h2>
                  <p className="text-sm opacity-80 flex items-center gap-1">
                    <MapPin size={14} />
                    {selectedClinic.address}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <Clock size={14} />
                      <span>{selectedClinic.hours}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                      <Star size={14} fill="currentColor" />
                      <span>{selectedClinic.rating} (120+ reviews)</span>
                    </div>
                  </div>
                </div>

                {/* Busy Hours Graph */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Popular Times</h4>
                    <span className="text-[10px] font-bold text-brand-600">Usually busy at 2 PM</span>
                  </div>
                  <div className="flex items-end gap-1 h-20 px-2">
                    {selectedClinic.busyHours.map((h: number, i: number) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 rounded-t-sm transition-all duration-500",
                          i === 5 ? "bg-brand-600" : "bg-slate-200"
                        )}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 px-1">
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>12 AM</span>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowReviews(!showReviews)}
                    className="w-full flex items-center justify-between text-sm font-bold text-slate-900 group"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} className="text-brand-600" />
                      <span>User Reviews</span>
                    </div>
                    <ChevronDown size={16} className={cn("transition-transform", showReviews && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence>
                    {showReviews && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3"
                      >
                        {selectedClinic.reviews.map((rev: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{rev.user}</span>
                              <div className="flex items-center gap-0.5 text-amber-500">
                                {Array.from({ length: rev.rating }).map((_, j) => <Star key={j} size={10} fill="currentColor" />)}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">{rev.comment}</p>
                          </div>
                        ))}
                        <div className="pt-2">
                          <textarea 
                            placeholder="Write a review..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 resize-none"
                          />
                          <Button variant="primary" className="w-full mt-2 py-2 text-xs">Post Review</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 py-4 border-slate-200 text-slate-700">
                    <Phone size={18} />
                    <span>Call Clinic</span>
                  </Button>
                  <Button className="flex-[2] py-4 text-lg bg-brand-600 hover:bg-brand-700" variant="primary">
                    <Navigation size={20} />
                    <span>Get Directions</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
