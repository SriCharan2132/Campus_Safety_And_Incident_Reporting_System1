import IncidentGrid from "../../components/IncidentGrid";

function AdminIncidentsPage() {

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">
        Manage Incidents
      </h1>

      <IncidentGrid role="admin" />

    </div>
  );

}

export default AdminIncidentsPage;