'use client';

import React, { useState } from 'react';
import { ExternalLink, Plus, Trash2, Link as LinkIcon, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface StyleLinkItem {
  id: string;
  label: string;
  url: string;
  created_at?: string;
}

interface StyleLinksCardProps {
  links?: StyleLinkItem[];
  onAddLink: (data: { label: string; url: string }) => void;
  onDeleteLink: (linkId: string) => void;
  isAdding?: boolean;
  canEdit?: boolean;
}

export const StyleLinksCard: React.FC<StyleLinksCardProps> = ({
  links = [],
  onAddLink,
  onDeleteLink,
  isAdding = false,
  canEdit = true,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const safeLinks = Array.isArray(links) ? links : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    onAddLink({ label: label.trim(), url: formattedUrl });
    setLabel('');
    setUrl('');
    setShowAddForm(false);
  };

  const getDomain = (rawUrl: string) => {
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      return parsed.hostname.replace('www.', '');
    } catch {
      return 'link';
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900">Style Links & Resources</h3>
            <p className="text-[11px] text-gray-500">Tech packs, 3D fitting, Drive folders</p>
          </div>
        </div>

        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
          {safeLinks.length}
        </span>
      </div>

      {/* Add Link Form */}
      {canEdit && (
        <>
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Link Title *</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Tech Pack v2.0 / 3D Viewer"
                  required
                  className="h-8 text-xs bg-white"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Resource URL *</Label>
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://drive.google.com/... or cloviewer.com/..."
                  required
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setLabel('');
                    setUrl('');
                  }}
                  className="h-7 text-xs text-gray-500"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAdding || !label.trim() || !url.trim()}
                  className="h-7 text-xs bg-blue-600 text-white gap-1"
                >
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Link
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              className="w-full text-xs h-8 border-dashed border-gray-300 text-blue-600 hover:bg-blue-50/50 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Related Link / Tech Pack
            </Button>
          )}
        </>
      )}

      {/* Links List */}
      <div className="space-y-2">
        {safeLinks.length === 0 ? (
          <div className="text-center py-6 px-3 text-xs text-gray-400 bg-gray-50/60 rounded-lg border border-dashed border-gray-200">
            No external links attached yet.
          </div>
        ) : (
          safeLinks.map((link) => (
            <div
              key={link.id}
              className="group flex items-center justify-between p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all bg-white"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 flex-1 min-w-0 pr-2"
                title={link.url}
              >
                <div className="p-1.5 bg-gray-100 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600 rounded flex-shrink-0 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700">
                    {link.label}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                    {getDomain(link.url)}
                    <ExternalLink className="w-2.5 h-2.5 inline text-gray-400 group-hover:text-blue-500" />
                  </p>
                </div>
              </a>

              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Remove link "${link.label}"?`)) {
                      onDeleteLink(link.id);
                    }
                  }}
                  className="h-7 w-7 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Delete Link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StyleLinksCard;
