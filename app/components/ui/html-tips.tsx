'use client';

import { Info } from 'lucide-react';

export function HtmlTips() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 mb-2">
      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="text-xs text-blue-800 leading-relaxed">
        <strong className="font-semibold">Tip:</strong> You can use HTML tags for formatting:
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;strong&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;em&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;br&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;p&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;ul&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;ol&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;li&gt;</code>,
        <code className="mx-1 px-1.5 py-0.5 bg-blue-100 rounded text-blue-900">&lt;a&gt;</code>, and more.
      </div>
    </div>
  );
}
