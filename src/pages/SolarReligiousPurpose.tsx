import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import { Outlet } from "react-router-dom";
import SubtopicCard from "../components/shared/SubtopicCard";

import AreaWiseSRPApplicationPIV from "../mainTopics/SRP/AreaWiseSRPApplicationPIV";

type Subtopic = {
  id: number;
  name: string;
};

const SolarReligiousPurpose = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    const srpTopic = sidebarData.find(
      (topic) => topic.name === "Solar Religious Purpose (SRP)"
    );
    if (srpTopic) {
      setSubtopics(srpTopic.subtopics);
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
      case "Area Wise SRP Application PIV (PIVI) To be Paid Report":
        return <AreaWiseSRPApplicationPIV />;
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
      <Outlet />
    </div>
  );
};

export default SolarReligiousPurpose;
