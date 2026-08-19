'use client';

import React from 'react';
import { UseFormRegister, Control } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type EmailContact = {
  id?: string;
  contact_name: string;
  email: string;
  email_type: 'to' | 'cc';
};

interface EmailListProps {
  fields: any[];
  append: (data: any) => void;
  remove: (index: number) => void;
  register: UseFormRegister<any>;
}

export const EmailList: React.FC<EmailListProps> = ({
  fields,
  append,
  remove,
  register,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-xs font-semibold text-gray-700">
            Email Notification Recipients
          </label>
          <p className="text-[11px] text-gray-500">
            Recipients who receive automated PDF inspection reports
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ contact_name: '', email: '', email_type: 'to' })}
          className="h-7 text-xs gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Email
        </Button>
      </div>

      <div className="border rounded-md divide-y bg-white max-h-56 overflow-y-auto">
        {fields.map((field, index) => (
          <div key={field.id} className="p-2 flex items-center gap-2">
            <Input
              {...register(`emails.${index}.contact_name` as const)}
              placeholder="Contact Name"
              className="h-8 text-xs w-36"
            />
            <Input
              type="email"
              {...register(`emails.${index}.email` as const)}
              placeholder="email@company.com"
              className="h-8 text-xs flex-1"
              required
            />
            <select
              {...register(`emails.${index}.email_type` as const)}
              className="h-8 px-2 border rounded text-xs bg-white font-medium"
            >
              <option value="to">TO</option>
              <option value="cc">CC</option>
            </select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="h-7 w-7 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
