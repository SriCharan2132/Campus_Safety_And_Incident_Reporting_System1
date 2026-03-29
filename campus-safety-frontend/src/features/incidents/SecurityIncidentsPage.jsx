import IncidentGrid from "../../components/IncidentGrid";

function SecurityIncidentsPage() {

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Assigned Incidents
      </h1>

      <IncidentGrid role="security" />
      
    </div>
  );
}

export default SecurityIncidentsPage;