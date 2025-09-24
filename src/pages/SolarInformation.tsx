import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";

import SolarProgressClarificationBulk from "../mainTopics/SolarInformation/SolarProgressClarificationBulk";
import SolarProgressClarificationOrdinary from "../mainTopics/SolarInformation/SolarConnectionDetailsBulk";

import SolarForm from "../mainTopics/Solar/SolarForm";
import SolarPVBilling from "../mainTopics/SolarInformation/SolarPVBilling"


type Subtopic = {
  id: number;
  name: string;
};

const SolarInformation = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Solar Information topic's subtopics directly from sidebarData
    const solarTopic = sidebarData.find(
      (topic) => topic.name === "Solar Information"
    );
    if (solarTopic) {
      setSubtopics(solarTopic.subtopics);
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
      case "Solar PV billing information":
        return <SolarPVBilling/>;
      case "Solar PV capacity information":
      case "Solar progress clarification (ordinary)":
      case "Solar payment information – retail":
        return <SolarForm />;
      case "Solar payment information – Bulk":
      case "Solar connection details (incl. Reading and usage) - retail":
      case "Solar connection details (incl. Reading and usage) - bulk":
        return <SolarProgressClarificationOrdinary />;
      case "Solar progress clarification – Bulk":
        return <SolarProgressClarificationBulk />;
      case "Solar customer information":

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
export default SolarInformation;