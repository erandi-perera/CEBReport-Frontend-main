import { MdPayment } from "react-icons/md";
import { RiBankLine } from "react-icons/ri";
import { FaBoxes } from "react-icons/fa";
import { BsFolder2Open } from "react-icons/bs";
import { MdAssignmentTurnedIn } from "react-icons/md";
import { GiSolarPower } from "react-icons/gi";
import { FaBalanceScale } from "react-icons/fa";

export const data = [
  {
    id: 1,
    name: "General",
    icon: MdPayment,
    subtopics: [
      { id: 18, name: "Sales data for tariff" },
      { id: 1, name: "Bill calculation" },
      { id: 2, name: "Amex customers" },
      { id: 3, name: "Listing of customers" },
      { id: 4, name: "List of government accounts" },
      { id: 5, name: "Largest 100 customer details" },
      { id: 6, name: "Customer's historical data" },
      { id: 7, name: "Revision of bills" },
      { id: 8, name: "Sequence change accounts" },
      { id: 9, name: "Retails Journal" },
      { id: 10, name: "Arrears position – meter reader wise" },
      { id: 11, name: "List of customers (enlisted in Master Invoices)" },
      { id: 12, name: "Disconnection list" },
      { id: 13, name: "Shakthi LED distribution summary" },
      { id: 14, name: "Active customers and sales by tariff" },
      { id: 15, name: "Standing order report" },
      { id: 16, name: "Illicit tapping of electricity" },
      { id: 17, name: "Registered consumers for SMS alerts" },
    ],
    path: "/report/general",
  },
  {
    id: 2,
    name: "Billing & Payment",
    icon: RiBankLine,
    subtopics: [
      { id: 19, name: "Customer Information" },
      // { id: 20, name: "Printed bill information" },
      // { id: 21, name: "Payment inquiries" },
      // { id: 22, name: "Customer balance with latest transactions" },
    ],
    path: "/report/billing-payment",
  },
  {
    id: 3,
    name: "Analysis",
    icon: FaBoxes,
    subtopics: [
       { id: 27, name: "Total debtors analysis" },
      { id: 23, name: "Age analysis" },
      { id: 24, name: "Transaction analysis" },
      { id: 25, name: "Transaction analysis (incl. Prov. Data)" },
      { id: 26, name: "Age analysis for solar customer" },
     
      { id: 28, name: "Debtors age analysis (individual customers)" },
      { id: 29, name: "Financial analysis" },
      { id: 30, name: "Assessed unit analysis" },
    ],
    path: "/report/analysis",
  },
  {
    id: 4,
    name: "Collections",
    icon: BsFolder2Open,
    subtopics: [
      { id: 31, name: "Online counter collections" },
      { id: 32, name: "Sales and collection" },
      { id: 33, name: "Stamp duty for payment collections" },
      { id: 34, name: "Monthly revenue collection of different channels" },
      { id: 35, name: "Kiosk payment collection" },
      { id: 36, name: "Payment collection" },
      { id: 37, name: "Suspense payment details" },
      { id: 38, name: "Finalized account details" },
      { id: 39, name: "Written off account details" },
      { id: 40, name: "Receivable position" },
      { id: 41, name: "Unload loan information" },
      { id: 42, name: "Dishonoured cheques" },
    ],
    path: "/report/collections",
  },
  {
    id: 5,
    name: "Consumption Analysis",
    icon: MdAssignmentTurnedIn,
    subtopics: [
      { id: 43, name: "Consumer consumption analysis" },
      { id: 44, name: "Tariff category wise consumption analysis" },
      { id: 45, name: "Business category wise consumption analysis" },
      { id: 46, name: "Transformer wise consumption analysis" },
      { id: 47, name: "Consumption pattern analysis" },
      { id: 48, name: "Assessed meter reading details" },
      { id: 49, name: "Zero consumption details" },
    ],
    path: "/report/consumption-analysis",
  },
  {
    id: 6,
    name: "Solar Information",
    icon: GiSolarPower,
    subtopics: [
      { id: 50, name: "Solar PV billing information" },
      { id: 51, name: "Solar PV capacity information" },
      { id: 52, name: "Solar progress clarification (ordinary)" },
      { id: 53, name: "Solar payment information – retail" },
      { id: 54, name: "Solar payment information – Bulk" },
      {
        id: 55,
        name: "Solar connection details (incl. Reading and usage) - retail",
      },
      {
        id: 56,
        name: "Solar connection details (incl. Reading and usage) - bulk",
      },
      { id: 57, name: "Solar progress clarification – Bulk" },
      { id: 58, name: "Solar customer information" },
    ],
    path: "/report/solar-information",
  },
  {
    id: 7,
    name: "PUCSL/LISS",
    icon: GiSolarPower,
    subtopics: [
      { id: 59, name: "LISS submission – retail journal adjustments" },
      { id: 60, name: "PUCSL Reports (LISS Data)" },
      { id: 61, name: "PUCSL Reports – solar connections (New)" },
      { id: 62, name: "Solar data for UNT calculation" },
    ],
    path: "/report/pucsl-liss",
  },
  {
    id: 8,
    name: "Inventory",
    icon: FaBoxes,
    subtopics: [{ id: 59, name: "All Material Details" }],
    path: "/report/inventory",
  },
  {
    id: 9,
    name: "Trial Balance",
    icon: FaBalanceScale,
    subtopics: [{ id: 60, name: "Cost Center Wise Trial Balances" }],
    path: "/report/trialBalance",
  },
];
