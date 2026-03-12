import {useState} from "react";
import JobSearchTable from "./JobSearchTable";
import JobSearchDetails from "./JobSearchDetails";
import {JobSearchResult} from "./JobSearchDetails";

const JobSearchPage = () => {
	const [selectedRow, setSelectedRow] = useState<JobSearchResult | null>(null);

	return (
		<>
			<JobSearchTable onSelectRow={setSelectedRow} />
			<JobSearchDetails
				selectedRow={selectedRow}
				onClose={() => setSelectedRow(null)}
			/>
		</>
	);
};

export default JobSearchPage;
