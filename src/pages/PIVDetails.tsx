import {useState, useEffect} from "react";
import {data as sidebarData} from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import ProvincePIV from "../mainTopics/PIV/ProvincePIV";
import ProvincePIVProvincial from "../mainTopics/PIV/ProvincePIVProvincial";
import ProvincePIVAll from "../mainTopics/PIV/ProvincePIVAll";
import ProvincePivOtherCC from "../mainTopics/PIV/ProvincePivOtherCC";
import OtherCCtoProvince from "../mainTopics/PIV/OtherCCtoProvince";
import BranchWisePivBoth from "../mainTopics/PIV/BranchWisePivBoth";
import PIVCollectionsByPeoplesBank from "../mainTopics/PIV/PIVCollectionsByPeoplesBank";
import PivBySLT from "../mainTopics/PIV/PIVCollectionsBySLT";
import PivByBanks from "../mainTopics/PIV/PivByBanks";
import PIVDetailsReport from "../mainTopics/PIV/PIVDetailsReport";
import ProvinceWisePIVStampDuty from "../mainTopics/PIV/ProvinceWisePIVStampDuty";


type Subtopic = {
	id: number;
	name: string;
};

const PIVDetails = () => {
	const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
	const [expandedCard, setExpandedCard] = useState<number | null>(null);

	useEffect(() => {
		const analysisTopic = sidebarData.find((topic) => topic.name === "PIV");
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
			case "1. Branch/Province wise PIV Collections Paid to Bank":
				return <ProvincePIV />;
			case "2. Branch/Province wise PIV Collections by Provincial POS relevant to the Province":
				return <ProvincePIVProvincial />;
			case "3. Branch/Province wise PIV Collections Paid to Provincial POS":
				return <ProvincePIVAll />;
			case "4. PIV Collections by Provincial POS relevant to Other Cost Centers":
				return <ProvincePivOtherCC />;
			case "5. PIV Collections by Other Cost Centers relevant to the Province":
				return <OtherCCtoProvince />;
			case "6. Branch wise PIV Tabulation ( Both Bank and POS)":
				return <BranchWisePivBoth />;
			case "7. PIV Collections by Banks":
				return <PivByBanks />;
			case "7.1 PIV Collections by Peoples Banks":
				return <PIVCollectionsByPeoplesBank />;
			case "7.2 PIV Collections by IPG  (SLT) ":
				return <PivBySLT />;
			case "8. PIV Details Report (PIV Amount not tallied with Paid Amount)":
				return <PIVDetailsReport />;
			case "9. Province wise PIV Stamp Duty":
				return <ProvinceWisePIVStampDuty />;

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

export default PIVDetails;
