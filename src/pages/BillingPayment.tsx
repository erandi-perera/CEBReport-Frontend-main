import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import CustomerDetails from "../mainTopics/billing&payment/CustomerDetails";
import { Outlet } from "react-router-dom";
import SubtopicCard from "../components/shared/SubtopicCard";

type Subtopic = {
  id: number;
  name: string;
};

const BillingPayment = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Billing & Payment topic's subtopics directly from sidebarData
    const billingTopic = sidebarData.find(
      (topic) => topic.name === "Billing & Payment"
    );
    if (billingTopic) {
      setSubtopics(billingTopic.subtopics);
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
      case "Customer Information":
        return <CustomerDetails />;
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

export default BillingPayment;
