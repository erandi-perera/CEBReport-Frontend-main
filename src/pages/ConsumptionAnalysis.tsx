import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";

type Subtopic = {
  id: number;
  name: string;
};

const ConsumptionAnalysis = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Consumption analysis topic's subtopics directly from sidebarData
    const consumptionTopic = sidebarData.find(
      (topic) => topic.name === "Consumption analysis"
    );
    if (consumptionTopic) {
      setSubtopics(consumptionTopic.subtopics);
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
      case "Consumer consumption analysis":
      case "Tariff category wise consumption analysis":
      case "Business category wise consumption analysis":
      case "Transformer wise consumption analysis":
      case "Consumption pattern analysis":
      case "Assessed meter reading details":
      case "Zero consumption details":
        return <div>{subtopicName} Content</div>;
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

export default ConsumptionAnalysis;
