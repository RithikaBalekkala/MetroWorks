'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ALL_STATIONS } from '@/lib/metro-network';
import { notifyLostReportSubmitted } from '@/lib/notification-service';
import {
  CATEGORY_CONFIG,
  COLOR_OPTIONS,
  MOCK_FOUND_ITEMS,
  findMatches,
  generateReferenceNumber,
  generateReportId,
  getCategoryEmoji,
  getCategoryLabel,
  getLostReports,
  getLostReportsByUser,
  saveLostReport,
  searchFoundItems,
} from '@/data/lost-found-data';
import type {
  CoachPosition,
  FormStep,
  FoundItemReport,
  ItemCategory,
  ItemColor,
  LostFoundMatch,
  LostItemReport,
  LostLocation,
  TrainDirection,
} from '@/lib/lost-found-types';

interface StationSearchDropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  excludeStation?: string;
}

function StationSearchDropdown({
  label,
  value,
  onChange,
  placeholder,
  error,
  excludeStation,
}: StationSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const groupedStations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const filtered = ALL_STATIONS.filter(station => {
      if (excludeStation && station.name === excludeStation) return false;
      if (!normalized) return true;
      return station.name.toLowerCase().includes(normalized);
    });

    const purple = filtered.filter(station => station.line === 'purple').map(station => station.name);
    const green = filtered.filter(station => station.line === 'green').map(station => station.name);

    return { purple, green };
  }, [excludeStation, query]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={query}
        onChange={event => {
          const next = event.target.value;
          setQuery(next);
          setIsOpen(true);
          if (next === '') onChange('');
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onChange('');
            setIsOpen(false);
          }}
          className="absolute right-2 top-8 text-xs text-gray-500"
        >
          ✕
        </button>
      ) : null}

      {isOpen ? (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg max-h-56 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-semibold text-purple-700 bg-purple-50">Purple Line stations</div>
          {groupedStations.purple.map(name => (
            <button
              key={`purple-${name}`}
              type="button"
              onClick={() => {
                onChange(name);
                setQuery(name);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-600" />
                {name}
              </span>
            </button>
          ))}
          {groupedStations.purple.length === 0 ? <p className="px-3 py-2 text-xs text-gray-500">No purple stations found</p> : null}

          <div className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-50">Green Line stations</div>
          {groupedStations.green.map(name => (
            <button
              key={`green-${name}`}
              type="button"
              onClick={() => {
                onChange(name);
                setQuery(name);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                {name}
              </span>
            </button>
          ))}
          {groupedStations.green.length === 0 ? <p className="px-3 py-2 text-xs text-gray-500">No green stations found</p> : null}
        </div>
      ) : null}

      {isOpen ? (
        <button type="button" onClick={() => setIsOpen(false)} className="fixed inset-0 z-20" aria-label="Close station dropdown" />
      ) : null}

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

const LOST_LOCATION_LABELS: Record<LostLocation, string> = {
  INSIDE_TRAIN: 'Inside the Train',
  ON_PLATFORM: 'On the Platform',
  AT_STATION_ENTRANCE: 'At Station Entrance/Exit',
  AT_TICKET_COUNTER: 'At Ticket Counter',
  IN_LIFT_ESCALATOR: 'In Lift / Escalator',
  AT_PARKING_AREA: 'At Parking Area',
  DONT_KNOW: 'Not Sure',
};

const COACH_OPTIONS: Array<{ value: CoachPosition; label: string }> = [
  { value: 'COACH_1', label: '1' },
  { value: 'COACH_2', label: '2' },
  { value: 'COACH_3', label: '3' },
  { value: 'COACH_4', label: '4' },
  { value: 'COACH_5', label: '5' },
  { value: 'COACH_6', label: '6' },
  { value: 'DONT_KNOW', label: '?' },
];

const DIRECTION_OPTIONS: Array<{ value: TrainDirection; label: string }> = [
  { value: 'TOWARDS_WHITEFIELD', label: '→ Towards Whitefield' },
  { value: 'TOWARDS_CHALLAGHATTA', label: '← Towards Challaghatta' },
  { value: 'TOWARDS_NAGASANDRA', label: '→ Towards Nagasandra' },
  { value: 'TOWARDS_SILK_INSTITUTE', label: '← Towards Silk Institute' },
];

export default function LostAndFoundPage() {
  const [activeTab, setActiveTab] = useState<'REPORT' | 'SEARCH' | 'MY_REPORTS'>('REPORT');
  const [formStep, setFormStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<LostItemReport | null>(null);
  const [matches, setMatches] = useState<LostFoundMatch[]>([]);
  const [searchResults, setSearchResults] = useState<FoundItemReport[]>([]);
  const [myReports, setMyReports] = useState<LostItemReport[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedFoundItem, setExpandedFoundItem] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    itemCategory: '' as ItemCategory | '',
    itemDescription: '',
    itemBrand: '',
    itemModel: '',
    primaryColor: '' as ItemColor | '',
    secondaryColor: '' as ItemColor | '',
    estimatedValue: '',
    hasDistinguishingFeatures: false,
    distinguishingFeatures: '',

    dateOfLoss: '',
    approximateTimeOfLoss: '',
    boardingStation: '',
    destinationStation: '',
    lostLocation: '' as LostLocation | '',
    coachPosition: '' as CoachPosition | '',
    trainDirection: '' as TrainDirection | '',

    reporterName: '',
    reporterPhone: '',
    reporterEmail: '',
  });

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [searchFilters, setSearchFilters] = useState({
    category: '' as ItemCategory | '',
    color: '' as ItemColor | '',
    station: '',
    dateFrom: '',
    keyword: '',
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const STEPS: FormStep[] = [
    { stepNumber: 1, stepTitle: 'Item Details', stepDescription: 'Describe what you lost', isCompleted: formStep > 1 },
    { stepNumber: 2, stepTitle: 'Journey Information', stepDescription: 'Where and when you lost it', isCompleted: formStep > 2 },
    { stepNumber: 3, stepTitle: 'Contact Details', stepDescription: 'How we can reach you', isCompleted: formStep > 3 },
    { stepNumber: 4, stepTitle: 'Review & Submit', stepDescription: 'Confirm your report', isCompleted: formStep > 4 },
  ];

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredResults = useMemo(() => {
    return searchFoundItems({
      category: searchFilters.category || undefined,
      color: searchFilters.color || undefined,
      station: searchFilters.station || undefined,
      dateFrom: searchFilters.dateFrom || undefined,
      keyword: searchFilters.keyword || undefined,
    });
  }, [searchFilters]);

  useEffect(() => {
    setSearchResults(filteredResults);
  }, [filteredResults]);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 180);
    return () => clearTimeout(timer);
  }, [searchFilters]);

  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem('bmrcl_user');
      if (!raw) {
        setMyReports(getLostReports());
        return;
      }
      const parsed = JSON.parse(raw) as { id?: string; email?: string };
      const userId = parsed.id ?? parsed.email;
      if (userId) {
        setMyReports(getLostReportsByUser(userId));
      } else {
        setMyReports(getLostReports());
      }
    } catch {
      setMyReports(getLostReports());
    }
  }, [isSubmitted, activeTab]);

  const clearError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(String(field));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    if (step >= 1) {
      if (!formData.itemCategory) newErrors.itemCategory = 'Please select a category.';
      if (!formData.itemDescription.trim()) {
        newErrors.itemDescription = 'Description is required.';
      } else if (formData.itemDescription.trim().length < 20) {
        newErrors.itemDescription = 'Description must be at least 20 characters.';
      }
      if (!formData.primaryColor) newErrors.primaryColor = 'Please select primary color.';
      if (formData.hasDistinguishingFeatures && !formData.distinguishingFeatures.trim()) {
        newErrors.distinguishingFeatures = 'Please describe distinguishing features.';
      }
    }

    if (step >= 2) {
      if (!formData.dateOfLoss) {
        newErrors.dateOfLoss = 'Date of loss is required.';
      } else if (formData.dateOfLoss > today) {
        newErrors.dateOfLoss = 'Date of loss cannot be in the future.';
      }
      if (!formData.approximateTimeOfLoss) newErrors.approximateTimeOfLoss = 'Approximate time is required.';
      if (!formData.boardingStation) newErrors.boardingStation = 'Boarding station is required.';
      if (!formData.destinationStation) {
        newErrors.destinationStation = 'Destination station is required.';
      } else if (formData.destinationStation === formData.boardingStation) {
        newErrors.destinationStation = 'Boarding and destination stations must be different.';
      }
      if (!formData.lostLocation) newErrors.lostLocation = 'Please select where item was lost.';
    }

    if (step >= 3) {
      if (!formData.reporterName.trim()) {
        newErrors.reporterName = 'Name is required.';
      } else if (formData.reporterName.trim().length < 2) {
        newErrors.reporterName = 'Name should be at least 2 characters.';
      }

      const phonePattern = /^[6-9]\d{9}$/;
      if (!formData.reporterPhone.trim()) {
        newErrors.reporterPhone = 'Phone number is required.';
      } else if (!phonePattern.test(formData.reporterPhone.trim())) {
        newErrors.reporterPhone = 'Enter valid Indian mobile number.';
      }

      if (formData.reporterEmail.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.reporterEmail.trim())) {
          newErrors.reporterEmail = 'Enter a valid email address.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep(3)) {
      setFormStep(3);
      return;
    }

    if (!acceptTerms) {
      setTermsError('Please accept declaration before submitting.');
      return;
    }

    setTermsError('');
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    let userId: string | undefined;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('bmrcl_user');
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string; email?: string };
          userId = parsed.id ?? parsed.email;
        }
      }
    } catch {
      userId = undefined;
    }

    const report: LostItemReport = {
      id: generateReportId(),
      itemCategory: formData.itemCategory as ItemCategory,
      itemCategoryLabel: getCategoryLabel(formData.itemCategory as ItemCategory),
      itemDescription: formData.itemDescription.trim(),
      itemBrand: formData.itemBrand.trim() || undefined,
      itemModel: formData.itemModel.trim() || undefined,
      primaryColor: formData.primaryColor as ItemColor,
      secondaryColor: (formData.secondaryColor as ItemColor) || undefined,
      estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
      hasDistinguishingFeatures: formData.hasDistinguishingFeatures,
      distinguishingFeatures: formData.distinguishingFeatures.trim() || undefined,
      dateOfLoss: formData.dateOfLoss,
      approximateTimeOfLoss: formData.approximateTimeOfLoss,
      boardingStation: formData.boardingStation,
      destinationStation: formData.destinationStation,
      lostAtStation: formData.lostLocation !== 'INSIDE_TRAIN' ? formData.boardingStation : undefined,
      lostLocation: formData.lostLocation as LostLocation,
      trainDirection: (formData.trainDirection as TrainDirection) || undefined,
      coachPosition: (formData.coachPosition as CoachPosition) || undefined,
      reporterName: formData.reporterName.trim(),
      reporterPhone: formData.reporterPhone.trim(),
      reporterEmail: formData.reporterEmail.trim() || undefined,
      userId,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      referenceNumber: generateReferenceNumber(),
      lastUpdatedAt: new Date().toISOString(),
    };

    saveLostReport(report);
    const foundMatches = findMatches(report);

    setMatches(foundMatches);
    setSubmittedReport(report);
    setIsSubmitted(true);
    setIsSubmitting(false);

    notifyLostReportSubmitted(report.referenceNumber, report.itemCategoryLabel);
  };

  const resetForm = () => {
    setFormStep(1);
    setIsSubmitted(false);
    setSubmittedReport(null);
    setMatches([]);
    setAcceptTerms(false);
    setTermsError('');
    setErrors({});
    setFormData({
      itemCategory: '',
      itemDescription: '',
      itemBrand: '',
      itemModel: '',
      primaryColor: '',
      secondaryColor: '',
      estimatedValue: '',
      hasDistinguishingFeatures: false,
      distinguishingFeatures: '',
      dateOfLoss: '',
      approximateTimeOfLoss: '',
      boardingStation: '',
      destinationStation: '',
      lostLocation: '',
      coachPosition: '',
      trainDirection: '',
      reporterName: '',
      reporterPhone: '',
      reporterEmail: '',
    });
  };

  const copyReference = async () => {
    if (!submittedReport) return;
    await navigator.clipboard.writeText(submittedReport.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-5 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back</Link>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">BMRCL Lost & Found</span>
          </div>
          <div className="mt-4">
            <div className="text-4xl">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Lost & Found</h1>
            <p className="text-sm text-gray-600">Report lost items or search for found items at Namma Metro stations</p>
            <p className="text-sm text-gray-500 mt-1">📞 Helpline: 1800-425-1663 · Any BMRCL station Lost & Found Office</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 border-b border-gray-200 overflow-x-auto">
          {([
            { key: 'REPORT', label: '📝 Report Lost Item' },
            { key: 'SEARCH', label: '🔍 Search Found Items' },
            { key: 'MY_REPORTS', label: '📋 My Reports' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm whitespace-nowrap ${activeTab === tab.key ? 'border-b-2 border-purple-600 text-purple-700 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'REPORT' ? (
          !isSubmitted ? (
            <div className="mt-6">
              <div className="mb-6">
                <div className="flex items-start justify-between gap-2">
                  {STEPS.map((step, index) => (
                    <div key={step.stepNumber} className="flex-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (step.stepNumber < formStep) setFormStep(step.stepNumber);
                        }}
                        disabled={step.stepNumber >= formStep}
                        className={`mx-auto h-8 w-8 rounded-full text-xs font-semibold ${step.stepNumber < formStep || step.stepNumber === formStep ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'} ${step.stepNumber < formStep ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {step.stepNumber}
                      </button>
                      <p className="mt-2 text-xs font-medium text-gray-700">{step.stepTitle}</p>
                      <p className="text-[10px] text-gray-500">{step.stepDescription}</p>
                      {index < STEPS.length - 1 ? (
                        <div className={`h-0.5 mt-2 ${formStep > step.stepNumber ? 'bg-purple-600' : 'bg-gray-200'}`} />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-opacity duration-200 opacity-100">
                {formStep === 1 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Tell us about your lost item</h2>
                    <label className="block mt-4 text-sm font-medium text-gray-700">What did you lose? *</label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map(category => (
                        <button
                          type="button"
                          key={category}
                          onClick={() => setField('itemCategory', category)}
                          className={`rounded-xl p-3 text-center border-2 ${formData.itemCategory === category ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-gray-50 hover:border-purple-400 hover:bg-purple-50'}`}
                        >
                          <div className="text-2xl">{CATEGORY_CONFIG[category].emoji}</div>
                          <p className="text-xs font-medium mt-1 text-gray-700">{CATEGORY_CONFIG[category].label}</p>
                        </button>
                      ))}
                    </div>
                    {errors.itemCategory ? <p className="text-sm text-red-600 mt-1">{errors.itemCategory}</p> : null}

                    <label className="block mt-4 text-sm font-medium text-gray-700">Describe your item in detail *</label>
                    <p className="text-sm text-gray-500">Include brand, model, color, any unique features (min. 20 characters)</p>
                    <textarea
                      value={formData.itemDescription}
                      onChange={event => setField('itemDescription', event.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="e.g. Black iPhone 14 Pro with purple case cover, has a small crack on top-right corner of the screen. Wallpaper shows a red sunset."
                      className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <p className="text-xs text-right text-gray-500">{formData.itemDescription.length}/500</p>
                    {errors.itemDescription ? <p className="text-sm text-red-600 mt-1">{errors.itemDescription}</p> : null}

                    <label className="block mt-3 text-sm font-medium text-gray-700">Brand (optional)</label>
                    <input
                      value={formData.itemBrand}
                      onChange={event => setField('itemBrand', event.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                    />
                    {formData.itemCategory && CATEGORY_CONFIG[formData.itemCategory]?.commonBrands?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {CATEGORY_CONFIG[formData.itemCategory].commonBrands?.map(brand => (
                          <button
                            key={brand}
                            type="button"
                            onClick={() => setField('itemBrand', brand)}
                            className="text-xs px-2 py-1 rounded-full border border-gray-300"
                          >
                            {brand}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <label className="text-sm font-medium text-gray-700">Primary Color *</label>
                      <div className="mt-2 grid grid-cols-8 gap-2">
                        {COLOR_OPTIONS.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setField('primaryColor', color.value)}
                            title={color.label}
                            className={`h-8 w-8 rounded-full ${color.value === 'WHITE' ? 'border border-gray-300' : ''} ${formData.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-purple-600' : ''}`}
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                      {errors.primaryColor ? <p className="text-sm text-red-600 mt-1">{errors.primaryColor}</p> : null}
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-700">Secondary Color (optional)</label>
                      <div className="mt-2 flex items-center flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setField('secondaryColor', '')}
                          className={`text-xs px-2 py-1 rounded-full border ${formData.secondaryColor === '' ? 'border-purple-600 text-purple-700' : 'border-gray-300'}`}
                        >
                          None
                        </button>
                        {COLOR_OPTIONS.map(color => (
                          <button
                            key={`secondary-${color.value}`}
                            type="button"
                            onClick={() => setField('secondaryColor', color.value)}
                            className={`h-6 w-6 rounded-full ${color.value === 'WHITE' ? 'border border-gray-300' : ''} ${formData.secondaryColor === color.value ? 'ring-2 ring-offset-2 ring-purple-600' : ''}`}
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-sm font-medium text-gray-700">Approximate value (optional)</label>
                      <div className="mt-1 flex items-center rounded-xl border border-gray-300 px-3 bg-white">
                        <span className="text-sm text-gray-500">₹</span>
                        <input
                          value={formData.estimatedValue}
                          onChange={event => setField('estimatedValue', event.target.value)}
                          placeholder="e.g. 15000"
                          inputMode="numeric"
                          className="w-full px-2 py-2 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={formData.hasDistinguishingFeatures}
                          onChange={event => {
                            setField('hasDistinguishingFeatures', event.target.checked);
                            if (!event.target.checked) setField('distinguishingFeatures', '');
                          }}
                        />
                        This item has distinguishing features (scratches, stickers, engravings, etc.)
                      </label>
                      {formData.hasDistinguishingFeatures ? (
                        <div className="mt-2">
                          <textarea
                            value={formData.distinguishingFeatures}
                            onChange={event => setField('distinguishingFeatures', event.target.value)}
                            rows={3}
                            placeholder="e.g. Has my name engraved on back, scratch near corner, logo sticker"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                          />
                          {errors.distinguishingFeatures ? <p className="text-sm text-red-600 mt-1">{errors.distinguishingFeatures}</p> : null}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep(1)) setFormStep(2);
                      }}
                      className="mt-5 w-full rounded-xl bg-purple-600 text-white py-2.5 font-semibold hover:bg-purple-700"
                    >
                      Next: Journey Details →
                    </button>
                  </div>
                ) : null}

                {formStep === 2 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">When and where did you lose it?</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Loss *</label>
                        <input
                          type="date"
                          max={today}
                          value={formData.dateOfLoss}
                          onChange={event => setField('dateOfLoss', event.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                        />
                        {errors.dateOfLoss ? <p className="text-xs text-red-600 mt-1">{errors.dateOfLoss}</p> : null}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Approximate Time of Loss *</label>
                        <input
                          type="time"
                          value={formData.approximateTimeOfLoss}
                          onChange={event => setField('approximateTimeOfLoss', event.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                        />
                        {errors.approximateTimeOfLoss ? <p className="text-xs text-red-600 mt-1">{errors.approximateTimeOfLoss}</p> : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <StationSearchDropdown
                        label="Station where you boarded *"
                        value={formData.boardingStation}
                        onChange={value => setField('boardingStation', value)}
                        placeholder="Search station"
                        error={errors.boardingStation}
                        excludeStation={formData.destinationStation || undefined}
                      />
                      <StationSearchDropdown
                        label="Your destination station *"
                        value={formData.destinationStation}
                        onChange={value => setField('destinationStation', value)}
                        placeholder="Search station"
                        error={errors.destinationStation}
                        excludeStation={formData.boardingStation || undefined}
                      />
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Where exactly did you lose it? *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(Object.entries(LOST_LOCATION_LABELS) as Array<[LostLocation, string]>).map(([value, label]) => (
                          <button
                            type="button"
                            key={value}
                            onClick={() => setField('lostLocation', value)}
                            className={`rounded-xl border px-3 py-2 text-left text-sm ${formData.lostLocation === value ? 'border-purple-600 bg-purple-50 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {errors.lostLocation ? <p className="text-xs text-red-600 mt-1">{errors.lostLocation}</p> : null}
                    </div>

                    {formData.lostLocation === 'INSIDE_TRAIN' ? (
                      <>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700">Which coach were you in? (optional)</label>
                          <p className="text-sm text-gray-500">Coaches are numbered 1-6 from the front</p>
                          <div className="mt-2 grid grid-cols-7 gap-2 max-w-xs sm:max-w-sm">
                            {COACH_OPTIONS.map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setField('coachPosition', option.value)}
                                className={`h-10 rounded-lg border text-sm font-semibold ${formData.coachPosition === option.value ? 'border-purple-600 bg-purple-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Coach 1 is at the front (towards the engine)</p>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Direction of travel (optional)</label>
                          <div className="flex flex-wrap gap-2">
                            {DIRECTION_OPTIONS.map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setField('trainDirection', option.value)}
                                className={`rounded-full px-3 py-1.5 text-xs border ${formData.trainDirection === option.value ? 'bg-purple-600 border-purple-600 text-white' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null}

                    <div className="mt-6 flex gap-3">
                      <button type="button" onClick={() => setFormStep(1)} className="flex-1 rounded-xl border border-gray-300 py-2.5">← Back</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(2)) setFormStep(3);
                        }}
                        className="flex-1 rounded-xl bg-purple-600 text-white py-2.5 font-semibold"
                      >
                        Next: Contact Details →
                      </button>
                    </div>
                  </div>
                ) : null}

                {formStep === 3 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">How can we contact you?</h2>
                    <p className="text-sm text-gray-500">Your details are kept confidential and used only for Lost & Found notifications.</p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                        <input
                          value={formData.reporterName}
                          onChange={event => setField('reporterName', event.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                        />
                        {errors.reporterName ? <p className="text-xs text-red-600 mt-1">{errors.reporterName}</p> : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                        <div className="mt-1 flex items-center rounded-xl border border-gray-300 px-3 bg-white">
                          <span className="text-sm text-gray-500">+91</span>
                          <input
                            value={formData.reporterPhone}
                            onChange={event => setField('reporterPhone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                            maxLength={10}
                            inputMode="numeric"
                            placeholder="10-digit mobile number"
                            className="w-full px-2 py-2 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        {errors.reporterPhone ? <p className="text-xs text-red-600 mt-1">{errors.reporterPhone}</p> : null}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address (optional)</label>
                        <input
                          value={formData.reporterEmail}
                          onChange={event => setField('reporterEmail', event.target.value)}
                          placeholder="yourname@email.com"
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">We'll send report updates to this email</p>
                        {errors.reporterEmail ? <p className="text-xs text-red-600 mt-1">{errors.reporterEmail}</p> : null}
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                        🔒 Your contact details are stored securely and only used to notify you when a matching item is found. BMRCL does not share your information with third parties.
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button type="button" onClick={() => setFormStep(2)} className="flex-1 rounded-xl border border-gray-300 py-2.5">← Back</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateStep(3)) setFormStep(4);
                        }}
                        className="flex-1 rounded-xl bg-purple-600 text-white py-2.5 font-semibold"
                      >
                        Review My Report →
                      </button>
                    </div>
                  </div>
                ) : null}

                {formStep === 4 ? (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Review your report</h2>
                    <p className="text-sm text-gray-500">Please verify all details before submitting</p>

                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-700">Item Details</h3>
                          <button type="button" onClick={() => setFormStep(1)} className="text-xs text-purple-600">Edit ✎</button>
                        </div>
                        <p className="text-sm mt-1">{formData.itemCategory ? getCategoryEmoji(formData.itemCategory as ItemCategory) : '📦'} {formData.itemCategory ? getCategoryLabel(formData.itemCategory as ItemCategory) : ''}</p>
                        <p className="text-sm italic text-gray-900">{formData.itemDescription}</p>
                        <p className="text-xs text-gray-500 mt-1">Color: {formData.primaryColor}{formData.secondaryColor ? ` + ${formData.secondaryColor}` : ''}</p>
                        {formData.estimatedValue ? <p className="text-xs text-gray-500">Value: ₹{formData.estimatedValue}</p> : null}
                        {formData.itemBrand ? <p className="text-xs text-gray-500">Brand: {formData.itemBrand}</p> : null}
                        {formData.distinguishingFeatures ? <p className="text-xs text-gray-500">Features: {formData.distinguishingFeatures}</p> : null}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-700">Journey Details</h3>
                          <button type="button" onClick={() => setFormStep(2)} className="text-xs text-purple-600">Edit ✎</button>
                        </div>
                        <p className="text-xs text-gray-500">📅 Date: {formData.dateOfLoss}</p>
                        <p className="text-xs text-gray-500">⏰ Time: approximately {formData.approximateTimeOfLoss}</p>
                        <p className="text-xs text-gray-500">🚉 From: {formData.boardingStation}</p>
                        <p className="text-xs text-gray-500">🏁 To: {formData.destinationStation}</p>
                        <p className="text-xs text-gray-500">📍 Where: {formData.lostLocation ? LOST_LOCATION_LABELS[formData.lostLocation as LostLocation] : ''}</p>
                        {formData.coachPosition ? <p className="text-xs text-gray-500">Coach: {formData.coachPosition}</p> : null}
                        {formData.trainDirection ? <p className="text-xs text-gray-500">Direction: {formData.trainDirection}</p> : null}
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-700">Contact</h3>
                          <button type="button" onClick={() => setFormStep(3)} className="text-xs text-purple-600">Edit ✎</button>
                        </div>
                        <p className="text-xs text-gray-500">👤 {formData.reporterName}</p>
                        <p className="text-xs text-gray-500">📞 {formData.reporterPhone}</p>
                        {formData.reporterEmail ? <p className="text-xs text-gray-500">📧 {formData.reporterEmail}</p> : null}
                      </div>
                    </div>

                    <label className="mt-4 inline-flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={event => {
                          setAcceptTerms(event.target.checked);
                          if (event.target.checked) setTermsError('');
                        }}
                      />
                      I confirm that the information provided is accurate to the best of my knowledge. I understand that BMRCL is not responsible for lost items and will make best efforts to assist in recovery.
                    </label>
                    {termsError ? <p className="text-sm text-red-600 mt-1">{termsError}</p> : null}

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="mt-4 w-full rounded-xl bg-purple-600 text-white py-3 font-semibold disabled:opacity-60"
                    >
                      {isSubmitting ? 'Submitting...' : '🔍 Submit Lost Item Report'}
                    </button>

                    <button type="button" onClick={() => setFormStep(3)} className="mt-2 w-full rounded-xl border border-gray-300 py-2.5">← Edit Report</button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
              <div className="text-5xl">✅</div>
              <h2 className="text-2xl font-bold text-green-700 mt-2">Report Submitted Successfully!</h2>

              <div className="mt-5">
                <p className="text-sm text-gray-600">Your Reference Number</p>
                <div className="mt-2 mx-auto max-w-md bg-white rounded-xl border-2 border-green-400 p-4 text-center text-2xl text-gray-900 font-bold tracking-widest font-mono">
                  {submittedReport?.referenceNumber}
                </div>
                <button
                  type="button"
                  onClick={copyReference}
                  className="mt-2 text-sm text-purple-600 underline"
                >
                  {copied ? 'Copied!' : 'Copy reference number'}
                </button>
                <p className="text-xs text-gray-500 mt-2">Save this number to track your report and collect your item if found.</p>
              </div>

              <div className="mt-6 text-left max-w-xl mx-auto">
                <h3 className="font-semibold text-gray-700">What happens next</h3>
                <ol className="list-decimal pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Our team reviews your report within 2 hours</li>
                  <li>We check our found items database for matches</li>
                  <li>You'll be notified via SMS/call if a match is found</li>
                  <li>Visit the station office with photo ID to collect</li>
                </ol>
              </div>

              {matches.length > 0 ? (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
                  <h3 className="font-semibold text-amber-800">🎯 {matches.length} Potential Match(es) Found!</h3>
                  <p className="text-xs text-gray-700 mt-1">These items in our database may be yours</p>
                  <div className="mt-3 space-y-3">
                    {matches.slice(0, 3).map(match => {
                      const item = MOCK_FOUND_ITEMS.find(found => found.id === match.foundReportId);
                      if (!item) return null;

                      return (
                        <div key={match.foundReportId} className={`bg-white rounded-xl p-3 border border-gray-200 border-l-4 ${match.matchConfidence === 'HIGH' ? 'border-green-500' : match.matchConfidence === 'MEDIUM' ? 'border-amber-500' : 'border-gray-400'}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{match.matchScore}% match</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{match.matchConfidence}</span>
                          </div>
                          <p className="text-sm mt-2 text-gray-800">{item.itemDescription.slice(0, 100)}</p>
                          <p className="text-xs text-gray-500 mt-1">📍 {item.foundAtStation} · 📅 {item.foundDate}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {match.matchReasons.map(reason => (
                              <span key={reason} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100">{reason}</span>
                            ))}
                          </div>
                          <div className="mt-2 p-2 rounded-lg bg-gray-50 border-t border-gray-100 text-xs text-gray-700">
                            📞 {match.contactInfo}
                            <br />
                            📍 {item.currentStorageLocation}
                            <br />
                            Bring your reference number + photo ID
                          </div>
                          {match.matchConfidence === 'HIGH' ? (
                            <p className="mt-2 text-xs bg-green-50 border border-green-200 text-green-700 rounded-md px-2 py-1">🎉 This looks like a very strong match!</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => setActiveTab('SEARCH')} className="mt-3 text-sm text-purple-600 underline">View all found items →</button>
                </div>
              ) : (
                <div className="mt-6 text-sm text-gray-600">
                  No exact matches in our current database.
                  <br />
                  We'll continue checking as new items are turned in. You'll be notified if a match appears.
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setActiveTab('MY_REPORTS')} className="px-4 py-2 rounded-xl bg-gray-100">📋 View My Reports</button>
                <button type="button" onClick={() => setActiveTab('SEARCH')} className="px-4 py-2 rounded-xl bg-gray-100">🔍 Search Found Items</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl bg-purple-600 text-white">Report Another Lost Item</button>
              </div>
            </div>
          )
        ) : null}

        {activeTab === 'SEARCH' ? (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-900">Search Our Found Items Database</h2>
            <p className="text-sm text-gray-500">{MOCK_FOUND_ITEMS.length} items currently in custody across Namma Metro stations</p>

            <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <input
                value={searchFilters.keyword}
                onChange={event => setSearchFilters(prev => ({ ...prev, keyword: event.target.value }))}
                placeholder="Describe the item — e.g. black phone, blue bag, Honda keys"
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />

              <div className="mt-3 flex gap-2 overflow-x-auto bg-gray-50 rounded-xl p-2">
                <select
                  value={searchFilters.category}
                  onChange={event => setSearchFilters(prev => ({ ...prev, category: event.target.value as ItemCategory | '' }))}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">All Categories</option>
                  {(Object.keys(CATEGORY_CONFIG) as ItemCategory[]).map(category => (
                    <option key={category} value={category}>{CATEGORY_CONFIG[category].label}</option>
                  ))}
                </select>

                <input
                  value={searchFilters.station}
                  onChange={event => setSearchFilters(prev => ({ ...prev, station: event.target.value }))}
                  placeholder="Station"
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />

                <input
                  type="date"
                  value={searchFilters.dateFrom}
                  onChange={event => setSearchFilters(prev => ({ ...prev, dateFrom: event.target.value }))}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSearchFilters(prev => ({ ...prev, color: '' }))}
                  className={`text-xs px-2 py-1 rounded-full border ${searchFilters.color === '' ? 'border-purple-600 text-purple-700' : 'border-gray-300'}`}
                >
                  All Colors
                </button>
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={`search-color-${color.value}`}
                    type="button"
                    onClick={() => setSearchFilters(prev => ({ ...prev, color: color.value }))}
                    title={color.label}
                    className={`h-6 w-6 rounded-full ${color.value === 'WHITE' ? 'border border-gray-300' : ''} ${searchFilters.color === color.value ? 'ring-2 ring-offset-2 ring-purple-600' : ''}`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>

              {(searchFilters.category || searchFilters.color || searchFilters.station || searchFilters.dateFrom || searchFilters.keyword) ? (
                <button
                  type="button"
                  onClick={() => setSearchFilters({ category: '', color: '', station: '', dateFrom: '', keyword: '' })}
                  className="mt-2 text-xs text-purple-600 underline"
                >
                  Clear All Filters
                </button>
              ) : null}

              <p className="mt-2 text-sm text-gray-600">{isSearching ? 'Searching...' : `${searchResults.length} items found`}</p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(item => {
                const isExpanded = expandedFoundItem === item.id;
                const daysRemaining = Math.ceil((new Date(item.claimDeadline).getTime() - Date.now()) / 86400000);

                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{getCategoryEmoji(item.itemCategory)} {getCategoryLabel(item.itemCategory)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'UNCLAIMED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status === 'UNCLAIMED' ? '🟢 Available' : '🟡 Possibly Claimed'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 mt-2">{item.itemDescription.slice(0, 120)}{item.itemDescription.length > 120 ? '...' : ''}</p>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <p>📍 Found at: {item.foundAtStation}</p>
                      <p>📅 Found on: {item.foundDate}</p>
                      <p>🔍 Location: {LOST_LOCATION_LABELS[item.foundLocation]}</p>
                      {item.coachNumber ? <p>🚃 Coach: {item.coachNumber}</p> : <p />}
                    </div>

                    <p className={`mt-2 text-xs ${daysRemaining <= 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {daysRemaining <= 7 ? `⚠️ Claim by ${item.claimDeadline}` : `Claim by ${item.claimDeadline}`}
                    </p>

                    {isExpanded ? (
                      <div className="mt-2 text-xs text-gray-700 rounded-lg bg-gray-50 border-t border-gray-100 p-2">
                        🏢 {item.currentStorageLocation}
                        <br />
                        📞 {item.storageContactNumber}
                        <br />
                        Bring photo ID and describe the item to station staff.
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setExpandedFoundItem(prev => (prev === item.id ? null : item.id))}
                      className="mt-2 text-xs text-purple-600 underline"
                    >
                      {isExpanded ? 'Hide ▴' : 'View collection details ▾'}
                    </button>
                  </div>
                );
              })}
            </div>

            {searchResults.length === 0 ? (
              <div className="mt-6 text-center text-sm text-gray-500">
                No items match your search.
                <br />
                Try broader keywords, remove color, or clear date filter.
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'MY_REPORTS' ? (
          <div className="mt-6">
            {myReports.length === 0 ? (
              <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <p className="text-4xl">📝</p>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">No reports yet</h2>
                <p className="text-sm text-gray-500">Report a lost item to get started</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('REPORT');
                    setIsSubmitted(false);
                    setFormStep(1);
                  }}
                  className="mt-4 rounded-xl bg-purple-600 text-white px-4 py-2"
                >
                  Report Lost Item →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map(report => {
                  const statusTone = report.status === 'SUBMITTED'
                    ? 'bg-blue-100 text-blue-700'
                    : report.status === 'UNDER_REVIEW'
                      ? 'bg-amber-100 text-amber-700'
                      : report.status === 'MATCHED'
                        ? 'bg-green-100 text-green-700'
                        : report.status === 'READY_FOR_COLLECTION'
                          ? 'bg-green-100 text-green-700 animate-pulse'
                          : report.status === 'EXPIRED'
                            ? 'bg-red-100 text-red-600'
                            : report.status === 'COLLECTED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-gray-100 text-gray-500';

                  const statusText = report.status === 'SUBMITTED'
                    ? '📤 Submitted'
                    : report.status === 'UNDER_REVIEW'
                      ? '🔍 Under Review'
                      : report.status === 'MATCHED'
                        ? '✅ Potential Match Found!'
                        : report.status === 'READY_FOR_COLLECTION'
                          ? '📦 Ready to Collect'
                          : report.status === 'COLLECTED'
                            ? '✓ Collected'
                            : report.status === 'EXPIRED'
                              ? 'Expired'
                              : 'Closed';

                  return (
                    <div key={report.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                      <p className="font-mono text-sm font-bold text-gray-900">{report.referenceNumber}</p>
                      <p className="text-sm mt-1 text-gray-700">{getCategoryEmoji(report.itemCategory)} {report.itemCategoryLabel} — {report.itemDescription.slice(0, 60)}{report.itemDescription.length > 60 ? '...' : ''}</p>
                      <p className="text-xs text-gray-500 mt-1">Journey: {report.boardingStation} → {report.destinationStation}</p>
                      <p className="text-xs text-gray-500">Date of loss: {report.dateOfLoss}</p>
                      <p className="text-xs text-gray-500">Submitted: {new Date(report.submittedAt).toLocaleString('en-IN')}</p>
                      <span className={`inline-flex mt-2 text-xs px-2 py-0.5 rounded-full ${statusTone}`}>{statusText}</span>

                      {report.status === 'MATCHED' ? (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700">
                          🎉 A match may have been found! Contact station office with your reference number.
                        </div>
                      ) : null}

                      {report.status === 'READY_FOR_COLLECTION' ? (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-xs text-blue-700">
                          📦 Ready for collection. Visit assigned station with photo ID before deadline.
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
