import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  FileQuestion,
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  HelpCircle,
  Trash2,
  Clock,
  Tag,
  ChevronRight,
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import apiClient from "@/lib/axios";

interface Ticket {
  id: string;
  title: string;
  service: string;
  priority: string;
  describe: string;
  status: string;
  createdAt: string;
}

export default function HelpCenter() {
  const [activeTab, setActiveTab] = useState<"home" | "ticket">("home");
  
  // Email Copy State
  const [emailCopied, setEmailCopied] = useState(false);

  // Ticket Form State
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketService, setTicketService] = useState("BSA Reports");
  const [ticketPriority, setTicketPriority] = useState("Medium");
  const [ticketDescribe, setTicketDescribe] = useState("");
  
  // Submission & Success Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState("");
  const [backendMessage, setBackendMessage] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tickets History
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Load tickets on mount
  const fetchTickets = async () => {
    try {
      const response = await apiClient.get("/ticket/history");
      const { data } = response.data;
      if (Array.isArray(data)) {
        const mappedTickets: Ticket[] = data.map((t: any) => ({
          id: t.ticket_id,
          title: t.title,
          service: t.service,
          priority: t.priority,
          describe: t.description,
          status: t.status,
          createdAt: t.created_at,
        }));
        setTickets(mappedTickets);
        localStorage.setItem("5pointcredit_tickets", JSON.stringify(mappedTickets));
      } else {
        setTickets([]);
        localStorage.setItem("5pointcredit_tickets", JSON.stringify([]));
      }
    } catch (e) {
      console.error("Failed to fetch tickets from backend, loading from localStorage fallback", e);
      const savedTickets = localStorage.getItem("5pointcredit_tickets");
      if (savedTickets) {
        try {
          setTickets(JSON.parse(savedTickets));
        } catch (parseError) {
          console.error("Failed to parse saved tickets", parseError);
        }
      }
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Save tickets helper
  const saveTickets = (updatedTickets: Ticket[]) => {
    setTickets(updatedTickets);
    localStorage.setItem("5pointcredit_tickets", JSON.stringify(updatedTickets));
  };

  // Submit Ticket Handler
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!ticketDescribe.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/ticket/create", {
        title: ticketTitle,
        description: ticketDescribe,
        service: ticketService,
        priority: ticketPriority
      });

      const { message, data } = response.data;
      const ticket_id = data?.ticket_id;
      const status = data?.status || "OPEN";
      const expectedResolution = data?.Expected_resolution_date;

      const newTicket: Ticket = {
        id: ticket_id,
        title: ticketTitle,
        service: ticketService,
        priority: ticketPriority,
        describe: ticketDescribe,
        status: status,
        createdAt: new Date().toLocaleString(),
      };

      const updatedTickets = [newTicket, ...tickets];
      saveTickets(updatedTickets);

      setGeneratedTicketId(ticket_id);
      setBackendStatus(status);
      setBackendMessage(message || `Expected resolution: ${expectedResolution}`);
      setIsSuccessModalOpen(true);
      
      // Reset form fields
      setTicketTitle("");
      setTicketDescribe("");
      
      // Refresh tickets list from backend to get precise timestamps
      fetchTickets();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || error.response?.data?.detail?.message || "Failed to submit ticket to support center");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy support email
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("support@5pointcredit.com");
    setEmailCopied(true);
    toast.success("Support email copied to clipboard!");
    setTimeout(() => setEmailCopied(false), 2000);
  };

  // Copy Ticket ID to Clipboard
  const copyToClipboard = () => {
    if (generatedTicketId) {
      navigator.clipboard.writeText(generatedTicketId);
      setCopied(true);
      toast.success("Ticket ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Clear all tickets from local history
  const clearTicketHistory = () => {
    saveTickets([]);
    toast.success("Ticket history cleared");
  };

  return (
    <div className="p-8 relative min-h-[calc(100vh-4rem)] text-gray-800 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl" />

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-[#000080] tracking-tight">
            Help & Support Center
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base max-w-2xl">
            Get prompt assistance with your reports, verify status, or raise custom support tickets directly with our agents.
          </p>
        </div>
        {activeTab !== "home" && (
          <Button
            onClick={() => setActiveTab("home")}
            variant="outline"
            className="flex items-center gap-2 border-[#000080]/30 text-[#000080] hover:bg-[#000080]/5 hover:text-[#000080] transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back 
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: HOME PAGE CHOICES */}
        {activeTab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* Top Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Option A: Email Support (Static Info Card) */}
              <Card className="relative border border-slate-200 bg-white/75 backdrop-blur-md overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-600 to-[#000080]" />
                <CardHeader className="flex flex-row items-center gap-5 pb-2">
                  <div className="p-4 rounded-2xl bg-blue-50 text-[#000080] shadow-inner">
                    <Mail className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800">Email Support</CardTitle>
                    <CardDescription className="text-slate-400 mt-0.5">Reach out to us via email</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-4 space-y-4">
                  {/* <p className="text-sm text-slate-600 leading-relaxed">
                    Have general queries or custom requirements? Shoot an email directly to our support inbox. We will respond within 24 business hours.
                  </p> */}
                  <div className="pt-2 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <span className="font-mono text-base font-bold text-[#000080] tracking-wide select-all">
                      r1@xchange.com
                    </span>
                    <Button
                      onClick={copyEmailToClipboard}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                      title="Copy Email"
                    >
                      {emailCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Option B: Raise a Ticket (Interactive Card) */}
              <Card
                onClick={() => setActiveTab("ticket")}
                className="group relative cursor-pointer border border-slate-200 bg-white/75 backdrop-blur-md overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 rounded-2xl"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-teal-600" />
                <CardHeader className="flex flex-row items-center gap-5 pb-2">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-inner">
                    <FileQuestion className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800 transition-colors group-hover:text-emerald-700">
                      Raise a Ticket
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-0.5">Create a tracking ticket in our system</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Submit a support ticket explaining the exact issue. Generates an instant reference ticket number to easily track query updates and status online.
                  </p>
                  <div className="mt-6 flex items-center text-sm font-bold text-emerald-600 group-hover:translate-x-1.5 transition-transform duration-300">
                    Open Ticket Creator <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Support Tickets History section */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#000080]/5 text-[#000080]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Support Ticket History</h2>
                </div>
                {tickets.length > 0 && (
                  <Button
                    onClick={clearTicketHistory}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50/50 flex items-center gap-1.5 font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear History
                  </Button>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm">
                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4 text-slate-400">
                    <HelpCircle className="h-10 w-10" />
                  </div>
                  <p className="text-slate-600 font-semibold text-lg">No active support tickets</p>
                  <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Tickets you submit to our agents will appear here with active status updates.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ticket ID</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Title</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Service</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Priority</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Created At</th>
                          <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tickets.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-mono text-sm text-[#000080] font-semibold">{t.id}</td>
                            <td className="p-4">
                              <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                              <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{t.describe}</p>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                                <Tag className="w-3.5 h-3.5 text-slate-400" />
                                {t.service}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-bold border
                                ${t.priority === "Urgent" ? "bg-red-50 text-red-700 border-red-100" : ""}
                                ${t.priority === "High" ? "bg-orange-50 text-orange-700 border-orange-100" : ""}
                                ${t.priority === "Medium" ? "bg-blue-50 text-blue-700 border-blue-100" : ""}
                                ${t.priority === "Low" ? "bg-slate-50 text-slate-600 border-slate-200" : ""}
                              `}>
                                {t.priority}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-slate-500">{t.createdAt}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 max-w-[200px] truncate" title={t.status}>
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: RAISE A TICKET FORM */}
        {activeTab === "ticket" && (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="shadow-2xl border border-slate-200/80 overflow-hidden rounded-2xl bg-white/95 backdrop-blur-md">
              <div className="bg-gradient-to-r from-[#000080] to-indigo-900 text-white p-6 relative">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-xl">
                    <FileQuestion className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">Raise a Support Ticket</CardTitle>
                    <p className="text-white/70 text-xs mt-1">
                      Our support agents will analyze your details and get back to you promptly.
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handleTicketSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Service Segment <span className="text-red-500">*</span></Label>
                      <Select value={ticketService} onValueChange={setTicketService}>
                        <SelectTrigger className="w-full bg-slate-50/50 hover:bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BSA Reports">BSA Reports & Statement Uploads</SelectItem>
                          <SelectItem value="GSTR Analysis">GST Analysis & Data Fetching</SelectItem>
                          <SelectItem value="ITR Tax">ITR Tax & Financial Sheets</SelectItem>
                          <SelectItem value="KYC Verification">KYC & Sign Up Process</SelectItem>
                          <SelectItem value="CIBIL Score">CIBIL Score Verification</SelectItem>
                          <SelectItem value="General/Account">General/Billing/Account</SelectItem>
                          <SelectItem value="Other">Other general inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-700 font-semibold text-sm">Priority Level <span className="text-red-500">*</span></Label>
                      <Select value={ticketPriority} onValueChange={setTicketPriority}>
                        <SelectTrigger className="w-full bg-slate-50/50 hover:bg-slate-50 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low - General inquiry</SelectItem>
                          <SelectItem value="Medium">Medium - Standard issue</SelectItem>
                          <SelectItem value="High">High - Blocking a feature</SelectItem>
                          <SelectItem value="Urgent">Urgent - Business operations blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-title" className="text-slate-700 font-semibold text-sm">Issue Title <span className="text-red-500">*</span></Label>
                    <Input
                      id="ticket-title"
                      placeholder="Briefly state your query or problem"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      className="bg-slate-50/50 hover:bg-slate-50 border-slate-200 focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080] transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-describe" className="text-slate-700 font-semibold text-sm">Detailed Description <span className="text-red-500">*</span></Label>
                    <textarea
                      id="ticket-describe"
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080] text-slate-800 text-sm placeholder:text-slate-400 transition-all duration-200"
                      placeholder="Please details what error message or mismatch you found. Provide reference codes if possible to expedite resolution."
                      value={ticketDescribe}
                      onChange={(e) => setTicketDescribe(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("home")}
                      className="flex-1 border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#000080] hover:bg-[#000060] text-white flex items-center justify-center gap-2 shadow-md transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting Ticket...
                        </>
                      ) : (
                        <>
                          Submit Support Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* SUCCESS MODAL FOR GENERATED TICKET */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
              
              {/* Green checkmark animation */}
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 text-emerald-500 shadow-inner">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>

              <h3 className="text-2xl font-bold text-[#000080] mb-2">{backendStatus}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                {backendMessage}
              </p>

              {/* Prominent Ticket ID badge */}
              <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mb-6 flex flex-col items-center justify-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your Ticket Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-slate-800 tracking-wide select-all">
                    {generatedTicketId}
                  </span>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-slate-800"
                    title="Copy Ticket ID"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setActiveTab("home");
                  }}
                  className="w-full bg-[#000080] hover:bg-[#000060] text-white py-2 rounded-xl transition-all"
                >
                  View Ticket History
                </Button>
                <p className="text-xs text-slate-400">
                  Please save this reference ID for tracking and communication.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
