import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  Crown,
  FileText,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  date: string;
  planId: string;
  planName: string;
  amountRupees: number;
  userName: string;
  userEmail: string;
  affiliation?: string;
  status: "paid" | "completed";
  gateway?: string;
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

export function InvoiceModal({ open, onOpenChange, invoice }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoice.invoiceNumber);
    toast.success("Invoice number copied to clipboard!");
  };

  // Tax calculations (18% GST breakdown for academic project authenticity)
  const totalAmount = Number(invoice.amountRupees) || 499;
  const baseAmount = Number((totalAmount / 1.18).toFixed(2));
  const gstAmount = Number((totalAmount - baseAmount).toFixed(2));
  const cgst = Number((gstAmount / 2).toFixed(2));
  const sgst = Number((gstAmount / 2).toFixed(2));

  const formattedDate = new Date(invoice.date || Date.now()).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border border-border/80 shadow-2xl rounded-3xl print:border-none print:shadow-none print:p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Tax Invoice & Payment Receipt</DialogTitle>
          <DialogDescription>Official receipt for ScholarNexus Pro subscription</DialogDescription>
        </DialogHeader>

        {/* Action Header Bar (Hidden during printing) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-muted/40 border-b border-border/60 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="font-semibold text-xs text-foreground">Official Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={invoiceRef} className="p-6 sm:p-8 space-y-6 text-foreground print:p-0">
          {/* Header Brand & Invoice ID */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  SN
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight text-foreground flex items-center gap-1.5">
                    ScholarNexus <span className="text-primary font-medium text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">Academic Hub</span>
                  </h3>
                  <p className="text-[0.72rem] text-muted-foreground">Collaborative Research & Thesis Management Platform</p>
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" /> PAYMENT COMPLETED
              </div>
              <p className="text-xs font-mono font-bold text-muted-foreground flex sm:justify-end items-center gap-1">
                {invoice.invoiceNumber}
                <button
                  onClick={handleCopyInvoiceNumber}
                  className="p-1 hover:text-foreground text-muted-foreground transition-colors cursor-pointer print:hidden"
                  title="Copy Invoice Number"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </p>
              <p className="text-[0.7rem] text-muted-foreground">{formattedDate}</p>
            </div>
          </div>

          {/* Billed To & Payment Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/25 border border-border/60">
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[0.68rem] uppercase tracking-wider text-muted-foreground">Billed To</span>
              <p className="font-bold text-sm text-foreground">{invoice.userName || "Researcher"}</p>
              <p className="text-muted-foreground">{invoice.userEmail}</p>
              {invoice.affiliation && (
                <p className="text-[0.72rem] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Building2 className="h-3 w-3" /> {invoice.affiliation}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs sm:text-right">
              <span className="font-bold text-[0.68rem] uppercase tracking-wider text-muted-foreground">Payment Details</span>
              <p className="font-semibold text-foreground flex sm:justify-end items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 text-primary" /> Razorpay Test Payment Gateway
              </p>
              <p className="text-[0.72rem] font-mono text-muted-foreground">
                Payment ID: <span className="text-foreground">{invoice.paymentId}</span>
              </p>
              <p className="text-[0.72rem] font-mono text-muted-foreground">
                Order ID: <span className="text-foreground">{invoice.orderId}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-border/70 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-bold text-[0.7rem] uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Plan / Subscription Item</th>
                  <th className="p-3.5 text-center">Period</th>
                  <th className="p-3.5 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="p-3.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-500" /> {invoice.planName}
                    </div>
                    <div className="text-[0.72rem] text-muted-foreground mt-0.5">
                      Includes Unlimited Projects, AI Assist Section & AI Research Roadmap Generator.
                    </div>
                  </td>
                  <td className="p-3.5 text-center text-muted-foreground font-medium">
                    {invoice.planId === "monthly" ? "1 Month" : "1 Year (Annual)"}
                  </td>
                  <td className="p-3.5 text-right font-semibold text-foreground">
                    ₹{baseAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Total Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="space-y-1.5 text-xs text-muted-foreground max-w-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[0.75rem]">
                <ShieldCheck className="h-4 w-4" /> Authenticated Academic Project Transaction
              </div>
              <p className="text-[0.7rem] leading-relaxed">
                This receipt is system-generated and validates active Scholar Pro privileges for academic and thesis work.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs border border-border/60 rounded-xl p-3.5 bg-muted/20">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (Base)</span>
                <span>₹{baseAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST (9%)</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST (9%)</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border/70 flex justify-between font-black text-sm text-foreground">
                <span>Total Paid</span>
                <span className="text-primary text-base">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between text-[0.7rem] text-muted-foreground gap-2">
            <span>ScholarNexus Project • University Academic Research Environment</span>
            <span>Thank you for supporting research innovation! 🚀</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
