import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { Settings } from "lucide-react";

function ColumnVisibilityModal({
  columns,
  columnVisibility,
  handleToggleColumn,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      {/* Tombol buka modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-full border p-2 hover:bg-gray-100 transition"
      >
        <Settings className="w-5 h-5 text-gray-600" />
      </button>

      {/* Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[9999]"
          onClose={() => setIsOpen(false)}
        >
          {/* Background blur */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          {/* Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-200"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <Dialog.Title className="text-lg font-semibold text-center mb-4 text-gray-800">
                  Column Settings
                </Dialog.Title>

                {/* Daftar kolom */}
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {columns.map((col) => (
                    <label
                      key={col.field || col.data}
                      className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={!!columnVisibility[col.field || col.data]}
                        onChange={() =>
                          handleToggleColumn(col.field || col.data)
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {col.headerName || col.title || col.field || col.data}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Tombol Done */}
                <div className="mt-5 flex justify-center">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default ColumnVisibilityModal;
