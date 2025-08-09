"use client";

// Home page (client component)
// Team notes:
// - Keeps all UI state local and small: drug inputs, loading, result modal, error.
// - The API call is intentionally simple and returns a normalized shape regardless of
//   the underlying DB schema.
// - Visual flourishes (particles, animations) are isolated so we can tweak/remove them
//   without touching the core logic.

import { useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle, Info, CheckCircle, XCircle, Pill, Shield, Activity, Zap, Sparkles, Brain, Dna, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: "Major" | "Moderate" | "Minor" | "None";
  description?: string;
  interaction?: string;
}

export default function Home() {
  const [drug1, setDrug1] = useState("");
  const [drug2, setDrug2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DrugInteraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Kicks off the interaction check against our API route.
  // We validate inputs lightly on the client, relying on server validation as the source of truth.
  const checkInteraction = async () => {
    if (!drug1.trim() || !drug2.trim()) {
      setError("Please enter both drug names");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/drug-interaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drug1: drug1.trim(),
          drug2: drug2.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check drug interaction");
      }

      const data = await response.json();
      setResult(data);
      setShowResults(true); // Open the modal when results are available
    } catch (err) {
      setError("An error occurred while checking drug interactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Maps severity to a consistent icon + brand color. Keeping this centralized makes
  // it easy to extend with new severities or themes.
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Major":
        return <XCircle className="h-10 w-10" style={{ color: '#DE6063' }} />;
      case "Moderate":
        return <AlertTriangle className="h-10 w-10" style={{ color: '#1C5378' }} />;
      case "Minor":
        return <Info className="h-10 w-10" style={{ color: '#464C43' }} />;
      case "None":
        return <CheckCircle className="h-10 w-10" style={{ color: '#19343F' }} />;
      default:
        return <Info className="h-10 w-10" style={{ color: '#464C43' }} />;
    }
  };

  // Central styling palette for each severity. Keep visual tokens here instead of
  // scattered inline so designers/devs can refine in one place.
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "Major":
        return {
          bg: "bg-red-600",
          border: "border-red-400/30",
          text: "text-red-300",
          badge: "bg-red-500/20 text-red-300 border-red-400/50",
          card: "border-l-red-500",
          glow: "shadow-red-500/30",
          particles: "bg-red-400"
        };
      case "Moderate":
        return {
          bg: "bg-blue-600",
          border: "border-blue-400/30",
          text: "text-blue-300",
          badge: "bg-blue-500/20 text-blue-300 border-blue-400/50",
          card: "border-l-blue-500",
          glow: "shadow-blue-500/30",
          particles: "bg-blue-400"
        };
      case "Minor":
        return {
          bg: "bg-gray-600",
          border: "border-gray-400/30",
          text: "text-gray-300",
          badge: "bg-gray-500/20 text-gray-300 border-gray-400/50",
          card: "border-l-gray-500",
          glow: "shadow-gray-500/30",
          particles: "bg-gray-400"
        };
      case "None":
        return {
          bg: "bg-green-600",
          border: "border-green-400/30",
          text: "text-green-300",
          badge: "bg-green-500/20 text-green-300 border-green-400/50",
          card: "border-l-green-500",
          glow: "shadow-green-500/30",
          particles: "bg-green-400"
        };
      default:
        return {
          bg: "bg-gray-600",
          border: "border-gray-400/30",
          text: "text-gray-300",
          badge: "bg-gray-500/20 text-gray-300 border-gray-400/50",
          card: "border-l-gray-500",
          glow: "shadow-gray-500/30",
          particles: "bg-gray-400"
        };
    }
  };

  const getSeverityAdvice = (severity: string): string[] => {
    switch (severity) {
      case "Major":
        return [
          "Avoid using these together if possible; ask your prescriber for alternatives.",
          "If combination is necessary, increase monitoring and consider dose/timing adjustments.",
          "Seek urgent care if severe symptoms appear (e.g., bleeding, chest pain, confusion).",
        ];
      case "Moderate":
        return [
          "Use with caution and monitor for reduced efficacy or increased side effects.",
          "Consider spacing doses (when clinically appropriate) and review other interacting meds.",
          "Contact your provider if new or persistent symptoms develop.",
        ];
      case "Minor":
        return [
          "Low likelihood of serious issues; mild effects may occur.",
          "No routine changes needed; continue usual monitoring.",
        ];
      default:
        return [
          "No significant interaction found in our database.",
          "Still monitor for unexpected symptoms and consult your provider if concerned.",
        ];
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `Interaction between ${result.drug1} and ${result.drug2} — Risk: ${result.severity}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Best-effort copy; ignore errors silently
    }
  };

  // Client-only floating particles to avoid hydration mismatches from Math.random()
  // Floating particles are rendered client-only to avoid hydration mismatch from Math.random().
  // If performance becomes a concern on low-end devices, we can gate this behind a media
  // query or a reduced-motion preference.
  const Particles = () => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Generate particle specs once on the client after mount
    const specs = useMemo(() => {
      return Array.from({ length: 20 }).map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        dx: Math.random() * 50 - 25,
        duration: Math.random() * 10 + 10,
      }));
    }, []);

    if (!mounted) return null;

    return (
      <>
        {specs.map((s, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-30"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              backgroundColor: "#FEFAEF",
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, s.dx, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#19343F' }}>
      {/* Simplified Solid Color Background */}
      <div className="fixed inset-0">
        {/* Solid color overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: '#19343F' }}></div>
        
        {/* Simple grid pattern */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FEFAEF' fill-opacity='0.03'%3E%3Cpath d='M20 20v20M0 20h40M0 0v40M40 0v40'/%3E%3C/g%3E%3C/svg%3E\")"
          }}
        ></div>
        
        {/* Simple floating particles (client-only to avoid hydration mismatch) */}
        <Particles />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center mb-20"
          >
            <div className="flex flex-col items-center gap-8 mb-12">
              <motion.div
                animate={{ 
                  rotate: [0, 360], 
                  scale: [1, 1.1, 1] 
                }}
                transition={{ 
                  duration: 25, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse" style={{ backgroundColor: '#1C5378' }}></div>
                <div className="relative p-4 rounded-3xl shadow-1xl" style={{ backgroundColor: '#464C43' }}>
                  <Dna className="h-6 w-6" style={{ color: '#FEFAEF' }} />
                </div>
              </motion.div>
              <div className="space-y-4">
                
                <motion.h1 
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold tracking-tight"
                  animate={{ 
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity 
                  }}
                  style={{ color: '#FEFAEF' }}
                >
                  MediMatch
                </motion.h1>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-xl md:text-2xl" style={{ color: '#FEFAEF' }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: '#1C5378' }} />
                  Intelligent Drug Interaction Analysis
                  <Sparkles className="h-5 w-5" style={{ color: '#DE6063' }} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Interface */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 mb-16"
          >
            {/* Input Card */}
            <Card className="backdrop-blur-2xl rounded-3xl overflow-hidden transition-all duration-500 shadow-xl" style={{ backgroundColor: '#fff', border: 'none' }}>
              <CardHeader className="pb-8 pt-8 px-8">
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-3 rounded-xl shadow-md" style={{ backgroundColor: '#1C5378' }}
                      >
                        <Search className="h-6 w-6" style={{ color: '#FEFAEF' }} />
                      </motion.div>
                      <div>
                        <h3 className="text-3xl font-bold" style={{ color: '#19343F' }}>
                          Drug Analysis
                        </h3>
                        <p className="text-lg mt-1" style={{ color: '#464C43' }}>
                          Enter medications for comprehensive interaction analysis
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0] 
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="p-2 rounded-lg opacity-20"
                      style={{ backgroundColor: '#DE6063' }}
                    >
                      <Pill className="h-5 w-5" style={{ color: '#19343F' }} />
                    </motion.div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-10">
                <div className="space-y-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                  >
                    <label style={{ color: '#19343F', fontSize: '1.125rem', fontWeight: 600 }} className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: '#1C5378' }}></div>
                      First Medication
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-300" style={{ backgroundColor: '#1C5378' }}></div>
                      <Input
                        placeholder="e.g., Aspirin, Lisinopril, Metformin..."
                        value={drug1}
                        onChange={(e) => setDrug1(e.target.value)}
                        className="w-full h-16 text-xl rounded-2xl backdrop-blur-sm group-hover:transition-all duration-300" style={{ backgroundColor: '#f8f9fa', border: '2px solid #464C4330', color: '#19343F' }}
                      />
                      <Pill className="absolute right-5 top-5 h-7 w-7 transition-colors duration-300" style={{ color: '#464C43' }} />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
                    <label style={{ color: '#19343F', fontSize: '1.125rem', fontWeight: 600 }} className="flex items-center gap-4">
                      <div className="w-4 h-4 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: '#464C43' }}></div>
                      Second Medication
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-300" style={{ backgroundColor: '#464C43' }}></div>
                      <Input
                        placeholder="e.g., Ibuprofen, Warfarin, Atorvastatin..."
                        value={drug2}
                        onChange={(e) => setDrug2(e.target.value)}
                        className="w-full h-16 text-xl rounded-2xl backdrop-blur-sm group-hover:transition-all duration-300" style={{ backgroundColor: '#f8f9fa', border: '2px solid #464C4330', color: '#19343F' }}
                      />
                      <Pill className="absolute right-5 top-5 h-7 w-7 transition-colors duration-300" style={{ color: '#464C43' }} />
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Button
                    onClick={checkInteraction}
                    disabled={loading || !drug1.trim() || !drug2.trim()}
                    className="w-full h-18 text-2xl font-bold shadow-2xl disabled:cursor-not-allowed rounded-2xl relative overflow-hidden" style={{ backgroundColor: '#DE6063', color: '#FEFAEF' }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"
                        />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Brain className="h-8 w-8" />
                        <span>Analyze Interaction</span>
                      </div>
                    )}
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Alert className="border-red-500/30 bg-red-500/10 text-red-200 backdrop-blur-sm">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="text-lg font-semibold">Error</AlertTitle>
                        <AlertDescription className="text-base">{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className="backdrop-blur-2xl rounded-3xl overflow-hidden transition-all duration-500" style={{ backgroundColor: '#464C4310', border: '3px solid #f8f8f8' }}>
              <CardHeader className="pb-10">
                <CardTitle className="flex items-center gap-6 text-4xl" style={{ color: '#FEFAEF' }}>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#464C43' }}
                  >
                    <Activity className="h-7 w-7" style={{ color: '#FEFAEF' }} />
                  </motion.div>
                  <div style={{ color: '#DE6063' }}>
                    System Intelligence
                  </div>
                </CardTitle>
                <CardDescription style={{ color: '#FEFAEF', fontSize: '1.25rem' }}>
                  Advanced analysis capabilities & status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.08, y: -5 }}
                    className="p-6 rounded-3xl border backdrop-blur-sm" style={{ backgroundColor: '#FEFAEF', borderColor: '#464C4330' }}
                  >
                    <div className="text-3xl font-bold" style={{ color: '#000000' }}>24/7</div>
                    <div className="mt-2" style={{ color: '#000000', fontSize: '1rem' }}>Available</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.08, y: -5 }}
                    className="p-6 rounded-3xl border backdrop-blur-sm" style={{ backgroundColor: '#DE6063', borderColor: '#464C4330' }}
                  >
                    <div className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>AI-Powered</div>
                    <div className="mt-2" style={{ color: '#FFFFFF', fontSize: '1rem' }}>Analysis</div>
                  </motion.div>
                </div>
                
                <div className="p-8 rounded-3xl border backdrop-blur-sm" style={{ backgroundColor: '#FEFAEF', border: '1px solid #464C4320' }}>
                  <h4 className="font-bold text-xl mb-6 flex items-center gap-3" style={{ color: '#000000' }}>
                    <Activity className="h-6 w-6" style={{ color: '#DE6063' }} />
                    Quick Start Guide
                  </h4>
                  <div style={{ color: '#000000', fontSize: '1rem' }} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#1C5378' }}></div>
                      <span>Enter medication names with accurate spelling</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#1C5378' }}></div>
                      <span>Use generic names for best results</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#464C43' }}></div>
                      <span>Always consult healthcare professionals</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: '#19343F' }}></div>
                      <span>Results are for informational purposes only</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Modal */}
          <AnimatePresence>
            {showResults && (
              <>
                {/* Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowResults(false)}
                >
                  {/* Modal Content */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-3 border-gray-100 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    style={{ backgroundColor: '#fff', border: '3px solid #f8f8f8' }}
                  >
                    <div className={`h-2 ${result ? getSeverityConfig(result.severity).bg : getSeverityConfig('None').bg}`}></div>
                    
                    {/* Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                              rotate: [0, 10, -10, 0]
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity 
                            }}
                          >
                            {result && getSeverityIcon(result.severity)}
                          </motion.div>
                          <div>
                            <h2 className="text-3xl font-bold" style={{ color: '#19343F' }}>Analysis Results</h2>
                            <p className="text-lg" style={{ color: '#464C43' }}>
                              Interaction between <span className="font-bold" style={{ color: '#1C5378' }}>{result?.drug1}</span> and <span className="font-bold" style={{ color: '#DE6063' }}>{result?.drug2}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            className="rounded-full"
                          >
                            Copy result
                          </Button>
                          <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowResults(false)}
                          className="rounded-full p-2 hover:bg-gray-100"
                          >
                          <X className="h-5 w-5" style={{ color: '#464C43' }} />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="px-6 pb-6 space-y-6">
                      <div className="flex items-center gap-6">
                        <span className="text-lg font-semibold" style={{ color: '#19343F' }}>Risk Level:</span>
                        <div className={`px-6 py-3 rounded-2xl border-2 font-bold text-lg ${result ? getSeverityConfig(result.severity).badge : getSeverityConfig('None').badge} backdrop-blur-sm`}>
                          {result?.severity}
                        </div>
                      </div>

                      {result && (
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: '#f8f9fa', border: '1px solid #E5E7EB' }}>
                          <div className="text-sm font-semibold mb-2" style={{ color: '#19343F' }}>What to do</div>
                          <ul className="list-disc pl-5 space-y-1" style={{ color: '#464C43' }}>
                            {getSeverityAdvice(result.severity).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result?.interaction && (
                        <div className="p-6 rounded-2xl border-l-4 backdrop-blur-sm" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #DE6063' }}>
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-3" style={{ color: '#19343F' }}>
                            <AlertTriangle className="h-5 w-5" style={{ color: '#1C5378' }} />
                            Clinical Significance
                          </h4>
                          <p style={{ color: '#464C43', fontSize: '1rem', lineHeight: '1.6' }} className="leading-relaxed">
                            {result.interaction}
                          </p>
                        </div>
                      )}

                      {result?.description && (
                        <div className="p-6 rounded-2xl border-l-4 backdrop-blur-sm" style={{ backgroundColor: '#f8f9fa', borderLeft: '4px solid #1C5378' }}>
                          <h4 className="font-bold text-lg mb-3 flex items-center gap-3" style={{ color: '#19343F' }}>
                            <Info className="h-5 w-5" style={{ color: '#1C5378' }} />
                            Detailed Information
                          </h4>
                          <p style={{ color: '#464C43', fontSize: '1rem', lineHeight: '1.6' }} className="leading-relaxed">
                            {result.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Card className="backdrop-blur-2xl rounded-3xl overflow-hidden" style={{ backgroundColor: '#464C4310', border: '1px solid #464C4320' }}>
              <CardContent className="pt-8">
                <Alert className="backdrop-blur-sm" style={{ backgroundColor: '#1C537810', border: '1px solid #1C537830', color: '#FFFFFF' }}>
                  <Shield className="h-5 w-5" />
                  <AlertTitle className="text-lg font-semibold">Medical Disclaimer</AlertTitle>
                  <AlertDescription className="text-base leading-relaxed" style={{ color: '#FFFFFF' }}>
                    This tool provides information for educational purposes only and should not replace 
                    professional medical advice. Always consult with your healthcare provider or pharmacist 
                    before making any changes to your medication regimen. The information provided may not be 
                    complete or up-to-date. In case of emergency, contact your healthcare provider immediately.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}