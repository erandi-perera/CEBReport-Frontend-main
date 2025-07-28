import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import CostCenterTrial from "../mainTopics/TrialBalance/CostCenterTrial";
import ProvintionalWiseTrial from "../mainTopics/TrialBalance/ProvintionalWiseTrial";
import ReagionTrial from "../mainTopics/TrialBalance/ReagionTrial";

type Subtopic = {
  id: number;
  name: string;
};

const TrialBalance = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get PUCSL/LISS topic's subtopics directly from sidebarData
    const pucslTopic = sidebarData.find(
      (topic) => topic.name === "Trial Balance"
    );
    if (pucslTopic) {
      setSubtopics(pucslTopic.subtopics);
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
      case "Cost Center Trial Balance - End of Month/Year":
        return <CostCenterTrial/>;

         case "Provintial Trial Balance - End of Month/Year":
        return <ProvintionalWiseTrial/>;
         case "Reagion Trial Balance - End of Month/Year":
        return <ReagionTrial/>;

      default:
        return (
          <div className="text-red-500 text-xs">
            No content available for {subtopicName}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 pt-5">
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

export default TrialBalance;
