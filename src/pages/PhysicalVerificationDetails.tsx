import { useState, useEffect } from "react";
import { data as sidebarData } from "../data/SideBarData";
import SubtopicCard from "../components/shared/SubtopicCard";
import PHVValidation from "../mainTopics/PhysicalVerification/PHVValidation";
import PHVEntryForm from "../mainTopics/PhysicalVerification/PHVEntryForm";
import PHVValidationWarehousewise from "../mainTopics/PhysicalVerification/PHVValidationWarehousewise";
import AnnualVerificationSheet from "../mainTopics/PhysicalVerification/AnnualVerificationSheet";





type Subtopic = {
    id: number;
    name: string;
};

const PhysicalVerificationDetails = () => {
    const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
    const [expandedCard, setExpandedCard] = useState<number | null>(null);

    useEffect(() => {
        const analysisTopic = sidebarData.find((topic) => topic.name === "Physical Verification");
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
            case "1.PHV Entry Form":
                return <PHVEntryForm />;

            case "2.1 PHV Validation":
                return <PHVValidation />;

            case "2.2 PHV Validation (Warehousewise)":
                return <PHVValidationWarehousewise/>;

            
            case "3.1 Annual Verification Sheet (Signature) - AV/1/A":
                return <AnnualVerificationSheet/>;
         

            default:
                return (
                    <div className="text-red-500 text-xs">
                        No content available for {subtopicName}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-4 pt-4 px-10">
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

export default PhysicalVerificationDetails;
