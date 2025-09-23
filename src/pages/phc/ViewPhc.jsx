import { useState, useEffect } from "react";
import { CircularProgress, Chip } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";

export default function ViewPhc() {
  const { phcId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [phc, setPhc] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const fetchPhc = async () => {
      try {
        const res = await api.get(`/phcs/show/${phcId}`);
        if (res.data) {
          const { phc, project } = res.data;
          setProject(project);
          setPhc(phc);
        }

        // Fetch document preparations untuk step 3
        const resDocs = await api.get(`/phcs/${phcId}/document-preparations`);
        if (resDocs.data) {
          setDocuments(
            (resDocs.data.documents ?? []).map((doc) => {
              const prep = doc.preparations?.[0];
              let datePrepared = "";
              if (prep?.date_prepared) {
                datePrepared = prep.date_prepared.split(" ")[0];
              }
              return {
                id: doc.id,
                name: doc.name,
                status: prep ? (prep.is_applicable ? "A" : "NA") : "NA",
                date_prepared: datePrepared,
              };
            })
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPhc();
  }, [phcId]);

  const formatDate = (val) => {
    if (!val) return "-";
    const date = new Date(val);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
        📄 View Project Handover Checklist
      </h2>

      {/* Step Indicator */}
      <div className="mb-6 text-center text-gray-600 font-medium text-sm md:text-base">
        {step === 1 && "🔹 Step 1 of 3: General Information"}
        {step === 2 && "📋 Step 2 of 3: Handover Checklist"}
        {step === 3 && "📄 Step 3 of 3: Document Preparation"}
      </div>

      {/* Step Tabs */}
      <div className="flex flex-col md:flex-row justify-center mb-6 gap-3">
        {[
          { num: 1, label: "Information" },
          { num: 2, label: "Checklist" },
          { num: 3, label: "Documents" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`px-4 py-2 rounded-md w-full md:w-40 text-sm font-medium ${
              step === s.num
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.num}️⃣ {s.label}
          </button>
        ))}
      </div>

      {/* ---------------- STEP 1 ---------------- */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Project" value={project?.project_name} />
            <InfoItem label="PN Number" value={project?.project_number} />
            <InfoItem
              label="Quotation Number"
              value={project?.quotation?.no_quotation}
            />
            <InfoItem
              label="Quotation Date"
              value={formatDate(project?.quotation?.quotation_date)}
            />
            <InfoItem
              label="Handover Date"
              value={formatDate(phc?.handover_date)}
            />
            <InfoItem label="Start Date" value={formatDate(phc?.start_date)} />
            <InfoItem
              label="Target Finish Date"
              value={formatDate(phc?.target_finish_date)}
            />
            <InfoItem label="Client PIC Name" value={phc?.client_pic_name} />
            <InfoItem label="Client Mobile" value={phc?.client_mobile} />
            <InfoItem
              label="Client Office Address"
              value={phc?.client_reps_office_address}
            />
            <InfoItem
              label="Client Site Address"
              value={phc?.client_site_address}
            />
            <InfoItem
              label="Client Representative"
              value={phc?.client_site_representatives}
            />
            <InfoItem
              label="Site Phone Number"
              value={phc?.site_phone_number}
            />
            <InfoItem label="HO Marketing" value={phc?.ho_marketing?.name} />
            <InfoItem label="PIC Marketing" value={phc?.pic_marketing?.name} />
            <InfoItem
              label="HO Engineering"
              value={phc?.ho_engineering?.name}
            />
            <InfoItem
              label="PIC Engineering"
              value={phc?.pic_engineering?.name}
            />
            <InfoItem label="Notes" value={phc?.notes} full />
          </div>
        </div>
      )}

      {/* ---------------- STEP 2 ---------------- */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            📋 Handover Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: "costing_by_marketing", label: "Costing by Marketing" },
              { key: "boq", label: "Bill of Quantity (BOQ)" },
              { key: "retention", label: "Retention" },
              { key: "warranty", label: "Warranty" },
              { key: "penalty", label: "Penalty" },
            ].map(({ key, label }) => {
              const value =
                phc?.[key] === "A" ? "Applicable" : "Not Applicable";
              const color =
                phc?.[key] === "A"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800";
              return (
                <div
                  key={key}
                  className="p-4 border rounded-md bg-gray-50 space-y-2"
                >
                  <p className="font-medium text-sm text-gray-700">{label}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}
                  >
                    {value}
                  </span>
                  {phc?.[`${key}_detail`] && (
                    <p className="text-sm text-gray-600 mt-2">
                      Detail: {phc[`${key}_detail`]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- STEP 3 ---------------- */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            📄 Document Preparation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border rounded-md shadow-sm bg-white space-y-2"
              >
                <p className="font-medium text-gray-700">{doc.name}</p>
                <Chip
                  label={doc.status === "A" ? "Applicable" : "Not Applicable"}
                  color={doc.status === "A" ? "success" : "error"}
                  size="small"
                />
                {doc.status === "A" && (
                  <p className="text-sm text-gray-600">
                    Date Prepared: {formatDate(doc.date_prepared)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Button */}
      <div className="flex justify-end mt-10">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back
        </button>
      </div>
    </div>
  );
}

/* Small reusable component for info display */
function InfoItem({ label, value, full = false }) {
  return (
    <div className={`flex flex-col ${full ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="mt-1 text-gray-800 bg-gray-50 rounded-md p-2 text-sm">
        {value || "-"}
      </span>
    </div>
  );
}
