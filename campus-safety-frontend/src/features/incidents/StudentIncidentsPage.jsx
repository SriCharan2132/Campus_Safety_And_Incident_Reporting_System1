import { useNavigate } from "react-router-dom";
import { PlusCircle, ShieldAlert } from "lucide-react";
import IncidentGrid from "../../components/IncidentGrid";

function StudentIncidentsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 px-6 py-6 text-white md:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  <ShieldAlert size={14} />
                  Student Incident Hub
                </div>
                <h1 className="text-2xl font-semibold md:text-3xl">
                  Track, review, and report incidents
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/90">
                  View your submitted incidents, monitor their current status, and
                  start a new report whenever needed.
                </p>
              </div>

              <button
                onClick={() => navigate("/student/incidents/report")}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-slate-50"
              >
                <PlusCircle size={18} />
                Report New Incident
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Tip</p>
              <p className="mt-2 text-sm text-slate-700">
                Use the filters to narrow incidents by status or priority.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Best practice</p>
              <p className="mt-2 text-sm text-slate-700">
                Add clear titles and evidence when reporting new incidents.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">Navigation</p>
              <p className="mt-2 text-sm text-slate-700">
                Click any incident card to open the full detail view.
              </p>
            </div>
          </div>
        </div>

        <IncidentGrid role="student" />
      </div>
    </div>
  );
}

export default StudentIncidentsPage;