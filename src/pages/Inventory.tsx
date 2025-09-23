import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import MaterialMaster from "../mainTopics/inventory/MaterialMaster";
import SubtopicCard from "../components/shared/SubtopicCard";
import AverageConsumptions from "../mainTopics/inventory/AverageConsumptions";
import CostCenterQuantityHnad from "../mainTopics/inventory/CostCenterQuantityHnad";
type Subtopic = {
  id: number;
  name: string;
};

const Inventory = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Inventory topic's subtopics directly from sidebarData
    const inventoryTopic = sidebarData.find(
      (topic) => topic.name === "Inventory"
    );
    if (inventoryTopic) {
      setSubtopics(inventoryTopic.subtopics);
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
      case "Material Details":
        return <MaterialMaster />;
        case "Cost Center wise Quantity on Hand":
          return <CostCenterQuantityHnad />;

        case "Average Consumptions":
        return <AverageConsumptions />;

        
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

export default Inventory;
