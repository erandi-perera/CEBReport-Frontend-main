import {useState, useEffect} from "react";
import {data as sidebarData} from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import LedgerCardReport from "../mainTopics/LedgerCard/LedgerCardReport";
import LCWithoutSubAcc from "../mainTopics/LedgerCard/LCWithoutSubAcc";
import LedgerCardSubAccountTotal from "../mainTopics/LedgerCard/LedgerCardSubAccountTotal";

type Subtopic = {
	id: number;
	name: string;
};

const LedgerCardDetails = () => {
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	useEffect(() => {
		const analysisTopic = sidebarData.find(
			(topic) => topic.name === "Ledger Cards"
		);
		if (analysisTopic) {
			setSubtopics(analysisTopic.subtopics);
		}
	}, []);

	const toggleCard = (id: number) => {
		if (expandedCard === id) {
			setExpandedCard(null);
		} else {
			setExpandedCard(id);
		}
	};

	const renderSubtopicContent = (subtopicName: string) => {
		switch (subtopicName) {
			case "Ledger Card with Subaccounts":
				return <LedgerCardReport />;
			case "Ledger Card without Subaccounts":
				return <LCWithoutSubAcc />;
			case "Ledger Card  Subaccounts Total":
				return <LedgerCardSubAccountTotal />;

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

export default LedgerCardDetails;
