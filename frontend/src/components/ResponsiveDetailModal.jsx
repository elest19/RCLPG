import Modal from "./Modal";

export default function ResponsiveDetailModal({ title, onClose, details = [], footer }) {
  return (
    <Modal title={title} onClose={onClose} size="lg">
      <dl className="space-y-2 text-sm">
        {details.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="text-sm font-semibold text-slate-800">
              {item.value === null || item.value === undefined || item.value === "" ? "—" : item.value}
            </dd>
          </div>
        ))}
      </dl>
      {footer && <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div>}
    </Modal>
  );
}
