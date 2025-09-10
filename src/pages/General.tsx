import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import TariffBlockWiseConsumption from "../mainTopics/general/TariffBlockWiseConsumption";
import SubtopicCard from "../components/shared/SubtopicCard";


type Subtopic = {
  id: number;
  name: string;
};

const General = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get General topic's subtopics directly from sidebarData
    const generalTopic = sidebarData.find((topic) => topic.name === "General");
    if (generalTopic) {
      setSubtopics(generalTopic.subtopics);
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
      case "Bill calculation":
     
      case "Amex customers":
      case "Listing of customers":
      case "List of government accounts":
      case "Largest 100 customer details":
      case "Customer's historical data":
      case "Revision of bills":
      case "Sequence change accounts":
      case "Retails Journal":
      case "Arrears position – meter reader wise":
      case "List of customers (enlisted in Master Invoices)":
      case "Disconnection list":
      case "Shakthi LED distribution summary":
      case "Active customers and sales by tariff":
      case "Standing order report":
      case "Illicit tapping of electricity":
      case "Registered consumers for SMS alerts":
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

export default General;
