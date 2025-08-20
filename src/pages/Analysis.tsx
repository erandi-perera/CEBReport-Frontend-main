import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import DebtorsAnalysis from "../mainTopics/Analysis/DebtorsAnalysis";
import AgeAnalysis from "../mainTopics/Analysis/AgeAnalysis";
import UnitAnalysis from "../mainTopics/Analysis/UnitAnalysis";


type Subtopic = {
  id: number;
  name: string;
};

const Analysis = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Analysis topic's subtopics directly from sidebarData
    const analysisTopic = sidebarData.find(
      (topic) => topic.name === "Analysis"
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
     
      case "Total Debtors Analysis":
     
        return <DebtorsAnalysis/>;
        case "Debtors Age Analysis (Individual Customers)":
        return <AgeAnalysis/>;
        
         case "unit analysis":
        return <UnitAnalysis/>;
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

export default Analysis;
