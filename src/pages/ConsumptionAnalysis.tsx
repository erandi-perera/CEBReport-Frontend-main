import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import TariffBlockWiseConsumption from "../mainTopics/general/TariffBlockWiseConsumption";

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
      (topic) => topic.name === "Consumption Analysis"
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
      case "Tariff Block Wise Consumption Report":
        return <TariffBlockWiseConsumption />;
      case "Tariff and Block wise Consumption Analysis":
      case "Transformer wise Consumption Analysis":
      case "Business Category wise Consumption Analysis":
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
