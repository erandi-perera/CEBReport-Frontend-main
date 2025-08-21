import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { FileText, TrendingUp, Building2, SunMedium, Layers } from "lucide-react";

const Home: React.FC = () => {
	const { user } = useUser();
	const maroon = "text-[#7A0000]";
	const maroonBg = "bg-[#7A0000]";

	const quickLinks = [
		{ to: "/report/IncomeExpenditure", title: "Income & Expenditure", desc: "View departmental income and expenditure", icon: FileText },
		{ to: "/report/trialBalance", title: "Trial Balance", desc: "Explore trial balance reports", icon: Layers },
		{ to: "/report/solar-information", title: "Solar Information", desc: "Access solar program info", icon: SunMedium },
		{ to: "/report/analysis", title: "Analysis", desc: "Debtors and consumption analysis", icon: TrendingUp },
		{ to: "/report/collections", title: "Collections", desc: "Collections dashboards", icon: Building2 },
	];

	return (
		<div className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h1 className={`text-2xl font-bold ${maroon}`}>Welcome{user?.Name ? `, ${user.Name}` : ""}</h1>
					{user?.Userno && (
						<p className="text-xs text-gray-600 mt-1">EPF: <span className="font-mono">{user.Userno}</span></p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="md:col-span-2">
					<div className="rounded-lg border border-gray-200 p-5 h-full">
						<h2 className={`text-lg font-semibold mb-2 ${maroon}`}>About this site</h2>
						<p className="text-sm text-gray-700 leading-relaxed">
							This portal provides quick access to CEB management reports. Use the links to navigate to key sections such as Income & Expenditure, Trial Balance, Collections, Analysis, and Solar information.
						</p>
						<ul className="mt-3 text-sm text-gray-600 list-disc pl-5 space-y-1">
							<li>Secure access using your EPF number credentials</li>
							<li>Role-based visibility of reports</li>
							<li>Export options for CSV and printing where available</li>
						</ul>
					</div>
				</div>

				<div className="rounded-lg border border-gray-200 p-5">
					<h2 className={`text-lg font-semibold mb-2 ${maroon}`}>Your info</h2>
					<div className="text-sm text-gray-700 space-y-1">
						<p><span className="text-gray-500">Name:</span> {user?.Name || "-"}</p>
						<p><span className="text-gray-500">EPF:</span> {user?.Userno || "-"}</p>
						<p><span className="text-gray-500">Designation:</span> {user?.Designation || "-"}</p>
						{user?.Email && <p><span className="text-gray-500">Email:</span> {user.Email}</p>}
					</div>
				</div>
			</div>

			<h2 className={`text-lg font-semibold mb-3 ${maroon}`}>Quick links</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{quickLinks.map(({ to, title, desc, icon: Icon }) => (
					<Link key={to} to={to} className={`group rounded-lg border border-gray-200 p-5 hover:shadow transition bg-white`}>
						<div className="flex items-center gap-3">
							<span className={`p-2 rounded ${maroonBg} text-white`}>
								<Icon className="w-4 h-4" />
							</span>
							<div>
								<div className="font-medium">{title}</div>
								<div className="text-xs text-gray-600">{desc}</div>
							</div>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
};

export default Home;


