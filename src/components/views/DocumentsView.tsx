import React, { useState } from 'react';
import {
  useBanjo } from '../../context/BanjoContext';
import {
  FileText,
  CalendarEvent,
  GeoAlt,
  Tag,
  ArrowRight,
  ZoomIn,
  XLg
} from 'react-bootstrap-icons';

export const DocumentsView: React.FC = () => {
  const { documents, selectedDocumentId, navigateTo } = useBanjo();

  const [activeDocId, setActiveDocId] = useState<string>(
    selectedDocumentId || documents[0]?.id || 'doc-001'
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'all') return true;
    return d.type === filterType;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-orange-700 font-semibold">
          Archival Evidence
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-black mt-0.5">
          Historical Documents, Record Sleeves & Posters
        </h1>
        <p className="text-xs text-black/60 mt-1">
          Scanned primary documentary evidence supporting encyclopedia entries and studio histories.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-black/10 pb-2 text-xs font-mono">
        {[
          { key: 'all', label: 'All Artifacts' },
          { key: 'record_sleeve', label: 'Record Sleeves' },
          { key: 'studio_document', label: 'Studio Logbooks' },
          { key: 'poster', label: 'Concert Handbills' },
          { key: 'newspaper_article', label: 'Newspaper Articles' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === tab.key
                ? 'bg-orange-600 text-white font-bold shadow-xs'
                : 'text-black/60 hover:text-black hover:bg-black/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => {
              setActiveDocId(doc.id);
              setLightboxOpen(true);
            }}
            className="rounded-2xl border border-black/10 bg-white p-4 space-y-3 shadow-xs hover:border-orange-600 transition-all cursor-pointer group"
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black/5 border border-black/10">
              <img
                src={doc.imageUrl}
                alt={doc.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <span className="p-1 rounded-md bg-black/60 text-white">
                  <ZoomIn className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-orange-700 uppercase font-bold block">
                {doc.type.replace('_', ' ')} · {doc.year}
              </span>
              <h3 className="font-serif text-sm font-semibold text-black group-hover:text-orange-700 transition-colors mt-0.5 line-clamp-1">
                {doc.title}
              </h3>
              <p className="text-xs text-black/60 line-clamp-2 mt-1 leading-relaxed">
                {doc.description}
              </p>
            </div>

            <div className="pt-2 border-t border-black/10 flex items-center justify-between text-[11px] text-black/50">
              <span>{doc.location}</span>
              <span className="text-blue-700 font-medium inline-flex items-center gap-1">Inspect Document <ArrowRight className="w-3 h-3" /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <div className="relative max-w-2xl w-full rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <div>
                <span className="font-mono text-xs text-orange-700 uppercase font-semibold">
                  Accession #{activeDoc.archivalCode}
                </span>
                <h3 className="font-serif text-base font-semibold text-black">
                  {activeDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1 text-black/40 hover:text-black/70 cursor-pointer"
              >
                <XLg className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden bg-black/5 border border-black/10">
              <img
                src={activeDoc.imageUrl}
                alt={activeDoc.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <p className="text-xs text-black/70 leading-relaxed">
              {activeDoc.description}
            </p>

            <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs text-black/50">
              <span>Holding: {activeDoc.sourceAttribution}</span>
              {activeDoc.relatedSongIds && activeDoc.relatedSongIds[0] && (
                <button
                  onClick={() => {
                    setLightboxOpen(false);
                    navigateTo('song_detail', { songId: activeDoc.relatedSongIds[0] });
                  }}
                  className="text-orange-700 font-semibold hover:underline cursor-pointer"
                >
                  View Related Song Article <ArrowRight className="w-3 h-3 inline" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
