import { useState } from "react";
import { Combobox } from "@headlessui/react";
import { countries } from "@/lib/countries";

interface CountrySelectProps {
  value: string | null;
  onChange: (code: string) => void;
  language?: "en" | "zh";
  placeholder?: string;
  className?: string;
}

export default function CountrySelect({ value, onChange, language = "en", placeholder = "US / United States / 美国", className = "" }: CountrySelectProps) {
  const [query, setQuery] = useState("");

  const filtered =
    query === ""
      ? countries
      : countries.filter((c) =>
          [c.code, c.en, c.zh]
            .some((field) => field.toLowerCase().includes(query.toLowerCase()))
        );

  const displayValue = (code: string | null) => {
    if (!code) return "";
    const c = countries.find((c) => c.code === code);
    return c ? (language === "zh" ? c.zh : c.en) : code;
  };

  return (
    <Combobox value={value} onChange={onChange}>
      <div className={`relative w-full ${className}`}>
        <Combobox.Input
          className="border px-2 py-1 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          displayValue={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {filtered.length === 0 && (
            <div className="cursor-default select-none px-4 py-2 text-gray-500">
              {language === "zh" ? "无匹配国家" : "No matching country"}
            </div>
          )}
          {filtered.map((c) => (
            <Combobox.Option
              key={c.code}
              value={c.code}
              className={({ active }: { active: boolean }) =>
                `relative cursor-pointer select-none py-2 pl-4 pr-4 ${
                  active ? "bg-blue-600 text-white" : "text-gray-900"
                }`
              }
            >
              <span className="block truncate">
                {c.code} - {c.en} / {c.zh}
              </span>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  );
} 