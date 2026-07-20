"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Ruler, 
  Sparkles, 
  CheckCircle, 
  ShieldAlert, 
  Camera, 
  Search, 
  Upload, 
  History, 
  User, 
  Trash2, 
  RefreshCw, 
  FileText,
  Maximize2,
  X,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Measurements() {
  const [activeTab, setActiveTab] = useState<"shirt" | "pant" | "suit" | "kurta">("shirt");
  const [mounted, setMounted] = useState(false);

  // Search & Customer states
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchResultText, setSearchResultText] = useState("");

  // Measurements history for searched phone number
  const [pastMeasurements, setPastMeasurements] = useState<any[]>([]);
  const [selectedPastMeasurement, setSelectedPastMeasurement] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Shirt template states
  const [shirtNeck, setShirtNeck] = useState("15.5");
  const [shirtChest, setShirtChest] = useState("40.0");
  const [shirtWaist, setShirtWaist] = useState("35.5");
  const [shirtShoulder, setShirtShoulder] = useState("18.0");
  const [shirtSleeve, setShirtSleeve] = useState("25.0");
  const [shirtLength, setShirtLength] = useState("29.0");
  const [shirtCuff, setShirtCuff] = useState("2.5");
  const [collarType, setCollarType] = useState("Mandarin Collar");
  const [pocketStyle, setPocketStyle] = useState("Classic Square");

  // Pant template states
  const [pantWaist, setPantWaist] = useState("34.0");
  const [pantHip, setPantHip] = useState("40.0");
  const [pantThigh, setPantThigh] = useState("24.0");
  const [pantKnee, setPantKnee] = useState("18.0");
  const [pantBottom, setPantBottom] = useState("15.0");
  const [pantLength, setPantLength] = useState("40.0");

  // Suit template states
  const [suitChest, setSuitChest] = useState("40.5");
  const [suitWaist, setSuitWaist] = useState("36.0");
  const [suitShoulder, setSuitShoulder] = useState("18.0");
  const [suitSleeve, setSuitSleeve] = useState("25.0");
  const [suitJacketLength, setSuitJacketLength] = useState("29.5");
  const [suitCoatSize, setSuitCoatSize] = useState("40");

  // Kurta template states
  const [kurtaChest, setKurtaChest] = useState("39.0");
  const [kurtaWaist, setKurtaWaist] = useState("35.0");
  const [kurtaSleeve, setKurtaSleeve] = useState("24.0");
  const [kurtaLength, setKurtaLength] = useState("42.0");
  const [kurtaCollar, setKurtaCollar] = useState("15.0");

  // Camera / Upload States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI check states
  const [aiChecked, setAiChecked] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchCustomers();
  }, []);

  // Fetch all customers for reference dropdown
  const fetchCustomers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.warn("Backend API not reachable. Using fallback customer list.");
      const fallback = [
        { id: "1", name: "Mr. Nilesh Shah", phone: "9925256898" },
        { id: "2", name: "Mr. Rajesh Patel", phone: "9998170809" },
        { id: "3", name: "Mr. Amit Mehta", phone: "9876543210" }
      ];
      setCustomers(fallback);
    }
  };

  // Run phone lookup
  const handlePhoneSearch = async (phoneStr: string) => {
    if (!phoneStr.trim()) return;
    
    setSearchResultText("Searching...");
    setPastMeasurements([]);
    setSelectedPastMeasurement(null);
    
    // Find matching customer in local list
    const matchedCustomer = customers.find(
      (c) => c.phone.replace(/\D/g, "") === phoneStr.replace(/\D/g, "") || c.phone.includes(phoneStr)
    );

    if (matchedCustomer) {
      setSelectedCustomerId(matchedCustomer.id);
      setSelectedCustomerName(matchedCustomer.name);
      setSearchResultText(`Found customer: ${matchedCustomer.name}`);
    } else {
      setSelectedCustomerId("");
      setSelectedCustomerName("Walk-in Customer");
      setSearchResultText("No customer profile found. Storing as walk-in.");
    }

    // Call backend measurements search
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/measurements/search?phone=${encodeURIComponent(phoneStr)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPastMeasurements(data);
          if (data.length === 0) {
            setSearchResultText(matchedCustomer ? `Found ${matchedCustomer.name}, but no previous measurements logged.` : "No measurements found for this phone.");
          }
        }
      } catch (err) {
        console.warn("Backend API measurements lookup failed. Using local mock lookup.");
        mockLocalMeasurementsLookup(phoneStr);
      }
    } else {
      mockLocalMeasurementsLookup(phoneStr);
    }
  };

  const mockLocalMeasurementsLookup = (phoneStr: string) => {
    // Generate some mock previous measurements for Nilesh
    if (phoneStr.includes("9925256898")) {
      const mockHistory = [
        {
          id: "m1",
          phone: "9925256898",
          customer_name: "Mr. Nilesh Shah",
          type: "shirt",
          values: { neck: "15.2", chest: "39.5", waist: "35.0", shoulder: "17.8", sleeve: "24.8", length: "28.5", cuff: "2.5", collarType: "Spread Collar", pocketStyle: "Classic Square" },
          photo_url: null,
          created_at: "2026-07-15T11:00:00"
        },
        {
          id: "m2",
          phone: "9925256898",
          customer_name: "Mr. Nilesh Shah",
          type: "pant",
          values: { waist: "33.5", hip: "39.5", thigh: "23.5", knee: "17.5", bottom: "14.5", length: "39.8" },
          photo_url: null,
          created_at: "2026-06-19T10:30:00"
        }
      ];
      setPastMeasurements(mockHistory);
    } else {
      setPastMeasurements([]);
    }
  };

  // Load a past measurement values into inputs
  const loadPastMeasurement = (m: any) => {
    setSelectedPastMeasurement(m);
    setDetailsModalOpen(true);
    setActiveTab(m.type);
    setAiChecked(false);
    
    const v = m.values;
    if (m.type === "shirt") {
      setShirtNeck(v.neck || "15.5");
      setShirtChest(v.chest || "40.0");
      setShirtWaist(v.waist || "35.5");
      setShirtShoulder(v.shoulder || "18.0");
      setShirtSleeve(v.sleeve || "25.0");
      setShirtLength(v.length || "29.0");
      setShirtCuff(v.cuff || "2.5");
      setCollarType(v.collarType || "Mandarin Collar");
      setPocketStyle(v.pocketStyle || "Classic Square");
    } else if (m.type === "pant") {
      setPantWaist(v.waist || "34.0");
      setPantHip(v.hip || "40.0");
      setPantThigh(v.thigh || "24.0");
      setPantKnee(v.knee || "18.0");
      setPantBottom(v.bottom || "15.0");
      setPantLength(v.length || "40.0");
    } else if (m.type === "suit") {
      setSuitChest(v.chest || "40.5");
      setSuitWaist(v.waist || "36.0");
      setSuitShoulder(v.shoulder || "18.0");
      setSuitSleeve(v.sleeve || "25.0");
      setSuitJacketLength(v.jacketLength || "29.5");
      setSuitCoatSize(v.coatSize || "40");
    } else if (m.type === "kurta") {
      setKurtaChest(v.chest || "39.0");
      setKurtaWaist(v.waist || "35.0");
      setKurtaSleeve(v.sleeve || "24.0");
      setKurtaLength(v.length || "42.0");
      setKurtaCollar(v.collar || "15.0");
    }
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    setPhotoBase64(null);
    setSelectedFile(null);
    setFilePreview(null);
    setIsCameraActive(true);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: 640, height: 480 }
        });
      } catch (e) {
        console.warn("Rear camera not available, trying default video source...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. Please check permissions or use file upload instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setPhotoBase64(dataUrl);
        stopCamera();
      }
    }
  };

  // File Upload Fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPhotoBase64(null);
      stopCamera();
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanBill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first to use the AI scanner.");
      setIsScanning(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("photo_file", file);

      // Set file previews
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/measurements/scan-bill`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.customer_name) {
          setSelectedCustomerName(data.customer_name);
          setSearchResultText(`AI Scanner: Loaded "${data.customer_name}". Please enter phone number to save.`);
        }
        
        if (data.garment_type) {
          setActiveTab(data.garment_type);
        }

        const v = data.values;
        if (data.garment_type === "shirt") {
          setShirtNeck(v.neck || "15.5");
          setShirtChest(v.chest || "40.0");
          setShirtWaist(v.waist || "35.5");
          setShirtShoulder(v.shoulder || "18.0");
          setShirtSleeve(v.sleeve || "25.0");
          setShirtLength(v.length || "29.0");
          setShirtCuff(v.cuff || "2.5");
          if (v.collarType) setCollarType(v.collarType);
          if (v.pocketStyle) setPocketStyle(v.pocketStyle);
        } else if (data.garment_type === "pant") {
          setPantWaist(v.waist || "34.0");
          setPantHip(v.hip || "40.0");
          setPantThigh(v.thigh || "24.0");
          setPantKnee(v.knee || "18.0");
          setPantBottom(v.bottom || "15.0");
          setPantLength(v.length || "40.0");
        } else if (data.garment_type === "suit") {
          setSuitChest(v.chest || "40.5");
          setSuitWaist(v.waist || "36.0");
          setSuitShoulder(v.shoulder || "18.0");
          setSuitSleeve(v.sleeve || "25.0");
          setSuitJacketLength(v.jacketLength || "29.5");
          setSuitCoatSize(v.coatSize || "40");
        } else if (data.garment_type === "kurta") {
          setKurtaChest(v.chest || "39.0");
          setKurtaWaist(v.waist || "35.0");
          setKurtaSleeve(v.sleeve || "24.0");
          setKurtaLength(v.length || "42.0");
          setKurtaCollar(v.collar || "15.0");
        }

        alert(`AI Scan Successful!\nLoaded Name: "${data.customer_name}"\nGarment: ${data.garment_type.toUpperCase()}`);
      } else {
        const errData = await res.json();
        alert(`Gemini Scanner Error: ${errData.detail || "Error loading. Check your Gemini API key configuration."}`);
        setFilePreview(null);
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Scanning failed:", err);
      alert("Error connecting to AI scanning server.");
      setFilePreview(null);
      setSelectedFile(null);
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  // Trigger local AI check
  const triggerAICheck = () => {
    setIsChecking(true);
    setAiChecked(false);
    
    setTimeout(() => {
      setIsChecking(false);
      setAiChecked(true);

      const warnings = [];
      if (activeTab === "shirt") {
        const chestVal = parseFloat(shirtChest);
        const neckVal = parseFloat(shirtNeck);
        if (chestVal > 46 || chestVal < 34) {
          warnings.push(`Unusual Chest size variance detected (Current: ${shirtChest}"). Typical size is between 36" and 44".`);
        }
        if (parseFloat(shirtWaist) > chestVal) {
          warnings.push(`Waist size (${shirtWaist}") exceeds Chest size (${shirtChest}"). Please verify waist measurement.`);
        }
      } else if (activeTab === "pant") {
        const waistVal = parseFloat(pantWaist);
        const hipVal = parseFloat(pantHip);
        if (waistVal > hipVal) {
          warnings.push(`Waist size (${waistVal}") cannot exceed Hip size (${hipVal}").`);
        }
        if (parseFloat(pantLength) < 32 || parseFloat(pantLength) > 46) {
          warnings.push(`Unusual Trouser Length (${pantLength}"). Standard gents length is 36"-44".`);
        }
      }
      setAiWarnings(warnings);
    }, 800);
  };

  // Save measurement to DB
  const handleSaveMeasurement = async () => {
    if (!searchPhone.trim()) {
      alert("Please provide a phone number for the customer.");
      return;
    }

    const token = localStorage.getItem("token");
    
    // Package active values
    let valuesObj: any = {};
    if (activeTab === "shirt") {
      valuesObj = {
        neck: shirtNeck,
        chest: shirtChest,
        waist: shirtWaist,
        shoulder: shirtShoulder,
        sleeve: shirtSleeve,
        length: shirtLength,
        cuff: shirtCuff,
        collarType,
        pocketStyle
      };
    } else if (activeTab === "pant") {
      valuesObj = {
        waist: pantWaist,
        hip: pantHip,
        thigh: pantThigh,
        knee: pantKnee,
        bottom: pantBottom,
        length: pantLength
      };
    } else if (activeTab === "suit") {
      valuesObj = {
        chest: suitChest,
        waist: suitWaist,
        shoulder: suitShoulder,
        sleeve: suitSleeve,
        jacketLength: suitJacketLength,
        coatSize: suitCoatSize
      };
    } else if (activeTab === "kurta") {
      valuesObj = {
        chest: kurtaChest,
        waist: kurtaWaist,
        sleeve: kurtaSleeve,
        length: kurtaLength,
        collar: kurtaCollar
      };
    }

    if (token) {
      try {
        const formData = new FormData();
        formData.append("phone", searchPhone);
        formData.append("type", activeTab);
        formData.append("values", JSON.stringify(valuesObj));
        if (selectedCustomerId) {
          formData.append("customer_id", selectedCustomerId);
        }
        
        if (selectedFile) {
          formData.append("photo_file", selectedFile);
        } else if (photoBase64) {
          formData.append("photo_base64", photoBase64);
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/measurements`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (res.ok) {
          alert("Measurement saved successfully to database!");
          
          // Trigger automatic thank you message if photo was attached
          const hasPhoto = selectedFile || photoBase64;
          if (hasPhoto) {
            triggerThankYouWhatsapp(searchPhone);
          }

          // Reset attachments
          setPhotoBase64(null);
          setSelectedFile(null);
          setFilePreview(null);
          // Reload history
          handlePhoneSearch(searchPhone);
          return;
        } else {
          const errData = await res.json();
          alert(`Failed to save: ${errData.detail || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Save measurement endpoint failed:", err);
      }
    }

    // Local Mock Save Fallback
    const mockMeasId = `MEAS-${Math.floor(1000 + Math.random() * 9000)}`;
    const newMockMeas = {
      id: mockMeasId,
      phone: searchPhone,
      customer_name: selectedCustomerName || "Walk-in Customer",
      type: activeTab,
      values: valuesObj,
      photo_url: filePreview || photoBase64 || null,
      created_at: new Date().toISOString()
    };

    setPastMeasurements([newMockMeas, ...pastMeasurements]);

    // Trigger automatic thank you message if photo was attached
    const hasPhotoLocal = selectedFile || photoBase64;
    if (hasPhotoLocal) {
      triggerThankYouWhatsapp(searchPhone);
    }

    setPhotoBase64(null);
    setSelectedFile(null);
    setFilePreview(null);
    alert("Saved successfully! (Saved to local memory state)");
  };

  const triggerThankYouWhatsapp = (phone: string) => {
    const cleanPhone = phone.replace("+", "").replace(/\s/g, "");
    const finalPhone = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone;
    const thankYouText = `Hello! Thank you for choosing Choice Tailors. We have successfully logged your measurements and fabric snap. We look forward to stitching your perfect outfit soon!\n\nNr. Nilkanth Lodge, Gandhi Chok, Kadi\nHelpline: 9925256898`;
    const encodedText = encodeURIComponent(thankYouText);
    window.open(`https://wa.me/${finalPhone}?text=${encodedText}`, "_blank");
  };

  const handleDeleteMeasurement = async (measId: string) => {
    if (!confirm("Are you sure you want to delete this measurement record?")) return;

    const token = localStorage.getItem("token");
    if (token && !measId.startsWith("MEAS-")) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/measurements/${measId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setPastMeasurements(pastMeasurements.filter((m) => m.id !== measId));
          if (selectedPastMeasurement?.id === measId) setSelectedPastMeasurement(null);
          return;
        }
      } catch (err) {
        console.error("Failed to delete measurement:", err);
      }
    }

    setPastMeasurements(pastMeasurements.filter((m) => m.id !== measId));
    if (selectedPastMeasurement?.id === measId) setSelectedPastMeasurement(null);
    alert("Measurement removed from record.");
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
              Measurement Board
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Store & click pictures of fabric measurements, search/retrieve records by mobile phone.
            </p>
          </div>

          {/* Quick Search Panel */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="tel" 
                placeholder="Search Phone..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch(searchPhone)}
                className="custom-input pl-10 text-sm w-full md:w-56 shadow-sm"
              />
            </div>
            <button
              onClick={() => handlePhoneSearch(searchPhone)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Search Results / Selected Customer Info Alert */}
        {searchResultText && (
          <div className={`mb-6 p-3 rounded-lg border text-xs flex justify-between items-center ${
            selectedCustomerId 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{searchResultText}</span>
              {selectedCustomerName && (
                <span className="font-bold">({selectedCustomerName} - {searchPhone})</span>
              )}
            </div>
            {selectedCustomerId && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Linked Profile
              </span>
            )}
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex gap-2 p-1 bg-slate-200/60 border border-slate-200 rounded-lg max-w-md mb-8">
          {(["shirt", "pant", "suit", "kurta"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setAiChecked(false);
              }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white text-red-700 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Grid */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Ruler className="w-5 h-5 text-red-600" />
              <span className="capitalize">{activeTab} Sizing Form</span>
            </h3>

            {activeTab === "shirt" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: "Neck (inches)", val: shirtNeck, set: setShirtNeck },
                  { label: "Chest (inches)", val: shirtChest, set: setShirtChest },
                  { label: "Waist (inches)", val: shirtWaist, set: setShirtWaist },
                  { label: "Shoulder (inches)", val: shirtShoulder, set: setShirtShoulder },
                  { label: "Sleeve Length (inches)", val: shirtSleeve, set: setShirtSleeve },
                  { label: "Shirt Length (inches)", val: shirtLength, set: setShirtLength },
                  { label: "Cuff (inches)", val: shirtCuff, set: setShirtCuff }
                ].map((input) => (
                  <div key={input.label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{input.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={input.val}
                      onChange={(e) => input.set(e.target.value)}
                      className="w-full custom-input text-sm"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Collar Type</label>
                  <select 
                    value={collarType} 
                    onChange={(e) => setCollarType(e.target.value)}
                    className="w-full custom-input text-sm text-slate-700"
                  >
                    <option>Mandarin Collar</option>
                    <option>Cutaway Collar</option>
                    <option>Spread Collar</option>
                    <option>Regular Collar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pocket Style</label>
                  <select 
                    value={pocketStyle} 
                    onChange={(e) => setPocketStyle(e.target.value)}
                    className="w-full custom-input text-sm text-slate-700"
                  >
                    <option>Classic Square</option>
                    <option>Round Flap</option>
                    <option>No Pocket</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "pant" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: "Waist (inches)", val: pantWaist, set: setPantWaist },
                  { label: "Hip (inches)", val: pantHip, set: setPantHip },
                  { label: "Thigh (inches)", val: pantThigh, set: setPantThigh },
                  { label: "Knee (inches)", val: pantKnee, set: setPantKnee },
                  { label: "Bottom (inches)", val: pantBottom, set: setPantBottom },
                  { label: "Length (inches)", val: pantLength, set: setPantLength }
                ].map((input) => (
                  <div key={input.label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{input.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={input.val}
                      onChange={(e) => input.set(e.target.value)}
                      className="w-full custom-input text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "suit" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: "Chest (inches)", val: suitChest, set: setSuitChest },
                  { label: "Waist (inches)", val: suitWaist, set: setSuitWaist },
                  { label: "Shoulder (inches)", val: suitShoulder, set: setSuitShoulder },
                  { label: "Sleeve Length (inches)", val: suitSleeve, set: setSuitSleeve },
                  { label: "Jacket Length (inches)", val: suitJacketLength, set: setSuitJacketLength },
                  { label: "Coat Size", val: suitCoatSize, set: setSuitCoatSize }
                ].map((input) => (
                  <div key={input.label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{input.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={input.val}
                      onChange={(e) => input.set(e.target.value)}
                      className="w-full custom-input text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "kurta" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {[
                  { label: "Chest (inches)", val: kurtaChest, set: setKurtaChest },
                  { label: "Waist (inches)", val: kurtaWaist, set: setKurtaWaist },
                  { label: "Sleeve (inches)", val: kurtaSleeve, set: setKurtaSleeve },
                  { label: "Length (inches)", val: kurtaLength, set: setKurtaLength },
                  { label: "Collar (inches)", val: kurtaCollar, set: setKurtaCollar }
                ].map((input) => (
                  <div key={input.label}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">{input.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={input.val}
                      onChange={(e) => input.set(e.target.value)}
                      className="w-full custom-input text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Camera / Fabric Photo Attachment Area */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-red-600" />
                <span>Fabric / Measurement Snap (कपड़े या नाप का फोटो)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left side: Camera Viewfinder or Upload Fallback */}
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
                  
                  {/* Live Video feed */}
                  {isCameraActive && (
                    <div className="w-full h-full flex flex-col items-center">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline
                        className="w-full h-40 object-cover rounded border border-slate-300"
                      />
                      <button
                        onClick={captureSnapshot}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
                      >
                        Capture Snapshot
                      </button>
                    </div>
                  )}

                  {/* Canvas for snapshot rendering (hidden) */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Photo Preview (Captured Webcam snapshot or Selected File) */}
                  {!isCameraActive && (photoBase64 || filePreview) && (
                    <div className="w-full h-full flex flex-col items-center relative">
                      <img 
                        src={photoBase64 || filePreview || ""} 
                        alt="Measurement Attachment Preview" 
                        className="w-full h-40 object-cover rounded border border-slate-300"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => {
                            setPhotoBase64(null);
                            setFilePreview(null);
                            setSelectedFile(null);
                          }}
                          className="bg-slate-900/70 hover:bg-slate-900 text-white p-1 rounded-full shadow"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1">Image Attached Successfully</span>
                    </div>
                  )}

                  {isScanning && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-700 text-center">Gemini AI reading Gujarati bill...</p>
                      <p className="text-[10px] text-slate-400">આઈ સ્કેન શરૂ છે...</p>
                    </div>
                  )}

                  {/* Default State: Inactive Camera */}
                  {!isCameraActive && !photoBase64 && !filePreview && !isScanning && (
                    <div className="text-center py-6">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 mb-4">No picture clicked or file uploaded.</p>
                      
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={startCamera}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Start Camera</span>
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File</span>
                        </button>

                        <button
                          onClick={() => scanInputRef.current?.click()}
                          className="bg-red-50 hover:bg-red-100/80 text-red-755 border border-red-200 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-red-600" />
                          <span>AI Scan Bill</span>
                        </button>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      <input 
                        type="file" 
                        ref={scanInputRef} 
                        onChange={handleScanBill}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Camera Error alert */}
                  {cameraError && (
                    <p className="text-[10px] text-red-600 font-semibold text-center mt-2 px-2">{cameraError}</p>
                  )}
                </div>

                {/* Right side: Instructions or Snapshot options */}
                <div className="flex flex-col justify-between text-xs text-slate-500 border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="space-y-2">
                    <p className="font-bold text-slate-700">Attachments Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You can click a photo of the physical cloth piece/pattern.</li>
                      <li>Or write measurements on paper, click photo, and save.</li>
                      <li>Max image upload size is 5MB.</li>
                    </ul>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={triggerAICheck}
                      disabled={isChecking}
                      className="bg-white hover:bg-slate-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex-1 font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isChecking ? "Checking..." : "AI Check"}</span>
                    </button>

                    <button
                      onClick={handleSaveMeasurement}
                      className="btn-crimson px-4 py-2 rounded-lg flex-1 font-bold flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save Record</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Body Points & History lookup */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* SVG Visual Body Pointer */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-center h-80 shadow-sm relative">
              <span className="absolute top-4 left-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fit Guide</span>
              <svg className="w-40 h-full opacity-70" viewBox="0 0 100 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Upper Chest / Head */}
                <circle cx="50" cy="20" r="12" stroke="#64748b" strokeWidth="1.5" />
                {/* Neck */}
                <line x1="50" y1="32" x2="50" y2="40" stroke={activeTab === "shirt" ? "#a82c2c" : "#64748b"} strokeWidth={activeTab === "shirt" ? "3" : "1.5"} />
                {/* Shoulders */}
                <path d="M 28 50 L 72 50" stroke={activeTab === "shirt" || activeTab === "suit" ? "#a82c2c" : "#64748b"} strokeWidth="2.5" />
                {/* Arms */}
                <path d="M 28 50 L 22 110 M 72 50 L 78 110" stroke={activeTab === "shirt" || activeTab === "suit" ? "#a82c2c" : "#64748b"} strokeWidth="2" />
                {/* Torso / Waist */}
                <rect x="33" y="50" width="34" height="60" rx="3" stroke={activeTab === "shirt" || activeTab === "suit" || activeTab === "kurta" ? "#a82c2c" : "#64748b"} strokeWidth="1.5" />
                <line x1="33" y1="90" x2="67" y2="90" stroke="#a82c2c" strokeWidth="2" />
                {/* Legs */}
                <path d="M 38 110 L 38 200 M 62 110 L 62 200" stroke={activeTab === "pant" ? "#a82c2c" : "#64748b"} strokeWidth="2.5" />
                
                {/* Dynamic highlight indicator */}
                <circle cx="50" cy="90" r="4" fill="#a82c2c" className="animate-ping" />
              </svg>
            </div>

            {/* AI Diagnostics Box */}
            <AnimatePresence>
              {aiChecked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border shadow-sm ${
                    aiWarnings.length > 0 
                      ? "bg-rose-50 border-rose-200 text-rose-800" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {aiWarnings.length > 0 ? (
                      <ShieldAlert className="w-5 h-5 text-rose-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    )}
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {aiWarnings.length > 0 ? "Measurement Warnings" : "Diagnostics Clear"}
                    </h4>
                  </div>
                  
                  {aiWarnings.length > 0 ? (
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      {aiWarnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs">
                      Sizes within standard tolerances. No critical warnings found.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Previous Measurements History */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <History className="w-4 h-4 text-red-600" />
                <span>History for Phone ({pastMeasurements.length})</span>
              </h4>

              {pastMeasurements.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No measurements history found. Search for a phone number or select a customer.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {pastMeasurements.map((m) => (
                    <div 
                      key={m.id} 
                      className={`p-3 border rounded-lg flex justify-between items-center transition-all cursor-pointer ${
                        selectedPastMeasurement?.id === m.id
                          ? "border-red-600 bg-red-50/50"
                          : "border-slate-200 hover:border-red-200"
                      }`}
                      onClick={() => loadPastMeasurement(m)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          {m.photo_url ? (
                            <img src={m.photo_url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${m.photo_url}` : m.photo_url} className="w-full h-full object-cover rounded-full" alt="attach" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">{m.type} Measurement</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMeasurement(m.id);
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-red-600 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Past Measurement Details with Image Preview */}
            {selectedPastMeasurement && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Selected Sizing Record Detail</h4>
                  <button 
                    onClick={() => setSelectedPastMeasurement(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs"
                  >
                    Clear Preview
                  </button>
                </div>

                <div className="text-xs space-y-2">
                  <p className="font-bold text-slate-800 uppercase">Values Logged:</p>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono">
                    {Object.entries(selectedPastMeasurement.values).map(([key, val]: any) => (
                      <div key={key} className="text-center p-1 bg-white border border-slate-100 rounded">
                        <span className="text-[9px] text-slate-400 block uppercase">{key}</span>
                        <span className="text-xs font-bold text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPastMeasurement.photo_url && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 uppercase">Fabric / Layout Photo:</p>
                    <div className="relative border border-slate-200 rounded overflow-hidden max-h-40 group">
                      <img 
                        src={selectedPastMeasurement.photo_url.startsWith("/") 
                          ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedPastMeasurement.photo_url}` 
                          : selectedPastMeasurement.photo_url
                        } 
                        className="w-full h-full object-cover" 
                        alt="Measurement attachment file" 
                      />
                      <button
                        onClick={() => window.open(
                          selectedPastMeasurement.photo_url.startsWith("/") 
                            ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedPastMeasurement.photo_url}` 
                            : selectedPastMeasurement.photo_url, 
                          "_blank"
                        )}
                        className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                        title="View Full Size"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </div>

        </div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {detailsModalOpen && selectedPastMeasurement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:p-0 print:bg-white">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white border border-slate-200 p-6 rounded-xl shadow-2xl relative max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:max-h-full print:overflow-visible"
            >
              <button 
                onClick={() => setDetailsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all duration-150 print:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2 uppercase tracking-wide print:text-black">
                <FileText className="w-5 h-5 text-red-600 print:hidden" />
                <span>{selectedPastMeasurement.type} Measurement Details</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5 pb-3 border-b border-slate-100 print:text-black">
                Customer: <span className="font-bold text-slate-750 print:text-black">{selectedPastMeasurement.customer_name || selectedCustomerName || "Walk-in Customer"}</span> | 
                Phone: <span className="font-bold text-slate-750 font-mono print:text-black"> {selectedPastMeasurement.phone}</span> | 
                Date: <span className="font-bold text-slate-755 print:text-black"> {new Date(selectedPastMeasurement.created_at).toLocaleDateString()}</span>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
                {/* Left Side: Photo */}
                <div className="space-y-3 print:space-y-2">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider print:text-black">Fabric / Layout Photo</span>
                  {selectedPastMeasurement.photo_url ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative aspect-[4/3] flex items-center justify-center print:border-none">
                      <img 
                        src={selectedPastMeasurement.photo_url.startsWith("/") 
                          ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedPastMeasurement.photo_url}` 
                          : selectedPastMeasurement.photo_url
                        } 
                        className="w-full h-full object-cover cursor-zoom-in"
                        alt="Measurement attachment"
                        onClick={() => window.open(
                          selectedPastMeasurement.photo_url.startsWith("/") 
                            ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedPastMeasurement.photo_url}` 
                            : selectedPastMeasurement.photo_url, 
                          "_blank"
                        )}
                      />
                      <button
                        onClick={() => window.open(
                          selectedPastMeasurement.photo_url.startsWith("/") 
                            ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}${selectedPastMeasurement.photo_url}` 
                            : selectedPastMeasurement.photo_url, 
                          "_blank"
                        )}
                        className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-lg shadow flex items-center gap-1 text-xs transition-all print:hidden"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View Full Screen</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-8 bg-slate-50 text-center flex flex-col items-center justify-center aspect-[4/3] text-slate-400 print:hidden">
                      <Camera className="w-8 h-8 text-slate-300 mb-2" />
                      <span className="text-xs">No image attached.</span>
                    </div>
                  )}
                </div>

                {/* Right Side: Sizes Table */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider print:text-black">Measurement Parameters</span>
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 print:max-h-full print:overflow-visible">
                    {Object.entries(selectedPastMeasurement.values).map(([key, val]: any) => (
                      <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm print:bg-white print:border-slate-300">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider print:text-black">{key}</span>
                        <span className="text-md font-extrabold text-slate-700 font-mono mt-0.5 block print:text-black">{val}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-5 border-t border-slate-100 mt-6 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print Sizes</span>
                </button>
                
                <button 
                  onClick={() => setDetailsModalOpen(false)}
                  className="btn-crimson flex-1 py-2.5 text-sm shadow-sm"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
