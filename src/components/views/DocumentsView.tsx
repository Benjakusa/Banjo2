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
    selectedDocumentId || documents[0]?.id || ''
  );
  const [filterType, setFilterType] = useState<string>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  if (!activeDoc) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-ink-60">
        No archival documents are available yet.
      </div>
    );
  }

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'all') return true;
    return d.type === filterType;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6 pb-36">
      <div>
        <span className="text-xs uppercase tracking-widest font-mono text-ink-60 font-semibold">
          Archival Evidence
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-ink mt-0.5">
          Historical Documents, Record Sleeves & Posters
        </h1>
        <p className="text-xs text-ink-60 mt-1">
          Scanned primary documentary evidence supporting encyclopedia entries and studio histories.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-ink-12 pb-2 text-xs font-mono">
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
                ? 'bg-brand text-on-orange font-bold'
                : 'text-ink-60 hover:text-ink hover:bg-ink-06'
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
            className="rounded-2xl border border-ink-12 bg-paper p-4 space-y-3 hover:border-brand transition-all cursor-pointer group"
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-ink-06 border border-ink-12">
              <img
                src={doc.imageUrl}
                alt={doc.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <span className="p-1 rounded-md bg-ink/60 text-paper">
                  <ZoomIn className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            <div>
              <span className="font-mono text-[10px] text-ink-60 uppercase font-bold block">
                {doc.type.replace('_', ' ')} · {doc.year}
              </span>
              <h3 className="font-serif text-sm font-semibold text-ink group-hover:text-link transition-colors mt-0.5 line-clamp-1">
                {doc.title}
              </h3>
              <p className="text-xs text-ink-60 line-clamp-2 mt-1 leading-relaxed">
                {doc.description}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 border-t border-ink-12 pt-2 text-[11px] text-ink-60 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-words">{doc.location}</span>
              <span className="inline-flex items-center gap-1 font-medium text-link">Inspect Document <ArrowRight className="w-3 h-3 shrink-0" /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 backdrop-blur-sm p-4"
        >
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-paper p-4 space-y-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-ink-12 pb-2">
              <div>
                <span className="font-mono text-xs text-ink-60 uppercase font-semibold">
                  Accession #{activeDoc.archivalCode}
                </span>
                <h3 className="font-serif text-base font-semibold text-ink">
                  {activeDoc.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1 text-ink-60 hover:text-ink-60 cursor-pointer"
              >
                <XLg className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-xl overflow-hidden bg-ink-06 border border-ink-12">
              <img
                src={activeDoc.imageUrl}
                alt={activeDoc.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain p-2"
              />
            </div>

            <p className="text-xs text-ink-60 leading-relaxed">
              {activeDoc.description}
            </p>

            <div className="pt-2 border-t border-ink-12 flex items-center justify-between text-xs text-ink-60">
              <span>Holding: {activeDoc.sourceAttribution}</span>
              {activeDoc.relatedSongIds && activeDoc.relatedSongIds[0] && (
                <button
                  onClick={() => {
                    setLightboxOpen(false);
                    navigateTo('song_detail', { songId: activeDoc.relatedSongIds[0] });
                  }}
                  className="text-link font-semibold hover:underline cursor-pointer"
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
