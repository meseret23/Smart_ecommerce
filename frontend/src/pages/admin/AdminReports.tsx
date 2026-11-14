
import { useEffect, useState } from 'react';
import api from '../../services/api';

interface DamageReport {
  id: number;
  user_id: number;
  order_id: number;
  product_id: number;
  product_name: string | null;
  customer_name: string;
  customer_email: string;
  description: string;
  status: string;
  image_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at?: string;
}

const statuses = ['pending', 'in_review', 'resolved', 'rejected'];

const AdminReports = () => {
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { status: string; admin_notes: string }>
  >({});

  const fetchReports = async () => {
    try {
      setError('');
      const response = await api.get('/reports/admin');
      const data: DamageReport[] = response.data.reports || [];

      setReports(data);

      const initialDrafts: Record<
        number,
        { status: string; admin_notes: string }
      > = {};

      data.forEach((report) => {
        initialDrafts[report.id] = {
          status: report.status,
          admin_notes: report.admin_notes || '',
        };
      });

      setDrafts(initialDrafts);
    } catch (err: any) {
      console.error('Error loading admin reports:', err);
      setError(
        err.response?.data?.message ||
          'Unable to load reports. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
  }, []);

  const updateDraft = (
    reportId: number,
    field: 'status' | 'admin_notes',
    value: string
  ) => {
    setDrafts((previous) => ({
      ...previous,
      [reportId]: {
        ...previous[reportId],
        [field]: value,
      },
    }));
  };

  const handleUpdate = async (reportId: number) => {
    const draft = drafts[reportId];
    if (!draft) return;

    try {
      setUpdatingId(reportId);
      setError('');

      await api.patch(`/reports/${reportId}/status`, {
        status: draft.status,
        admin_notes: draft.admin_notes,
      });

      await fetchReports();
    } catch (err: any) {
      console.error('Error updating report:', err);
      setError(
        err.response?.data?.message ||
          'Unable to update this report. Please try again.'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const statusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'in_review':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        Loading damage reports...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Damage Reports
          </h1>
          <p className="mt-2 text-gray-500">
            Review customer complaints and manage their status.
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            void fetchReports();
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total reports</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reports.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Awaiting review</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {reports.filter((report) =>
              ['pending', 'in_review'].includes(report.status.toLowerCase())
            ).length}
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">
            No damage reports yet
          </h2>
          <p className="mt-2 text-gray-500">
            Customer reports will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const draft = drafts[report.id];

            return (
              <article
                key={report.id}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {report.product_name || `Product #${report.product_id}`}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Report #{report.id} · Order #{report.order_id}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Submitted {formatDate(report.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle(report.status)}`}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Customer
                    </h3>
                    <p className="mt-2 text-sm text-gray-700">
                      {report.customer_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.customer_email}
                    </p>

                    <h3 className="mt-5 text-sm font-semibold text-gray-800">
                      Description
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {report.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-800">
                      Customer photo
                    </h3>

                    {report.image_url ? (
                      <a
                        href={
                          report.image_url.startsWith('http')
                            ? report.image_url
                            : `http://localhost:5000${report.image_url}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={
                            report.image_url.startsWith('http')
                              ? report.image_url
                              : `http://localhost:5000${report.image_url}`
                          }
                          alt="Customer's damaged product"
                          className="h-52 w-full max-w-sm rounded-xl border border-gray-200 object-contain"
                        />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">
                        No photo attached.
                      </p>
                    )}
                  </div>
                </div>

                {draft && (
                  <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
                    <div>
                      <label
                        htmlFor={`status-${report.id}`}
                        className="mb-2 block text-sm font-semibold text-gray-800"
                      >
                        Update status
                      </label>

                      <select
                        id={`status-${report.id}`}
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(report.id, 'status', event.target.value)
                        }
                        className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`notes-${report.id}`}
                        className="mb-2 block text-sm font-semibold text-gray-800"
                      >
                        Response to customer
                      </label>

                      <textarea
                        id={`notes-${report.id}`}
                        value={draft.admin_notes}
                        onChange={(event) =>
                          updateDraft(
                            report.id,
                            'admin_notes',
                            event.target.value
                          )
                        }
                        rows={3}
                        maxLength={2000}
                        placeholder="Write an update for the customer..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => void handleUpdate(report.id)}
                      disabled={updatingId === report.id}
                      className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingId === report.id
                        ? 'Saving...'
                        : 'Save changes'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
