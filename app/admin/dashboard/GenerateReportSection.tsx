"use client";
import React, { useState } from 'react';
import CountrySelect from '../../../components/ui/CountrySelect';
import CategoryTreeSelect from '../../../components/ui/CategoryTreeSelect';

export default function GenerateReportSection() {
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [csvPath, setCsvPath] = useState('');
  const [analyzedHtmlPath, setAnalyzedHtmlPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [htmlPath, setHtmlPath] = useState('');
  const [prompt, setPrompt] = useState('Please generate a weekly e-commerce trend report in HTML format, highlight the fastest growing products and key trends.');
  const [model, setModel] = useState<'gpt' | 'gemini' | 'deepseek'>('gpt');

  return (
    <div className="p-4 bg-white rounded shadow mb-8">
      <h2 className="text-lg font-bold mb-4">Generate Weekly Report</h2>
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="w-48">
          <CountrySelect value={country} onChange={setCountry} language="en" placeholder="Country" />
        </div>
        <div className="w-72">
          <CategoryTreeSelect value={category} onChange={(code) => { if (typeof code === 'string') setCategory(code); }} placeholder="Select Category" />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold">Model:</label>
          <label><input type="radio" name="model" value="gpt" checked={model === 'gpt'} onChange={() => setModel('gpt')} /> GPT</label>
          <label><input type="radio" name="model" value="gemini" checked={model === 'gemini'} onChange={() => setModel('gemini')} /> Gemini</label>
          <label><input type="radio" name="model" value="deepseek" checked={model === 'deepseek'} onChange={() => setModel('deepseek')} /> Deepseek</label>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading || !country || !category}
          onClick={async () => {
            setLoading(true);
            setCsvPath('');
            setHtmlPath('');
            const res = await fetch(`/api/export-csv?country=${country}&category=${category}`);
            const json = await res.json();
            setCsvPath(json.file || '');
            setLoading(false);
          }}
        >
          {loading ? 'Generating CSV...' : 'Generate CSV'}
        </button>
        {csvPath && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={async () => {
              setLoading(true);
              setHtmlPath('');
              const res = await fetch('/api/generate-html-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: csvPath, prompt, model }),
              });
              const json = await res.json();
              setHtmlPath(json.htmlFile || '');
              setLoading(false);
            }}
          >
            {loading ? 'Generating HTML...' : 'Generate HTML Report'}
          </button>
        )}
        {csvPath && (
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              setHtmlPath('');
              const res = await fetch('/api/analyze-csv-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: csvPath }),
              });
              const json = await res.json();
              setAnalyzedHtmlPath(json.htmlFile || '');
              setLoading(false);
            }}
          >
            {loading ? '分析中...' : '本地分析生成HTML（不调用AI）'}
          </button>
        )}
        {analyzedHtmlPath && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={async () => {
              setLoading(true);
              setHtmlPath('');
              // 新增日志
              console.log('Generate HTML Report filePath:', analyzedHtmlPath, 'is analyzedHtmlPath:', !!analyzedHtmlPath);
              const res = await fetch('/api/generate-html-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: analyzedHtmlPath, prompt, model }),
              });
              const json = await res.json();
              setHtmlPath(json.htmlFile || '');
              setLoading(false);
            }}
          >
            {loading ? 'Generating HTML...' : 'Generate HTML Report'}
          </button>
        )}
      </div>
      <div>
        <label className="block mb-1 font-semibold">Prompt for GPT/Gemini/Deepseek:</label>
        <textarea
          className="border p-2 w-full"
          rows={3}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
      </div>
      {csvPath && (
        <div className="mt-2 text-sm">
          <span>CSV File: </span>
          <a href={csvPath} target="_blank" className="text-blue-600 underline">{csvPath}</a>
        </div>
      )}
      {htmlPath && (
        <div className="mt-2 text-sm">
          <span>HTML Report: </span>
          <a href={htmlPath} target="_blank" className="text-green-600 underline">{htmlPath}</a>
        </div>
      )}
      {analyzedHtmlPath && (
        <div className="mt-2 text-sm">
          <span>Analyzed HTML File: </span>
          <a href={analyzedHtmlPath} target="_blank" className="text-blue-600 underline">{analyzedHtmlPath}</a>
        </div>
      )}
    </div>
  );
} 