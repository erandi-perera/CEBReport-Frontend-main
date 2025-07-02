import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";

type Subtopic = {
  id: number;
  name: string;
};

const Collections = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Collections topic's subtopics directly from sidebarData
    const collectionsTopic = sidebarData.find(
      (topic) => topic.name === "Collections"
    );
    if (collectionsTopic) {
      setSubtopics(collectionsTopic.subtopics);
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
      case "Online counter collections":
      case "Sales and collection":
      case "Stamp duty for payment collections":
      case "Monthly revenue collection of different channels":
      case "Kiosk payment collection":
      case "Payment collection":
      case "Suspense payment details":
      case "Finalized account details":
      case "Written off account details":
      case "Receivable position":
      case "Unload loan information":
      case "Dishonoured cheques":
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

export default Collections;
