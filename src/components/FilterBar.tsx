import React from 'react';
import { Search, Tag, Building2, MapPin, X, FileDown } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  selectedManufacturer: string;
  onManufacturerChange: (val: string) => void;
  manufacturers: string[];
  selectedLocation: string;
  onLocationChange: (val: string) => void;
  locations: string[];
  resultsCount: number;
  onExportPDF?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedManufacturer,
  onManufacturerChange,
  manufacturers,
  selectedLocation,
  onLocationChange,
  locations,
  resultsCount,
  onExportPDF,
}) => {
  const hasActiveFilters = Boolean(
    selectedCategory || selectedManufacturer || selectedLocation || searchQuery
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Keresés: ID, név, gyári kód, hely, leírás..."
          className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-base text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {/* Category */}
        <div>
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 mb-1.5">
            <Tag className="w-4 h-4 text-teal-600" />
            <span>Kategória</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
              selectedCategory
                ? 'border-teal-500 bg-teal-50/40 text-teal-900 ring-2 ring-teal-100'
                : 'border-slate-200 text-slate-800 focus:border-teal-500 focus:ring-teal-100'
            }`}
          >
            <option value="">Összes kategória</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-blue-700 mb-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Gyártó</span>
          </label>
          <select
            value={selectedManufacturer}
            onChange={(e) => onManufacturerChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
              selectedManufacturer
                ? 'border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-100'
                : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-blue-100'
            }`}
          >
            <option value="">Összes gyártó</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="sm:col-span-2 md:col-span-1">
          <label className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 mb-1.5">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>Alkatrész Helye</span>
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
              selectedLocation
                ? 'border-teal-500 bg-teal-50/40 text-teal-900 ring-2 ring-teal-100'
                : 'border-slate-200 text-slate-800 focus:border-teal-500 focus:ring-teal-100'
            }`}
          >
            <option value="">Minden hely</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter badges if any */}
      {hasActiveFilters && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Aktív szűrők:</span>
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Kategória: {selectedCategory}
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="hover:text-teal-950 cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedManufacturer && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Gyártó: {selectedManufacturer}
              <button
                type="button"
                onClick={() => onManufacturerChange('')}
                className="hover:text-blue-950 cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {selectedLocation && (
            <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Hely: {selectedLocation}
              <button
                type="button"
                onClick={() => onLocationChange('')}
                className="hover:text-teal-950 cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
              Keresés: „{searchQuery}”
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-slate-950 cursor-pointer ml-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-sm text-slate-600">
        <div>
          Találatok:{' '}
          <strong className="text-slate-900 font-extrabold text-base tabular-nums">
            {resultsCount}
          </strong>{' '}
          db
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onCategoryChange('');
                onManufacturerChange('');
                onLocationChange('');
                onSearchChange('');
              }}
              className="px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
            >
              Összes szűrő törlése
            </button>
          )}

          {onExportPDF && (
            <button
              type="button"
              onClick={onExportPDF}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="A jelenleg leszűrt lista mentése PDF dokumentumként"
            >
              <FileDown className="w-4 h-4 text-red-600 shrink-0" />
              <span>Lista mentése PDF-be</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
