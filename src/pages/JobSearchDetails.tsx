import {useState, useEffect} from "react";
import {data as sidebarData} from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import Sample from "../mainTopics/Job Search/JobSearchPage";

type Subtopic = {
	id: number;
	name: string;
};

const JobSearchDetails = () => {
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	useEffect(() => {
		const analysisTopic = sidebarData.find(
			(topic) => topic.name === "Job Search",
		);

		if (analysisTopic) {
			setSubtopics(analysisTopic.subtopics);

			// Automatically expand the first subtopic if there are any
			if (analysisTopic.subtopics.length > 0) {
				setExpandedCard(analysisTopic.subtopics[0].id);
			}
		}
	}, []);

	const toggleCard = (id: number) => {
		setExpandedCard((prev) => (prev === id ? null : id));
	};

	const renderSubtopicContent = (subtopicName: string) => {
		switch (subtopicName) {
			case "Job Search":
				return <Sample />;

			default:
				return (
					<div className="text-red-500 text-xs">
						No content available for "{subtopicName}"
					</div>
				);
		}
	};

	return (
		<div className=" w-full flex flex-col gap-4 pt-2">
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

export default JobSearchDetails;
