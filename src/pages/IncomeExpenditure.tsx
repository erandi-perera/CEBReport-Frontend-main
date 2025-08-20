import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import CostCenterIncomeExpenditure from "../mainTopics/IncomeExpenditure/CostCenterIncomeExpenditure";
import ProvinceExpenditure from "../mainTopics/IncomeExpenditure/ProvinceExpenditure";
import RegionExpenditure from "../mainTopics/IncomeExpenditure/RegionExpenditure";

type Subtopic = {
  id: number;
  name: string;
};

const IncomeExpenditure = () => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    // Get Income Expenditure topic's subtopics directly from sidebarData
    const topic = sidebarData.find(
      (topic) => topic.name === "Income Expenditure"
    );
    if (topic) {
      setSubtopics(topic.subtopics);
    }
  }, []);

  const toggleCard = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const renderSubtopicContent = (subtopicName: string) => {
    switch (subtopicName) {
      case "Cost Center Wise Income Expenditure":
        return <CostCenterIncomeExpenditure />;
         case "Province Wise Income Expenditure":
        return <ProvinceExpenditure />;
         case "Region Wise Income Expenditure":
        return <RegionExpenditure />;
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

export default IncomeExpenditure;
