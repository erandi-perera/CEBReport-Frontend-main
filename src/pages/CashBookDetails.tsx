import {useState, useEffect} from "react";
import {data as sidebarData} from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import CashBookDetailsReport from "../mainTopics/CashBook/CashBookDetailsReport";
import CashBookCCReport from "../mainTopics/CashBook/CashBookCCReport";
import DocumentInquiry from "../mainTopics/CashBook/DocumentInquiry";

type Subtopic = {
	id: number;
	name: string;
};

const CashBookDetails = () => {
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	useEffect(() => {
		const cashBookTopic = sidebarData.find(
			(topic) => topic.name === "Cash Book"
		);
		if (cashBookTopic) {
			setSubtopics(cashBookTopic.subtopics);
		}
	}, []);

	const toggleCard = (id: number) => {
		setExpandedCard((prev) => (prev === id ? null : id));
	};

	const renderSubtopicContent = (subtopicName: string) => {
		switch (subtopicName) {
			case "Cheque Details":
				return <CashBookDetailsReport />;
			case "Cost Center Wise Cheque Details":
				return <CashBookCCReport />;
			case "Cost Center Wise Document Inquiry Cash Book With Cheque Details":
				return <DocumentInquiry />;
			default:
				return (
					<div className="text-red-500 text-xs">
						No content available for {subtopicName}
					</div>
				);
		}
	};

	return (
		<div className="flex flex-col gap-4 pt-4 px-10">
			{subtopics.map((subtopic) => (
				<SubtopicCard
					key={subtopic.id}
					id={subtopic.id}
					title={subtopic.name}
					expanded={expandedCard === subtopic.id}
					onToggle={toggleCard}
				>
					{renderSubtopicContent(subtopic.name)}
				</SubtopicCard>
			))}
		</div>
	);
};

export default CashBookDetails;
